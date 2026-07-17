import path from "node:path";

/**
 * Runtime Adapter
 *
 * Converts a resolved Codex Dream Skin theme into the payload shape
 * consumed by the existing runtime/injector layer.
 *
 * This layer intentionally does not know about CDP injection details.
 * It only bridges Theme System -> Runtime System.
 */

export function createRuntimePayload(theme) {
  if (!theme) {
    throw new Error("Theme is required");
  }

  const wallpaper = theme.manifest?.assets?.wallpaper
    ? path.join(theme.root, theme.manifest.assets.wallpaper)
    : null;

  const colors = theme.theme?.colors || {};

  return {
    themeId: theme.manifest?.id || null,
    name: theme.manifest?.name || null,
    wallpaper,
    colors,
    appearance: theme.theme?.appearance || {},
    content: theme.theme?.content || {},
  };
}

export default {
  createRuntimePayload,
};
