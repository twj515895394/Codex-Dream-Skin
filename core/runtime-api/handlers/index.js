/**
 * Handlers Index & Router Component for Runtime API v1 Operations
 */

import { handleCapabilities } from "./capabilities-handler.js";
import { handleStatus } from "./status-handler.js";
import { handleListThemes } from "./list-themes-handler.js";
import { createErrorObject } from "../codes.js";

export function createRealAdapter(options = {}) {
  return {
    async handleOperation(operation, input, reqCtx) {
      switch (operation) {
        case "capabilities":
          return handleCapabilities(input, options);
        case "status":
          return handleStatus(input, options);
        case "listThemes":
          return handleListThemes(input, options);
        default:
          const errObj = createErrorObject(
            "OPERATION_UNSUPPORTED",
            `Operation '${operation}' is not supported by this adapter.`
          );
          return { ok: false, error: errObj };
      }
    },
  };
}

export { handleCapabilities, handleStatus, handleListThemes };

