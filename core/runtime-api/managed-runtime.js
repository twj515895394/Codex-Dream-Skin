/**
 * Managed Runtime Lifecycle Management Implementation
 *
 * Ground Truth:
 * - docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md
 * - .scratch/phase-00-foundation/issues/13-managed-runtime-lifecycle.md
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import { createErrorObject } from "./codes.js";

function resolveStateRoot(opts = {}) {
  if (opts.stateRoot) return opts.stateRoot;
  if (process.env.STATE_ROOT) return process.env.STATE_ROOT;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
  }
  return path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
}

function getRuntimePaths(stateRoot) {
  const baseDir = path.join(stateRoot, "runtime");
  return {
    baseDir,
    currentDir: path.join(baseDir, "current"),
    previousDir: path.join(baseDir, "previous"),
    stagingDir: path.join(baseDir, "staging"),
    metadataPath: path.join(baseDir, "runtime.json"),
  };
}

function computeFileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
}

/**
 * Scan directory recursively and ensure no symlinks or reparse points exist
 */
function validateNoSymlinks(dirPath) {
  if (!fs.existsSync(dirPath)) return true;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isSymbolicLink()) {
      return false;
    }
    const lstat = fs.lstatSync(fullPath);
    if (lstat.isSymbolicLink()) {
      return false;
    }
    if (entry.isDirectory()) {
      if (!validateNoSymlinks(fullPath)) return false;
    }
  }
  return true;
}

/**
 * Validate manifest & file hashes in target directory
 */
export function verifyManagedRuntimePayload(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return { valid: false, error: createErrorObject("PACKAGE_NOT_FOUND", "Runtime payload directory not found") };
  }

  // 1. Check Symlinks
  if (!validateNoSymlinks(targetDir)) {
    return {
      valid: false,
      error: createErrorObject("PACKAGE_LINK_OR_SPECIAL_FILE", "Runtime payload contains symbolic link or reparse point"),
    };
  }

  // 2. Read manifest.json
  const manifestPath = path.join(targetDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return {
      valid: false,
      error: createErrorObject("MANIFEST_INVALID", "Runtime payload is missing manifest.json"),
    };
  }

  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return { valid: false, error: createErrorObject("MANIFEST_INVALID", "Corrupt manifest.json in runtime payload") };
  }

  if (!manifest || typeof manifest !== "object" || !manifest.version || typeof manifest.files !== "object") {
    return { valid: false, error: createErrorObject("MANIFEST_INVALID", "Invalid manifest structure in runtime payload") };
  }

  // 3. Verify file hashes
  for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
    const filePath = path.join(targetDir, relPath);
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: createErrorObject("PACKAGE_UNREADABLE", `Missing file in runtime payload: ${relPath}`),
      };
    }
    const actualHash = computeFileSha256(filePath);
    if (actualHash !== expectedHash) {
      return {
        valid: false,
        error: createErrorObject("PACKAGE_UNREADABLE", `File hash mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`),
      };
    }
  }

  return { valid: true, manifest };
}

/**
 * Read current runtime metadata
 */
