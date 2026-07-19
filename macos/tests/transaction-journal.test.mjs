/**
 * Transaction Journal & Crash Recovery Unit & Integration Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 16)
 * - .scratch/phase-00-foundation/issues/08-transaction-journal-crash-recovery.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  createJournal,
  updateJournalStage,
  commitJournal,
  inspectJournal,
  performRollback,
} from "../../core/runtime-api/transaction-journal.js";
import { handleStatus } from "../../core/runtime-api/handlers/status-handler.js";

function createIsolatedStateRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ds-journal-test-"));
}

function cleanupIsolatedStateRoot(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

test("Transaction Journal & Crash Recovery Test Suite", async (t) => {
  await t.test("1. 完整正常事务流：创建 -> 阶段更新 -> Commit -> 归档至 history", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const opId = "op_journal_normal_001";
      const target = { kind: "activeTheme", logicalId: "preset-dark" };

      // 1. Create Journal
      const createRes = createJournal({
        stateRoot,
        operationId: opId,
        operation: "applyTheme",
        target,
      });

      assert.equal(createRes.created, true);
      assert.ok(fs.existsSync(createRes.currentPath));
      assert.equal(createRes.journal.committed, false);
      assert.equal(createRes.journal.state, "initialized");

      // 2. Update Stage & Backup & Publish
      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          state: "backed_up",
          backup: { relativePath: "backup/theme.json", exists: true },
        },
      });

      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          state: "published",
          publish: { started: true, commitMarkerWritten: true },
        },
      });

      // Inspection check before commit
      const inspectionMid = inspectJournal({ stateRoot });
      assert.equal(inspectionMid.exists, true);
      assert.equal(inspectionMid.recoveryRequired, true);

      // Status check before commit
      const statusMid = handleStatus({}, { stateRoot });
      assert.equal(statusMid.data.runtime.recoveryRequired, true);
      assert.equal(statusMid.data.recovery.transactionId, opId);

      // 3. Commit Journal
      const commitRes = commitJournal({
        stateRoot,
        operationId: opId,
      });

      assert.equal(commitRes.committed, true);
      assert.equal(fs.existsSync(createRes.currentPath), false); // current.json removed
      assert.ok(fs.existsSync(commitRes.historyPath)); // archived to history

      // Inspection check after commit
      const inspectionPost = inspectJournal({ stateRoot });
      assert.equal(inspectionPost.recoveryRequired, false);

      const statusPost = handleStatus({}, { stateRoot });
      assert.equal(statusPost.data.runtime.recoveryRequired, false);
      assert.equal(statusPost.data.recovery, null);
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("2. 崩溃故障注入与 Recovery Required 检测", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const opId = "op_crash_002";
      createJournal({
        stateRoot,
        operationId: opId,
        operation: "importTheme",
      });

      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          state: "failed",
          error: { code: "UNZIP_ERROR", message: "Corrupted payload" },
        },
      });

      const inspection = inspectJournal({ stateRoot });
      assert.equal(inspection.exists, true);
      assert.equal(inspection.recoveryRequired, true);
      assert.equal(inspection.journal.error.code, "UNZIP_ERROR");

      const statusRes = handleStatus({}, { stateRoot });
      assert.equal(statusRes.data.runtime.recoveryRequired, true);
      assert.equal(statusRes.data.recovery.transactionId, opId);
      assert.equal(statusRes.data.recovery.state, "failed");
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("3. 自动 Rollback：基于备份还原受管资源", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const opId = "op_rollback_003";
      const backupDir = path.join(stateRoot, "backup");
      const targetDir = path.join(stateRoot, "theme");
      fs.mkdirSync(backupDir, { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });

      // Write mock files
      const backupFile = path.join(backupDir, "theme.json");
      const targetFile = path.join(targetDir, "theme.json");
      fs.writeFileSync(backupFile, JSON.stringify({ id: "original-theme" }), "utf8");
      fs.writeFileSync(targetFile, JSON.stringify({ id: "corrupted-theme" }), "utf8");

      createJournal({
        stateRoot,
        operationId: opId,
        operation: "applyTheme",
        target: { kind: "activeTheme", logicalId: "corrupted-theme" },
      });

      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          state: "failed",
          backup: { relativePath: "backup/theme.json", exists: true },
          error: { code: "INJECT_FAILED", message: "Target crashed during inject" },
        },
      });

      // Perform Rollback
      const rollbackRes = performRollback({
        stateRoot,
        backupAbsPath: backupFile,
        targetAbsPath: targetFile,
      });

      assert.equal(rollbackRes.recovered, true);
      assert.equal(rollbackRes.rollback.succeeded, true);

      // Verify target file restored
      const restoredContent = JSON.parse(fs.readFileSync(targetFile, "utf8"));
      assert.equal(restoredContent.id, "original-theme");

      // Verify status after recovery
      const statusRes = handleStatus({}, { stateRoot });
      assert.equal(statusRes.data.runtime.recoveryRequired, false);
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("4. Commit 后 Cleanup 失败容错：警告记录但保持已提交状态", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const opId = "op_cleanup_warn_004";
      createJournal({
        stateRoot,
        operationId: opId,
        operation: "applyTheme",
      });

      const commitRes = commitJournal({
        stateRoot,
        operationId: opId,
        cleanupWarnings: ["Failed to remove temp dir /tmp/stage: EBUSY"],
      });

      assert.equal(commitRes.committed, true);

      const archivedRaw = fs.readFileSync(commitRes.historyPath, "utf8");
      const archivedData = JSON.parse(archivedRaw);

      assert.equal(archivedData.committed, true);
      assert.equal(archivedData.state, "committed");
      assert.ok(archivedData.cleanup.warnings.length > 0);
      assert.equal(archivedData.cleanup.warnings[0], "Failed to remove temp dir /tmp/stage: EBUSY");
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("5. 重复未完成事务拦截：阻断新事务并提示 recoveryRequired", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      createJournal({
        stateRoot,
        operationId: "op_active_005",
        operation: "applyTheme",
      });

      assert.throws(
        () => {
          createJournal({
            stateRoot,
            operationId: "op_new_attempt_006",
            operation: "applyTheme",
          });
        },
        (err) => {
          return err.code === "TRANSACTION_RECOVERY_REQUIRED";
        }
      );
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });
});
