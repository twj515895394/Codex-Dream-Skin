/**
 * importTheme Operation Handler Implementation
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 11)
 * - .scratch/phase-00-foundation/issues/09-import-theme-operation.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

import { createErrorObject } from "../codes.js";
import { acquireLock, releaseLock } from "../operation-lock.js";
import {
  createJournal,
  updateJournalStage,
  commitJournal,
  performRollback,
  getJournalPaths,
} from "../transaction-journal.js";

const EXECUTABLE_EXTENSIONS = new Set([
  ".sh", ".bash", ".zsh", ".command", ".app", ".pkg", ".dmg",
  ".exe", ".dll", ".dylib", ".so", ".bin", ".js", ".mjs", ".cjs",
  ".py", ".pl", ".rb", ".ps1", ".bat", ".cmd",
]);

const VALID_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

function getThemeLibraryDir(stateRoot) {
  // Support both themes/ and saved-themes/ for backwards compatibility
  const themesDir = path.join(stateRoot, "themes");
  const savedThemesDir = path.join(stateRoot, "saved-themes");

  if (fs.existsSync(savedThemesDir) && !fs.existsSync(themesDir)) {
    return savedThemesDir;
  }
  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
  }
  return themesDir;
}

function resolveStateRoot(opts = {}) {
  if (opts.stateRoot) return opts.stateRoot;
  if (process.env.STATE_ROOT) return process.env.STATE_ROOT;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
  }
  return path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
}

/**
 * Handle importTheme operation
 */
