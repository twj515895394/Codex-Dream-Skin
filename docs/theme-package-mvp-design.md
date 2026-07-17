# Codex Dream Skin Theme Package MVP Design

## Goal

Move from script-based skin customization to a portable `.codex-theme` package.

MVP goal:

```
.codex-theme
    ↓
Import
    ↓
Active Theme
    ↓
Apply Runtime
    ↓
Codex CDP Injector
```

## Scope

### Included

- Theme package format
- Import theme flow
- Active theme selection
- Runtime loading
- Apply through existing injector
- Restore default

### Deferred

- Marketplace
- Full theme registry
- Cross-platform abstraction
- GUI theme studio

## Theme Package Format

```
Soft-Family-Calm.codex-theme

├── manifest.json
├── theme.json
├── assets/
│   ├── wallpaper-light.png
│   ├── wallpaper-dark.png
│   └── preview.png
└── README.md
```

## Runtime Flow

```
Theme Package
      |
      v
Import Theme
      |
      v
active-theme.json
      |
      v
theme.json
      |
      v
runtime-theme.json
      |
      v
existing injector
      |
      v
Codex
```

## Soft Family Theme Direction

Design principles:

- Low visual fatigue
- Soft contrast
- Long coding sessions
- Light and dark mode support

Light palette:

- Background: #EEF6FB
- Panel: #F8FBFD
- Accent: #7FB8D8
- Text: #29404F

Dark palette:

- Background: #243744
- Panel: #2D414E
- Accent: #7FAEC5
- Text: #F3F7F8

## Implementation Notes

Keep injector focused on CDP injection only. Theme loading and conversion should happen before injector execution.