export function getRuntimeMetadata(opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const paths = getRuntimePaths(stateRoot);

  if (!fs.existsSync(paths.metadataPath)) {
    return {
      exists: false,
      currentVersion: null,
      previousVersion: null,
    };
  }

  try {
    const raw = fs.readFileSync(paths.metadataPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      exists: true,
      currentVersion: parsed.currentVersion || null,
      previousVersion: parsed.previousVersion || null,
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { exists: false, currentVersion: null, previousVersion: null };
  }
}

/**
 * Update runtime.json metadata atomically
 */
function saveRuntimeMetadata(stateRoot, currentVersion, previousVersion) {
  const paths = getRuntimePaths(stateRoot);
  fs.mkdirSync(paths.baseDir, { recursive: true });

  const metadata = {
    schemaVersion: 1,
    currentVersion,
    previousVersion,
    updatedAt: new Date().toISOString(),
  };

  const tempPath = path.join(paths.baseDir, `.runtime.json.${Date.now()}`);
  fs.writeFileSync(tempPath, JSON.stringify(metadata, null, 2), "utf8");
  fs.renameSync(tempPath, paths.metadataPath);
}

/**
 * Install or upgrade Managed Runtime from payload directory
 */
export async function installManagedRuntime(payloadDir, opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const paths = getRuntimePaths(stateRoot);

  if (!payloadDir || typeof payloadDir !== "string" || !fs.existsSync(payloadDir)) {
    return {
      ok: false,
      error: createErrorObject("PACKAGE_NOT_FOUND", "Runtime payload directory invalid or non-existent"),
    };
  }

  // 1. Prepare Staging
  fs.mkdirSync(paths.baseDir, { recursive: true });
  fs.rmSync(paths.stagingDir, { recursive: true, force: true });
  fs.mkdirSync(paths.stagingDir, { recursive: true, mode: 0o700 });

  // Copy payload to staging
  fs.cpSync(payloadDir, paths.stagingDir, { recursive: true });

  // 2. Verify payload in staging
  const verifyRes = verifyManagedRuntimePayload(paths.stagingDir);
  if (!verifyRes.valid) {
    fs.rmSync(paths.stagingDir, { recursive: true, force: true });
    return { ok: false, error: verifyRes.error };
  }

  const newVersion = verifyRes.manifest.version;
  const currentMeta = getRuntimeMetadata(opts);

  // 3. Handle previous backup (if current exists)
  let previousVersion = currentMeta.currentVersion;
  if (fs.existsSync(paths.currentDir)) {
    fs.rmSync(paths.previousDir, { recursive: true, force: true });
    fs.renameSync(paths.currentDir, paths.previousDir);
  }

  // 4. Atomic Publish (Staging -> Current)
  fs.renameSync(paths.stagingDir, paths.currentDir);

  // 5. Save metadata
  saveRuntimeMetadata(stateRoot, newVersion, previousVersion);

  return {
    ok: true,
    data: {
      installed: true,
      currentVersion: newVersion,
      previousVersion,
      runtimeDir: paths.currentDir,
    },
  };
}

/**
 * Downgrade Managed Runtime from previous backup
 */
export async function downgradeManagedRuntime(opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const paths = getRuntimePaths(stateRoot);
  const meta = getRuntimeMetadata(opts);

  if (!fs.existsSync(paths.previousDir)) {
    return {
      ok: false,
      error: createErrorObject("NOT_FOUND", "No previous runtime version available to downgrade"),
    };
  }

  const verifyPrev = verifyManagedRuntimePayload(paths.previousDir);
  if (!verifyPrev.valid) {
    return {
      ok: false,
      error: createErrorObject("PACKAGE_UNREADABLE", "Previous runtime version backup is corrupt"),
    };
  }

  const restoredVersion = verifyPrev.manifest.version;

  // Swap / Restore previous to current
  const tempDir = path.join(paths.baseDir, `.current-temp-${Date.now()}`);
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.renameSync(paths.previousDir, tempDir);

  fs.rmSync(paths.currentDir, { recursive: true, force: true });
  fs.renameSync(tempDir, paths.currentDir);

  saveRuntimeMetadata(stateRoot, restoredVersion, null);

  return {
    ok: true,
    data: {
      downgraded: true,
      currentVersion: restoredVersion,
      previousVersion: null,
      runtimeDir: paths.currentDir,
    },
  };
}

/**
 * Verify installed active managed runtime
 */
export async function verifyManagedRuntime(opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const paths = getRuntimePaths(stateRoot);

  if (!fs.existsSync(paths.currentDir)) {
    return {
      ok: false,
      error: createErrorObject("NOT_FOUND", "No managed runtime currently installed"),
    };
  }

  const verifyRes = verifyManagedRuntimePayload(paths.currentDir);
  if (!verifyRes.valid) {
    return {
      ok: false,
      error: verifyRes.error,
    };
  }

  const meta = getRuntimeMetadata(opts);
  return {
    ok: true,
    data: {
      verified: true,
      version: verifyRes.manifest.version,
      previousVersion: meta.previousVersion,
      runtimeDir: paths.currentDir,
    },
  };
}

/**
 * Recover Incomplete / Interrupted Runtime Transaction
 */
export async function recoverRuntimeTransaction(opts = {}) {
  const stateRoot = resolveStateRoot(opts);
  const paths = getRuntimePaths(stateRoot);

  let cleanedStaging = false;
  let restoredPrevious = false;

  // 1. Clean up abandoned staging
  if (fs.existsSync(paths.stagingDir)) {
    fs.rmSync(paths.stagingDir, { recursive: true, force: true });
    cleanedStaging = true;
  }

  // 2. If current is missing/corrupt but previous exists, perform fallback
  const currentVerify = verifyManagedRuntimePayload(paths.currentDir);
  if (!currentVerify.valid && fs.existsSync(paths.previousDir)) {
    const prevVerify = verifyManagedRuntimePayload(paths.previousDir);
    if (prevVerify.valid) {
      fs.rmSync(paths.currentDir, { recursive: true, force: true });
      fs.renameSync(paths.previousDir, paths.currentDir);
      saveRuntimeMetadata(stateRoot, prevVerify.manifest.version, null);
      restoredPrevious = true;
    }
  }

  return {
    ok: true,
    data: {
      recovered: cleanedStaging || restoredPrevious,
      cleanedStaging,
      restoredPrevious,
    },
  };
}
