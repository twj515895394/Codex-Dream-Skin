import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseRequestEnvelope,
  buildSuccessResponse,
  buildErrorResponse,
  validateResponseEnvelope,
  MAX_REQUEST_BYTES,
  MAX_RESPONSE_BYTES,
} from "../../core/runtime-api/schema-envelope.js";
import {
  EXIT_CODES,
  EXIT_CODE_TO_CATEGORY,
  ERROR_CODES,
  getExitCodeForError,
  getCategoryForExitCode,
  createErrorObject,
} from "../../core/runtime-api/codes.js";
import { BUILTIN_OPERATIONS } from "../../core/runtime-api/operations/index.js";

describe("Runtime JSON API v1 Schema & Envelope Test Suite", () => {
  describe("1. Request Envelope Validation", () => {
    it("1.1 合法 capabilities Request 解析成功", () => {
      const payload = JSON.stringify({
        apiVersion: 1,
        operation: "capabilities",
        requestId: "req_001",
        input: {},
      });

      const res = parseRequestEnvelope(payload);
      assert.equal(res.valid, true);
      assert.equal(res.request.apiVersion, 1);
      assert.equal(res.request.operation, "capabilities");
      assert.equal(res.request.requestId, "req_001");
      assert.equal(res.warnings.length, 0);
    });

    it("1.2 顶层未知字段被忽略并产生 warning", () => {
      const payload = JSON.stringify({
        apiVersion: 1,
        operation: "status",
        requestId: "req_002",
        input: { includeChecks: true },
        unknownField: "foo",
      });

      const res = parseRequestEnvelope(payload);
      assert.equal(res.valid, true);
      assert.equal(res.warnings.length, 1);
      assert.equal(res.warnings[0].code, "UNKNOWN_TOPLEVEL_FIELD");
      assert.equal(res.warnings[0].details.field, "unknownField");
    });

    it("1.3 input 内未知字段被硬拒绝并报 INVALID_REQUEST", () => {
      const payload = JSON.stringify({
        apiVersion: 1,
        operation: "capabilities",
        requestId: "req_003",
        input: { invalidParam: 123 },
      });

      const res = parseRequestEnvelope(payload);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 2);
      assert.equal(res.error.code, "INVALID_REQUEST");
      assert.equal(res.error.details.field, "invalidParam");
    });

    it("1.4 缺失 apiVersion 被拒绝", () => {
      const payload = JSON.stringify({
        operation: "capabilities",
        requestId: "req_004",
        input: {},
      });

      const res = parseRequestEnvelope(payload);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 2);
      assert.equal(res.error.code, "INVALID_REQUEST");
    });

    it("1.5 不支持的 apiVersion 被拒绝为 API_VERSION_UNSUPPORTED", () => {
      const payload = JSON.stringify({
        apiVersion: 2,
        operation: "capabilities",
        requestId: "req_005",
        input: {},
      });

      const res = parseRequestEnvelope(payload);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 3);
      assert.equal(res.error.code, "API_VERSION_UNSUPPORTED");
    });

    it("1.6 不支持的 operation 被拒绝为 OPERATION_UNSUPPORTED", () => {
      const payload = JSON.stringify({
        apiVersion: 1,
        operation: "nonExistentOp",
        requestId: "req_006",
        input: {},
      });

      const res = parseRequestEnvelope(payload);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 3);
      assert.equal(res.error.code, "OPERATION_UNSUPPORTED");
    });

    it("1.7 请求大小超过 1 MiB 被拒绝", () => {
      const bigString = "x".repeat(MAX_REQUEST_BYTES + 10);
      const res = parseRequestEnvelope(bigString);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 20);
      assert.equal(res.error.code, "PACKAGE_TOO_LARGE");
    });

    it("1.8 非法 JSON 语法被拒绝为 INVALID_JSON", () => {
      const res = parseRequestEnvelope("{ bad json }");
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 2);
      assert.equal(res.error.code, "INVALID_JSON");
    });
  });

  describe("2. Response Envelope Invariants", () => {
    it("2.1 buildSuccessResponse 产生合法 Envelope，且 ok=true 时 error=null", () => {
      const reqCtx = { operation: "capabilities", requestId: "req_010" };
      const response = buildSuccessResponse(reqCtx, { supportedApiVersions: [1] });

      assert.equal(response.apiVersion, 1);
      assert.equal(response.operation, "capabilities");
      assert.equal(response.requestId, "req_010");
      assert.equal(response.ok, true);
      assert.equal(response.error, null);
      assert.deepEqual(response.data, { supportedApiVersions: [1] });
      assert.ok(Array.isArray(response.warnings));
      assert.ok(response.meta);
    });

    it("2.2 buildErrorResponse 产生合法 Envelope，且 ok=false 时 error 必存", () => {
      const reqCtx = { operation: "applyTheme", requestId: "req_011", isWrite: true };
      const errObj = createErrorObject("VERIFY_FAILED_ROLLED_BACK", "Theme verification failed.", {
        recoverable: true,
        details: { failedCheck: "rendererMarker" },
      });

      const response = buildErrorResponse(reqCtx, errObj);
      assert.equal(response.ok, false);
      assert.notEqual(response.error, null);
      assert.equal(response.error.code, "VERIFY_FAILED_ROLLED_BACK");
      assert.equal(response.error.category, "verification");
      assert.equal(response.error.recoverable, true);
      assert.ok(response.operationId.startsWith("op_"));
    });

    it("2.3 违反不变量：ok=true 但 error!=null 时 validateResponseEnvelope 抛错", () => {
      const invalidRes = {
        apiVersion: 1,
        operation: "test",
        requestId: "req",
        operationId: null,
        ok: true,
        data: {},
        warnings: [],
        error: { code: "SOME_ERR", category: "internal", message: "m", recoverable: false, action: "none" },
        meta: { runtimeVersion: "0.1.0", adapterVersion: "0.1.0", platform: "darwin", durationMs: 0 },
      };

      assert.throws(() => {
        validateResponseEnvelope(invalidRes);
      }, /invariant violated/);
    });

    it("2.4 违反不变量：ok=false 但 error 缺失时 validateResponseEnvelope 抛错", () => {
      const invalidRes = {
        apiVersion: 1,
        operation: "test",
        requestId: "req",
        operationId: null,
        ok: false,
        data: {},
        warnings: [],
        error: null,
        meta: { runtimeVersion: "0.1.0", adapterVersion: "0.1.0", platform: "darwin", durationMs: 0 },
      };

      assert.throws(() => {
        validateResponseEnvelope(invalidRes);
      }, /invariant violated/);
    });

    it("2.5 响应尺寸超过 4 MiB 时 validateResponseEnvelope 抛错", () => {
      const hugeData = { payload: "y".repeat(MAX_RESPONSE_BYTES + 100) };
      const response = {
        apiVersion: 1,
        operation: "test",
        requestId: "req",
        operationId: null,
        ok: true,
        data: hugeData,
        warnings: [],
        error: null,
        meta: { runtimeVersion: "0.1.0", adapterVersion: "0.1.0", platform: "darwin", durationMs: 0 },
      };

      assert.throws(() => {
        validateResponseEnvelope(response);
      }, /exceeds maximum limit of 4 MiB/);
    });
  });

  describe("3. Exit Codes & Error Mapping Matrix", () => {
    it("3.1 验证 15 种退出码常量及映射全覆盖", () => {
      const expectedCodes = [0, 2, 3, 10, 11, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50];
      for (const code of expectedCodes) {
        const cat = getCategoryForExitCode(code);
        assert.ok(cat && cat !== "internal" || code === 50);
      }
    });

    it("3.2 验证关键 Error Code 映射与 Exit Code 一致", () => {
      assert.equal(getExitCodeForError("INVALID_JSON"), 2);
      assert.equal(getExitCodeForError("API_VERSION_UNSUPPORTED"), 3);
      assert.equal(getExitCodeForError("OPERATION_BUSY"), 10);
      assert.equal(getExitCodeForError("PACKAGE_TOO_LARGE"), 20);
      assert.equal(getExitCodeForError("PACKAGE_NOT_FOUND"), 21);
      assert.equal(getExitCodeForError("PERMISSION_DENIED"), 22);
      assert.equal(getExitCodeForError("RUNTIME_NOT_INSTALLED"), 30);
      assert.equal(getExitCodeForError("CDP_NOT_READY"), 31);
      assert.equal(getExitCodeForError("CODEX_RESTART_REQUIRED"), 32);
      assert.equal(getExitCodeForError("PUBLISH_FAILED"), 40);
      assert.equal(getExitCodeForError("VERIFY_FAILED_ROLLED_BACK"), 41);
      assert.equal(getExitCodeForError("RECOVERY_REQUIRED"), 42);
      assert.equal(getExitCodeForError("INTERNAL_ERROR"), 50);
    });
  });

  describe("4. Operations Input Validation", () => {
    it("4.1 status 操作的 includeChecks 参数校验", () => {
      const validReq = JSON.stringify({
        apiVersion: 1,
        operation: "status",
        requestId: "r1",
        input: { includeChecks: true },
      });
      assert.equal(parseRequestEnvelope(validReq).valid, true);

      const invalidReq = JSON.stringify({
        apiVersion: 1,
        operation: "status",
        requestId: "r2",
        input: { includeChecks: "not_boolean" },
      });
      const res = parseRequestEnvelope(invalidReq);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 2);
    });

    it("4.2 listThemes 操作的参数校验", () => {
      const validReq = JSON.stringify({
        apiVersion: 1,
        operation: "listThemes",
        requestId: "r3",
        input: { includeInvalid: true, includeLegacy: false },
      });
      assert.equal(parseRequestEnvelope(validReq).valid, true);

      const invalidReq = JSON.stringify({
        apiVersion: 1,
        operation: "listThemes",
        requestId: "r4",
        input: { includeInvalid: 123 },
      });
      const res = parseRequestEnvelope(invalidReq);
      assert.equal(res.valid, false);
      assert.equal(res.exitCode, 2);
    });
  });
});
