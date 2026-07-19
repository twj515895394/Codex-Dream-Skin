/**
 * Runtime JSON API v1 Schema & Envelope Implementation
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 */

import {
  ERROR_CODES,
  createErrorObject,
  getExitCodeForError,
} from "./codes.js";
import { BUILTIN_OPERATIONS } from "./operations/index.js";

export const MAX_REQUEST_BYTES = 1 * 1024 * 1024; // 1 MiB
export const MAX_RESPONSE_BYTES = 4 * 1024 * 1024; // 4 MiB

export const KNOWN_TOPLEVEL_REQUEST_KEYS = Object.freeze([
  "apiVersion",
  "operation",
  "requestId",
  "input",
  "options",
  "client",
]);

/**
 * Parse and validate a raw Request Envelope.
 *
 * @param {string|Buffer} rawInput
 * @param {Object} [opts]
 * @param {Object} [opts.operations] Custom operation schemas
 * @returns {{ valid: boolean, request?: Object, warnings: Array, error?: Object, exitCode?: number }}
 */
export function parseRequestEnvelope(rawInput, opts = {}) {
  const operations = opts.operations || BUILTIN_OPERATIONS;
  const warnings = [];

  const byteLength = Buffer.isBuffer(rawInput)
    ? rawInput.length
    : Buffer.byteLength(String(rawInput || ""), "utf8");

  if (byteLength > MAX_REQUEST_BYTES) {
    const error = createErrorObject(
      "PACKAGE_TOO_LARGE",
      `Request size (${byteLength} bytes) exceeds maximum limit of 1 MiB.`,
      { details: { byteLength, maxLimit: MAX_REQUEST_BYTES } }
    );
    return {
      valid: false,
      warnings,
      error,
      exitCode: getExitCodeForError("PACKAGE_TOO_LARGE"),
    };
  }

  let parsed;
  try {
    const str = Buffer.isBuffer(rawInput) ? rawInput.toString("utf8") : String(rawInput);
    parsed = JSON.parse(str);
  } catch (err) {
    const error = createErrorObject("INVALID_JSON", "Failed to parse JSON request payload.", {
      details: { rawMessage: err.message },
    });
    return {
      valid: false,
      warnings,
      error,
      exitCode: getExitCodeForError("INVALID_JSON"),
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const error = createErrorObject("INVALID_REQUEST", "Request payload must be a JSON object.");
    return {
      valid: false,
      warnings,
      error,
      exitCode: getExitCodeForError("INVALID_REQUEST"),
    };
  }

  // Check top-level unknown keys
  const topKeys = Object.keys(parsed);
  for (const k of topKeys) {
    if (!KNOWN_TOPLEVEL_REQUEST_KEYS.includes(k)) {
      warnings.push({
        code: "UNKNOWN_TOPLEVEL_FIELD",
        message: `Unknown top-level request field '${k}' ignored.`,
        action: "none",
        details: { field: k },
      });
    }
  }

  // Validate apiVersion
  if (!("apiVersion" in parsed)) {
    const error = createErrorObject("INVALID_REQUEST", "Missing required field 'apiVersion'.");
    return { valid: false, warnings, error, exitCode: 2 };
  }
  if (typeof parsed.apiVersion !== "number") {
    const error = createErrorObject("INVALID_REQUEST", "Field 'apiVersion' must be a number.");
    return { valid: false, warnings, error, exitCode: 2 };
  }
  if (parsed.apiVersion !== 1) {
    const error = createErrorObject(
      "API_VERSION_UNSUPPORTED",
      `API version ${parsed.apiVersion} is not supported. Supported version is 1.`,
      { details: { requestedVersion: parsed.apiVersion, supportedVersions: [1] } }
    );
    return { valid: false, warnings, error, exitCode: 3 };
  }

  // Validate operation
  if (!parsed.operation || typeof parsed.operation !== "string" || !parsed.operation.trim()) {
    const error = createErrorObject("INVALID_REQUEST", "Missing or invalid 'operation' field.");
    return { valid: false, warnings, error, exitCode: 2 };
  }

  const opSchema = operations[parsed.operation];
  if (!opSchema) {
    const error = createErrorObject(
      "OPERATION_UNSUPPORTED",
      `Operation '${parsed.operation}' is not supported by this runtime API.`,
      { details: { operation: parsed.operation } }
    );
    return { valid: false, warnings, error, exitCode: 3 };
  }

  // Validate requestId
  if (
    !parsed.requestId ||
    typeof parsed.requestId !== "string" ||
    parsed.requestId.length < 1 ||
    parsed.requestId.length > 128
  ) {
    const error = createErrorObject(
      "INVALID_REQUEST",
      "Field 'requestId' must be a string of 1-128 characters."
    );
    return { valid: false, warnings, error, exitCode: 2 };
  }

  // Validate input
  if (!("input" in parsed) || !parsed.input || typeof parsed.input !== "object" || Array.isArray(parsed.input)) {
    const error = createErrorObject("INVALID_REQUEST", "Field 'input' must be a non-null JSON object.");
    return { valid: false, warnings, error, exitCode: 2 };
  }

  // Check unknown input fields
  if (Array.isArray(opSchema.allowedInputKeys)) {
    const inputKeys = Object.keys(parsed.input);
    for (const ik of inputKeys) {
      if (!opSchema.allowedInputKeys.includes(ik)) {
        const error = createErrorObject(
          "INVALID_REQUEST",
          `Unknown input field '${ik}' for operation '${parsed.operation}'.`,
          { details: { field: ik, operation: parsed.operation, allowedKeys: opSchema.allowedInputKeys } }
        );
        return { valid: false, warnings, error, exitCode: 2 };
      }
    }
  }

  // Validate operation input content
  if (typeof opSchema.validateInput === "function") {
    const res = opSchema.validateInput(parsed.input);
    if (!res.valid) {
      const error = createErrorObject(
        "INVALID_REQUEST",
        `Input validation failed for operation '${parsed.operation}': ${res.error}`
      );
      return { valid: false, warnings, error, exitCode: 2 };
    }
  }

  return {
    valid: true,
    request: {
      apiVersion: parsed.apiVersion,
      operation: parsed.operation,
      requestId: parsed.requestId,
      input: parsed.input,
      options: parsed.options && typeof parsed.options === "object" ? parsed.options : {},
      client: parsed.client && typeof parsed.client === "object" ? parsed.client : {},
    },
    warnings,
  };
}

/**
 * Validate Response Envelope Invariants.
 * Throws an Error if invariant fails.
 */
export function validateResponseEnvelope(res) {
  if (!res || typeof res !== "object" || Array.isArray(res)) {
    throw new Error("Response envelope must be a non-null object.");
  }
  if (res.apiVersion !== 1) {
    throw new Error(`Response envelope apiVersion must be 1, got ${res.apiVersion}.`);
  }
  if (typeof res.ok !== "boolean") {
    throw new Error(`Response envelope 'ok' must be boolean, got ${typeof res.ok}.`);
  }
  if (!Array.isArray(res.warnings)) {
    throw new Error("Response envelope 'warnings' must be an Array.");
  }
  if (res.ok) {
    if (res.error !== null) {
      throw new Error("Response envelope invariant violated: error must be null when ok=true.");
    }
  } else {
    if (!res.error || typeof res.error !== "object") {
      throw new Error("Response envelope invariant violated: error object must exist when ok=false.");
    }
    if (!res.error.code || !res.error.category || !res.error.message || typeof res.error.recoverable !== "boolean" || !res.error.action) {
      throw new Error("Response envelope invariant violated: error object is missing required fields.");
    }
  }

  const jsonStr = JSON.stringify(res);
  const byteLength = Buffer.byteLength(jsonStr, "utf8");
  if (byteLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Response envelope size (${byteLength} bytes) exceeds maximum limit of 4 MiB.`);
  }

  return true;
}

/**
 * Build a successful Response Envelope.
 */
export function buildSuccessResponse(reqCtx, data = {}, metaOpts = {}) {
  const isWrite = metaOpts.isWrite ?? reqCtx?.isWrite ?? false;
  const warnings = Array.isArray(metaOpts.warnings) ? metaOpts.warnings : [];
  if (Array.isArray(reqCtx?.warnings)) {
    warnings.push(...reqCtx.warnings);
  }

  const response = {
    apiVersion: 1,
    operation: reqCtx?.operation || "unknown",
    requestId: reqCtx?.requestId || "unknown",
    operationId: isWrite
      ? metaOpts.operationId || `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : metaOpts.operationId || null,
    ok: true,
    data: data || {},
    warnings,
    error: null,
    meta: {
      runtimeVersion: metaOpts.runtimeVersion || "0.1.0",
      adapterVersion: metaOpts.adapterVersion || "0.1.0",
      platform: metaOpts.platform || process.platform,
      durationMs: typeof metaOpts.durationMs === "number" ? metaOpts.durationMs : 0,
    },
  };

  validateResponseEnvelope(response);
  return response;
}

/**
 * Build an error Response Envelope.
 */
export function buildErrorResponse(reqCtx, errorObj, metaOpts = {}) {
  const isWrite = metaOpts.isWrite ?? reqCtx?.isWrite ?? false;
  const warnings = Array.isArray(metaOpts.warnings) ? metaOpts.warnings : [];
  if (Array.isArray(reqCtx?.warnings)) {
    warnings.push(...reqCtx.warnings);
  }

  const response = {
    apiVersion: 1,
    operation: reqCtx?.operation || "unknown",
    requestId: reqCtx?.requestId || null,
    operationId: isWrite
      ? metaOpts.operationId || `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : metaOpts.operationId || null,
    ok: false,
    data: metaOpts.data || {},
    warnings,
    error: errorObj,
    meta: {
      runtimeVersion: metaOpts.runtimeVersion || "0.1.0",
      adapterVersion: metaOpts.adapterVersion || "0.1.0",
      platform: metaOpts.platform || process.platform,
      durationMs: typeof metaOpts.durationMs === "number" ? metaOpts.durationMs : 0,
    },
  };

  validateResponseEnvelope(response);
  return response;
}
