/**
 * Operation Lock (owner.json) Implementation
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 15)
 * - .scratch/phase-00-foundation/issues/07-operation-lock.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

// In-memory registry of active locks acquired by this process for auto-cleanup
const activeProcessLocks = new Set();
let exitHandlersRegistered = false;

/**
 * Generate anonymized user identity hash (SHA-256)
 */
export function generateUserIdentityHash() {
  let userInfo = "";
  try {
    userInfo = os.userInfo().username || String(os.userInfo().uid);
  } catch {
    userInfo = process.env.USER || process.env.USERNAME || "unknown-user";
  }
  return `sha256:${crypto.createHash("sha256").update(userInfo).digest("hex")}`;
}

/**
 * Get process start time in ISO format or null if process dead / unavailable
 */
export function getProcessStartTime(pid) {
  if (!pid || typeof pid !== "number") return null;
  try {
    // Check if PID exists via kill(pid, 0)
    process.kill(pid, 0);
  } catch (err) {
    if (err.code === "ESRCH") return null; // Process does not exist
  }

  // Attempt to query OS for exact process start time (macOS / Linux)
  try {
    if (process.platform === "darwin" || process.platform === "linux") {
      const output = execSync(`ps -p ${pid} -o lstart=`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (output) {
        const parsedDate = new Date(output);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }
    }
  } catch {
    // Ignore OS query errors (e.g. permission or platform differences)
  }

  return "alive";
}

/**
 * Inspect an existing operation lock directory & owner.json
 */
export function inspectLock(opts = {}) {
  let lockDir = opts.lockDir;
  if (!lockDir && opts.stateRoot) {
    lockDir = path.join(opts.stateRoot, "locks", "operation.lock");
  }

  if (!lockDir || !fs.existsSync(lockDir)) {
    return { exists: false, isStale: false, owner: null };
  }

  const ownerPath = path.join(lockDir, "owner.json");
  if (!fs.existsSync(ownerPath)) {
    // Empty lock directory without owner.json is considered stale
    return { exists: true, isStale: true, reason: "missing_owner_json", owner: null };
  }

  let owner = null;
  try {
    const raw = fs.readFileSync(ownerPath, "utf8");
    owner = JSON.parse(raw);
  } catch {
    // Malformed JSON is considered stale
    return { exists: true, isStale: true, reason: "corrupted_owner_json", owner: null };
  }

  if (!owner || typeof owner !== "object" || !owner.pid || !owner.operationId) {
    return { exists: true, isStale: true, reason: "invalid_owner_schema", owner };
  }

  // Check PID existence
  const processStatus = getProcessStartTime(owner.pid);
  if (processStatus === null) {
    return { exists: true, isStale: true, reason: "process_dead", owner };
  }

  // Check PID start time mismatch (PID reuse protection)
  if (
    processStatus !== "alive" &&
    owner.processStartedAt &&
    owner.processStartedAt !== "alive"
  ) {
    const recordedTime = new Date(owner.processStartedAt).getTime();
    const actualTime = new Date(processStatus).getTime();
    if (!isNaN(recordedTime) && !isNaN(actualTime)) {
      // Allow 3 seconds tolerance for clock skew/formatting
      if (Math.abs(recordedTime - actualTime) > 3000) {
        return { exists: true, isStale: true, reason: "pid_reused", owner };
      }
    }
  }

  // Active and valid lock
  return { exists: true, isStale: false, owner };
}

/**
 * Register global process exit handlers to clean up acquired locks
 */
function ensureExitHandlersRegistered() {
  if (exitHandlersRegistered) return;
  exitHandlersRegistered = true;

  const cleanupAllLocks = () => {
    for (const lockInfo of activeProcessLocks) {
      try {
        if (fs.existsSync(lockInfo.lockDir)) {
          const ownerPath = path.join(lockInfo.lockDir, "owner.json");
          if (fs.existsSync(ownerPath)) {
            const content = fs.readFileSync(ownerPath, "utf8");
            const data = JSON.parse(content);
            if (data.operationId === lockInfo.operationId) {
              fs.rmSync(lockInfo.lockDir, { recursive: true, force: true });
            }
          }
        }
      } catch {
        // Suppress exit cleanup errors
      }
    }
    activeProcessLocks.clear();
  };

  process.on("exit", cleanupAllLocks);
  process.on("SIGINT", () => {
    cleanupAllLocks();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanupAllLocks();
    process.exit(143);
  });
}

/**
 * Acquire Operation Lock atomically
 */
export function acquireLock(opts = {}) {
  const {
    stateRoot,
    operationId,
    requestId = null,
    operation = "unknown",
    entrypoint = "cli",
    runtimeExecutable = "$RUNTIME/current/bin/dream-skin-runtime",
    runtimeVersion = "0.1.0",
    processStartedAt: customProcessStartedAt = null,
  } = opts;

  if (!operationId) {
    throw new Error("acquireLock requires operationId");
  }

  let lockDir = opts.lockPath;
  if (!lockDir) {
    if (!stateRoot) {
      throw new Error("acquireLock requires either stateRoot or lockPath");
    }
    lockDir = path.join(stateRoot, "locks", "operation.lock");
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(lockDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const nowIso = new Date().toISOString();
  const processStartedAt = customProcessStartedAt || getProcessStartTime(process.pid) || nowIso;

  const ownerData = {
    lockSchemaVersion: 1,
    operationId,
    requestId,
    operation,
    entrypoint,
    pid: process.pid,
    processStartedAt: typeof processStartedAt === "string" ? processStartedAt : nowIso,
    runtimeExecutable,
    runtimeVersion,
    userIdentityHash: generateUserIdentityHash(),
    createdAt: nowIso,
    heartbeatAt: nowIso,
  };

  const attemptMkdirAndWriteOwner = () => {
    fs.mkdirSync(lockDir);
    const ownerPath = path.join(lockDir, "owner.json");
    fs.writeFileSync(ownerPath, JSON.stringify(ownerData, null, 2), "utf8");
  };

  try {
    attemptMkdirAndWriteOwner();
    const lockHandle = { lockDir, operationId };
    activeProcessLocks.add(lockHandle);
    ensureExitHandlersRegistered();
    return {
      acquired: true,
      recoveredStale: false,
      lockDir,
      owner: ownerData,
    };
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }

  // Lock directory already exists -> Inspect for Stale Lock
  const inspection = inspectLock({ lockDir });
  if (inspection.isStale) {
    try {
      // Safely purge stale lock directory
      fs.rmSync(lockDir, { recursive: true, force: true });
      attemptMkdirAndWriteOwner();
      const lockHandle = { lockDir, operationId };
      activeProcessLocks.add(lockHandle);
      ensureExitHandlersRegistered();
      return {
        acquired: true,
        recoveredStale: true,
        staleReason: inspection.reason,
        lockDir,
        owner: ownerData,
      };
    } catch {
      // Re-claim failed due to race condition
      return {
        acquired: false,
        busy: true,
        reason: "preempt_race_failed",
        owner: inspectLock({ lockDir }).owner,
      };
    }
  }

  // Active lock by another process
  return {
    acquired: false,
    busy: true,
    reason: "locked_by_active_process",
    owner: inspection.owner,
  };
}

/**
 * Release Operation Lock
 */
export function releaseLock(opts = {}) {
  let lockDir = opts.lockPath;
  if (!lockDir) {
    if (!opts.stateRoot) {
      throw new Error("releaseLock requires either stateRoot or lockPath");
    }
    lockDir = path.join(opts.stateRoot, "locks", "operation.lock");
  }

  if (!fs.existsSync(lockDir)) {
    return { released: true, existed: false };
  }

  const ownerPath = path.join(lockDir, "owner.json");
  if (fs.existsSync(ownerPath)) {
    try {
      const raw = fs.readFileSync(ownerPath, "utf8");
      const owner = JSON.parse(raw);
      // Verify ownership if operationId is provided
      if (opts.operationId && owner.operationId && owner.operationId !== opts.operationId) {
        return { released: false, reason: "ownership_mismatch", currentOwner: owner };
      }
    } catch {
      // Ignore parse errors on release
    }
  }

  try {
    fs.rmSync(lockDir, { recursive: true, force: true });

    // Remove from in-memory active process locks
    for (const lockHandle of activeProcessLocks) {
      if (lockHandle.lockDir === lockDir) {
        activeProcessLocks.delete(lockHandle);
      }
    }
    return { released: true, existed: true };
  } catch (err) {
    return { released: false, error: err.message };
  }
}
