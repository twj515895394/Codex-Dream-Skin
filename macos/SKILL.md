---
name: codex-dream-skin-studio
description: Design, build, apply, verify, repair, update, or restore a custom Codex Dream Skin on macOS. Use when a user wants to create a Codex theme from an image or visual brief, configure theme.json, apply a skin, troubleshoot CDP theming, or preserve the native Codex interface while customizing appearance.
compatibility: macOS, official Codex Desktop app, signed bundled Node.js 20 or newer
---

# Codex Dream Skin Studio — macOS Theme Authoring

Create a complete and reversible Codex theme from a visual brief or source image. Prefer configuration themes using a prepared wallpaper plus `theme.json`. Escalate to CSS or renderer changes only when the requested result cannot be expressed by configuration.

## Non-negotiable boundaries

- Never modify the official `.app`, `app.asar`, executable, resources, or code signature.
- Use the official Codex app's signed Node.js runtime only after validating its signature, Team ID, architecture, and minimum version.
- Bind CDP to loopback, verify that the listener belongs to Codex, and reject non-Codex renderer targets.
- Preserve native sidebar, cards, navigation, project selector, task content, menus, composer, focus, and keyboard interaction.
- Theme images must be UI-free wallpapers. Never create fake Codex UI, screenshots, buttons, input boxes, or rasterized controls.
- Paint one landscape image continuously across the window; judge both home and task routes.
- Keep decorative layers `pointer-events: none`.
- Require explicit authorization before restarting an already-running Codex instance.
- Keep API providers, credentials, authentication, threads, plugins, and user data outside theme operations.

## Workflow

### 1. Resolve theme brief and runtime

Determine theme identity, mood, subject or brand, shell mode target, display copy, and whether the user supplied an image or needs generated artwork.

Choose scope:

- Configuration theme: image, copy, palette only.
- Structural theme: CSS, typography, layout, or renderer decoration.

Install engine only when missing:

```bash
./scripts/install-dream-skin-macos.sh --no-launch
```

Complete when theme scope and runtime paths are known.

### 2. Design theme artwork

Read `references/theme-art-direction.md` before generating or preparing artwork.

Requirements:

- landscape image;
- preferably 3200px wide or 4K;
- left area calm for live Codex heading and controls;
- important subject normally center-right;
- no embedded UI or text.

The same wallpaper is used across home and task routes, so judge readability in both contexts.

### 3. Generate configuration theme

Use the customization script and inspect before applying:

```bash
ENGINE="$HOME/.codex/codex-dream-skin-studio"
"$ENGINE/scripts/customize-theme-macos.sh" \
  --image "/absolute/path/to/image.png" \
  --name "Theme name" \
  --tagline "Theme tagline" \
  --quote "DISPLAY QUOTE" \
  --accent "#7cff46" \
  --secondary "#36d7e8" \
  --highlight "#642a8c" \
  --no-apply
```

Generated theme location:

```text
~/Library/Application Support/CodexDreamSkinStudio/theme
```

Read `references/theme-config.md` for advanced fields or direct theme.json customization.

Validate payload before applying using the project's signed-runtime checks.

### 4. Apply theme

Use the managed launcher:

```bash
ENGINE="$HOME/.codex/codex-dream-skin-studio"
"$ENGINE/scripts/start-dream-skin-macos.sh" --prompt-restart
```

Never launch arbitrary injectors against Electron targets.

### 5. Verify

Capture a real verification screenshot:

```bash
ENGINE="$HOME/.codex/codex-dream-skin-studio"
"$ENGINE/scripts/verify-dream-skin-macos.sh" \
  --screenshot "$HOME/Desktop/Codex Dream Skin Verification.png"
```

Check:

- native sidebar works;
- composer works;
- project selector works;
- no overflow exists;
- decoration is non-interactive;
- home route and task route are readable.

Repair in order:

1. artwork crop/contrast;
2. theme.json palette/copy;
3. CSS selectors/layout;
4. renderer decoration logic.

### 6. Structural extensions

Read `references/theme-extension.md` before modifying:

- `assets/dream-skin.css`
- `assets/renderer-inject.js`

Keep repository source as the single source of truth. Reinstall, apply, and verify after structural changes.

### 7. Deliver and rollback

Report:

- theme name;
- artwork source;
- generated theme directory;
- changed CSS/renderer files;
- verification result;
- rollback method.

Rollback:

```bash
ENGINE="$HOME/.codex/codex-dream-skin-studio"
"$ENGINE/scripts/restore-dream-skin-macos.sh" --restore-base-theme --restart-codex
```

## Repair branch

Diagnose:

1. `scripts/doctor-macos.sh`
2. injector and launch logs
3. payload validation
4. live verification
5. restore and reinstall if state is unreliable

Never kill an injector unless recorded PID, executable, script path, command line, and start time still match.

## Key resources

- `README.md`: user installation and customization guide.
- `scripts/injector.mjs`: CDP connection, injection, removal, verification, and screenshots.
- `assets/dream-skin.css`: live native interface styling.
- `assets/renderer-inject.js`: idempotent DOM integration and cleanup.
- `scripts/doctor-macos.sh`: signed-runtime, payload, and optional live-session self-check.
- `references/qa-inventory.md`: release and visual acceptance criteria.
