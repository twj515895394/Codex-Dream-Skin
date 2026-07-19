/**
 * Transaction Journal & Crash Recovery Coordinator Implementation
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 16)
 * - .scratch/phase-00-foundation/issues/08-transaction-journal-crash-recovery.md
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Get standard journal paths for a given stateRoot
 */
export function getJournalPaths(stateRoot) {
  const journalsDir = path.join(stateRoot, "journals");
  const currentPath = path.join(journalsDir, "current.json");
  const historyDir = path.join(journalsDir, "history");
  const legacyPath = path.join(stateRoot, "journal", "journal.json");
  return { journalsDir, currentPath, historyDir, legacyPath };
}

/**
 * Inspect active journal for crash recovery requirements
 */
export function inspectJournal(opts = {}) {
  const stateRoot = opts.stateRoot;
  let targetPath = opts.journalPath;

  if (!targetPath && stateRoot) {
    const paths = getJournalPaths(stateRoot);
    if (fs.existsSync(paths.currentPath)) {
      targetPath = paths.currentPath;
    } else if (fs.existsSync(paths.legacyPath)) {
      targetPath = paths.legacyPath;
    }
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    return { exists: false, recoveryRequired: false, journal: null };
  }

  try {
    const raw = fs.readFileSync(targetPath, "utf8");
    const journal = JSON.parse(raw);

    if (!journal || typeof journal !== "object" || !journal.operationId) {
      return { exists: true, recoveryRequired: true, reason: "corrupted_journal_schema", journal };
    }

    // A journal requires recovery if it is NOT committed, OR if it has an unhandled error/published state
    const isCommitted = Boolean(journal.committed);
    const hasError = Boolean(journal.error);
    const isPublished = journal.state === "published";
    const isUnfinished = journal.state !== "committed" && journal.state !== "recovered";

    const recoveryRequired = !isCommitted && (hasError || isPublished || isUnfinished);

    return {
      exists: true,
      recoveryRequired,
      journalPath: targetPath,
      journal,
    };
  } catch {
    return { exists: true, recoveryRequired: true, reason: "malformed_journal_json", journal: null };
  }
}

/**
 * Create a new active Transaction Journal in STATE_ROOT/journals/current.json
 */
export function createJournal(opts = {}) {
  const { stateRoot, operationId, requestId = null, operation = "unknown", target = null } = opts;

  if (!stateRoot || !operationId) {
    throw new Error("createJournal requires stateRoot and operationId");
  }

  const { journalsDir, currentPath } = getJournalPaths(stateRoot);
  if (!fs.existsSync(journalsDir)) {
    fs.mkdirSync(journalsDir, { recursive: true });
  }

  // Check if active transaction exists and requires recovery
  const inspection = inspectJournal({ stateRoot });
  if (inspection.exists && inspection.recoveryRequired && inspection.journal?.operationId !== operationId) {
    const err = new Error(`Active unfinished transaction ${inspection.journal?.operationId} exists and requires recovery`);
    err.code = "TRANSACTION_RECOVERY_REQUIRED";
    err.activeJournal = inspection.journal;
    throw err;
  }

  const nowIso = new Date().toISOString();
  const journalData = {
    journalSchemaVersion: 1,
    operationId,
    requestId,
    operation,
    state: "initialized",
    committed: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    target: target || { kind: "unknown", logicalId: "unknown" },
    stage: { relativePath: null, verified: false },
    backup: { relativePath: null, exists: false, revision: null },
    publish: { started: false, commitMarkerWritten: false },
    verification: { attempted: false, passed: null },
    rollback: { attempted: false, succeeded: null },
    cleanup: { pending: false, warnings: [] },
    error: null,
  };

  fs.writeFileSync(currentPath, JSON.stringify(journalData, null, 2), "utf8");
  return { created: true, currentPath, journal: journalData };
}

/**
 * Update stages or metadata of the active journal
 */
