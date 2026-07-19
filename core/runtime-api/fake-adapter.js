/**
 * Fake / Reference Adapter for Runtime API v1 Host Testing
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 */

import { createErrorObject } from "./codes.js";
import { handleCapabilities } from "./handlers/capabilities-handler.js";
import { handleStatus } from "./handlers/status-handler.js";
import { handleListThemes } from "./handlers/list-themes-handler.js";

export function createFakeAdapter(initialState = {}, injectionOpts = {}) {
  const themes = initialState.themes || [
    {
      id: "soft-family-calm-v3",
      name: "Soft Family Calm",
      schemaVersion: 1,
      source: "imported",
      status: "ready",
      isCurrent: true,
      hasManifest: true,
      hasPreview: true,
      image: {
        fileName: "background.jpg",
        mimeType: "image/jpeg",
        bytes: 1234567,
      },
      diagnostics: [],
      revision: "sha256:dummy_revision_hash_001",
    },
  ];

  return {
    async handleOperation(operation, input, reqCtx) {
      // 1. Check fault injection
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

      // 2. Normal handlers
      switch (operation) {
        case "capabilities":
          return handleCapabilities(input, initialState.capabilitiesOpts);

        case "status":
          return handleStatus(input, { ...initialState.statusOpts, stateRoot: initialState.stateRoot });

        case "listThemes":
          if (initialState.stateRoot) {
            return handleListThemes(input, { stateRoot: initialState.stateRoot });
          }
          return {
            ok: true,
            data: {
              snapshotRevision: "sha256:snapshot_revision_hash",
              themes,
              diagnostics: [],
            },
          };


        default:
          const errObj = createErrorObject(
            "OPERATION_UNSUPPORTED",
            `Operation '${operation}' is not implemented in reference adapter.`
          );
          return { ok: false, error: errObj };
      }
    },
  };
}

