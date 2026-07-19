/**
 * Runtime JSON API v1 Codes & Mapping Constants
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 */

export const EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  REQUEST_INVALID: 2,
  COMPATIBILITY_ERROR: 3,
  CONFLICT: 10,
  CANCELLED: 11,
  VALIDATION_FAILED: 20,
  NOT_FOUND: 21,
  PERMISSION_DENIED: 22,
  RUNTIME_ERROR: 30,
  CODEX_ERROR: 31,
  AUTHORIZATION_REQUIRED: 32,
  OPERATION_FAILED: 40,
  VERIFICATION_FAILED: 41,
  RECOVERY_FAILED: 42,
  INTERNAL_ERROR: 50,
});

export const EXIT_CODE_TO_CATEGORY = Object.freeze({
  [EXIT_CODES.SUCCESS]: "success",
  [EXIT_CODES.REQUEST_INVALID]: "request",
  [EXIT_CODES.COMPATIBILITY_ERROR]: "compatibility",
  [EXIT_CODES.CONFLICT]: "conflict",
  [EXIT_CODES.CANCELLED]: "cancelled",
  [EXIT_CODES.VALIDATION_FAILED]: "validation",
  [EXIT_CODES.NOT_FOUND]: "not-found",
  [EXIT_CODES.PERMISSION_DENIED]: "permission",
  [EXIT_CODES.RUNTIME_ERROR]: "runtime",
  [EXIT_CODES.CODEX_ERROR]: "codex",
  [EXIT_CODES.AUTHORIZATION_REQUIRED]: "authorization",
  [EXIT_CODES.OPERATION_FAILED]: "operation",
  [EXIT_CODES.VERIFICATION_FAILED]: "verification",
  [EXIT_CODES.RECOVERY_FAILED]: "recovery",
  [EXIT_CODES.INTERNAL_ERROR]: "internal",
});