export function updateJournalStage(opts = {}) {
  const { stateRoot, operationId, updates = {} } = opts;
  if (!stateRoot || !operationId) {
    throw new Error("updateJournalStage requires stateRoot and operationId");
  }

  const { currentPath } = getJournalPaths(stateRoot);
  if (!fs.existsSync(currentPath)) {
    throw new Error(`Active journal not found at ${currentPath}`);
  }

  const raw = fs.readFileSync(currentPath, "utf8");
  const journal = JSON.parse(raw);

  if (journal.operationId !== operationId) {
    throw new Error(`Operation ID mismatch: expected ${operationId}, got ${journal.operationId}`);
  }

  const nowIso = new Date().toISOString();
  journal.updatedAt = nowIso;

  if (updates.state) journal.state = updates.state;
  if (updates.error !== undefined) journal.error = updates.error;
  if (updates.stage) journal.stage = { ...journal.stage, ...updates.stage };
  if (updates.backup) journal.backup = { ...journal.backup, ...updates.backup };
  if (updates.publish) journal.publish = { ...journal.publish, ...updates.publish };
  if (updates.verification) journal.verification = { ...journal.verification, ...updates.verification };
  if (updates.rollback) journal.rollback = { ...journal.rollback, ...updates.rollback };
  if (updates.cleanup) journal.cleanup = { ...journal.cleanup, ...updates.cleanup };

  fs.writeFileSync(currentPath, JSON.stringify(journal, null, 2), "utf8");
  return { updated: true, journal };
}

/**
 * Commit the active journal and archive it into STATE_ROOT/journals/history/<opId>.json
 */
export function commitJournal(opts = {}) {
  const { stateRoot, operationId, cleanupWarnings = [] } = opts;
  if (!stateRoot || !operationId) {
    throw new Error("commitJournal requires stateRoot and operationId");
  }

  const { currentPath, historyDir } = getJournalPaths(stateRoot);
  if (!fs.existsSync(currentPath)) {
    throw new Error(`Active journal not found at ${currentPath}`);
  }

  const raw = fs.readFileSync(currentPath, "utf8");
  const journal = JSON.parse(raw);

  if (journal.operationId !== operationId) {
    throw new Error(`Operation ID mismatch: expected ${operationId}, got ${journal.operationId}`);
  }

  const nowIso = new Date().toISOString();
  journal.committed = true;
  journal.state = "committed";
  journal.updatedAt = nowIso;

  if (cleanupWarnings && cleanupWarnings.length > 0) {
    journal.cleanup.warnings = [...(journal.cleanup.warnings || []), ...cleanupWarnings];
  }

  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const historyPath = path.join(historyDir, `${operationId}.json`);
  fs.writeFileSync(historyPath, JSON.stringify(journal, null, 2), "utf8");

  // Atomic remove active current.json
  fs.rmSync(currentPath, { force: true });

  return { committed: true, historyPath, journal };
}

/**
 * Perform Crash Recovery / Rollback based on active journal
 */
export function performRollback(opts = {}) {
  const { stateRoot, backupAbsPath, targetAbsPath } = opts;
  if (!stateRoot) {
    throw new Error("performRollback requires stateRoot");
  }

  const inspection = inspectJournal({ stateRoot });
  if (!inspection.exists || !inspection.journal) {
    return { recovered: false, reason: "no_active_journal" };
  }

  const journal = inspection.journal;
  const operationId = journal.operationId;
  const nowIso = new Date().toISOString();

  let rollbackSucceeded = false;
  let rollbackMessage = "";

  if (backupAbsPath && targetAbsPath && fs.existsSync(backupAbsPath)) {
    try {
      // Restore files from backup to target
      if (fs.statSync(backupAbsPath).isDirectory()) {
        fs.cpSync(backupAbsPath, targetAbsPath, { recursive: true });
      } else {
        fs.copyFileSync(backupAbsPath, targetAbsPath);
      }
      rollbackSucceeded = true;
      rollbackMessage = "Restored from backup directory/file";
    } catch (err) {
      rollbackSucceeded = false;
      rollbackMessage = `Restore failed: ${err.message}`;
    }
  } else {
    // No backup available, mark attempt
    rollbackSucceeded = false;
    rollbackMessage = "No backup resource available to restore";
  }

  const rollbackStatus = {
    attempted: true,
    succeeded: rollbackSucceeded,
    recoveredAt: nowIso,
    message: rollbackMessage,
  };

  const updatedState = rollbackSucceeded ? "recovered" : "failed";

  // Update current journal
  updateJournalStage({
    stateRoot,
    operationId,
    updates: {
      state: updatedState,
      rollback: rollbackStatus,
    },
  });

  // Archive to history after recovery attempt
  const { currentPath, historyDir } = getJournalPaths(stateRoot);
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  const historyPath = path.join(historyDir, `${operationId}.json`);
  if (fs.existsSync(currentPath)) {
    const raw = fs.readFileSync(currentPath, "utf8");
    fs.writeFileSync(historyPath, raw, "utf8");
    fs.rmSync(currentPath, { force: true });
  }

  return {
    recovered: rollbackSucceeded,
    operationId,
    historyPath,
    rollback: rollbackStatus,
  };
}
