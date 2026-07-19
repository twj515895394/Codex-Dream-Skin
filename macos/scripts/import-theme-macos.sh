#!/bin/bash

# Import a data-only .codex-theme ZIP package into the existing saved-theme
# library, then reuse switch-theme-macos.sh to apply it.

set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

PACKAGE=""
APPLY_NOW="true"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --file) PACKAGE="${2:-}"; shift 2 ;;
    --no-apply) APPLY_NOW="false"; shift ;;
    *) fail "Unknown argument: $1" ;;
  esac
done

choose_package() {
  /usr/bin/osascript <<'APPLESCRIPT'
set selectedFile to choose file with prompt "选择一个 .codex-theme 主题包"
return POSIX path of selectedFile
APPLESCRIPT
}

[ -n "$PACKAGE" ] || PACKAGE="$(choose_package 2>/dev/null || true)"
[ -n "$PACKAGE" ] || fail "No theme package selected."
[ -f "$PACKAGE" ] || fail "Theme package not found: $PACKAGE"
case "$PACKAGE" in
  *.codex-theme) ;;
  *) fail "Theme package must use the .codex-theme extension." ;;
esac

PACKAGE_BYTES="$(/usr/bin/stat -f '%z' "$PACKAGE")"
[ "$PACKAGE_BYTES" -gt 0 ] && [ "$PACKAGE_BYTES" -le 67108864 ] \
  || fail "Theme package must be non-empty and no larger than 64 MB."

archive_entries="$(/usr/bin/unzip -Z1 "$PACKAGE" 2>/dev/null)" \
  || fail "Theme package is not a readable ZIP archive."
[ -n "$archive_entries" ] || fail "Theme package is empty."
while IFS= read -r entry; do
  [ -n "$entry" ] || continue
  case "$entry" in
    /*|*'../'*|../*|*'/..'|..|*'..\ '*|*'..\ '*|'..\'*|*'\..'*|*'\..')
      fail "Theme package contains an unsafe path: $entry"
      ;;
  esac
  lower="$(printf '%s' "$entry" | /usr/bin/tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    *.command|*.sh|*.bash|*.zsh|*.app|*.pkg|*.dmg|*.exe|*.dll|*.dylib|*.so|*.bin|*.js|*.mjs|*.cjs|*.py|*.pl|*.rb|*.ps1|*.bat|*.cmd)
      fail "Theme packages are data-only; executable content is not allowed: $entry"
      ;;
  esac
done <<EOF
$archive_entries
EOF

ensure_state_root
discover_codex_app
require_macos_runtime

tmp="$(/usr/bin/mktemp -d "$STATE_ROOT/.theme-import.XXXXXX")"
cleanup() { /bin/rm -rf "$tmp"; }
trap cleanup EXIT
/bin/chmod 700 "$tmp"
/usr/bin/ditto -x -k "$PACKAGE" "$tmp/extracted" \
  || fail "Could not extract theme package."

if /usr/bin/find "$tmp/extracted" -type l -print -quit | /usr/bin/grep -q .; then
  fail "Theme package must not contain symbolic links."
fi
if /usr/bin/find "$tmp/extracted" ! -type d ! -type f -print -quit | /usr/bin/grep -q .; then
  fail "Theme package contains an unsupported special file."
fi

root="$tmp/extracted"
set -- "$root"/*
if [ "$#" -eq 1 ] && [ -d "$1" ]; then root="$1"; fi
[ -f "$root/manifest.json" ] || fail "manifest.json is missing from the theme package."
[ -f "$root/theme.json" ] || fail "theme.json is missing from the theme package."

metadata="$($NODE - "$root/manifest.json" "$root/theme.json" <<'NODE'
const fs = require('fs');
const path = require('path');
const [manifestPath, themePath] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
const rootFile = (value, label) => {
  if (typeof value !== 'string' || !value || path.basename(value) !== value) {
    throw new Error(`${label} must be a file in the package root`);
  }
  return value;
};
if (manifest?.schemaVersion !== 1) throw new Error('Unsupported manifest schemaVersion');
if (!validId(manifest.id)) throw new Error('Invalid manifest id');
if (manifest.theme !== 'theme.json') throw new Error('manifest.theme must be theme.json');
if (theme?.schemaVersion !== 1) throw new Error('Unsupported theme schemaVersion');
if (!validId(theme.id) || theme.id !== manifest.id) throw new Error('theme.id must match manifest.id');
const image = rootFile(theme.image, 'theme.image');
const preview = manifest.preview == null || manifest.preview === '' ? '' : rootFile(manifest.preview, 'manifest.preview');
if (typeof manifest.name !== 'string' || !manifest.name.trim()) throw new Error('Manifest name is required');
if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(manifest.name)) throw new Error('Manifest name contains invalid control characters');
process.stdout.write(`${manifest.id}\n${image}\n${manifest.name.trim()}\n${preview}`);
NODE
)" || fail "Theme package metadata is invalid."
THEME_ID="$(printf '%s\n' "$metadata" | /usr/bin/sed -n '1p')"
THEME_IMAGE="$(printf '%s\n' "$metadata" | /usr/bin/sed -n '2p')"
THEME_NAME="$(printf '%s\n' "$metadata" | /usr/bin/sed -n '3p')"
THEME_PREVIEW="$(printf '%s\n' "$metadata" | /usr/bin/sed -n '4p')"
[ -f "$root/$THEME_IMAGE" ] || fail "Theme image is missing: $THEME_IMAGE"
if [ -n "$THEME_PREVIEW" ]; then
  [ -f "$root/$THEME_PREVIEW" ] || fail "Theme preview is missing: $THEME_PREVIEW"
fi

"$NODE" "$INJECTOR" --check-payload --theme-dir "$root" >/dev/null \
  || fail "Theme package failed Dream Skin payload validation."

THEMES_ROOT="$STATE_ROOT/themes"
/bin/mkdir -p "$THEMES_ROOT"
/bin/chmod 700 "$THEMES_ROOT"
staged="$tmp/$THEME_ID"
/bin/mkdir -p "$staged"
/bin/cp "$root/theme.json" "$staged/theme.json"
/bin/cp "$root/$THEME_IMAGE" "$staged/$THEME_IMAGE"
/bin/cp "$root/manifest.json" "$staged/manifest.json"
if [ -n "$THEME_PREVIEW" ]; then
  /bin/cp "$root/$THEME_PREVIEW" "$staged/$THEME_PREVIEW"
fi
/bin/chmod 600 "$staged"/*

dest="$THEMES_ROOT/$THEME_ID"
previous="$tmp/$THEME_ID.previous"
[ ! -e "$dest" ] || /bin/mv "$dest" "$previous"
if ! /bin/mv "$staged" "$dest"; then
  [ ! -e "$previous" ] || /bin/mv "$previous" "$dest"
  fail "Could not install imported theme."
fi
/bin/rm -rf "$previous"
trap - EXIT
/bin/rm -rf "$tmp"

if [ "$APPLY_NOW" = "true" ]; then
  "$SCRIPT_DIR/switch-theme-macos.sh" --id "$THEME_ID"
else
  printf 'Imported theme: %s (%s)\n' "$THEME_NAME" "$THEME_ID"
  printf 'Apply later with: %s --id %s\n' "$SCRIPT_DIR/switch-theme-macos.sh" "$THEME_ID"
fi
