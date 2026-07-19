/**
 * Electron Main Process stdio Child Process IPC Prototype
 */

import { handleCapabilities } from "../../../core/runtime-api/handlers/capabilities-handler.js";

export async function simulateElectronMainIPC(requestObj) {
  const op = requestObj?.operation || "capabilities";
  if (op === "capabilities") {
    const res = await handleCapabilities(requestObj?.input || {}, { adapterVersion: "0.1.0-electron" });
    return {
      apiVersion: 1,
      requestId: requestObj?.requestId || "req_electron_001",
      ok: res.ok,
      data: res.data,
      error: res.error || null,
    };
  }
  return { apiVersion: 1, ok: false, error: { code: "OPERATION_UNSUPPORTED" } };
}
