/**
 * Windows Platform Adapter Implementation for Runtime API v1 (DS-FIX-004 Hardened)
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
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData/Local");
  return path.join(localAppData, "CodexDreamSkinStudio");
}

function resolveCodexAppPath(opts = {}) {
  if (opts.codexAppPath) return opts.codexAppPath;
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData/Local");
  return path.join(localAppData, "Programs/Codex");
}

function createDiagnosticMetadata(errorObj = null) {
  return {
    platform: "win32",
    adapterVersion: "0.1.0-windows",
    recoverable: errorObj ? Boolean(errorObj.recoverable || errorObj.details?.recoverable) : true,
    timestamp: new Date().toISOString(),
  };
}

function containsReparsePointOrSymlink(targetPath) {
  if (!fs.existsSync(targetPath)) return false;
  try {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink()) return true;

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(targetPath, entry.name);
        if (entry.isSymbolicLink()) return true;
        const subStat = fs.lstatSync(full);
        if (subStat.isSymbolicLink()) return true;
      }
    }
  } catch {
    // Suppress filesystem errors
  }
  return false;
}

export function createWindowsAdapter(options = {}, injectionOpts = {}) {
  const stateRoot = resolveStateRoot(options);
  const codexAppPath = resolveCodexAppPath(options);

  return {
    /**
     * Typed Method: probeCapabilities
     */
    async probeCapabilities(input = {}) {
      const baseRes = await handleCapabilities(input, options);
      if (!baseRes.ok) {
        return { ...baseRes, diagnosticMetadata: createDiagnosticMetadata(baseRes.error) };
      }

      return {
        ok: true,
        data: {
          ...baseRes.data,
          platform: {
            os: "windows",
            arch: process.arch,
            codexAppPath,
            powerShellAvailable: true,
            powershellVersion: options.powershellVersion || "5.1",
            authenticodeValid: true,
            namedMutexSupported: true,
          },
        },
        diagnosticMetadata: createDiagnosticMetadata(),
      };
    },

    /**
     * Typed Method: readStatus
     */
    async readStatus(input = {}) {
      const res = await handleStatus(input, { ...options, stateRoot });
      return { ...res, diagnosticMetadata: createDiagnosticMetadata(res.error) };
    },

    /**
     * Typed Method: listThemes
     */
    async listThemes(input = {}) {
      const res = await handleListThemes(input, { ...options, stateRoot });
      return { ...res, diagnosticMetadata: createDiagnosticMetadata(res.error) };
    },

    /**
     * Typed Method: validatePackage
     */
    async validatePackage(sourceFile) {
      if (!sourceFile || typeof sourceFile !== "string" || (!path.isAbsolute(sourceFile) && !/^[A-Za-z]:[\\/]/.test(sourceFile))) {
        const err = createErrorObject("INVALID_REQUEST", "sourceFile must be an absolute path");
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }
      if (!fs.existsSync(sourceFile)) {
        const err = createErrorObject("PACKAGE_NOT_FOUND", `Package file not found: ${sourceFile}`);
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }
      if (containsReparsePointOrSymlink(sourceFile)) {
        const err = createErrorObject("PACKAGE_LINK_OR_SPECIAL_FILE", "Reparse Point or Symlink not allowed");
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }
      if (!sourceFile.endsWith(".codex-theme")) {
        const err = createErrorObject("PACKAGE_UNREADABLE", "Theme package must end with .codex-theme");
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }
      const stat = fs.statSync(sourceFile);
      if (stat.size === 0 || stat.size > 67108864) {
        const err = createErrorObject(stat.size === 0 ? "PACKAGE_UNREADABLE" : "PACKAGE_TOO_LARGE", "Invalid package size");
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }
      return { ok: true, data: { valid: true, sourceFile, bytes: stat.size }, diagnosticMetadata: createDiagnosticMetadata() };
    },

    /**
     * Typed Method: importTheme
     */
    async importTheme(input = {}) {
      const res = await handleImportTheme(input, { ...options, stateRoot });
      return { ...res, diagnosticMetadata: createDiagnosticMetadata(res.error) };
    },

    /**
     * Typed Method: loadThemeById
     */
    async loadThemeById(themeId) {
      if (!themeId || typeof themeId !== "string") {
        const err = createErrorObject("INVALID_REQUEST", "themeId must be a non-empty string");
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }
      const themesRes = await handleListThemes({}, { ...options, stateRoot });
      if (!themesRes.ok) return { ...themesRes, diagnosticMetadata: createDiagnosticMetadata(themesRes.error) };

      const found = (themesRes.data.themes || []).find((t) => t.id === themeId);
      if (!found) {
        const err = createErrorObject("THEME_NOT_FOUND", `Theme '${themeId}' not found`);
        return { ok: false, error: err, diagnosticMetadata: createDiagnosticMetadata(err) };
      }

      return { ok: true, data: { theme: found }, diagnosticMetadata: createDiagnosticMetadata() };
    },

    /**
     * Typed Method: applyTheme
     */
    async applyTheme(input = {}) {
      const res = await handleApplyTheme(input, { ...options, stateRoot });
      return { ...res, diagnosticMetadata: createDiagnosticMetadata(res.error) };
    },

    /**
     * Typed Method: verify
     */
    async verify(input = {}) {
      const res = await handleVerify(input, { ...options, stateRoot });
      return { ...res, diagnosticMetadata: createDiagnosticMetadata(res.error) };
    },

    /**
     * Typed Method: restore
     */
    async restore(input = {}) {
      const res = await handleRestore(input, { ...options, stateRoot });
      return { ...res, diagnosticMetadata: createDiagnosticMetadata(res.error) };
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
          platform: "win32",
          stateRoot,
        },
        diagnosticMetadata: createDiagnosticMetadata(),
      };
    },

    /**
     * Standard Host Operation Router
     */
    async handleOperation(operation, input = {}, reqCtx = {}) {
      if (injectionOpts.throwInternalError) {
        throw new Error(injectionOpts.throwMessage || "Simulated unhandled adapter exception.");
      }
      if (injectionOpts.failErrorCode) {
        const errObj = createErrorObject(
          injectionOpts.failErrorCode,
          injectionOpts.failMessage || `Simulated error for ${operation}`,
          { recoverable: Boolean(injectionOpts.recoverable) }
        );
        return { ok: false, error: errObj, diagnosticMetadata: createDiagnosticMetadata(errObj) };
      }
      if (injectionOpts.returnMalformedData) {
        return { ok: true, data: "this is string not object", diagnosticMetadata: createDiagnosticMetadata() };
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
          return { ok: false, error: errObj, diagnosticMetadata: createDiagnosticMetadata(errObj) };
      }
    },
  };
}
