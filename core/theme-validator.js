/**
 * Codex Dream Skin Theme Validator
 *
 * Validates .codex-theme package structure before import.
 * This module intentionally validates data packages only.
 * Executable files are not allowed inside theme packages.
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_EXTENSIONS = [
  '.command',
  '.sh',
  '.app',
  '.exe',
  '.bin'
];

function validateJson(file) {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
    return true;
  } catch {
    return false;
  }
}

function validateThemePackage(themeDir) {
  const errors = [];

  const requiredFiles = [
    'manifest.json',
    'theme.json'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(themeDir, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  for (const file of requiredFiles) {
    const target = path.join(themeDir, file);
    if (fs.existsSync(target) && !validateJson(target)) {
      errors.push(`Invalid JSON: ${file}`);
    }
  }

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(entry).toLowerCase();
        if (FORBIDDEN_EXTENSIONS.includes(ext)) {
          errors.push(`Forbidden executable asset: ${entry}`);
        }
      }
    }
  };

  walk(themeDir);

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateThemePackage
};
