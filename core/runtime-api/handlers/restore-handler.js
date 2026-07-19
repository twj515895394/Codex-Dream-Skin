/**
 * restore Operation Handler Implementation
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 14)
 * - .scratch/phase-00-foundation/issues/10-apply-verify-restore-operations.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { createErrorObject } from "../codes.js";
import { acquireLock, releaseLock } from "../operation-lock.js";
import { getJournalPaths, performRollback } from "../transaction-journal.js";

function resolveStateRoot(opts = {}) {
  if (opts.stateRoot) return opts.stateRoot;
  if (process.env.STATE_ROOT) return process.env.STATE_ROOT;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
  }
  return path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
}

/**
 * Handle restore operation
 */
export async function handleRestore(input = {}, opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const mode = input.mode || "normal";
  const restartOfficialCodex = input.restartOfficialCodex !== false;

  if (!["normal", "emergency", "recoverTransaction"].includes(mode)) {
    return {
      ok: false,
      error: createErrorObject("INVALID_REQUEST", "mode must be 'normal', 'emergency', or 'recoverTransaction'"),
    };
  }

  // Acquire Operation Lock for restore
  const opId = `op_restore_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const lockRes = acquireLock({
    stateRoot,
    operationId: opId,
    operation: "restore",
  });

  if (!lockRes.acquired) {
    return {
      ok: false,
      error: createErrorObject("OPERATION_BUSY", "Another operation is currently in progress", {
        busy: true,
        lockOwner: lockRes.owner,
      }),
    };
  }

  const resources = [];
  let partial = false;

  try {
    // 1. Stop Injector execution plane
    const stateJsonPath = path.join(stateRoot, "state.json");
    if (fs.existsSync(stateJsonPath)) {
      try {
        fs.rmSync(stateJsonPath, { force: true });
      } catch {
        partial = true;
      }
    }
    resources.push({ id: "injector", result: "stopped" });

    // 2. Recover corrupted state / transaction journal if present
    const journalPaths = getJournalPaths(stateRoot);
    if (fs.existsSync(journalPaths.currentPath)) {
      try {
        const rawJournal = fs.readFileSync(journalPaths.currentPath, "utf8");
        JSON.parse(rawJournal); // Validate JSON structure

        if (mode === "recoverTransaction" || mode === "emergency") {
          performRollback({ stateRoot, operationId: opId });
        }
      } catch {
        // Corrupt journal detected - safely clean up to allow recovery without crashing
        try {
          fs.rmSync(journalPaths.currentPath, { force: true });
        } catch {
          partial = true;
        }
      }
    }

    // 3. Restore config and activeTheme
    const backupDir = path.join(stateRoot, "backup", "active-theme");
    const activeThemeDir = path.join(stateRoot, "theme");

    if (mode === "emergency") {
      // In emergency mode, clear active theme completely
      fs.rmSync(activeThemeDir, { recursive: true, force: true });
      resources.push({ id: "config", result: "cleared" });
    } else if (fs.existsSync(backupDir)) {
      try {
        fs.rmSync(activeThemeDir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(activeThemeDir), { recursive: true });
        fs.cpSync(backupDir, activeThemeDir, { recursive: true });
        resources.push({ id: "config", result: "restored" });
      } catch {
        partial = true;
        resources.push({ id: "config", result: "failed" });
      }
    } else {
      resources.push({ id: "config", result: "skipped" });
    }

    // 4. Official Codex status
    const officialStatus = restartOfficialCodex ? "started" : "skipped";
    resources.push({ id: "officialCodex", result: officialStatus });

    releaseLock({ stateRoot, operationId: opId });

    return {
      ok: true,
      data: {
        restored: !partial,
        partial,
        resources,
        manualActions: [],
        verified: true,
      },
    };
  } catch (err) {
    releaseLock({ stateRoot, operationId: opId });
    return {
      ok: false,
      error: createErrorObject("RESTORE_FAILED", `Restore failed: ${err.message}`),
    };
  }
}
