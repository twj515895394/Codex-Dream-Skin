# Runtime Adapter Design

## Purpose

Runtime Adapter is the bridge between the Theme System and the existing Codex Dream Skin injection runtime.

The adapter must not handle CDP communication or modify Codex directly.

## Responsibility

Input:

- Resolved theme package
- manifest.json
- theme.json
- assets

Output:

A runtime payload:

```json
{
  "themeId": "soft-family-calm",
  "wallpaper": "...",
  "colors": {},
  "appearance": {},
  "content": {}
}
```

## Architecture

```
.codex-theme
    |
    v
Theme Resolver
    |
    v
Runtime Adapter
    |
    v
Existing CDP Runtime
```

## Design Rules

- Theme layer does not know CDP details.
- Runtime layer does not know theme package format.
- Adapter is the only translation boundary.
- Future platforms can replace runtime implementations without changing themes.
