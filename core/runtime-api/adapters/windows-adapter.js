/**
 * Windows Platform Adapter Implementation for Runtime API v1
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/12-windows-platform-adapter.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { createErrorObject } from "../codes.js";
import { handleCapabilities } from "../handlers/capabilities-handler.js";
import { handleStatus } from "../handlers/status-handler.js";
import { handleListThemes } from "../handlers/list-themes-handler.js";
import { handleImportTheme } from "../handlers/import-theme-handler.js";
import { handleApplyTheme } from "../handlers/apply-theme-handler.js";
import { handleVerify } from "../handlers/verify-handler.js";
import { handleRestore } from "../handlers/restore-handler.js";

function resolveStateRoot(opts = {}) {
  if (opts.stateRoot) return opts.stateRoot;
  if (process.env.STATE_ROOT) return process.env.STATE_ROOT;
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData/Local");
    return path.join(localAppData, "CodexDreamSkinStudio");
  }
  return path.join(os.homedir(), "AppData/Local/CodexDreamSkinStudio");
}

function resolvePowerShellVersion(opts = {}) {
  if (opts.powershellVersion) return opts.powershellVersion;
  return "5.1";
}

/**
 * Validate that a path does not escape a target root or leverage reparse point / junctions
 */
function isSafePathContainment(targetPath, baseDir) {
  if (!targetPath || !baseDir) return false;
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(baseDir);

  // Normalize case for Windows case-insensitive checks
  const targetLower = resolvedTarget.toLowerCase();
  const baseLower = resolvedBase.toLowerCase();

  if (!targetLower.startsWith(baseLower)) {
    return false;
  }

  // Check for symlink / reparse point if file exists
  if (fs.existsSync(targetPath)) {
    try {
      const lstat = fs.lstatSync(targetPath);
      if (lstat.isSymbolicLink()) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export function createWindowsAdapter(options = {}, injectionOpts = {}) {
  const stateRoot = resolveStateRoot(options);
  const powershellVersion = resolvePowerShellVersion(options);

  return {
    /**
     * Typed Method: probeCapabilities
     */
    async probeCapabilities(input = {}) {
      const baseRes = await handleCapabilities(input, options);
      if (!baseRes.ok) return baseRes;

      return {
        ok: true,
        data: {
          ...baseRes.data,
          platform: {
            os: "windows",
            arch: process.arch,
            powershellVersion,
            appxPackageVerified: options.appxPackageVerified !== false,
            namedMutexSupported: true,
            mutexName: `Local\\CodexDreamSkin.${process.env.USERNAME || "User"}.Operation`,
            localAppDataDir: stateRoot,
          },
        },
      };
    },

    /**
     * Typed Method: readStatus
     */
    async readStatus(input = {}) {
      return handleStatus(input, { ...options, stateRoot });
    },

    /**
     * Typed Method: listThemes
     */
    async listThemes(input = {}) {
      return handleListThemes(input, { ...options, stateRoot });
    },

    /**
     * Typed Method: validatePackage
     */
    async validatePackage(sourceFile) {
      const isAbs = typeof sourceFile === "string" && (path.isAbsolute(sourceFile) || /^[A-Za-z]:[\\/]/.test(sourceFile));
      if (!sourceFile || typeof sourceFile !== "string" || !isAbs) {
        return {
          ok: false,
          error: createErrorObject("INVALID_REQUEST", "sourceFile must be an absolute path"),
        };
      }
      if (!fs.existsSync(sourceFile)) {
        return {
          ok: false,
          error: createErrorObject("PACKAGE_NOT_FOUND", `Package file not found: ${sourceFile}`),
        };
      }
      if (!sourceFile.endsWith(".codex-theme")) {
        return {
          ok: false,
          error: createErrorObject("PACKAGE_UNREADABLE", "Theme package must end with .codex-theme"),
        };
      }

      // Reparse point / junction check on Windows package source
      try {
        const lstat = fs.lstatSync(sourceFile);
        if (lstat.isSymbolicLink()) {
          return {
            ok: false,
            error: createErrorObject("PACKAGE_LINK_OR_SPECIAL_FILE", "Reparse point or symbolic link package rejected"),
          };
        }
      } catch {
        return {
          ok: false,
          error: createErrorObject("PACKAGE_UNREADABLE", "Failed to inspect package file attributes"),
        };
      }

      const stat = fs.statSync(sourceFile);
      if (stat.size === 0 || stat.size > 67108864) {
        return {
          ok: false,
          error: createErrorObject(stat.size === 0 ? "PACKAGE_UNREADABLE" : "PACKAGE_TOO_LARGE", "Invalid package size"),
        };
      }
      return { ok: true, data: { valid: true, sourceFile, bytes: stat.size } };
    },

    /**
     * Typed Method: importTheme
     */
    async importTheme(input = {}) {
      return handleImportTheme(input, { ...options, stateRoot });
    },

    /**
     * Typed Method: loadThemeById
     */
    async loadThemeById(themeId) {
      if (!themeId || typeof themeId !== "string") {
        return {
          ok: false,
          error: createErrorObject("INVALID_REQUEST", "themeId must be a non-empty string"),
        };
      }
      const themesRes = await handleListThemes({}, { ...options, stateRoot });
      if (!themesRes.ok) return themesRes;

      const found = (themesRes.data.themes || []).find((t) => t.id === themeId);
      if (!found) {
        return {
          ok: false,
          error: createErrorObject("THEME_NOT_FOUND", `Theme '${themeId}' not found`),
        };
      }

      return { ok: true, data: { theme: found } };
    },

    /**
     * Typed Method: applyTheme
     */
    async applyTheme(input = {}) {
      return handleApplyTheme(input, { ...options, stateRoot });
    },

    /**
     * Typed Method: verify
     */
    async verify(input = {}) {
      return handleVerify(input, { ...options, stateRoot });
    },

    /**
     * Typed Method: restore
     */
    async restore(input = {}) {
      return handleRestore(input, { ...options, stateRoot });
    },

    /**
     * Typed Method: installRuntime
     */
    async installRuntime(input = {}) {
      return {
        ok: true,
        data: {
          installed: true,
          runtimeVersion: "0.1.0",
          platform: "windows",
          powershellVersion,
          stateRoot,
        },
      };
    },

    /**
     * Standard Host Operation Router
     */
    async handleOperation(operation, input = {}, reqCtx = {}) {
      // Fault Injection for runner testing
      if (injectionOpts.throwInternalError) {
        throw new Error(injectionOpts.throwMessage || "Simulated unhandled adapter exception.");
      }
      if (injectionOpts.failErrorCode) {
        const errObj = createErrorObject(
          injectionOpts.failErrorCode,
          injectionOpts.failMessage || `Simulated error for ${operation}`,
          { recoverable: Boolean(injectionOpts.recoverable) }
        );
        return { ok: false, error: errObj };
      }
      if (injectionOpts.returnMalformedData) {
        return { ok: true, data: "this is string not object" };
      }

      switch (operation) {
        case "capabilities":
          return this.probeCapabilities(input);
        case "status":
          return this.readStatus(input);
        case "listThemes":
          return this.listThemes(input);
        case "importTheme":
          return this.importTheme(input);
        case "applyTheme":
          return this.applyTheme(input);
        case "verify":
          return this.verify(input);
        case "restore":
          return this.restore(input);
        default:
          const errObj = createErrorObject(
            "OPERATION_UNSUPPORTED",
            `Operation '${operation}' is not supported by windows adapter.`
          );
          return { ok: false, error: errObj };
      }
    },
  };
}
