import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { validateResponseEnvelope, MAX_REQUEST_BYTES } from "../../core/runtime-api/schema-envelope.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_PATH = path.resolve(__dirname, "../../core/runtime-api/reference-runner.js");

/**
 * Helper to invoke reference-runner subprocess with stdin JSON payload and optional env vars.
 */
function invokeRunner(payload, envOverrides = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [RUNNER_PATH], {
      env: { ...process.env, ...envOverrides },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderrData += chunk.toString("utf8");
    });

    child.on("close", (exitCode) => {
      let parsedStdout = null;
      try {
        parsedStdout = JSON.parse(stdoutData.trim());
      } catch (e) {
        // Leave parsedStdout as null if output is not JSON
      }

      resolve({
        exitCode,
        stdoutRaw: stdoutData,
        stderrRaw: stderrData,
        json: parsedStdout,
      });
    });

    if (typeof payload === "string") {
      child.stdin.write(payload);
    } else if (Buffer.isBuffer(payload)) {
      child.stdin.write(payload);
    }
    child.stdin.end();
  });
}

describe("Runtime Host Reference Runner Contract Test Suite", () => {
  it("1. 合法 capabilities 请求：返回 ok=true, exitCode=0，Envelope 通过不变量检验", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "capabilities",
      requestId: "req_cap_001",
      input: {},
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 0);
    assert.ok(res.json);
    assert.equal(res.json.ok, true);
    assert.equal(res.json.operation, "capabilities");
    assert.equal(res.json.requestId, "req_cap_001");
    assert.ok(Array.isArray(res.json.data.supportedApiVersions));
    assert.equal(res.json.error, null);

    // Validate Envelope Invariants
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("2. 合法 status 请求：返回 ok=true, exitCode=0", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "status",
      requestId: "req_stat_002",
      input: { includeChecks: true },
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 0);
    assert.ok(res.json);
    assert.equal(res.json.ok, true);
    assert.equal(res.json.data.runtime.state, "ready");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("3. 合法 listThemes 请求：返回 ok=true, exitCode=0", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "listThemes",
      requestId: "req_list_003",
      input: { includeInvalid: true },
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 0);
    assert.ok(res.json);
    assert.equal(res.json.ok, true);
    assert.ok(Array.isArray(res.json.data.themes));
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("4. 非法 JSON 输入：返回 INVALID_JSON, exitCode=2", async () => {
    const res = await invokeRunner("{ invalid json payload");
    assert.equal(res.exitCode, 2);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "INVALID_JSON");
    assert.equal(res.json.error.category, "request");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("5. 缺失必填字段 apiVersion：返回 INVALID_REQUEST, exitCode=2", async () => {
    const req = JSON.stringify({
      operation: "capabilities",
      requestId: "req_missing_ver",
      input: {},
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 2);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "INVALID_REQUEST");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("6. 不支持的 apiVersion (99)：返回 API_VERSION_UNSUPPORTED, exitCode=3", async () => {
    const req = JSON.stringify({
      apiVersion: 99,
      operation: "capabilities",
      requestId: "req_bad_ver",
      input: {},
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 3);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "API_VERSION_UNSUPPORTED");
    assert.equal(res.json.error.category, "compatibility");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("7. 未知 operation 名 (unknownOp)：返回 OPERATION_UNSUPPORTED, exitCode=3", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "unknownOp",
      requestId: "req_bad_op",
      input: {},
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 3);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "OPERATION_UNSUPPORTED");
    assert.equal(res.json.error.category, "compatibility");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("8. 请求超过 1 MiB 限制：返回 PACKAGE_TOO_LARGE, exitCode=20", async () => {
    const hugePayload = "x".repeat(MAX_REQUEST_BYTES + 100);
    const res = await invokeRunner(hugePayload);
    assert.equal(res.exitCode, 20);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "PACKAGE_TOO_LARGE");
    assert.equal(res.json.error.category, "validation");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("9. input 中包含未知拼写错误字段：返回 INVALID_REQUEST, exitCode=2", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "capabilities",
      requestId: "req_typo",
      input: { typoKey: 123 },
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 2);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "INVALID_REQUEST");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("10. 故障注入 - Adapter 内部未捕获异常：返回 INTERNAL_ERROR, exitCode=50", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "capabilities",
      requestId: "req_throw",
      input: {},
    });

    const res = await invokeRunner(req, {
      TEST_INJECT_THROW: "true",
      TEST_INJECT_THROW_MSG: "Simulated host crash",
    });

    assert.equal(res.exitCode, 50);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "INTERNAL_ERROR");
    assert.equal(res.json.error.category, "internal");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("11. 故障注入 - Adapter 返回 malformed 数据：返回 INTERNAL_ERROR, exitCode=50", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "capabilities",
      requestId: "req_malformed",
      input: {},
    });

    const res = await invokeRunner(req, { TEST_INJECT_MALFORMED: "true" });
    assert.equal(res.exitCode, 50);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "INTERNAL_ERROR");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("12. 故障注入 - Adapter 返回特定错误 PERMISSION_DENIED：返回 exitCode=22", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "capabilities",
      requestId: "req_perm",
      input: {},
    });

    const res = await invokeRunner(req, { TEST_INJECT_FAIL_CODE: "PERMISSION_DENIED" });
    assert.equal(res.exitCode, 22);
    assert.ok(res.json);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, "PERMISSION_DENIED");
    assert.equal(res.json.error.category, "permission");
    assert.equal(validateResponseEnvelope(res.json), true);
  });

  it("13. 诊断输出写入 stderr，而 stdout 必须只包含纯 JSON 响应", async () => {
    const req = JSON.stringify({
      apiVersion: 1,
      operation: "capabilities",
      requestId: "req_diag",
      input: {},
    });

    const res = await invokeRunner(req);
    assert.equal(res.exitCode, 0);
    assert.ok(res.stderrRaw.includes("[reference-runner] Received"));
    // stdout should be valid single line JSON
    const lines = res.stdoutRaw.trim().split("\n");
    assert.equal(lines.length, 1);
    assert.doesNotThrow(() => JSON.parse(lines[0]));
  });
});
