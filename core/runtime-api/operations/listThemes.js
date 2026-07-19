/**
 * Operation schema for "listThemes"
 */

export const LIST_THEMES_OPERATION = Object.freeze({
  name: "listThemes",
  isWrite: false,
  allowedInputKeys: ["includeInvalid", "includeLegacy"],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    if ("includeInvalid" in input && typeof input.includeInvalid !== "boolean") {
      return { valid: false, error: "includeInvalid must be a boolean" };
    }
    if ("includeLegacy" in input && typeof input.includeLegacy !== "boolean") {
      return { valid: false, error: "includeLegacy must be a boolean" };
    }
    return { valid: true };
  },
});
