/**
 * Theme Applier
 *
 * Responsible for connecting the active theme state with the existing
 * Codex Dream Skin runtime.
 *
 * This module intentionally does not modify Codex installation files.
 * It prepares the runtime layer to consume an active .codex-theme package.
 */

class ThemeApplier {
  constructor(options = {}) {
    this.registry = options.registry;
    this.runtime = options.runtime || null;
  }

  getActiveTheme() {
    if (!this.registry) {
      throw new Error('Theme registry is required');
    }

    return this.registry.getActiveTheme?.() || null;
  }

  async apply(themeId) {
    if (!this.registry) {
      throw new Error('Theme registry is required');
    }

    const theme = this.registry.find(themeId);

    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    this.registry.setActiveTheme?.(themeId);

    // Runtime integration point.
    // Future implementation will call existing macOS injector/runtime layer.
    return {
      success: true,
      theme: themeId,
      status: 'registered'
    };
  }
}

module.exports = ThemeApplier;
