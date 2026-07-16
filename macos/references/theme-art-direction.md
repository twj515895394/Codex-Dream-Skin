# Theme artwork direction

Use this reference only while designing, selecting, generating, or evaluating the image used by a macOS Dream Skin theme.

## Visual contract

Before producing artwork, write a compact contract containing:

- **Theme name:** the user-visible identity.
- **Purpose:** personal atmosphere, product branding, character theme, event theme, or another concrete use.
- **Mood:** two or three compatible adjectives.
- **Subject:** person, mascot, environment, abstract form, or brand object.
- **Focal placement:** normally center-right or far-right.
- **Left safe zone:** low-detail region reserved for native Codex heading and project controls.
- **Palette:** background, accent, secondary, and highlight colors.
- **Shell target:** dark-first, light-first, or balanced.
- **Forbidden content:** fake UI, rasterized Codex text, tiny unreadable lettering, watermarks, or unlicensed marks for public distribution.

Do not generate until the contract is internally coherent. A theme described as calm and minimal should not also demand dense particles, several characters, and high-frequency detail across the entire canvas.

## Canvas and composition

Preferred source:

- landscape orientation;
- at least 2000 px wide, with 3200 px or 4K width preferred;
- 16:9 or a slightly wider cinematic ratio;
- important subject matter inside the central 80% vertically;
- no essential detail at extreme edges because banner and task routes crop differently.

Use this layout as the default:

```text
┌──────────────────────────────────────────────────────────────┐
│ calm live-text zone │ transition zone │ primary subject     │
│ about 35–45%        │ about 15–20%    │ about 35–45%        │
│ low contrast/detail │ atmospheric     │ strongest contrast  │
└──────────────────────────────────────────────────────────────┘
```

The home banner places live text and project controls toward the left. The task route uses the same image as a full background under gradients and translucent native content. Judge the image in both roles.

## Artwork rules

- Treat the image as atmosphere, not interface.
- Keep the left third quieter than the right half.
- Avoid faces, logos, and focal objects directly behind expected text.
- Prefer broad lighting, silhouettes, gradients, architecture, clouds, fabric, or controlled bokeh over dense micro-detail.
- Keep enough dark or light separation for overlays; do not depend on a single exact crop.
- Do not draw buttons, sidebars, cards, menus, input fields, code panels, or window chrome.
- Do not bake the theme name, tagline, project label, or status text into the image; these remain live DOM text.
- Decorative lettering is acceptable only when the user explicitly requests it and it is not intended to imitate Codex controls.

## Image-generation prompt pattern

Adapt this pattern to the visual contract rather than copying it literally:

```text
Create a premium landscape background for an interactive desktop coding workspace.
Theme: [theme identity and mood].
Scene: [subject and environment].
Composition: primary focal subject on the right, a calm low-detail negative-space area across the left 40%, soft transition through the center, important content away from edges.
Lighting and palette: [background], [accent], [secondary], [highlight], with readable tonal separation for translucent foreground panels.
Style: [specific visual style], polished, cinematic, cohesive, high-resolution.
No user interface, no buttons, no input boxes, no sidebar, no code editor screenshot, no small text, no watermark, no fake application controls.
16:9 landscape, 4K-quality detail.
```

For a recognizable person, character, logo, or franchise, confirm that the intended use and distribution are compatible with the user's rights. Public or commercial packaging needs stricter rights review than personal local use.

## Palette derivation

Choose colors by role, not merely by sampling the most saturated pixels:

- **Background:** the dominant low-energy field used behind task content.
- **Accent:** the primary interactive emphasis; it must remain legible on both dark panels and light shell surfaces.
- **Secondary:** a distinct supporting hue for gradients and small highlights.
- **Highlight:** the deepest or most vivid contrast hue, used sparingly.
- **Text/muted:** neutral readable values, not tinted so strongly that long task content becomes tiring.

Reject a palette when accent and secondary are nearly indistinguishable, when the accent disappears against the artwork, or when all colors have maximum saturation.

## Artwork acceptance

The artwork is ready only when all are true:

- source file exists locally and is no larger than 50 MB;
- width is preferably at least 2000 px;
- the left safe zone remains readable under live text;
- the primary subject survives a wide banner crop;
- the task background remains atmospheric rather than distracting;
- no fake controls or rasterized Codex labels are present;
- the image can be converted to a prepared file no larger than 16 MB without obvious degradation.