# Theme Generation Workflow

## Purpose

Define the end-to-end workflow used by Codex Theme Authoring when creating a Dream Skin theme.

The workflow converts a user idea, image, or existing theme into a validated `.codex-theme` package.

---

## Input Modes

### Text → Theme

Use when the user provides only a concept.

Example:

> Create a calm developer workspace theme.

Flow:

```
Theme brief
    ↓
Visual direction
    ↓
Artwork prompt
    ↓
Wallpaper generation
    ↓
Palette extraction
    ↓
theme.json
    ↓
Theme package
```

---

### Image → Theme

Use when the user provides a reference image.

Do not directly place the source image as wallpaper.

Flow:

```
Reference image
    ↓
Image analysis
    ↓
Visual language extraction
    ↓
Codex-compatible artwork direction
    ↓
New wallpaper
    ↓
theme configuration
    ↓
Theme package
```

---

### Existing Theme Refinement

Use when improving an existing theme.

Analyze:

- readability
- contrast
- saturation
- visual fatigue
- layout balance

Prefer configuration changes before structural changes.

---

## Standard Generation Steps

### Step 1: Understand Intent

Capture:

- theme purpose
- target user
- working duration
- emotional tone
- visual references

---

### Step 2: Create Theme Brief

The brief should define:

- name
- style keywords
- color direction
- composition
- prohibited elements

---

### Step 3: Design Artwork

The generated wallpaper must:

- remain UI-free
- preserve Codex readability
- provide safe text areas
- avoid fake interface elements

---

### Step 4: Generate Configuration

Create:

- manifest.json
- theme.json

Validate all fields before packaging.

---

### Step 5: Build Theme Package

Output:

```
ThemeName.codex-theme
```

Package must contain:

- metadata
- wallpaper
- preview image
- theme configuration
- installation instructions

---

### Step 6: Runtime Application

The authoring workflow should delegate actual loading to Codex Dream Skin Studio runtime.

Authoring creates themes.
Runtime applies themes.

---

### Step 7: Verify

Check:

- title readability
- sidebar visibility
- project selector
- composer area
- task pages
- contrast
- visual comfort

---

## Design Principle

A Dream Skin is not a replacement UI.

It is a carefully designed working environment around the native Codex interface.
