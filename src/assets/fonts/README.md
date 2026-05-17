# Fonts

Wonder Practices self-hosts Atkinson Hyperlegible (body) and Bricolage Grotesque (display).

Atkinson Hyperlegible was designed by the Braille Institute to maximize letter-shape distinctiveness for low-vision readers. Bricolage Grotesque is a contemporary humanist sans with optical-size variants that pair well as a display face.

## Current files

```
atkinson/
  atkinson-hyperlegible-v12-latin-regular.woff2   (400)
  atkinson-hyperlegible-v12-latin-700.woff2       (700)
bricolage/
  bricolage-grotesque-v9-latin-regular.woff2      (400)
  bricolage-grotesque-v9-latin-500.woff2          (500)
  bricolage-grotesque-v9-latin-600.woff2          (600)
  bricolage-grotesque-v9-latin-700.woff2          (700)
```

The `@font-face` declarations live in `src/assets/css/tokens.css`. Each rule lists `url(...)` first and `local(...)` as a fallback, so the self-hosted file is preferred for cross-user consistency.

## Italic

No italic file is included. Spots that use `font-style: italic` (the mountain-scape intro line, the panel description text) fall back to the browser's synthesized italic from the regular weight. If a true italic file is added later, drop it in the same folder and add a matching `@font-face` block with `font-style: italic`.

## Sources

Both faces are open source.

- Atkinson Hyperlegible: https://www.brailleinstitute.org/freefont
- Bricolage Grotesque: https://fonts.google.com/specimen/Bricolage+Grotesque
