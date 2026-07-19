/**
 * Operation schema for "status"
 */

export const STATUS_OPERATION = Object.freeze({
  name: "status",
  isWrite: false,
  allowedInputKeys: ["includeChecks"],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    if ("includeChecks" in input && typeof input.includeChecks !== "boolean") {
      return { valid: false, error: "includeChecks must be a boolean" };
    }
    return { valid: true };
  },
});
