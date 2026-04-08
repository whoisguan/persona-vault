# Theme: Linear

> Dark-mode-native. Indigo-violet accent. Inter Variable with cv01/ss03. Precision in darkness.
> Source: [awesome-design-md/linear.app](https://github.com/VoltAgent/awesome-design-md)

## CSS Variables

```css
:root[data-theme="linear"] {
  /* Surfaces */
  --bg-primary: #08090a;
  --bg-secondary: #0f1011;
  --bg-tertiary: #191a1b;
  --bg-inverse: #f7f8f8;

  /* Text */
  --text-primary: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-tertiary: #8a8f98;
  --text-inverse: #08090a;

  /* Brand & Accent */
  --accent-primary: #5e6ad2;
  --accent-hover: #828fff;
  --accent-subtle: rgba(94, 106, 210, 0.15);
  --accent-link: #7170ff;

  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-secondary: rgba(255, 255, 255, 0.05);
  --border-focus: #5e6ad2;

  /* Shadows */
  --shadow-border: none;
  --shadow-card: none;  /* Linear uses border-defined depth, not shadows */
  --shadow-elevated: rgba(0, 0, 0, 0.4) 0px 2px 4px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: 'Inter Variable', Inter, -apple-system, system-ui, sans-serif;
  --font-mono: 'Berkeley Mono', ui-monospace, SF Mono, Menlo, monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

## Typography

Font: **Inter Variable** with `font-feature-settings: "cv01", "ss03"`
Weights: 400 (read), 510 (emphasis/UI), 590 (strong). No 700.

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display | 48px | 510 | 1.00 | -1.056px |
| H1 | 32px | 400 | 1.13 | -0.704px |
| H2 | 24px | 400 | 1.33 | -0.288px |
| H3 | 20px | 590 | 1.33 | -0.24px |
| Body Large | 18px | 400 | 1.60 | -0.165px |
| Body | 16px | 400 | 1.50 | normal |
| Body Medium | 16px | 510 | 1.50 | normal |
| Caption | 13px | 510 | 1.50 | -0.13px |
| Label | 12px | 510 | 1.40 | normal |
| Mono Body | 14px (Mono) | 400 | 1.50 | normal |

## Key Principles

1. **Dark-native**: Background luminance steps create depth — `#08090a` → `#0f1011` → `#191a1b`. No shadows needed.

2. **510 is the signature weight**: Between regular and medium. Subtle emphasis without heaviness.

3. **OpenType identity**: `"cv01", "ss03"` transform Inter into Linear's distinctive typeface.

4. **Semi-transparent borders**: `rgba(255,255,255,0.05-0.08)` — structure without visual noise.

5. **Button transparency**: Backgrounds at `rgba(255,255,255, 0.02-0.05)` — never solid on dark.

6. **Single accent**: Brand indigo (`#5e6ad2` / `#7170ff`) is the only chromatic color.

## Do's and Don'ts

### Do
- Set `font-feature-settings: "cv01", "ss03"` on ALL Inter text
- Use weight 510 as default emphasis, 590 for strong
- Build depth via background luminance stepping
- Use semi-transparent white borders

### Don't
- Don't use pure white (`#ffffff`) as text — use `#f7f8f8`
- Don't use solid backgrounds for buttons on dark surfaces
- Don't use drop shadows for elevation on dark
- Don't introduce warm colors into the palette
