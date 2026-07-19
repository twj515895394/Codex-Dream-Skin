/**
 * listThemes Operation Handler Implementation
 *
 * Ground Truth: docs/studio/phases/phase-00-foundation-and-shell-spike/contracts-and-data-model.md (Section 10)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

function computeSha256(data) {
  return "sha256:" + crypto.createHash("sha256").update(data).digest("hex");
}

function getMimeType(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

export function handleListThemes(input = {}, opts = {}) {
  const includeInvalid = input.includeInvalid !== false;
  const includeLegacy = input.includeLegacy !== false;

  // Resolve stateRoot safely
  let stateRoot = opts.stateRoot;
  if (!stateRoot) {
    if (process.env.STATE_ROOT) {
      stateRoot = process.env.STATE_ROOT;
    } else if (process.platform === "darwin") {
      stateRoot = path.join(os.homedir(), "Library/Application Support/CodexDreamSkinStudio");
    } else {
      stateRoot = path.join(os.homedir(), "AppData/Roaming/CodexDreamSkinStudio");
    }
  }

  // 1. Determine current theme ID
  let currentThemeId = null;
  const activeConfigPath = path.join(stateRoot, "theme", "theme.json");
  if (fs.existsSync(activeConfigPath)) {
    try {
      const activeContent = fs.readFileSync(activeConfigPath, "utf8");
      const activeJson = JSON.parse(activeContent);
      if (activeJson && activeJson.id) {
        currentThemeId = activeJson.id;
      }
    } catch {
      // Ignore active theme read errors
    }
  }

  const themesDir = path.join(stateRoot, "themes");
  const resultThemes = [];
  const globalDiagnostics = [];
  const seenIds = new Map(); // id -> folderName

  if (!fs.existsSync(themesDir)) {
    const emptyHash = computeSha256("EMPTY_THEME_LIST");
    return {
      ok: true,
      data: {
        snapshotRevision: emptyHash,
        themes: [],
        diagnostics: [],
      },
    };
  }

  let entries = [];
  try {
    entries = fs.readdirSync(themesDir, { withFileTypes: true });
  } catch (err) {
    globalDiagnostics.push({
      code: "THEMES_DIR_UNREADABLE",
      message: `Failed to read themes directory: ${err.message}`,
      severity: "warning",
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    const themeFolder = path.join(themesDir, folderName);

    // Prevent symlink escape
    try {
      const realPath = fs.realpathSync(themeFolder);
      const realThemesDir = fs.realpathSync(themesDir);
      if (!realPath.startsWith(realThemesDir)) {
        globalDiagnostics.push({
          code: "THEME_SYMLINK_ESCAPE",
          message: `Theme folder '${folderName}' is a symlink escaping state root. Ignored.`,
          severity: "warning",
        });
        continue;
      }
    } catch {
      // Ignore resolution failures
    }

    // Inspect individual theme
    const themeConfigPath = path.join(themeFolder, "theme.json");
    const manifestPath = path.join(themeFolder, "manifest.json");

    let themeJson = null;
    let manifestJson = null;
    const itemDiagnostics = [];

    // Parse theme.json
    if (fs.existsSync(themeConfigPath)) {
      try {
        const content = fs.readFileSync(themeConfigPath, "utf8");
        themeJson = JSON.parse(content);
      } catch (err) {
        itemDiagnostics.push(`theme.json is invalid or unreadable: ${err.message}`);
      }
    } else {
      itemDiagnostics.push("Missing theme.json file");
    }

    // Parse manifest.json if exists
    if (fs.existsSync(manifestPath)) {
      try {
        const content = fs.readFileSync(manifestPath, "utf8");
        manifestJson = JSON.parse(content);
      } catch (err) {
        itemDiagnostics.push(`manifest.json is unreadable: ${err.message}`);
      }
    }

    // If theme.json is completely invalid or missing
    if (!themeJson || typeof themeJson !== "object" || !themeJson.id) {
      if (includeInvalid) {
        resultThemes.push({
          id: themeJson?.id || folderName,
          name: themeJson?.name || folderName,
          schemaVersion: themeJson?.schemaVersion || 1,
          source: "unknown",
          status: "invalid",
          isCurrent: false,
          hasManifest: Boolean(manifestJson),
          hasPreview: false,
          image: null,
          diagnostics: itemDiagnostics,
          revision: computeSha256(`INVALID_${folderName}_${itemDiagnostics.join(";")}`),
        });
      }
      continue;
    }

    // Determine Theme ID & Name
    const id = themeJson.id;
    const name = themeJson.name || id;

    // Check duplicate ID
    if (seenIds.has(id)) {
      const previousFolder = seenIds.get(id);
      globalDiagnostics.push({
        code: "THEME_ID_CONFLICT",
        message: `Duplicate theme ID '${id}' found in folders '${previousFolder}' and '${folderName}'.`,
        severity: "warning",
      });
    } else {
      seenIds.set(id, folderName);
    }

    // Determine Source & Legacy
    const hasManifest = Boolean(manifestJson);
    let source = "custom";
    let status = "ready";

    if (manifestJson && manifestJson.source) {
      source = manifestJson.source;
    } else if (id.startsWith("preset-")) {
      source = "bundled";
    } else if (hasManifest) {
      source = "imported";
    } else {
      source = "legacy";
      status = "warning";
      itemDiagnostics.push("Theme is missing manifest.json (legacy theme)");
    }

    if (!includeLegacy && source === "legacy") {
      continue;
    }

    // Determine Image / Preview
    const imageFileName = themeJson.image || manifestJson?.assets?.wallpaper || null;
    let imageInfo = null;
    let hasPreview = false;

    if (imageFileName && typeof imageFileName === "string") {
      const imagePath = path.join(themeFolder, imageFileName);
      if (fs.existsSync(imagePath)) {
        try {
          const stats = fs.statSync(imagePath);
          hasPreview = true;
          imageInfo = {
            fileName: imageFileName,
            mimeType: getMimeType(imageFileName),
            bytes: stats.size,
          };
        } catch {
          itemDiagnostics.push(`Preview image '${imageFileName}' unreadable`);
        }
      } else {
        itemDiagnostics.push(`Preview image '${imageFileName}' does not exist`);
      }
    }

    // Revision SHA256 Calculation
    const revisionSeed = JSON.stringify({
      id,
      name,
      schemaVersion: themeJson.schemaVersion || 1,
      imageInfo,
      hasManifest,
    });
    const revision = computeSha256(revisionSeed);

    resultThemes.push({
      id,
      name,
      schemaVersion: themeJson.schemaVersion || 1,
      source,
      status,
      isCurrent: id === currentThemeId,
      hasManifest,
      hasPreview,
      image: imageInfo,
      diagnostics: itemDiagnostics,
      revision,
    });
  }

  // Calculate Snapshot Revision
  const globalSeed = resultThemes.map((t) => `${t.id}:${t.revision}`).join("|");
  const snapshotRevision = computeSha256(globalSeed || "EMPTY_THEME_LIST");

  return {
    ok: true,
    data: {
      snapshotRevision,
      themes: resultThemes,
      diagnostics: globalDiagnostics,
    },
  };
}
