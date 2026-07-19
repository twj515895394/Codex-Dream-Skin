/**
 * Capabilities Operation Handler Implementation
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 8)
 */

import os from "node:os";

export function handleCapabilities(input = {}, opts = {}) {
  const osType = process.platform === "darwin" ? "macos" : process.platform === "win32" ? "windows" : process.platform;
  const osRelease = os.release() || "unknown";

  return {
    ok: true,
    data: {
      supportedApiVersions: [1],
      operations: {
        capabilities: { supported: true },
        status: { supported: true },
        listThemes: { supported: true },
        importTheme: {
          supported: true,
          conflictPolicies: ["reject", "replace"],
          maxPackageBytes: 67108864, // 64 MiB
        },
        applyTheme: {
          supported: true,
          mayRequireCodexRestart: true,
        },
        verify: { supported: true },
        restore: { supported: true },
      },
      platform: {
        os: osType,
        arch: process.arch,
        osVersion: osRelease,
      },
      runtime: {
        mode: opts.runtimeMode || "managed",
        version: opts.runtimeVersion || "0.1.0",
        adapterVersion: opts.adapterVersion || "0.1.0",
        legacyBackend: Boolean(opts.legacyBackend),
      },
      limits: {
        maxImageBytes: 16777216, // 16 MiB
        maxImageDimension: 16384,
        maxImagePixels: 50000000,
      },
    },
  };
}
