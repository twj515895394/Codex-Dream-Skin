# Theme Schema Guidance

## Overview

A Codex theme consists of visual assets and metadata consumed by Codex Dream Skin Studio.

Prefer generating configuration themes before modifying runtime CSS or renderer logic.

## Theme Metadata

Recommended fields:

```json
{
  "name": "Theme Name",
  "brandSubtitle": "CODEX DREAM SKIN",
  "tagline": "A short visual statement",
  "quote": "CREATE WITHOUT LIMITS"
}
```

## Color System

Design colors by role, not isolated values.

```json
{
  "background": "#071116",
  "panel": "#0b1a20",
  "panelAlt": "#10272c",
  "accent": "#7cff46",
  "accentAlt": "#b8ff3d",
  "secondary": "#36d7e8",
  "highlight": "#642a8c",
  "text": "#e9fff1",
  "muted": "#9ebdb3",
  "line": "rgba(124,255,70,.28)"
}
```

## Design Rules

- background should support long sessions;
- text must remain readable;
- accent colors should highlight, not dominate;
- avoid pure black and pure white extremes when possible;
- use shadows and muted gradients instead of aggressive contrast.

## Scope Decision

Configuration only:

- wallpaper
- text
- palette
- metadata

Structural customization:

- layout
- typography
- additional DOM decoration
- CSS behavior

Structural changes require explicit escalation.
