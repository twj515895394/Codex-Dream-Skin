# Theme Runtime Import Architecture

## Goal

Provide a safe data-only theme installation flow based on `.codex-theme` packages.

## Runtime storage

macOS runtime data:

```
~/Library/Application Support/CodexDreamSkinStudio/

├── themes/
│   ├── soft-family/
│   └── other-theme/
│
├── registry.json
└── active-theme.json
```

## Import flow

```
.codex-theme
    |
    v
Validator
    |
    v
Importer
    |
    v
Storage
    |
    v
Registry
    |
    v
Apply Theme
```

## Security rules

Theme packages are data packages only.

Forbidden:

- executable scripts
- applications
- binaries

Allowed:

- JSON configuration
- images
- metadata
- documentation

## Active theme

Runtime stores only the selected theme id:

```json
{
  "activeTheme": "soft-family-calm"
}
```

The actual theme assets remain managed in the theme registry.
