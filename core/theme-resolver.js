/**
 * Resolve the currently selected Dream Skin theme.
 *
 * The resolver intentionally stays independent from macOS injection logic.
 * Runtime layers consume the resolved theme package and decide how to apply it.
 */

const path = require('path');
const fs = require('fs');
const ThemeStorage = require('./theme-storage');

class ThemeResolver {
  constructor(storage = new ThemeStorage()) {
    this.storage = storage;
  }

  resolveActiveTheme() {
    const active = this.storage.getActiveTheme();
    if (!active) {
      throw new Error('No active theme configured');
    }

    return this.resolveTheme(active);
  }

  resolveTheme(themeId) {
    const themePath = this.storage.getThemePath(themeId);
    const manifestPath = path.join(themePath, 'manifest.json');
    const configPath = path.join(themePath, 'theme.json');

    if (!fs.existsSync(manifestPath) || !fs.existsSync(configPath)) {
      throw new Error(`Invalid installed theme: ${themeId}`);
    }

    return {
      id: themeId,
      root: themePath,
      manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
      theme: JSON.parse(fs.readFileSync(configPath, 'utf8')),
    };
  }
}

module.exports = ThemeResolver;
