---
name: codex-dream-skin-studio
description: Design, build, apply, verify, repair, or restore a custom Codex Dream Skin on macOS. Use when the user asks to design or generate a Codex theme image, create a Mac Codex skin, configure theme.json colors or copy, apply a theme, extend the visual layer, or troubleshoot CDP theming while preserving native Codex controls.
compatibility: macOS, official Codex Desktop app, signed bundled Node.js 20 or newer
---

# Codex Dream Skin Studio — macOS Theme Authoring

Create a complete, reversible Codex theme from a visual brief or source image. Prefer a **configuration theme**—prepared image plus `theme.json`. Escalate to CSS or injected DOM only when the requested result cannot be expressed by configuration.

## Non-negotiable boundaries

- Never modify the official `.app`, `app.asar`, executable, resources, or code signature.
- Bind CDP to loopback and accept only verified Codex renderer targets.
- Preserve native sidebar, cards, project selector, task content, menus, composer, focus, and keyboard interaction.
- Keep every decorative layer `pointer-events: none`; never use a full-window screenshot or rasterized fake interface.
- Require explicit authorization before restarting an already-running Codex instance.
- Keep API provider, Base URL, API key, authentication, threads, plugins, and user data outside the theme operation.

## Steps

### 1. Resolve the theme brief and runtime

Determine the theme name, intended mood, subject or brand, preferred shell mode, display copy, and whether the user supplied an image or wants new artwork. Choose one scope:

- **Configuration theme:** image, copy, and palette only.
- **Structural theme:** layout, typography, card treatment, or additional decorative DOM.

Locate the repository or installed engine, then verify the official Codex app and signed bundled Node runtime. Install the engine only when it is missing:

```bash
./scripts/install-dream-skin-macos.sh --no-launch
```

**Complete when:** the theme brief is concrete, the scope is selected, and both Codex and the Dream Skin runtime paths are known.

### 2. Design or prepare the theme artwork

Read [`references/theme-art-direction.md`](references/theme-art-direction.md) before generating, selecting, or cropping artwork.

- When the user supplied an image, inspect its composition and decide whether it needs cropping, cleanup, or regeneration.
- When new artwork is requested and an image-generation tool is available, generate the final landscape asset from the visual contract.
- When no image-generation tool is available, produce a production-ready prompt and do not proceed to application until a real local image exists.

Do not place Codex controls, fake cards, fake input boxes, small raster text, or essential content in the artwork. Keep the left side calm enough for live heading and project controls.

**Complete when:** a local PNG, JPEG, HEIC, TIFF, or WebP source exists, is at most 50 MB, is preferably at least 2000 px wide, and remains legible when cropped as a wide banner and a task background.

### 3. Build the configuration theme

Use the installed customization script to normalize the image and create a safe base configuration. Use `--no-apply` so configuration can be inspected before restarting Codex:

```bash
ENGINE="$HOME/.codex/codex-dream-skin-studio"
"$ENGINE/scripts/customize-theme-macos.sh" \
  --image "/absolute/path/to/source-image.png" \
  --name "Theme name" \
  --tagline "Theme tagline" \
  --quote "SHORT DISPLAY QUOTE" \
  --accent "#7cff46" \
  --secondary "#36d7e8" \
  --highlight "#642a8c" \
  --no-apply
```

The generated theme is stored under:

```text
~/Library/Application Support/CodexDreamSkinStudio/theme
```

Read [`references/theme-config.md`](references/theme-config.md) when the brief requires custom brand subtitle, status text, project labels, full dark palette, or direct `theme.json` editing. Do not edit CSS for a standard configuration theme.

Validate the complete payload before applying it:

```bash
THEME_DIR="$HOME/Library/Application Support/CodexDreamSkinStudio/theme"
"$ENGINE/Contents/Resources/cua_node/bin/node" 2>/dev/null || true
"$ENGINE/scripts/injector.mjs" --check-payload --theme-dir "$THEME_DIR"
```

Use the signed Node path discovered by the project scripts when the illustrative command above does not match the installed layout; do not fall back to an unverified runtime.

**Complete when:** the theme directory contains one prepared image no larger than 16 MB, a schema-version-1 `theme.json`, valid colors, safe local image paths, and `--check-payload` succeeds.

### 4. Apply the theme

Apply through the project launcher so process identity, port ownership, restart consent, state, and logs remain managed:

```bash
"$ENGINE/scripts/start-dream-skin-macos.sh" --prompt-restart
```

Never launch an alternative injector against an arbitrary Electron target. Preserve the running daemon so route changes and renderer reloads can reapply the theme.

**Complete when:** the verified injector is active on a loopback port and Codex opens with the intended image, copy, and palette.

### 5. Verify visually and functionally

Run the live verifier and capture a real Codex screenshot:

```bash
SCREENSHOT="$HOME/Desktop/Codex Dream Skin Verification.png"
"$ENGINE/scripts/verify-dream-skin-macos.sh" --screenshot "$SCREENSHOT"
```

Read and apply every item in [`references/qa-inventory.md`](references/qa-inventory.md). Inspect both the home route and a normal task route. A screenshot that merely looks attractive is not sufficient: native interaction, contrast, overflow, focus, menus, composer access, and non-interactive decoration must all pass.

When verification fails, repair the smallest responsible layer:

1. artwork crop or contrast;
2. `theme.json` copy or palette;
3. CSS selectors or layout;
4. renderer decoration logic.

Reapply and rerun verification after each repair.

**Complete when:** verifier output passes, the screenshot is retained, native controls remain usable, and both home and task routes satisfy the QA inventory.

### 6. Handle structural themes only when requested

Read [`references/theme-extension.md`](references/theme-extension.md) before changing `assets/dream-skin.css` or `assets/renderer-inject.js`.

Make durable structural changes in the repository source, run tests, reinstall the engine, apply, and verify. Do not leave the installed engine as the only copy of a successful source change.

**Complete when:** the repository is the single source of truth, syntax and project tests pass, reinstall reproduces the result, and restore still returns Codex to its official appearance.

### 7. Deliver and preserve rollback

Report:

- theme name and source artwork path;
- generated theme directory and key configuration values;
- whether source CSS or renderer code changed;
- verification screenshot path and pass status;
- the rollback action.

Rollback command:

```bash
"$ENGINE/scripts/restore-dream-skin-macos.sh" --restore-base-theme --restart-codex
```

**Complete when:** the user can identify the active theme, reproduce it, verify it, and restore the official appearance without editing the Codex installation.

## Repair and restore branch

For a broken or stale installation, diagnose in this order:

1. `scripts/doctor-macos.sh` for app identity, signature, runtime, and payload checks;
2. injector and launch logs under `~/Library/Application Support/CodexDreamSkinStudio`;
3. `--check-payload` against the active theme directory;
4. live verify and screenshot;
5. restore, reinstall, and reapply when state cannot be trusted.

Never kill a recorded injector unless PID, executable, script path, command line, and start time still match the saved state.