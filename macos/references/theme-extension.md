# Structural theme extension reference

Use this reference only when image, copy, and `theme.json` cannot express the requested result.

## Choose the smallest responsible layer

| Requested change | Correct layer |
|---|---|
| Artwork, theme name, tagline, quote, project copy, status copy, palette | user image + `theme.json` |
| Panel treatment, spacing, card shape, typography, responsive layout, light-shell structure | `assets/dream-skin.css` |
| New decorative element, route-aware decoration, new live theme field, cleanup behavior | `assets/renderer-inject.js` plus CSS |
| Image conversion, exposed CLI fields, theme generation rules | `scripts/customize-theme-macos.sh` and `scripts/write-theme.mjs` |
| Payload validation, CDP target selection, injection lifecycle | `scripts/injector.mjs`; change only for an engine feature or bug |
| Official Codex controls or application logic | out of scope; do not replace or patch the app |

Do not escalate because editing CSS feels faster. Configuration remains more portable across Codex updates and easier to restore.

## Source of truth

Durable changes belong in the repository under `macos/`. The installed engine at `~/.codex/codex-dream-skin-studio` is a deployed copy.

Use this loop:

```text
edit repository source
→ run syntax and project tests
→ reinstall with --no-launch
→ apply through the launcher
→ verify and capture screenshot
→ sync any emergency installed-copy experiment back to source or discard it
```

Never finish with a successful modification that exists only in the installed engine.

## CSS responsibilities

`assets/dream-skin.css` styles the official live DOM and the decorative DOM created by the renderer script.

Rules:

- Scope every rule under `html.codex-dream-skin` or a Dream Skin-owned ID/class.
- Prefer stable semantic markers already validated by the injector over deep positional selectors.
- Keep native controls above decorations and preserve pointer, hover, focus, keyboard, and scroll behavior.
- Use theme variables instead of repeating literal colors when a value is theme-controlled.
- Provide responsive behavior before decoration can overlap controls.
- Honor `prefers-reduced-motion` for nonessential animation.
- Avoid global resets, broad `div` selectors, and selectors that can escape the Codex shell.
- Use `!important` only where required to override the host renderer; do not add it automatically to every declaration.

A CSS change is incomplete until the home route, task route, narrow window, dialogs, menus, composer, selection states, and focus outlines have been inspected.

## Renderer responsibilities

`assets/renderer-inject.js` owns idempotent setup, theme variables, decorative DOM, route detection, reapplication, and cleanup.

Rules:

- Reuse the existing state object and cleanup path; do not create an independent unmanaged observer or timer.
- Give new DOM a Dream Skin-owned ID or class.
- Set decorative roots to `aria-hidden="true"` and keep them non-interactive.
- Use `textContent` for user-controlled theme copy rather than interpolating it into HTML.
- Add every new root variable to cleanup bookkeeping.
- Make repeated `ensure()` calls idempotent: one renderer must still produce one decoration tree.
- Remove listeners, observers, timers, object URLs, classes, variables, styles, and DOM nodes during cleanup.
- Keep route detection tolerant of missing optional home elements; do not remove the entire skin merely because one decorative target changed.
- Do not read secrets, authentication state, conversation content, or external URLs for decoration.

When adding a new configurable field, update all of these single-source locations together:

1. theme writer or documented direct-edit schema;
2. injector loader validation and fallback;
3. renderer application or live text assignment;
4. cleanup only when a root variable or persistent node is introduced;
5. tests and example theme where relevant.

## Update resilience

Treat every host selector as a compatibility dependency.

Before changing a selector:

1. confirm it exists in a real current Codex renderer;
2. determine whether it identifies a native control, route, or purely visual wrapper;
3. prefer attributes, roles, or stable shell markers over generated class chains;
4. add a fallback only when it cannot accidentally match another Electron page;
5. keep strict target validation in the injector.

Do not solve a host update by drawing a replacement control. The correct fallback is restrained styling or temporarily losing decoration while native controls continue to work.

## Required checks

From the repository `macos/` directory:

```bash
./tests/run-tests.sh
```

Also run syntax checks when editing the corresponding files:

```bash
node --check scripts/injector.mjs
node --check assets/renderer-inject.js
bash -n scripts/customize-theme-macos.sh
bash -n scripts/start-dream-skin-macos.sh
```

Use the verified bundled runtime for live payload checks and application. A global Node binary may be used for static syntax checks only when project policy permits it; it is not a substitute for runtime signature validation.

Reinstall the repository copy before live acceptance:

```bash
./scripts/install-dream-skin-macos.sh --no-launch
```

Then apply, verify, reload, verify again, and restore. The extension is complete only when reinstall reproduces it and restore removes it without changing the official app signature.