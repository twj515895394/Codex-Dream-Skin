/**
 * Native Host (SwiftUI / WinForms) Process Pipe Communication Prototype
 */

import { handleCapabilities } from "../../../core/runtime-api/handlers/capabilities-handler.js";

export async function simulateNativeHostPipe(stdinBuf) {
  const res = await handleCapabilities({}, { adapterVersion: "0.1.0-native" });
  return JSON.stringify({
    apiVersion: 1,
    requestId: "req_native_001",
    ok: res.ok,
    data: res.data,
  });
}