export async function handleImportTheme(input = {}, opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const sourceFile = input.sourceFile;
  const conflictPolicy = input.conflictPolicy || "reject";

  // Validate source file parameter
  if (!sourceFile || typeof sourceFile !== "string" || !path.isAbsolute(sourceFile)) {
    return {
      ok: false,
      error: createErrorObject("INVALID_REQUEST", "sourceFile must be an absolute local path"),
    };
  }

  if (!fs.existsSync(sourceFile)) {
    return {
      ok: false,
      error: createErrorObject("PACKAGE_NOT_FOUND", `Theme package not found: ${sourceFile}`),
    };
  }

  if (!sourceFile.endsWith(".codex-theme")) {
    return {
      ok: false,
      error: createErrorObject("PACKAGE_UNREADABLE", "Theme package must use the .codex-theme extension"),
    };
  }

  const stat = fs.statSync(sourceFile);
  if (stat.size === 0 || stat.size > 67108864) {
    const errCode = stat.size === 0 ? "PACKAGE_UNREADABLE" : "PACKAGE_TOO_LARGE";
    return {
      ok: false,
      error: createErrorObject(errCode, "Theme package must be non-empty and no larger than 64 MB"),
    };
  }

  // Operation Lock
  const opId = `op_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const lockRes = acquireLock({
    stateRoot,
    operationId: opId,
    operation: "importTheme",
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

  function cleanupJournalOnFailure(errObj) {
    if (createdJournal) {
      try {
        const paths = getJournalPaths(stateRoot);
        if (fs.existsSync(paths.currentPath)) {
          fs.rmSync(paths.currentPath, { force: true });
        }
      } catch {
        // Suppress journal cleanup errors
      }
    }
    return { ok: false, error: errObj };
  }

  try {
    // Transaction Journal Creation
    createJournal({
      stateRoot,
      operationId: opId,
      operation: "importTheme",
      target: { kind: "themePackage", logicalId: path.basename(sourceFile) },
    });
    createdJournal = true;

    // Staging Directory Creation
    stagingDir = fs.mkdtempSync(path.join(stateRoot, ".import-stage-"));
    fs.chmodSync(stagingDir, 0o700);

    updateJournalStage({
      stateRoot,
      operationId: opId,
      updates: {
        state: "staged",
        stage: { relativePath: path.relative(stateRoot, stagingDir), verified: false },
      },
    });

    // Extract ZIP archive safely
    try {
      if (process.platform === "darwin") {
        execFileSync("/usr/bin/ditto", ["-x", "-k", sourceFile, stagingDir], { stdio: "ignore" });
      } else {
        // Fallback for Windows/Linux
        execFileSync("tar", ["-xf", sourceFile, "-C", stagingDir], { stdio: "ignore" });
      }
    } catch {
      return cleanupJournalOnFailure(
        createErrorObject("PACKAGE_UNREADABLE", "Theme package is not a readable ZIP archive")
      );
    }

    // Safety Checks: Symlinks, Special Files, Path Traversal, Executable Content
    const filesToScan = [];
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(stagingDir, fullPath);

        // Check path traversal in relative path
        if (relPath.includes("../") || relPath.includes("..\\") || relPath.startsWith("/")) {
          const err = new Error(`Unsafe path detected: ${relPath}`);
          err.code = "PACKAGE_UNSAFE_PATH";
          throw err;
        }

        if (entry.isSymbolicLink()) {
          const err = new Error(`Symbolic link detected: ${relPath}`);
          err.code = "PACKAGE_LINK_OR_SPECIAL_FILE";
          throw err;
        }

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          // Check extension
          const ext = path.extname(entry.name).toLowerCase();
          if (EXECUTABLE_EXTENSIONS.has(ext)) {
            const err = new Error(`Executable content not allowed: ${relPath}`);
            err.code = "PACKAGE_EXECUTABLE_CONTENT";
            throw err;
          }
          filesToScan.push({ fullPath, relPath });
        } else {
          const err = new Error(`Special file not allowed: ${relPath}`);
          err.code = "PACKAGE_LINK_OR_SPECIAL_FILE";
          throw err;
        }
      }
    }

    try {
      scanDir(stagingDir);
    } catch (scanErr) {
      return cleanupJournalOnFailure(
        createErrorObject(scanErr.code || "MANIFEST_INVALID", scanErr.message)
      );
    }

    // Locate root containing manifest.json
    let extractedRoot = stagingDir;
    const topEntries = fs.readdirSync(stagingDir);
    if (topEntries.length === 1 && fs.statSync(path.join(stagingDir, topEntries[0])).isDirectory()) {
      const nestedDir = path.join(stagingDir, topEntries[0]);
      if (fs.existsSync(path.join(nestedDir, "manifest.json"))) {
        extractedRoot = nestedDir;
      }
    }

    const manifestPath = path.join(extractedRoot, "manifest.json");
    const themeJsonPath = path.join(extractedRoot, "theme.json");

    if (!fs.existsSync(manifestPath)) {
      return cleanupJournalOnFailure(
        createErrorObject("MANIFEST_INVALID", "manifest.json is missing from the theme package")
      );
    }

    if (!fs.existsSync(themeJsonPath)) {
      return cleanupJournalOnFailure(
        createErrorObject("THEME_INVALID", "theme.json is missing from the theme package")
      );
    }

    // Schema Validation
    let manifestData, themeData;
    try {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      themeData = JSON.parse(fs.readFileSync(themeJsonPath, "utf8"));
    } catch {
      return cleanupJournalOnFailure(
        createErrorObject("MANIFEST_INVALID", "Corrupted JSON in manifest or theme configuration")
      );
    }

    if (manifestData?.schemaVersion !== 1 || themeData?.schemaVersion !== 1) {
      return cleanupJournalOnFailure(
        createErrorObject("MANIFEST_INVALID", "Unsupported manifest or theme schemaVersion")
      );
    }

    const themeId = manifestData.id;
    if (!themeId || typeof themeId !== "string" || !VALID_ID_PATTERN.test(themeId)) {
      return cleanupJournalOnFailure(
        createErrorObject("MANIFEST_INVALID", `Invalid theme ID: ${themeId}`)
      );
    }

    if (themeData.id !== themeId) {
      return cleanupJournalOnFailure(
        createErrorObject("THEME_INVALID", "theme.id must match manifest.id")
      );
    }

    if (manifestData.theme !== "theme.json") {
      return cleanupJournalOnFailure(
        createErrorObject("MANIFEST_INVALID", "manifest.theme must be theme.json")
      );
    }

    if (!themeData.image || typeof themeData.image !== "string" || path.basename(themeData.image) !== themeData.image) {
      return cleanupJournalOnFailure(
        createErrorObject("THEME_INVALID", "theme.image must be a file in the package root")
      );
    }

    const imageFilePath = path.join(extractedRoot, themeData.image);
    if (!fs.existsSync(imageFilePath)) {
      return cleanupJournalOnFailure(
        createErrorObject("THEME_INVALID", `Theme background image file not found: ${themeData.image}`)
      );
    }

    updateJournalStage({
      stateRoot,
      operationId: opId,
      updates: {
        state: "validated",
        stage: { relativePath: path.relative(stateRoot, extractedRoot), verified: true },
        target: { kind: "theme", logicalId: themeId },
      },
    });

    // Conflict Check and Replacement Logic
    const libraryDir = getThemeLibraryDir(stateRoot);
    const targetThemeDir = path.join(libraryDir, themeId);
    let replaced = false;
    let backupDir = null;

    if (fs.existsSync(targetThemeDir)) {
      if (conflictPolicy === "reject") {
        return cleanupJournalOnFailure(
          createErrorObject("THEME_ID_CONFLICT", `Theme ID '${themeId}' already exists in library`)
        );
      }

      // Conflict policy: replace -> Create backup
      const backupsDir = path.join(stateRoot, "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      backupDir = path.join(backupsDir, `${themeId}_${Date.now()}`);
      fs.cpSync(targetThemeDir, backupDir, { recursive: true });

      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          state: "backed_up",
          backup: { relativePath: path.relative(stateRoot, backupDir), exists: true },
        },
      });

      // Purge existing target directory for replacement
      fs.rmSync(targetThemeDir, { recursive: true, force: true });
      replaced = true;
    }

    // Publish: Move extractedRoot to targetThemeDir
    try {
      fs.cpSync(extractedRoot, targetThemeDir, { recursive: true });
      updateJournalStage({
        stateRoot,
        operationId: opId,
        updates: {
          state: "published",
          publish: { started: true, commitMarkerWritten: true },
        },
      });
    } catch (publishErr) {
      // Rollback if publish fails and backup exists
      if (backupDir && fs.existsSync(backupDir)) {
        performRollback({
          stateRoot,
          backupAbsPath: backupDir,
          targetAbsPath: targetThemeDir,
        });
      }
      return {
        ok: false,
        error: createErrorObject("PUBLISH_FAILED", `Failed to publish imported theme: ${publishErr.message}`),
      };
    }

    // Compute revision hash for response
    const themeJsonRaw = fs.readFileSync(path.join(targetThemeDir, "theme.json"), "utf8");
    const revisionHash = `sha256:${crypto.createHash("sha256").update(themeJsonRaw).digest("hex")}`;

    // Commit Journal
    commitJournal({
      stateRoot,
      operationId: opId,
    });

    return {
      ok: true,
      data: {
        installed: true,
        replaced,
        theme: {
          id: themeId,
          name: themeData.name || themeId,
          revision: revisionHash,
          source: "imported",
          status: "ready",
        },
        applied: false,
        verified: true,
        rollbackAttempted: false,
        rollbackSucceeded: null,
        transaction: {
          state: "completed",
          committed: true,
          cleanupPending: false,
        },
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: createErrorObject("INTERNAL_ERROR", `Unhandled import error: ${err.message}`),
    };
  } finally {
    // Cleanup temporary staging directory
    if (stagingDir && fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch {
        // Suppress staging cleanup errors
      }
    }
    // Release Operation Lock
    releaseLock({ stateRoot, operationId: opId });
  }
}
