/**
 * Codex Dream Skin Theme Registry
 *
 * Stores installed theme metadata.
 * Runtime layer will use this registry to resolve active themes.
 */

class ThemeRegistry {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.themes = [];
  }

  register(theme) {
    const existing = this.themes.find(t => t.id === theme.id);

    if (existing) {
      Object.assign(existing, theme);
    } else {
      this.themes.push(theme);
    }

    return theme;
  }

  remove(themeId) {
    this.themes = this.themes.filter(t => t.id !== themeId);
  }

  list() {
    return this.themes;
  }

  find(themeId) {
    return this.themes.find(t => t.id === themeId);
  }
}

module.exports = {
  ThemeRegistry
};
