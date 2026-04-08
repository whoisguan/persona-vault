# Theme: Notion

> Warm & approachable. Content-first. Whisper borders. Yellow-brown neutral undertones.
> Source: [awesome-design-md/notion](https://github.com/VoltAgent/awesome-design-md)

## CSS Variables

```css
:root[data-theme="notion"] {
  /* Surfaces */
  --bg-primary: #ffffff;
  --bg-secondary: #f6f5f4;           /* warm white — the signature */
  --bg-tertiary: #f0efed;
  --bg-inverse: #31302e;

  /* Text */
  --text-primary: rgba(0, 0, 0, 0.95); /* not pure black */
  --text-secondary: #615d59;
  --text-tertiary: #a39e98;
  --text-inverse: #ffffff;

  /* Brand & Accent */
  --accent-primary: #0075de;           /* Notion Blue */
  --accent-hover: #005bab;
  --accent-subtle: #f2f9ff;
  --accent-link: #0075de;

  /* Borders — whisper-weight */
  --border-primary: rgba(0, 0, 0, 0.1);
  --border-secondary: rgba(0, 0, 0, 0.06);
  --border-focus: #097fe8;

  /* Shadows — multi-layer, sub-0.05 opacity */
  --shadow-border: none;
  --shadow-card: rgba(0, 0, 0, 0.04) 0px 4px 18px,
                 rgba(0, 0, 0, 0.027) 0px 2px 8px,
                 rgba(0, 0, 0, 0.02) 0px 0.8px 3px,
                 rgba(0, 0, 0, 0.01) 0px 0.2px 1px;
  --shadow-elevated: rgba(0, 0, 0, 0.01) 0px 1px 3px,
                     rgba(0, 0, 0, 0.02) 0px 3px 7px,
                     rgba(0, 0, 0, 0.02) 0px 7px 15px,
                     rgba(0, 0, 0, 0.04) 0px 14px 28px,
                     rgba(0, 0, 0, 0.05) 0px 23px 52px;

  /* Radius — rounder than Vercel */
  --radius-sm: 4px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, system-ui, Segoe UI, Helvetica, sans-serif;
  --font-mono: 'SFMono-Regular', Menlo, Consolas, monospace;

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

Font: **Inter** (or NotionInter). `font-feature-settings: "lnum", "locl"` on headings.
Weights: 400 (body), 500 (UI), 600 (emphasis), 700 (display headings).

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display | 48px | 700 | 1.00 | -1.5px |
| H1 | 32px | 700 | 1.25 | -0.8px |
| H2 | 24px | 700 | 1.27 | -0.25px |
| Body Large | 20px | 600 | 1.40 | -0.125px |
| Body | 16px | 400 | 1.50 | normal |
| Body Medium | 16px | 500 | 1.50 | normal |
| Nav / Button | 15px | 600 | 1.33 | normal |
| Caption | 14px | 500 | 1.43 | normal |
| Badge | 12px | 600 | 1.33 | 0.125px |

## Key Principles

1. **Warm neutrals**: Grays carry yellow-brown undertones (`#f6f5f4`, `#615d59`, `#a39e98`). Never blue-gray.

2. **Whisper borders**: `1px solid rgba(0,0,0,0.1)` — barely visible structure.

3. **Near-black, not black**: `rgba(0,0,0,0.95)` for text softens reading.

4. **Section alternation**: White and warm white (`#f6f5f4`) sections alternate for rhythm.

5. **Four-weight system**: 400/500/600/700 — broader range than other themes.

6. **Single accent**: Notion Blue (`#0075de`) is the only saturated color.

## Do's and Don'ts

### Do
- Use warm neutrals (yellow-brown undertones)
- Keep borders at whisper-weight: `rgba(0,0,0,0.1)` max
- Use multi-layer shadows with individual opacity never exceeding 0.05
- Alternate white and warm white sections
- Use `#f2f9ff` for badge backgrounds

### Don't
- Don't use blue-gray neutrals
- Don't use heavy borders or shadows
- Don't skip the warm white section alternation
- Don't use saturated colors beyond Notion Blue
