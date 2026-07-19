/**
 * Status Operation Handler Implementation
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 9)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { inspectLock } from "../operation-lock.js";
import { inspectJournal } from "../transaction-journal.js";

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
  let lockDir = opts.lockDir || path.join(stateRoot, "locks", "operation.lock");
  let lockInspection = inspectLock({ lockDir });
  if (!lockInspection.exists) {
    // Fallback check legacy path lock/owner.json if opts.lockPath or legacy exists
    const legacyOwnerPath = opts.lockPath || path.join(stateRoot, "lock", "owner.json");
    if (fs.existsSync(legacyOwnerPath)) {
      lockInspection = inspectLock({ lockDir: path.dirname(legacyOwnerPath) });
    }
  }

  if (lockInspection.exists && !lockInspection.isStale && lockInspection.owner) {
    const lockData = lockInspection.owner;
    if (lockData.operationId) {
      busyOperation = {
        busy: true,
        operationId: lockData.operationId,
        operation: lockData.operation || "unknown",
      };
    }
  }

  // 2. Check Transaction Journal (journals/current.json)
  const journalInspection = inspectJournal({ stateRoot, journalPath: opts.journalPath });
  if (journalInspection.exists && journalInspection.recoveryRequired) {
    recoveryRequired = true;
    const jData = journalInspection.journal || {};
    recoveryData = {
      transactionId: jData.operationId || "unknown",
      state: jData.state || "unknown",
    };
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
