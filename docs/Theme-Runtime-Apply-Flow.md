# Theme Runtime Apply Flow

## Goal

Move from fixed theme files to an active theme resolution model.

## Flow

```text
.codex-theme
    |
    v
Theme Importer
    |
    v
Theme Registry
    |
    v
active-theme.json
    |
    v
Theme Resolver
    |
    v
theme.json + assets
    |
    v
Runtime Applier
    |
    v
Codex renderer injection
```

## Rules

- Theme packages are data-only packages.
- Runtime never executes files from a theme package.
- The active theme is selected through registry state.
- Platform-specific application logic remains outside the theme layer.

## Migration

Legacy direct theme loading should be replaced gradually:

Before:

```
fixed theme.json
        |
        v
injector
```

After:

```
active theme id
        |
        v
resolver
        |
        v
theme package
        |
        v
injector
```
