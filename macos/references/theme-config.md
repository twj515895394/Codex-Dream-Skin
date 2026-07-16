# Theme configuration reference

Use this reference when authoring or repairing the macOS user theme stored under:

```text
~/Library/Application Support/CodexDreamSkinStudio/theme
```

The installed engine remains under:

```text
~/.codex/codex-dream-skin-studio
```

Keep runtime state and user theme assets outside the engine so engine updates do not become the only copy of user artwork.

## Standard build path

Prefer `scripts/customize-theme-macos.sh` for the initial build because it:

- validates the source file and 50 MB limit;
- converts macOS-readable formats to JPEG;
- limits the prepared dimension to 3200 px;
- writes the prepared asset with restrictive permissions;
- enforces the 16 MB prepared-file limit;
- writes `theme.json` atomically;
- removes older generated background files.

Use `--no-apply`, inspect the result, then apply separately.

## Theme directory contract

A valid directory contains:

```text
theme/
├── theme.json
└── background-YYYYMMDD-HHMMSS-PID.jpg
```

The image filename may differ, but it must:

- be a basename with no parent path;
- stay in the same theme directory as `theme.json`;
- use `.png`, `.jpg`, `.jpeg`, or `.webp` after preparation;
- be non-empty and no larger than 16 MB.

Do not reference an absolute image path, `..`, a symlink escape, a URL, or a file outside the theme directory.

## Schema

```json
{
  "schemaVersion": 1,
  "id": "custom-unique-id",
  "name": "Theme name",
  "brandSubtitle": "CODEX DREAM SKIN",
  "tagline": "A concise live tagline.",
  "projectPrefix": "选择项目 · ",
  "projectLabel": "◉  选择项目",
  "statusText": "THEME ONLINE",
  "quote": "MAKE SOMETHING WONDERFUL",
  "image": "background.jpg",
  "colors": {
    "background": "#071116",
    "panel": "#0b1a20",
    "panelAlt": "#10272c",
    "accent": "#7cff46",
    "accentAlt": "#b8ff3d",
    "secondary": "#36d7e8",
    "highlight": "#642a8c",
    "text": "#e9fff1",
    "muted": "#9ebdb3",
    "line": "rgba(124, 255, 70, .28)"
  }
}
```

## Field roles

| Field | Role | Practical limit |
|---|---|---:|
| `schemaVersion` | Loader compatibility; must be `1` | fixed |
| `id` | Theme identity used by the injector state | 80 characters |
| `name` | Live brand title and home banner label | 80 characters |
| `brandSubtitle` | Small live subtitle in decorative chrome | 80 characters |
| `tagline` | Live home-banner supporting copy | 160 characters |
| `projectPrefix` | Prefix attached to the real project control | 80 characters |
| `projectLabel` | Label above the native project selector | 80 characters |
| `statusText` | Decorative status label | 80 characters |
| `quote` | Short decorative quote | 80 characters |
| `image` | Prepared local image basename | one safe filename |

Keep display copy short even when the loader permits longer values. Long brand names and project labels collide with responsive layouts before they reach their technical maximum.

## Color roles

- `background`: dark-shell base behind task routes.
- `panel`: primary dark-shell surface.
- `panelAlt`: alternate dark-shell surface and gradient partner.
- `accent`: primary emphasis, focus, active state, and brand color.
- `accentAlt`: second accent used where a two-stop emphasis is needed.
- `secondary`: supporting contrast hue.
- `highlight`: deep or vivid atmospheric hue.
- `text`: primary dark-shell text.
- `muted`: secondary dark-shell text.
- `line`: borders and separators; may be hex, `rgb(...)`, or `rgba(...)`.

All other colors should normally be six-digit hex values. Invalid values fall back to project defaults during payload loading, which can hide a configuration mistake; validate before application rather than relying on fallback behavior.

## Light and dark shell behavior

The renderer detects the Codex shell mode dynamically.

In dark mode, the structural values from `theme.json`—background, panels, text, muted, and line—are used directly.

In light mode, the renderer intentionally keeps a fixed readable light structure while applying the configured accent, accentAlt, secondary, highlight, and line colors. Therefore:

- changing dark background or panel values does not fully recolor the light shell;
- a standard configuration theme should treat light mode as an accent adaptation;
- a completely custom light-shell structure is a structural theme and requires a deliberate CSS/renderer change described in `theme-extension.md`.

## Direct-edit rules

Use direct `theme.json` editing only after the customization script has prepared the image and created the base file.

- Preserve `schemaVersion: 1`.
- Preserve the generated image basename unless replacing the prepared image deliberately.
- Keep JSON valid UTF-8 with a trailing newline.
- Do not add secrets, API endpoints, user identifiers, or unrelated application configuration.
- Do not rely on fields that the renderer does not consume.
- Treat the active theme directory as runtime state; keep important source artwork and the visual brief in a durable user or repository location.

## Validation with the signed runtime

Run validation through the project environment so it discovers and verifies the official Codex app and its bundled Node runtime:

```bash
ENGINE="$HOME/.codex/codex-dream-skin-studio"
THEME_DIR="$HOME/Library/Application Support/CodexDreamSkinStudio/theme"

/bin/bash -c '
  set -euo pipefail
  ENGINE="$HOME/.codex/codex-dream-skin-studio"
  THEME_DIR="$HOME/Library/Application Support/CodexDreamSkinStudio/theme"
  . "$ENGINE/scripts/common-macos.sh"
  discover_codex_app
  require_macos_runtime
  "$NODE" "$ENGINE/scripts/injector.mjs" --check-payload --theme-dir "$THEME_DIR"
'
```

Validation is complete only when the loader accepts the schema, image path, image size and format, all text values, colors, CSS payload, and renderer template.