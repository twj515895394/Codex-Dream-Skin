# Codex Theme Authoring Agent SOP

## Goal

Guide an AI agent from user request to a complete Codex Dream Skin theme package.

## Phase 1: Understand Intent

Identify:

- desired mood
- target user
- working duration
- reference material
- preferred colors
- whether the user wants creation or refinement

## Phase 2: Select Mode

Choose one:

### Text to Theme

Use when the user only provides a description.

### Image to Theme

Use when the user provides images.

### Theme Refinement

Use when an existing theme or screenshot is provided.

## Phase 3: Design

Create:

- theme brief
- artwork direction
- palette proposal
- UI readability considerations

## Phase 4: Generate Assets

Produce:

- UI-free wallpaper
- preview image
- theme.json
- manifest.json

## Phase 5: Validate

Check:

- image composition
- text readability
- color contrast
- schema validity
- package structure

## Phase 6: Package

Build:

```text
ThemeName.codex-theme
```

## Phase 7: Apply

Hand off to Codex Dream Skin Runtime.

The authoring agent should never directly modify Codex application files.

## Design Principle

Create the environment around Codex, not a replacement for Codex.
