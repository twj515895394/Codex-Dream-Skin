import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Persistent storage abstraction for installed Dream Skin themes.
 *
 * Runtime data is intentionally separated from the repository so installed
 * themes survive application updates.
 */

const DEFAULT_ROOT = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "CodexDreamSkinStudio"
);

export function createThemeStorage(root = DEFAULT_ROOT) {
  const themesDir = path.join(root, "themes");
  const registryFile = path.join(root, "registry.json");
  const activeFile = path.join(root, "active-theme.json");

  async function ensure() {
    await fs.mkdir(themesDir, { recursive: true });
  }

  async function readJson(file, fallback) {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return fallback;
    }
  }

  async function writeJson(file, value) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
  }

  return {
    themesDir,
    async getRegistry() {
      await ensure();
      return readJson(registryFile, { themes: [] });
    },
    async saveRegistry(registry) {
      await writeJson(registryFile, registry);
    },
    async getActiveTheme() {
      return readJson(activeFile, { activeTheme: null });
    },
    async setActiveTheme(id) {
      await writeJson(activeFile, { activeTheme: id });
    }
  };
}
