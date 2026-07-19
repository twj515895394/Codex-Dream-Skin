import { CAPABILITIES_OPERATION } from "./capabilities.js";
import { STATUS_OPERATION } from "./status.js";
import { LIST_THEMES_OPERATION } from "./listThemes.js";

export const IMPORT_THEME_OPERATION = Object.freeze({
  name: "importTheme",
  isWrite: true,
  allowedInputKeys: ["sourceFile", "conflictPolicy", "applyAfterImport", "expectedConflictThemeRevision"],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    if (typeof input.sourceFile !== "string" || !input.sourceFile.trim()) {
      return { valid: false, error: "sourceFile must be a non-empty string" };
    }
    if ("conflictPolicy" in input && !["reject", "replace"].includes(input.conflictPolicy)) {
      return { valid: false, error: "conflictPolicy must be 'reject' or 'replace'" };
    }
    if ("applyAfterImport" in input && typeof input.applyAfterImport !== "boolean") {
      return { valid: false, error: "applyAfterImport must be a boolean" };
    }
    return { valid: true };
  },
});

export const APPLY_THEME_OPERATION = Object.freeze({
  name: "applyTheme",
  isWrite: true,
  allowedInputKeys: ["themeId", "expectedThemeRevision"],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    if (typeof input.themeId !== "string" || !input.themeId.trim()) {
      return { valid: false, error: "themeId must be a non-empty string" };
    }
    return { valid: true };
  },
});

export const VERIFY_OPERATION = Object.freeze({
  name: "verify",
  isWrite: false,
  allowedInputKeys: ["scope"],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    if ("scope" in input && !["runtime", "activeTheme", "full"].includes(input.scope)) {
      return { valid: false, error: "scope must be 'runtime', 'activeTheme', or 'full'" };
    }
    return { valid: true };
  },
});

export const RESTORE_OPERATION = Object.freeze({
  name: "restore",
  isWrite: true,
  allowedInputKeys: ["mode", "restartOfficialCodex"],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    if ("mode" in input && !["normal", "emergency", "recoverTransaction"].includes(input.mode)) {
      return { valid: false, error: "mode must be 'normal', 'emergency', or 'recoverTransaction'" };
    }
    return { valid: true };
  },
});

export const BUILTIN_OPERATIONS = Object.freeze({
  capabilities: CAPABILITIES_OPERATION,
  status: STATUS_OPERATION,
  listThemes: LIST_THEMES_OPERATION,
  importTheme: IMPORT_THEME_OPERATION,
  applyTheme: APPLY_THEME_OPERATION,
  verify: VERIFY_OPERATION,
  restore: RESTORE_OPERATION,
});
