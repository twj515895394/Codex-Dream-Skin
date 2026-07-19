/**
 * Tauri 2 Sidecar Communication Prototype
 */

import { handleCapabilities } from "../../../core/runtime-api/handlers/capabilities-handler.js";

export async function simulateTauriSidecarIPC(payloadStr) {
  let request = { apiVersion: 1, operation: "capabilities", input: {} };
  try {
    if (payloadStr) request = JSON.parse(payloadStr);
  } catch {
    // Default fallback
  }

  if (request.operation === "capabilities") {
    const res = await handleCapabilities(request.input || {}, { adapterVersion: "0.1.0-tauri2" });
    return JSON.stringify({
      apiVersion: 1,
      requestId: request.requestId || "req_tauri_001",
      ok: res.ok,
      data: res.data,
      error: res.error || null,
    });
  }

  return JSON.stringify({ apiVersion: 1, ok: false, error: { code: "OPERATION_UNSUPPORTED" } });
}
