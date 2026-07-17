---
name: codex-theme-authoring
description: Create Codex Dream Skin themes from text briefs, reference images, existing screenshots, or existing themes. Generate UI-free wallpapers, theme configuration, theme packages, and coordinate application through Codex Dream Skin Studio.
compatibility: macOS, Codex Dream Skin Studio
---

# Codex Theme Authoring

Create a complete Codex Dream Skin theme from a creative brief or visual reference.

This skill focuses on **theme creation**. Runtime operations such as injection, verification, and restore are handled by Codex Dream Skin Studio.

## Supported creation modes

### 1. Text to Theme

Use when the user only provides an idea or style requirement.

Examples:

- Create a low-fatigue developer workspace theme.
- Design an Apple-like minimal Codex theme.
- Create a futuristic AI creator workspace.

Flow:

1. Build theme brief.
2. Define visual direction.
3. Generate UI-free wallpaper.
4. Design palette.
5. Create theme.json.
6. Package theme.

### 2. Image to Theme

Use when the user provides a photo, artwork, or reference image.

Do not directly place the image into Codex.

Analyze:

- composition;
- subject position;
- dominant colors;
- mood;
- lighting;
- usable empty areas.

Then redesign it into a Codex-compatible wallpaper.

### 3. Existing Theme Refinement

Use when the user wants improvements.

Examples:

- reduce eye fatigue;
- make colors softer;
- improve readability;
- adjust professional feeling.

## Non-negotiable rules

- Never generate fake Codex UI inside wallpaper.
- Never embed buttons, input boxes, sidebars, or screenshots into artwork.
- Preserve native Codex controls.
- Optimize for long working sessions.
- Prefer configuration themes before CSS or renderer changes.

## Output

A completed theme should contain:

- wallpaper asset;
- theme.json;
- preview image;
- theme package metadata;
- installation instructions.

Read references when needed:

- references/artwork-direction.md
- references/theme-schema.md
- references/theme-package.md
