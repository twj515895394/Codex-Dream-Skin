/**
 * applyTheme + verify + restore Operations Contract Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/10-apply-verify-restore-operations.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { handleApplyTheme } from "../../core/runtime-api/handlers/apply-theme-handler.js";
import { handleVerify } from "../../core/runtime-api/handlers/verify-handler.js";
import { handleRestore } from "../../core/runtime-api/handlers/restore-handler.js";
import { acquireLock, releaseLock } from "../../core/runtime-api/operation-lock.js";
import { getJournalPaths } from "../../core/runtime-api/transaction-journal.js";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-avr-state-"));
  return { stateRoot: tmpState };
}

function cleanupIsolatedStateRoot(ctx) {
  try {
    if (ctx.stateRoot && fs.existsSync(ctx.stateRoot)) {
      fs.rmSync(ctx.stateRoot, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

function createDummyTheme(stateRoot, themeId, themeName = "Test Theme") {
  const themeDir = path.join(stateRoot, "themes", themeId);
  fs.mkdirSync(themeDir, { recursive: true });
  fs.writeFileSync(
    path.join(themeDir, "theme.json"),
    JSON.stringify({
      schemaVersion: 1,
      id: themeId,
      name: themeName,
      version: "1.0.0",
      image: "background.png",
    }),
    "utf8"
  );
  fs.writeFileSync(path.join(themeDir, "background.png"), "fake-image-bytes");
}

function setActiveTheme(stateRoot, themeId, themeName) {
  const activeDir = path.join(stateRoot, "theme");
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(
    path.join(activeDir, "theme.json"),
    JSON.stringify({
      schemaVersion: 1,
      id: themeId,
      name: themeName,
      version: "1.0.0",
    }),
    "utf8"
  );
}

test("applyTheme + verify + restore Operation Test Suite", async (t) => {
  await t.test("1. applyTheme 成功路径：主题正常应用、校验通过并写入 active theme", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createDummyTheme(ctx.stateRoot, "soft-calm-01", "Soft Calm 01");

      const res = await handleApplyTheme({ themeId: "soft-calm-01" }, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, true);
      assert.equal(res.data.themeId, "soft-calm-01");
      assert.equal(res.data.applied, true);
      assert.equal(res.data.verified, true);
      assert.equal(res.data.transaction.state, "completed");
      assert.equal(res.data.transaction.committed, true);

      // Verify active theme files exist
      const activeConfig = path.join(ctx.stateRoot, "theme", "theme.json");
      assert.equal(fs.existsSync(activeConfig), true);
      const activeData = JSON.parse(fs.readFileSync(activeConfig, "utf8"));
      assert.equal(activeData.id, "soft-calm-01");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. applyTheme 参数校验与不存在主题判定", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      // Invalid themeId (path traversal)
      const resInvalid = await handleApplyTheme({ themeId: "../escape" }, { stateRoot: ctx.stateRoot });
      assert.equal(resInvalid.ok, false);
      assert.equal(resInvalid.error.code, "INVALID_REQUEST");

      // Nonexistent theme
      const resNotFound = await handleApplyTheme({ themeId: "nonexistent-theme" }, { stateRoot: ctx.stateRoot });
      assert.equal(resNotFound.ok, false);
      assert.equal(resNotFound.error.code, "THEME_NOT_FOUND");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("3. applyTheme 锁冲突判定：返回 OPERATION_BUSY", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createDummyTheme(ctx.stateRoot, "busy-theme", "Busy Theme");

      // Acquire lock manually
      acquireLock({
        stateRoot: ctx.stateRoot,
        operationId: "op_external_lock",
        operation: "importTheme",
      });

      const res = await handleApplyTheme({ themeId: "busy-theme" }, { stateRoot: ctx.stateRoot });
      assert.equal(res.ok, false);
      assert.equal(res.error.code, "OPERATION_BUSY");
    } finally {
      releaseLock({ stateRoot: ctx.stateRoot, operationId: "op_external_lock" });
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("4. applyTheme 注入失败：自动触发 Rollback 并还原旧主题", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      setActiveTheme(ctx.stateRoot, "old-active-theme", "Old Active");
      createDummyTheme(ctx.stateRoot, "new-theme-fail", "New Theme Fail");

      const res = await handleApplyTheme(
        { themeId: "new-theme-fail" },
        { stateRoot: ctx.stateRoot, simulateInjectFailure: true }
      );

      assert.equal(res.ok, false);
      assert.equal(res.data.applied, false);
      assert.equal(res.data.verified, false);
      assert.equal(res.data.rollbackAttempted, true);
      assert.equal(res.data.rollbackSucceeded, true);
      assert.equal(res.data.transaction.state, "rolled_back");

      // Verify old active theme is restored
      const activeConfig = path.join(ctx.stateRoot, "theme", "theme.json");
      const activeData = JSON.parse(fs.readFileSync(activeConfig, "utf8"));
      assert.equal(activeData.id, "old-active-theme");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("5. applyTheme Rollback 失败：标记 recoveryRequired", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createDummyTheme(ctx.stateRoot, "rollback-fail-theme", "Rollback Fail Theme");

      const res = await handleApplyTheme(
        { themeId: "rollback-fail-theme" },
        { stateRoot: ctx.stateRoot, simulateInjectFailure: true, simulateRollbackFailure: true }
      );

      assert.equal(res.ok, false);
      assert.equal(res.data.rollbackAttempted, true);
      assert.equal(res.data.rollbackSucceeded, false);
      assert.equal(res.data.recoveryRequired, true);
      assert.equal(res.data.transaction.state, "failed");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("6. applyTheme 需要 restart 拦截：未授权时返回 CODEX_RESTART_REQUIRED", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      createDummyTheme(ctx.stateRoot, "restart-theme", "Restart Theme");

      const res = await handleApplyTheme(
        { themeId: "restart-theme" },
        { stateRoot: ctx.stateRoot, requireCodexRestart: true, allowCodexRestart: false }
      );

      assert.equal(res.ok, false);
      assert.equal(res.error.code, "CODEX_RESTART_REQUIRED");
      assert.equal(res.error.details.requiredAction, "confirmRestart");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("7. verify 结构化检查：返回全量检查数组与 overall 状态", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      setActiveTheme(ctx.stateRoot, "active-theme-verify", "Active Theme Verify");

      const res = await handleVerify({ scope: "activeTheme" }, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, true);
      assert.equal(res.data.overall, "pass");
      assert.ok(Array.isArray(res.data.checks));

      const payloadCheck = res.data.checks.find((c) => c.id === "activePayload");
      assert.ok(payloadCheck);
      assert.equal(payloadCheck.status, "pass");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("8. restore 正常与紧急模式：清除或还原应用状态，Codex 恢复正常", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      setActiveTheme(ctx.stateRoot, "active-before-restore", "Before Restore");

      // Normal restore
      const resNormal = await handleRestore({ mode: "normal" }, { stateRoot: ctx.stateRoot });
      assert.equal(resNormal.ok, true);
      assert.equal(resNormal.data.restored, true);
      assert.ok(resNormal.data.resources.some((r) => r.id === "injector" && r.result === "stopped"));

      // Emergency restore
      const resEmergency = await handleRestore({ mode: "emergency" }, { stateRoot: ctx.stateRoot });
      assert.equal(resEmergency.ok, true);
      assert.equal(resEmergency.data.restored, true);
      assert.equal(fs.existsSync(path.join(ctx.stateRoot, "theme")), false);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("9. restore 处理损坏 Journal 不崩溃", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const journalPaths = getJournalPaths(ctx.stateRoot);
      fs.mkdirSync(path.dirname(journalPaths.currentPath), { recursive: true });
      fs.writeFileSync(journalPaths.currentPath, "{ corrupt json ...", "utf8");

      const res = await handleRestore({ mode: "emergency" }, { stateRoot: ctx.stateRoot });

      assert.equal(res.ok, true);
      assert.equal(res.data.restored, true);
      assert.equal(fs.existsSync(journalPaths.currentPath), false);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });
});
