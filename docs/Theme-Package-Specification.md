# Codex Dream Skin Theme Package Specification

## Overview

`.codex-theme` is the standard distribution format for Codex Dream Skin themes.

A theme package is a data package only. It must not contain executable scripts or binaries.

## Structure

```text
ThemeName.codex-theme/
├── manifest.json
├── theme.json
├── assets/
│   ├── wallpaper.png
│   └── preview.png
├── metadata/
│   └── design.json
└── README.md
```

## Runtime responsibilities

The Runtime is responsible for:

- validating packages
- importing themes
- registering themes
- applying themes
- restoring previous themes

## Authoring responsibilities

Theme Authoring is responsible for:

- creating visual direction
- generating assets
- creating manifest/theme configuration
- exporting `.codex-theme`

## Security rules

Theme packages must not include:

- `.command`
- `.sh`
- executable binaries
- application bundles

Themes should be treated as configuration and assets, not programs.
