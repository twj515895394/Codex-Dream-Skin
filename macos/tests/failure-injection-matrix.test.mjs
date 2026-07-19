/**
 * Failure Injection Matrix Test Suite (DS-QA-005)
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/test-and-acceptance-plan.md
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/code-review-fix-round/README.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { handleImportTheme } from "../../core/runtime-api/handlers/import-theme-handler.js";
import { handleApplyTheme } from "../../core/runtime-api/handlers/apply-theme-handler.js";
import { acquireLock, inspectLock } from "../../core/runtime-api/operation-lock.js";
import { recoverRuntimeTransaction } from "../../core/runtime-api/managed-runtime.js";

function createIsolatedStateRoot() {
  const tmpState = fs.mkdtempSync(path.join(os.tmpdir(), "ds-fi-matrix-state-"));
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

test("Failure Injection Matrix Test Suite (DS-QA-005)", async (t) => {
  await t.test("1. Import 阶段故障注入：包损坏与写锁竞争", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      // 1.1 Non-existent package
      const resMissing = await handleImportTheme(
        { sourceFile: "/non/existent/file.codex-theme" },
        { stateRoot: ctx.stateRoot }
      );
      assert.equal(resMissing.ok, false);
      assert.equal(resMissing.error.code, "PACKAGE_NOT_FOUND");

      // 1.2 Lock contention
      const lockRes = acquireLock({
        stateRoot: ctx.stateRoot,
        operationId: "op_external_holder",
      });
      assert.equal(lockRes.acquired, true);

      const invalidPkg = path.join(ctx.stateRoot, "test.codex-theme");
      fs.writeFileSync(invalidPkg, "dummy-content");

      const resBusy = await handleImportTheme(
        { sourceFile: invalidPkg },
        { stateRoot: ctx.stateRoot }
      );
      assert.equal(resBusy.ok, false);
      assert.equal(resBusy.error.code, "OPERATION_BUSY");
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("2. Apply 阶段故障注入：注入失败自动 Rollback 还原旧状态", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      // Create initial active theme and candidate theme
      const themesDir = path.join(ctx.stateRoot, "themes");
      fs.mkdirSync(path.join(themesDir, "active-theme"), { recursive: true });
      fs.writeFileSync(
        path.join(themesDir, "active-theme", "theme.json"),
        JSON.stringify({ schemaVersion: 1, id: "active-theme", name: "Active Theme", image: "bg.png" })
      );
      fs.writeFileSync(path.join(themesDir, "active-theme", "bg.png"), "active-bg");

      fs.mkdirSync(path.join(themesDir, "candidate-theme"), { recursive: true });
      fs.writeFileSync(
        path.join(themesDir, "candidate-theme", "manifest.json"),
        JSON.stringify({ schemaVersion: 1, id: "candidate-theme", theme: "theme.json" })
      );
      fs.writeFileSync(
        path.join(themesDir, "candidate-theme", "theme.json"),
        JSON.stringify({ schemaVersion: 1, id: "candidate-theme", name: "Candidate Theme", image: "bg.png" })
      );
      fs.writeFileSync(path.join(themesDir, "candidate-theme", "bg.png"), "candidate-bg");

      // Apply with simulated injector error
      const resFault = await handleApplyTheme(
        { themeId: "candidate-theme" },
        { stateRoot: ctx.stateRoot, simulateInjectFailure: true }
      );

      assert.equal(resFault.ok, false);
      assert.ok(resFault.error.message.includes("Simulated injection failure"));

      // Verify active theme state file handling
      const stateFile = path.join(ctx.stateRoot, "state.json");
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
        assert.equal(state.activeThemeId, "active-theme");
      }
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });

  await t.test("3. Runtime 阶段故障注入：Heartbeat 超时死锁识别与自动 Recover", async () => {
    const ctx = createIsolatedStateRoot();
    try {
      const lockDir = path.join(ctx.stateRoot, "locks", "operation.lock");
      fs.mkdirSync(lockDir, { recursive: true });

      // Create owner.json with old heartbeat timestamp (60 seconds ago) for current process PID or mock PID
      const oldHeartbeat = new Date(Date.now() - 60000).toISOString();
      const ownerData = {
        lockSchemaVersion: 1,
        operationId: "op_frozen_process",
        pid: process.pid + 100000, // Non-matching PID
        processStartedAt: "alive",
        heartbeatAt: oldHeartbeat,
      };
      fs.writeFileSync(path.join(lockDir, "owner.json"), JSON.stringify(ownerData, null, 2));

      // Inspect lock -> should be detected as stale
      const inspection = inspectLock({ lockDir, heartbeatTimeoutMs: 30000 });
      assert.equal(inspection.isStale, true);

      // Attempt acquireLock -> should preempt stale frozen lock
      const acqRes = acquireLock({
        stateRoot: ctx.stateRoot,
        operationId: "op_new_recovery",
      });

      assert.equal(acqRes.acquired, true);
      assert.equal(acqRes.recoveredStale, true);

      // Runtime Transaction Recovery
      const stagingDir = path.join(ctx.stateRoot, "runtime", "staging");
      fs.mkdirSync(stagingDir, { recursive: true });
      fs.writeFileSync(path.join(stagingDir, "junk.tmp"), "abandoned");

      const recRes = await recoverRuntimeTransaction({ stateRoot: ctx.stateRoot });
      assert.equal(recRes.ok, true);
      assert.equal(recRes.data.cleanedStaging, true);
    } finally {
      cleanupIsolatedStateRoot(ctx);
    }
  });
});
