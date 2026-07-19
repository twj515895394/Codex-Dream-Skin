/**
 * Operation schema for "capabilities"
 */

export const CAPABILITIES_OPERATION = Object.freeze({
  name: "capabilities",
  isWrite: false,
  allowedInputKeys: [],
  validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, error: "input must be an object" };
    }
    return { valid: true };
  },
});
