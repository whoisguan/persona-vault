# Theme: Vercel (Default)

> Monochrome precision. Shadow-as-border. Geist typography. Gallery emptiness.
> Source: [awesome-design-md/vercel](https://github.com/VoltAgent/awesome-design-md)

## CSS Variables

```css
:root[data-theme="vercel"] {
  /* Surfaces */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --bg-inverse: #171717;

  /* Text */
  --text-primary: #171717;
  --text-secondary: #666666;
  --text-tertiary: #808080;
  --text-inverse: #ffffff;

  /* Brand & Accent */
  --accent-primary: #171717;           /* dark CTA — Vercel's signature */
  --accent-hover: #000000;
  --accent-subtle: #f5f5f5;
  --accent-link: #0072f5;              /* link blue */

  /* Workflow Colors (use sparingly, only in pipeline context) */
  --workflow-develop: #0a72ef;
  --workflow-preview: #de1d8d;
  --workflow-ship: #ff5b4f;

  /* Borders — Vercel uses shadow-as-border */
  --border-primary: rgba(0, 0, 0, 0.08);
  --border-secondary: #ebebeb;
  --border-focus: hsla(212, 100%, 48%, 1);

  /* Shadows */
  --shadow-border: 0px 0px 0px 1px rgba(0, 0, 0, 0.08);
  --shadow-card: 0px 0px 0px 1px rgba(0, 0, 0, 0.08),
                 0px 2px 2px rgba(0, 0, 0, 0.04),
                 0px 0px 0px 1px #fafafa;
  --shadow-elevated: 0px 0px 0px 1px rgba(0, 0, 0, 0.08),
                     0px 2px 2px rgba(0, 0, 0, 0.04),
                     0px 8px 8px -8px rgba(0, 0, 0, 0.04),
                     0px 0px 0px 1px #fafafa;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: 'Geist', Inter, -apple-system, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, monospace;

  /* Spacing (8px base) */
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

Font: **Geist** (sans) + **Geist Mono** (mono)
OpenType: `"liga"` enabled globally.
Weights: 400 (body), 500 (UI), 600 (headings). No 700.

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display | 48px | 600 | 1.00 | -2.4px |
| H1 | 32px | 600 | 1.25 | -1.28px |
| H2 | 24px | 600 | 1.33 | -0.96px |
| Body Large | 20px | 400 | 1.80 | normal |
| Body | 16px | 400 | 1.50 | normal |
| Body Medium | 16px | 500 | 1.50 | normal |
| Button / Caption | 14px | 500 | 1.43 | normal |
| Small Caption | 12px | 500 | 1.33 | normal |
| Mono Body | 16px (Mono) | 400 | 1.50 | normal |
| Mono Label | 12px (Mono) | 500 | 1.00 | normal, uppercase |

## Key Principles

1. **Shadow-as-border**: Use `box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.08)` instead of CSS `border`. This allows smoother transitions and rounded corners without clipping.

2. **Compression at scale**: Letter-spacing progressively tightens with size. -2.4px at 48px, -0.96px at 24px, normal at 14px.

3. **Gallery emptiness**: Massive whitespace between sections. White space IS the design.

4. **Three weights only**: 400 read, 500 interact, 600 announce.

5. **Color is structural**: The UI is achromatic (grays only). Color appears only for links (blue) and workflow stages (develop/preview/ship).

## Component Examples

### Card
```html
<div style="
  background: var(--bg-primary);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-md);
  padding: var(--space-6);
">
  <h3 style="font-size: 24px; font-weight: 600; letter-spacing: -0.96px; color: var(--text-primary);">
    Card Title
  </h3>
  <p style="font-size: 16px; color: var(--text-secondary); margin-top: var(--space-2);">
    Description text
  </p>
</div>
```

### Primary Button
```html
<button style="
  background: var(--accent-primary);
  color: var(--text-inverse);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
">
  Get Started
</button>
```

### Pill Badge
```html
<span style="
  background: #ebf5ff;
  color: #0068d6;
  padding: 0px 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
">
  New
</span>
```

## Do's and Don'ts

### Do
- Use shadow-as-border everywhere (no CSS `border` on cards)
- Enable `font-feature-settings: "liga"` on all Geist text
- Use `#171717` for text, not `#000000`
- Apply negative letter-spacing on headings
- Use multi-layer shadow stacks for depth

### Don't
- Don't use weight 700 on body text
- Don't introduce warm colors (orange, yellow, green) into chrome
- Don't use heavy shadows (>0.1 opacity)
- Don't use pill radius on primary buttons (pills are for badges only)
- Don't skip the inner `#fafafa` ring in card shadows
