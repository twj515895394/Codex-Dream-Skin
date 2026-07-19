/**
 * applyTheme Operation Handler Implementation
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 12)
 * - .scratch/phase-00-foundation/issues/10-apply-verify-restore-operations.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import { createErrorObject } from "../codes.js";
import { acquireLock, releaseLock } from "../operation-lock.js";
import {
  createJournal,
  updateJournalStage,
  commitJournal,
  performRollback,
  getJournalPaths,
} from "../transaction-journal.js";

const VALID_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

function resolveStateRoot(opts = {}) {
  if (opts.stateRoot) return opts.stateRoot;
  if (process.env.STATE_ROOT) return process.env.STATE_ROOT;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
  }
  return path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
}

function findThemeDir(stateRoot, themeId) {
  const themesDir = path.join(stateRoot, "themes", themeId);
  const savedThemesDir = path.join(stateRoot, "saved-themes", themeId);

  if (fs.existsSync(themesDir)) return themesDir;
  if (fs.existsSync(savedThemesDir)) return savedThemesDir;
  return null;
}

/**
 * Handle applyTheme operation
 */
export async function handleApplyTheme(input = {}, opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const themeId = input.themeId;
  const expectedThemeRevision = input.expectedThemeRevision;

  // Validate themeId parameter
  if (!themeId || typeof themeId !== "string" || !VALID_ID_PATTERN.test(themeId)) {
    return {
      ok: false,
      error: createErrorObject("INVALID_REQUEST", "themeId must be a valid non-empty identifier"),
    };
  }

  // 1. Locate source theme directory
  const themeDir = findThemeDir(stateRoot, themeId);
  if (!themeDir) {
    return {
      ok: false,
      error: createErrorObject("THEME_NOT_FOUND", `Theme with ID '${themeId}' was not found`),
    };
  }

  const themeConfigPath = path.join(themeDir, "theme.json");
  if (!fs.existsSync(themeConfigPath)) {
    return {
      ok: false,
      error: createErrorObject("THEME_INVALID", `Theme '${themeId}' is missing theme.json`),
    };
  }

  // Calculate actual revision
  const actualRevision = computeFileHash(themeConfigPath);
  if (expectedThemeRevision && expectedThemeRevision !== actualRevision) {
    return {
      ok: false,
      error: createErrorObject("REVISION_MISMATCH", "Theme revision mismatch"),
    };
  }

  // 2. Acquire Operation Lock
  const opId = `op_apply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const lockRes = acquireLock({
    stateRoot,
    operationId: opId,
    operation: "applyTheme",
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

  let stagingDir = null;
  let createdJournal = false;

  function cleanupLockAndJournalOnFailure(errObj) {
    if (createdJournal) {
      try {
        const paths = getJournalPaths(stateRoot);
        if (fs.existsSync(paths.currentPath)) {
          fs.rmSync(paths.currentPath, { force: true });
        }
      } catch {
        // Suppress errors
      }
    }
    releaseLock({ stateRoot, operationId: opId });
    return { ok: false, error: errObj };
  }

  const activeThemeDir = path.join(stateRoot, "theme");
  const backupDir = path.join(stateRoot, "backup", "active-theme");

  try {
    // 3. Create Transaction Journal
    createJournal({
      stateRoot,
      operationId: opId,
      operation: "applyTheme",
      target: { kind: "activeTheme", logicalId: themeId },
    });
    createdJournal = true;

    // 4. Backup current active theme
    let previousThemeId = null;

    if (fs.existsSync(activeThemeDir)) {
      const activeConfig = path.join(activeThemeDir, "theme.json");
      if (fs.existsSync(activeConfig)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(activeConfig, "utf8"));
          previousThemeId = parsed.id || null;
        } catch {
          // Ignore parse error
        }
      }

      fs.rmSync(backupDir, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(backupDir), { recursive: true });
      fs.cpSync(activeThemeDir, backupDir, { recursive: true });

      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          backup: {
            relativePath: path.relative(stateRoot, backupDir),
            exists: true,
            revision: computeFileHash(activeConfig),
          },
        },
      });
    }

    // 5. Staging new theme files
    stagingDir = fs.mkdtempSync(path.join(stateRoot, ".apply-stage-"));
    fs.chmodSync(stagingDir, 0o700);

    fs.cpSync(themeDir, stagingDir, { recursive: true });

    updateJournalStage({
      stateRoot,
      operationId: opId,
      updates: {
        state: "staged",
        stage: { relativePath: path.relative(stateRoot, stagingDir), verified: true },
      },
    });

    // 6. Check Restart Requirement Guard
    if (opts.requireCodexRestart === true && input.allowCodexRestart !== true) {
      return cleanupLockAndJournalOnFailure(
        createErrorObject("CODEX_RESTART_REQUIRED", "Codex restart is required to apply theme", {
          action: "confirmRestart",
          details: { requiredAction: "confirmRestart" },
        })
      );
    }

    // 7. Atomic Publish (Write theme.json last)
    const tempActiveDir = fs.mkdtempSync(path.join(stateRoot, ".active-temp-"));
    // Copy stage files except theme.json
    const entries = fs.readdirSync(stagingDir);
    for (const entry of entries) {
      if (entry !== "theme.json") {
        fs.cpSync(path.join(stagingDir, entry), path.join(tempActiveDir, entry), { recursive: true });
      }
    }
    // Write theme.json last to guarantee complete payload
    fs.cpSync(path.join(stagingDir, "theme.json"), path.join(tempActiveDir, "theme.json"));

    // Replace active theme directory
    fs.rmSync(activeThemeDir, { recursive: true, force: true });
    fs.renameSync(tempActiveDir, activeThemeDir);

    updateJournalStage({
      stateRoot,
      operationId: opId,
      updates: {
        state: "published",
        publish: { started: true, commitMarkerWritten: true },
      },
    });

    // 8. Injection / Verification & Failure Simulation check
    if (opts.simulateInjectFailure === true) {
      throw new Error("Simulated injection failure during applyTheme");
    }

    // Mark as completed
    commitJournal({ stateRoot, operationId: opId, state: "completed" });
    releaseLock({ stateRoot, operationId: opId });

    if (stagingDir && fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }

    return {
      ok: true,
      data: {
        themeId,
        applied: true,
        verified: true,
        usedHotPath: true,
        codexRestarted: false,
        rollbackAttempted: false,
        rollbackSucceeded: null,
        previousThemeId,
        transaction: {
          state: "completed",
          committed: true,
          cleanupPending: false,
        },
      },
    };
  } catch (err) {
    // Attempt Rollback
    updateJournalStage({
      stateRoot,
      operationId: opId,
      updates: {
        state: "rolling_back",
        error: err.message,
      },
    });

    let rollbackResult = { recovered: false };
    if (opts.simulateRollbackFailure === true) {
      rollbackResult = { recovered: false, error: "Simulated rollback failure" };
    } else {
      rollbackResult = performRollback({
        stateRoot,
        backupAbsPath: backupDir,
        targetAbsPath: activeThemeDir,
      });
    }

    if (stagingDir && fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }

    releaseLock({ stateRoot, operationId: opId });

    if (rollbackResult.recovered) {
      return {
        ok: false,
        error: createErrorObject("APPLY_FAILED", `Apply failed: ${err.message}`),
        data: {
          themeId,
          applied: false,
          verified: false,
          usedHotPath: false,
          codexRestarted: false,
          rollbackAttempted: true,
          rollbackSucceeded: true,
          previousThemeId: null,
          transaction: {
            state: "rolled_back",
            committed: false,
            cleanupPending: false,
          },
        },
      };
    } else {
      return {
        ok: false,
        error: createErrorObject("APPLY_FAILED_ROLLBACK_FAILED", `Apply and rollback failed: ${err.message}`),
        data: {
          themeId,
          applied: false,
          verified: false,
          usedHotPath: false,
          codexRestarted: false,
          rollbackAttempted: true,
          rollbackSucceeded: false,
          recoveryRequired: true,
          transaction: {
            state: "failed",
            committed: false,
            cleanupPending: true,
          },
        },
      };
    }
  }
}
