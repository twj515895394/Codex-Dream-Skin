import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { handleCapabilities } from "../../core/runtime-api/handlers/capabilities-handler.js";
import { handleStatus } from "../../core/runtime-api/handlers/status-handler.js";
import { validateResponseEnvelope, buildSuccessResponse } from "../../core/runtime-api/schema-envelope.js";

describe("Capabilities & Status Operations Unit & Integration Test Suite", () => {
  let tmpStateRoot = "";

  beforeEach(() => {
    tmpStateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-status-test-"));
  });

  afterEach(() => {
    if (tmpStateRoot && fs.existsSync(tmpStateRoot)) {
      fs.rmSync(tmpStateRoot, { recursive: true, force: true });
    }
  });

  describe("1. capabilities Operation", () => {
    it("1.1 capabilities 返回完整结构并符合 SchemaEnvelope 约束", () => {
      const res = handleCapabilities({});
      assert.equal(res.ok, true);
      assert.ok(Array.isArray(res.data.supportedApiVersions));
      assert.equal(res.data.supportedApiVersions[0], 1);

      assert.ok(res.data.operations.capabilities.supported);
      assert.ok(res.data.operations.status.supported);
      assert.ok(res.data.operations.importTheme.supported);

      assert.ok(res.data.platform.os);
      assert.ok(res.data.limits.maxImageBytes > 0);

      // Build Envelope & Invariant check
      const env = buildSuccessResponse({ operation: "capabilities", requestId: "r_cap" }, res.data);
      assert.equal(validateResponseEnvelope(env), true);
    });
  });

  describe("2. status Operation", () => {
    it("2.1 status 默认探测返回基础健康状态", () => {
      const res = handleStatus({}, { stateRoot: tmpStateRoot });
      assert.equal(res.ok, true);
      assert.equal(res.data.runtime.state, "ready");
      assert.equal(res.data.runtime.recoveryRequired, false);
      assert.equal(res.data.operation, null);
      assert.equal(res.data.recovery, null);

      const env = buildSuccessResponse({ operation: "status", requestId: "r_stat" }, res.data);
      assert.equal(validateResponseEnvelope(env), true);
    });

    it("2.2 includeChecks=true 返回扩展诊断断言列表", () => {
      const res = handleStatus({ includeChecks: true }, { stateRoot: tmpStateRoot });
      assert.equal(res.ok, true);
      assert.ok(Array.isArray(res.data.checks));
      assert.ok(res.data.checks.length >= 3);
    });

    it("2.3 探查 owner.json 锁返回 busy 标记与正在运行的操作描述", () => {
      const lockDir = path.join(tmpStateRoot, "lock");
      fs.mkdirSync(lockDir, { recursive: true });
      fs.writeFileSync(
        path.join(lockDir, "owner.json"),
        JSON.stringify({
          lockSchemaVersion: 1,
          operationId: "op_import_999",
          operation: "importTheme",
          pid: process.pid,
        })
      );

      const res = handleStatus({}, { stateRoot: tmpStateRoot });
      assert.equal(res.ok, true);
      assert.notEqual(res.data.operation, null);
      assert.equal(res.data.operation.busy, true);
      assert.equal(res.data.operation.operationId, "op_import_999");
      assert.equal(res.data.operation.operation, "importTheme");
    });

    it("2.4 探查异常 Journal 返回 recoveryRequired 与恢复状态提示", () => {
      const journalDir = path.join(tmpStateRoot, "journal");
      fs.mkdirSync(journalDir, { recursive: true });
      fs.writeFileSync(
        path.join(journalDir, "journal.json"),
        JSON.stringify({
          journalSchemaVersion: 1,
          operationId: "op_failed_publish",
          operation: "applyTheme",
          state: "published",
          committed: false,
          error: { code: "VERIFY_FAILED_ROLLED_BACK" },
        })
      );

      const res = handleStatus({}, { stateRoot: tmpStateRoot });
      assert.equal(res.ok, true);
      assert.equal(res.data.runtime.state, "recoveryRequired");
      assert.equal(res.data.runtime.recoveryRequired, true);
      assert.notEqual(res.data.recovery, null);
      assert.equal(res.data.recovery.transactionId, "op_failed_publish");
    });

    it("2.5 探查 theme/theme.json 正确解析当前激活主题名称与 ID", () => {
      const themeDir = path.join(tmpStateRoot, "theme");
      fs.mkdirSync(themeDir, { recursive: true });
      fs.writeFileSync(
        path.join(themeDir, "theme.json"),
        JSON.stringify({
          schemaVersion: 1,
          id: "active-cyberpunk-theme",
          name: "Cyberpunk Active",
        })
      );

      const res = handleStatus({}, { stateRoot: tmpStateRoot });
      assert.equal(res.ok, true);
      assert.notEqual(res.data.skin.currentTheme, null);
      assert.equal(res.data.skin.currentTheme.id, "active-cyberpunk-theme");
      assert.equal(res.data.skin.currentTheme.name, "Cyberpunk Active");
    });

    it("2.6 状态探测零副作用：多次调用 capabilities 与 status 不修改非已有目录或文件", () => {
      const nonExistentStateRoot = path.join(tmpStateRoot, "non-existent-subfolder");

      handleCapabilities({});
      handleStatus({}, { stateRoot: nonExistentStateRoot });
      handleStatus({ includeChecks: true }, { stateRoot: nonExistentStateRoot });

      // Ensure no directory was created by pure read calls
      assert.equal(fs.existsSync(nonExistentStateRoot), false);
    });
  });
});