export const ERROR_CODES = Object.freeze({
  INVALID_JSON: { code: "INVALID_JSON", exitCode: 2, category: "request", defaultAction: "none" },
  INVALID_REQUEST: { code: "INVALID_REQUEST", exitCode: 2, category: "request", defaultAction: "none" },
  API_VERSION_UNSUPPORTED: { code: "API_VERSION_UNSUPPORTED", exitCode: 3, category: "compatibility", defaultAction: "repairRuntime" },
  OPERATION_UNSUPPORTED: { code: "OPERATION_UNSUPPORTED", exitCode: 3, category: "compatibility", defaultAction: "none" },
  OPERATION_BUSY: { code: "OPERATION_BUSY", exitCode: 10, category: "conflict", defaultAction: "refreshStatus" },
  THEME_CHANGED: { code: "THEME_CHANGED", exitCode: 10, category: "conflict", defaultAction: "reloadTheme" },
  CANCELLED: { code: "CANCELLED", exitCode: 11, category: "cancelled", defaultAction: "none" },
  PACKAGE_NOT_FOUND: { code: "PACKAGE_NOT_FOUND", exitCode: 21, category: "not-found", defaultAction: "retry" },
  PACKAGE_TOO_LARGE: { code: "PACKAGE_TOO_LARGE", exitCode: 20, category: "validation", defaultAction: "none" },
  PACKAGE_UNREADABLE: { code: "PACKAGE_UNREADABLE", exitCode: 20, category: "validation", defaultAction: "none" },
  PACKAGE_UNSAFE_PATH: { code: "PACKAGE_UNSAFE_PATH", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  PACKAGE_EXECUTABLE_CONTENT: { code: "PACKAGE_EXECUTABLE_CONTENT", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  PACKAGE_LINK_OR_SPECIAL_FILE: { code: "PACKAGE_LINK_OR_SPECIAL_FILE", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  PACKAGE_ZIP_BOMB_SUSPECTED: { code: "PACKAGE_ZIP_BOMB_SUSPECTED", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  MANIFEST_INVALID: { code: "MANIFEST_INVALID", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  THEME_INVALID: { code: "THEME_INVALID", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  THEME_NOT_FOUND: { code: "THEME_NOT_FOUND", exitCode: 21, category: "not-found", defaultAction: "reloadTheme" },
  THEME_ID_CONFLICT: { code: "THEME_ID_CONFLICT", exitCode: 10, category: "conflict", defaultAction: "none" },
  IMAGE_INVALID: { code: "IMAGE_INVALID", exitCode: 20, category: "validation", defaultAction: "reviewDiagnostics" },
  PERMISSION_DENIED: { code: "PERMISSION_DENIED", exitCode: 22, category: "permission", defaultAction: "openPermissions" },
  MANAGED_PATH_UNSAFE: { code: "MANAGED_PATH_UNSAFE", exitCode: 22, category: "permission", defaultAction: "manualRecovery" },
  RUNTIME_NOT_INSTALLED: { code: "RUNTIME_NOT_INSTALLED", exitCode: 30, category: "runtime", defaultAction: "repairRuntime" },
  RUNTIME_VERSION_MISMATCH: { code: "RUNTIME_VERSION_MISMATCH", exitCode: 30, category: "runtime", defaultAction: "repairRuntime" },
  RUNTIME_INTEGRITY_FAILED: { code: "RUNTIME_INTEGRITY_FAILED", exitCode: 30, category: "runtime", defaultAction: "repairRuntime" },
  CODEX_NOT_FOUND: { code: "CODEX_NOT_FOUND", exitCode: 21, category: "not-found", defaultAction: "none" },
  CODEX_IDENTITY_INVALID: { code: "CODEX_IDENTITY_INVALID", exitCode: 31, category: "codex", defaultAction: "reviewDiagnostics" },
  CDP_NOT_READY: { code: "CDP_NOT_READY", exitCode: 31, category: "codex", defaultAction: "retry" },
  CDP_OWNER_INVALID: { code: "CDP_OWNER_INVALID", exitCode: 31, category: "codex", defaultAction: "restore" },
  INJECTOR_IDENTITY_INVALID: { code: "INJECTOR_IDENTITY_INVALID", exitCode: 31, category: "codex", defaultAction: "restore" },
  CODEX_RESTART_REQUIRED: { code: "CODEX_RESTART_REQUIRED", exitCode: 32, category: "authorization", defaultAction: "confirmRestart" },
  PUBLISH_FAILED: { code: "PUBLISH_FAILED", exitCode: 40, category: "operation", defaultAction: "retry" },
  VERIFY_FAILED_ROLLED_BACK: { code: "VERIFY_FAILED_ROLLED_BACK", exitCode: 41, category: "verification", defaultAction: "reviewDiagnostics" },
  ROLLBACK_FAILED: { code: "ROLLBACK_FAILED", exitCode: 42, category: "recovery", defaultAction: "restore" },
  RECOVERY_REQUIRED: { code: "RECOVERY_REQUIRED", exitCode: 42, category: "recovery", defaultAction: "restore" },
  RESTORE_PARTIAL: { code: "RESTORE_PARTIAL", exitCode: 42, category: "recovery", defaultAction: "manualRecovery" },
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", exitCode: 50, category: "internal", defaultAction: "reviewDiagnostics" },
});

export const WARNING_CODES = Object.freeze([
  "LEGACY_BACKEND_ACTIVE",
  "MANIFEST_MISSING",
  "PREVIEW_MISSING",
  "CODEX_VERSION_UNVERIFIED",
  "CLEANUP_PENDING",
  "OLD_RUNTIME_RETAINED",
  "PARTIAL_SUCCESS",
  "DIAGNOSTICS_REDACTED",
]);

export function getExitCodeForError(codeName) {
  const errDef = ERROR_CODES[codeName];
  if (errDef) {
    return errDef.exitCode;
  }
  return EXIT_CODES.INTERNAL_ERROR;
}

export function getCategoryForExitCode(exitCode) {
  return EXIT_CODE_TO_CATEGORY[exitCode] || "internal";
}

export function createErrorObject(codeName, message, options = {}) {
  const errDef = ERROR_CODES[codeName] || ERROR_CODES.INTERNAL_ERROR;
  const { recoverable = false, action, details = null } = options;

  return {
    code: errDef.code,
    category: errDef.category,
    message: message || "An error occurred.",
    recoverable: Boolean(recoverable),
    action: action || errDef.defaultAction,
    ...(details !== null && details !== undefined ? { details } : {}),
  };
}
