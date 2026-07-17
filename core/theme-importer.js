// Theme Package Importer
//
// Responsible for importing .codex-theme packages.
// Runtime flow:
//   package -> validate -> extract -> registry -> apply
//
// This module intentionally does not execute scripts from themes.
// Themes are data-only packages.

const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateThemePackage } = require('./theme-validator');
const { registerTheme } = require('./theme-registry');

function importThemePackage(packagePath, options = {}) {
  if (!packagePath.endsWith('.codex-theme')) {
    throw new Error('Invalid theme package. Expected .codex-theme');
  }

  const validation = validateThemePackage(packagePath);

  if (!validation.valid) {
    throw new Error(`Theme validation failed: ${validation.errors.join(', ')}`);
  }

  const themesRoot = options.themesRoot || path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'CodexDreamSkinStudio',
    'themes'
  );

  fs.mkdirSync(themesRoot, { recursive: true });

  // Extraction implementation will be connected with the final package format.
  // Current stage establishes the import lifecycle contract.

  const themeId = path.basename(packagePath, '.codex-theme');
  registerTheme({
    id: themeId,
    source: packagePath,
    installedAt: new Date().toISOString()
  }, { themesRoot });

  return {
    success: true,
    id: themeId,
    message: 'Theme imported successfully'
  };
}

module.exports = {
  importThemePackage
};
