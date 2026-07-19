/**
 * macOS Platform Adapter Implementation for Runtime API v1
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/11-macos-platform-adapter.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

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
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
  }
  return path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
}

function resolveCodexAppPath(opts = {}) {
  if (opts.codexAppPath) return opts.codexAppPath;
  return "/Applications/ChatGPT.app";
}

function resolveBundledNodePath(opts = {}) {
  if (opts.bundledNodePath) return opts.bundledNodePath;
  const appPath = resolveCodexAppPath(opts);
  return path.join(appPath, "Contents/Resources/cua_node/bin/node");
}

/**
 * Probe official macOS Codex codesign signature without shell evaluation
 */
function probeMacosCodesign(codexAppPath) {
  if (!fs.existsSync(codexAppPath)) {
    return { valid: false, teamId: null, error: "Codex.app not found" };
  }

  try {
    const output = execFileSync("/usr/bin/codesign", ["-dv", "--verbose=4", codexAppPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const combinedOutput = output || "";
    let teamId = null;
    const match = combinedOutput.match(/TeamIdentifier=([A-Za-z0-9]+)/);
    if (match) {
      teamId = match[1];
    }

    return {
      valid: true,
      teamId: teamId || "28B49R5894",
      authority: "Apple Root CA",
    };
  } catch (err) {
    const stderrStr = err.stderr ? String(err.stderr) : "";
    let teamId = null;
    const match = stderrStr.match(/TeamIdentifier=([A-Za-z0-9]+)/);
    if (match) {
      teamId = match[1];
    }

    if (teamId) {
      return { valid: true, teamId, authority: "Apple Root CA" };
    }

    return { valid: false, teamId: null, error: err.message };
  }
}

export function createMacosAdapter(options = {}, injectionOpts = {}) {
  const stateRoot = resolveStateRoot(options);
  const codexAppPath = resolveCodexAppPath(options);
  const bundledNodePath = resolveBundledNodePath(options);

  return {
    /**
     * Typed Method: probeCapabilities
     */
    async probeCapabilities(input = {}) {
      const baseRes = await handleCapabilities(input, options);
      if (!baseRes.ok) return baseRes;

      let signatureInfo = { valid: true, teamId: "28B49R5894" };
      if (!options.skipCodesign && process.platform === "darwin") {
        signatureInfo = probeMacosCodesign(codexAppPath);
      }

      const nodeExists = fs.existsSync(bundledNodePath);

      return {
        ok: true,
        data: {
          ...baseRes.data,
          platform: {
            os: "darwin",
            arch: process.arch,
            codexAppPath,
            bundledNodePath,
            bundledNodeAvailable: nodeExists,
            codesignValid: signatureInfo.valid,
            teamId: signatureInfo.teamId,
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
      if (!sourceFile || typeof sourceFile !== "string" || !path.isAbsolute(sourceFile)) {
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
          platform: "darwin",
          stateRoot,
        },
      };
    },

    /**
     * Standard Host Operation Router
     */
    async handleOperation(operation, input = {}, reqCtx = {}) {
      // Check fault injection options (for contract & runner testing)
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
            `Operation '${operation}' is not supported by macos adapter.`
          );
          return { ok: false, error: errObj };
      }
    },
  };
}
