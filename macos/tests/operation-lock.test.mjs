/**
 * Operation Lock (owner.json) Unit & Integration Test Suite
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 15)
 * - .scratch/phase-00-foundation/issues/07-operation-lock.md
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  acquireLock,
  releaseLock,
  inspectLock,
  generateUserIdentityHash,
} from "../../core/runtime-api/operation-lock.js";
import { handleStatus } from "../../core/runtime-api/handlers/status-handler.js";

function createIsolatedStateRoot() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ds-lock-test-"));
  return tmpDir;
}

function cleanupIsolatedStateRoot(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

test("Operation Lock Test Suite", async (t) => {
  await t.test("1. 单进程成功获取与释放锁", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const opId = "op_test_single_001";
      const res = acquireLock({
        stateRoot,
        operationId: opId,
        operation: "applyTheme",
        entrypoint: "studio",
      });

      assert.equal(res.acquired, true);
      assert.equal(res.recoveredStale, false);
      assert.ok(fs.existsSync(res.lockDir));

      const ownerPath = path.join(res.lockDir, "owner.json");
      assert.ok(fs.existsSync(ownerPath));

      const ownerData = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
      assert.equal(ownerData.operationId, opId);
      assert.equal(ownerData.operation, "applyTheme");
      assert.equal(ownerData.entrypoint, "studio");
      assert.equal(ownerData.pid, process.pid);

      // Inspect check
      const inspection = inspectLock({ stateRoot });
      assert.equal(inspection.exists, true);
      assert.equal(inspection.isStale, false);
      assert.equal(inspection.owner.operationId, opId);

      // Status handler integration check
      const statusRes = handleStatus({}, { stateRoot });
      assert.equal(statusRes.ok, true);
      assert.ok(statusRes.data.operation);
      assert.equal(statusRes.data.operation.busy, true);
      assert.equal(statusRes.data.operation.operationId, opId);

      // Release lock
      const releaseRes = releaseLock({ stateRoot, operationId: opId });
      assert.equal(releaseRes.released, true);
      assert.equal(fs.existsSync(res.lockDir), false);

      // Post-release status check
      const statusAfter = handleStatus({}, { stateRoot });
      assert.equal(statusAfter.data.operation, null);
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("2. 锁竞争拦截：已占用锁返回 busy", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const lock1 = acquireLock({
        stateRoot,
        operationId: "op_holder",
        operation: "importTheme",
      });
      assert.equal(lock1.acquired, true);

      // Second acquire attempt should fail and report busy
      const lock2 = acquireLock({
        stateRoot,
        operationId: "op_contender",
        operation: "applyTheme",
      });

      assert.equal(lock2.acquired, false);
      assert.equal(lock2.busy, true);
      assert.equal(lock2.owner.operationId, "op_holder");

      // Release first lock
      releaseLock({ stateRoot, operationId: "op_holder" });
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("3. 崩溃死锁 (Stale Lock) 识别与自动回收抢占", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const lockDir = path.join(stateRoot, "locks", "operation.lock");
      fs.mkdirSync(lockDir, { recursive: true });

      // Create owner.json with dead PID (999999)
      const fakeOwner = {
        lockSchemaVersion: 1,
        operationId: "op_crashed_999",
        operation: "applyTheme",
        pid: 999999, // Dead PID
        processStartedAt: new Date(Date.now() - 100000).toISOString(),
        userIdentityHash: "sha256:fake",
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(lockDir, "owner.json"), JSON.stringify(fakeOwner), "utf8");

      // Inspect should classify as stale
      const inspection = inspectLock({ stateRoot });
      assert.equal(inspection.exists, true);
      assert.equal(inspection.isStale, true);

      // New acquireLock should purge stale lock and acquire successfully
      const acquireRes = acquireLock({
        stateRoot,
        operationId: "op_new_recovery",
        operation: "restore",
      });

      assert.equal(acquireRes.acquired, true);
      assert.equal(acquireRes.recoveredStale, true);
      assert.equal(acquireRes.owner.operationId, "op_new_recovery");

      releaseLock({ stateRoot, operationId: "op_new_recovery" });
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("4. PID Reuse 防线：PID 匹配但 processStartedAt 不一致判定为 Stale Lock", () => {
    const stateRoot = createIsolatedStateRoot();
    try {
      const lockDir = path.join(stateRoot, "locks", "operation.lock");
      fs.mkdirSync(lockDir, { recursive: true });

      // Create owner.json with CURRENT PID, but a timestamp from 2000
      const fakeOwner = {
        lockSchemaVersion: 1,
        operationId: "op_reused_pid",
        operation: "applyTheme",
        pid: process.pid,
        processStartedAt: "2000-01-01T00:00:00.000Z", // Ancient timestamp
        userIdentityHash: "sha256:fake",
        createdAt: "2000-01-01T00:00:00.000Z",
      };
      fs.writeFileSync(path.join(lockDir, "owner.json"), JSON.stringify(fakeOwner), "utf8");

      // Inspect check
      const inspection = inspectLock({ stateRoot });
      assert.equal(inspection.exists, true);
      assert.equal(inspection.isStale, true);

      // Re-claim should succeed
      const acquireRes = acquireLock({
        stateRoot,
        operationId: "op_after_reuse_clean",
        operation: "applyTheme",
      });

      assert.equal(acquireRes.acquired, true);
      assert.equal(acquireRes.recoveredStale, true);

      releaseLock({ stateRoot, operationId: "op_after_reuse_clean" });
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });

  await t.test("5. 脱敏隐私合规：userIdentityHash 采用 sha256，不写明文用户名", () => {
    const hash = generateUserIdentityHash();
    assert.match(hash, /^sha256:[a-f0-9]{64}$/);

    const stateRoot = createIsolatedStateRoot();
    try {
      const lockRes = acquireLock({
        stateRoot,
        operationId: "op_privacy_test",
        operation: "status",
      });
      assert.equal(lockRes.acquired, true);

      const ownerPath = path.join(lockRes.lockDir, "owner.json");
      const rawContent = fs.readFileSync(ownerPath, "utf8");
      assert.match(rawContent, /"userIdentityHash": "sha256:[a-f0-9]{64}"/);

      // Check no raw username is exposed if username exists
      let username = "";
      try {
        username = os.userInfo().username;
      } catch {
        // Ignore if user info unavailable
      }
      if (username && username.length > 3) {
        // Simple check that raw username key doesn't leak
        assert.equal(rawContent.includes(`"${username}"`), false);
      }

      releaseLock({ stateRoot, operationId: "op_privacy_test" });
    } finally {
      cleanupIsolatedStateRoot(stateRoot);
    }
  });
});
