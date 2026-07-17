# Theme Finalization Checklist

Before delivering a Codex Dream Skin theme, verify:

## Design

- [ ] Theme intent is clearly defined
- [ ] Wallpaper is UI-free
- [ ] Main subject does not block Codex content areas
- [ ] Colors are comfortable for long sessions

## Assets

- [ ] wallpaper.png exists
- [ ] preview.png exists
- [ ] Images are optimized

## Configuration

- [ ] manifest.json is valid
- [ ] theme.json is valid
- [ ] Asset paths are relative

## Package

- [ ] Theme package builds successfully
- [ ] Package can be imported by runtime tooling

## Runtime Handoff

Authoring only creates the theme package.
Codex Dream Skin Runtime is responsible for installation, injection, verification, and rollback.
