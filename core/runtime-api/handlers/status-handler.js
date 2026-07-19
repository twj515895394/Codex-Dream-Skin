/**
 * Status Operation Handler Implementation
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 9)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function handleStatus(input = {}, opts = {}) {
  const includeChecks = Boolean(input.includeChecks);

  // Resolve stateRoot safely
  let stateRoot = opts.stateRoot;
  if (!stateRoot) {
    if (process.env.STATE_ROOT) {
      stateRoot = process.env.STATE_ROOT;
    } else if (process.platform === "darwin") {
      stateRoot = path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
    } else {
      stateRoot = path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
    }
  }

  let busyOperation = null;
  let recoveryData = null;
  let recoveryRequired = false;
  let currentTheme = null;

  // 1. Check Operation Lock (owner.json)
  const lockPath = opts.lockPath || path.join(stateRoot, "lock", "owner.json");
  if (fs.existsSync(lockPath)) {
    try {
      const lockContent = fs.readFileSync(lockPath, "utf8");
      const lockData = JSON.parse(lockContent);
      if (lockData && lockData.operationId) {
        busyOperation = {
          busy: true,
          operationId: lockData.operationId,
          operation: lockData.operation || "unknown",
        };
      }
    } catch {
      // Ignore read errors
    }
  }

  // 2. Check Transaction Journal (journal.json)
  const journalPath = opts.journalPath || path.join(stateRoot, "journal", "journal.json");
  if (fs.existsSync(journalPath)) {
    try {
      const journalContent = fs.readFileSync(journalPath, "utf8");
      const journalData = JSON.parse(journalContent);
      if (journalData && (journalData.committed === false || journalData.state === "published" || journalData.error)) {
        recoveryRequired = true;
        recoveryData = {
          transactionId: journalData.operationId || "unknown",
          state: journalData.state || "unknown",
        };
      }
    } catch {
      // Ignore read errors
    }
  }

  // 3. Check Active Theme (theme.json)
  const activeThemeConfigPath = opts.activeThemeConfigPath || path.join(stateRoot, "theme", "theme.json");
  if (fs.existsSync(activeThemeConfigPath)) {
    try {
      const configContent = fs.readFileSync(activeThemeConfigPath, "utf8");
      const configData = JSON.parse(configContent);
      if (configData && configData.id) {
        currentTheme = {
          id: configData.id,
          name: configData.name || configData.id,
        };
      }
    } catch {
      // Ignore read errors
    }
  }

  // Determine runtime state
  let runtimeState = "ready";
  if (recoveryRequired) {
    runtimeState = "recoveryRequired";
  } else if (opts.runtimeState) {
    runtimeState = opts.runtimeState;
  }

  const responseData = {
    runtime: {
      state: runtimeState,
      version: opts.runtimeVersion || "0.1.0",
      integrity: opts.integrity || "verified",
      recoveryRequired,
      cleanupPending: Boolean(opts.cleanupPending),
    },
    codex: {
      state: opts.codexState || "running",
      version: opts.codexVersion || "26.7.0",
      identity: opts.codexIdentity || "verified",
      cdp: opts.cdpState || "ready",
    },
    skin: {
      state: currentTheme ? "active" : "off",
      currentTheme,
      injector: opts.injectorState || "running",
      renderer: opts.rendererState || "verified",
    },
    operation: busyOperation,
    recovery: recoveryData,
  };

  if (includeChecks) {
    responseData.checks = [
      { id: "stateRootAccess", status: fs.existsSync(stateRoot) ? "pass" : "warn" },
      { id: "lockFree", status: busyOperation ? "warn" : "pass" },
      { id: "journalClean", status: recoveryRequired ? "warn" : "pass" },
    ];
  }

  return {
    ok: true,
    data: responseData,
  };
}
