# Theme Builder Specification

## Purpose

Define how generated theme assets are assembled into a portable Codex Dream Skin package.

The builder converts a theme workspace into:

```
ThemeName.codex-theme
```

---

## Source Workspace

Expected structure:

```
theme-workspace/

├── manifest.json
├── theme.json
├── assets/
│   ├── wallpaper.png
│   └── preview.png
└── README.md
```

---

## Output Package

Generated package:

```
ThemeName.codex-theme/
```

or archive:

```
ThemeName.codex-theme.zip
```

---

## Validation Before Build

Required checks:

### Metadata

- theme id exists
- version exists
- name exists

### Assets

- wallpaper exists
- preview exists
- image format supported
- image size acceptable

### Configuration

- theme.json matches schema
- color values are valid
- references are relative paths

---

## Future CLI Design

Example:

```bash
codex-theme build ./soft-family
```

Output:

```text
✓ validate manifest
✓ validate theme.json
✓ validate assets
✓ create package

Soft-Family.codex-theme
```

---

## Relationship With Runtime

Theme Builder does not inject themes.

Responsibilities:

```
Theme Builder
    ↓
creates package

Dream Skin Runtime
    ↓
installs and applies package
```

Keeping creation and execution separate allows future support for:

- theme marketplace
- theme sharing
- cross-platform adapters
- automated theme generation
