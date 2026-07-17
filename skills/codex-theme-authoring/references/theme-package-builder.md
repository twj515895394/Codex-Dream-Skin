# Theme Package Builder Specification

## Purpose

The Theme Package Builder converts an authored Codex Dream Skin theme directory into a portable `.codex-theme` package.

The builder is responsible for validation, packaging, and metadata generation. It does not install or inject themes into Codex.

## Input

A theme directory:

```text
my-theme/
├── manifest.json
├── theme.json
├── assets/
│   ├── wallpaper.png
│   └── preview.png
└── README.md
```

## Output

```text
my-theme.codex-theme
```

The package should be portable and safe to share.

## Validation Rules

Before packaging, validate:

- manifest.json exists
- theme.json exists
- schemaVersion is supported
- theme id is valid
- required colors are valid CSS values
- wallpaper exists
- preview exists
- image size follows Dream Skin limits
- no executable files are included unless explicitly allowed

## Build Flow

```text
Theme Directory
      |
      v
Load manifest.json
      |
Validate theme.json
      |
Validate assets
      |
Generate package metadata
      |
Create .codex-theme archive
      |
Output package
```

## Separation of Responsibilities

Theme Builder:

- create package
- validate assets
- preserve metadata

Dream Skin Runtime:

- install package
- apply theme
- inject styles
- verify result
- restore defaults

## Future CLI

Example:

```bash
codex-theme build ./my-theme
```

Expected output:

```text
Built: my-theme.codex-theme
```
