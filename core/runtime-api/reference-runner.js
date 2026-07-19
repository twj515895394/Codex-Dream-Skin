/**
 * Reference Runner Host Executable for Runtime API v1
 *
 * Single-request, single-subprocess pipeline reading JSON from stdin,
 * processing via adapter, and printing single JSON response to stdout.
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 */

import { parseRequestEnvelope, buildSuccessResponse, buildErrorResponse, MAX_REQUEST_BYTES } from "./schema-envelope.js";
import { createErrorObject, getExitCodeForError, EXIT_CODES } from "./codes.js";
import { createFakeAdapter } from "./fake-adapter.js";
import { BUILTIN_OPERATIONS } from "./operations/index.js";

/**
 * Execute a single Runtime JSON API v1 request reading from stdinStream and writing to stdoutStream.
 */
export async function runReferenceHost(stdinStream, stdoutStream, stderrStream, options = {}) {
  const adapter = options.adapter || createFakeAdapter(options.initialState, options.injectionOpts);

  let rawBuffer = Buffer.alloc(0);
  let reqCtx = { operation: "unknown", requestId: null, isWrite: false };

  try {
    // 1. Read stdin
    rawBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      let totalBytes = 0;

      stdinStream.on("data", (chunk) => {
        totalBytes += chunk.length;
        chunks.push(chunk);
        if (totalBytes > MAX_REQUEST_BYTES + 1024) {
          // Exceeded safety threshold early
          stdinStream.pause();
        }
      });

      stdinStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      stdinStream.on("error", (err) => {
        reject(err);
      });
    });

    // Write diagnostic to stderr
    stderrStream.write(`[reference-runner] Received ${rawBuffer.length} bytes from stdin.\n`);

    // 2. Parse request envelope
    const parseResult = parseRequestEnvelope(rawBuffer, { operations: BUILTIN_OPERATIONS });
    if (!parseResult.valid) {
      const exitCode = parseResult.exitCode || EXIT_CODES.REQUEST_INVALID;
      const errorResponse = buildErrorResponse(
        reqCtx,
        parseResult.error || createErrorObject("INVALID_REQUEST", "Invalid request envelope."),
        { warnings: parseResult.warnings }
      );
      stdoutStream.write(JSON.stringify(errorResponse) + "\n");
      return exitCode;
    }

    const req = parseResult.request;
    const opDef = BUILTIN_OPERATIONS[req.operation];
    reqCtx = {
      apiVersion: req.apiVersion,
      operation: req.operation,
      requestId: req.requestId,
      isWrite: opDef?.isWrite ?? false,
      warnings: parseResult.warnings,
    };

    // 3. Delegate to adapter
    let adapterResult;
    try {
      adapterResult = await adapter.handleOperation(req.operation, req.input, reqCtx);
    } catch (adapterErr) {
      const internalErr = createErrorObject("INTERNAL_ERROR", `Unhandled adapter exception: ${adapterErr.message}`);
      const errResponse = buildErrorResponse(reqCtx, internalErr, { warnings: reqCtx.warnings });
      stdoutStream.write(JSON.stringify(errResponse) + "\n");
      return EXIT_CODES.INTERNAL_ERROR;
    }

    // 4. Handle adapter result
    if (adapterResult.ok) {
      // Valid data response
      if (typeof adapterResult.data !== "object" || adapterResult.data === null || Array.isArray(adapterResult.data)) {
        // Returned malformed non-object data
        const internalErr = createErrorObject("INTERNAL_ERROR", "Adapter returned malformed non-object data.");
        const errResponse = buildErrorResponse(reqCtx, internalErr, { warnings: reqCtx.warnings });
        stdoutStream.write(JSON.stringify(errResponse) + "\n");
        return EXIT_CODES.INTERNAL_ERROR;
      }

      const successResponse = buildSuccessResponse(reqCtx, adapterResult.data, {
        warnings: reqCtx.warnings,
        isWrite: reqCtx.isWrite,
      });
      stdoutStream.write(JSON.stringify(successResponse) + "\n");
      return EXIT_CODES.SUCCESS;
    } else {
      // Error response returned from adapter
      const errObj = adapterResult.error || createErrorObject("INTERNAL_ERROR", "Adapter reported failure without error object.");
      const exitCode = getExitCodeForError(errObj.code);
      const errResponse = buildErrorResponse(reqCtx, errObj, {
        warnings: reqCtx.warnings,
        data: adapterResult.data || {},
        isWrite: reqCtx.isWrite,
      });
      stdoutStream.write(JSON.stringify(errResponse) + "\n");
      return exitCode;
    }
  } catch (uncaughtErr) {
    stderrStream.write(`[reference-runner] Uncaught exception: ${uncaughtErr.stack || uncaughtErr.message}\n`);
    const internalErr = createErrorObject("INTERNAL_ERROR", `Fatal uncaught error: ${uncaughtErr.message}`);
    const fallbackResponse = buildErrorResponse(reqCtx, internalErr);
    stdoutStream.write(JSON.stringify(fallbackResponse) + "\n");
    return EXIT_CODES.INTERNAL_ERROR;
  }
}

// CLI entry point if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Support fault injection via env vars for process contract testing
  const injectionOpts = {
    throwInternalError: process.env.TEST_INJECT_THROW === "true",
    throwMessage: process.env.TEST_INJECT_THROW_MSG,
    failErrorCode: process.env.TEST_INJECT_FAIL_CODE,
    returnMalformedData: process.env.TEST_INJECT_MALFORMED === "true",
  };

  runReferenceHost(process.stdin, process.stdout, process.stderr, { injectionOpts })
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((err) => {
      process.stderr.write(`Fatal host error: ${err.message}\n`);
      process.exit(50);
    });
}
