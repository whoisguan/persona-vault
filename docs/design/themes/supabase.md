# Theme: Supabase

> Dark open-source. Emerald green accent. Border-defined depth. Terminal-born elegance.
> Source: [awesome-design-md/supabase](https://github.com/VoltAgent/awesome-design-md)

## CSS Variables

```css
:root[data-theme="supabase"] {
  /* Surfaces */
  --bg-primary: #171717;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #222222;
  --bg-inverse: #fafafa;

  /* Text */
  --text-primary: #fafafa;
  --text-secondary: #b4b4b4;
  --text-tertiary: #898989;
  --text-inverse: #171717;

  /* Brand & Accent */
  --accent-primary: #3ecf8e;           /* Supabase green */
  --accent-hover: #4ade80;
  --accent-subtle: rgba(62, 207, 142, 0.1);
  --accent-link: #00c573;

  /* Borders — hierarchy through gray steps */
  --border-primary: #2e2e2e;
  --border-secondary: #242424;
  --border-focus: rgba(62, 207, 142, 0.3);

  /* Shadows — almost none, depth via borders */
  --shadow-border: none;
  --shadow-card: none;
  --shadow-elevated: rgba(0, 0, 0, 0.1) 0px 4px 12px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: 'Circular', Inter, Helvetica Neue, Helvetica, Arial, sans-serif;
  --font-mono: 'Source Code Pro', ui-monospace, Menlo, monospace;

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

Font: **Circular** (geometric sans-serif, rounded terminals). Fallback to Inter.
Weights: 400 (everything), 500 (buttons/nav only). No bold.

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display | 48px | 400 | 1.00 | normal |
| H1 | 36px | 400 | 1.25 | normal |
| H2 | 24px | 400 | 1.33 | -0.16px |
| Body | 16px | 400 | 1.50 | normal |
| Nav / Button | 14px | 500 | 1.14 | normal |
| Caption | 14px | 400 | 1.43 | normal |
| Small | 12px | 400 | 1.33 | normal |
| Code Label | 12px (Mono) | 400 | 1.33 | 1.2px, uppercase |

## Key Principles

1. **No shadows**: Depth comes from border color hierarchy (`#242424` → `#2e2e2e` → `#363636`).

2. **Weight restraint**: Almost everything is 400. Hierarchy through size, not weight.

3. **Hero at 1.00 line-height**: Zero-leading display text — dense, terminal-like.

4. **Green as identity marker**: `#3ecf8e` for brand elements only, never decorative fills.

5. **Pill for primary CTAs**: 9999px radius for main actions, 6px for secondary.

6. **Monospace as ritual**: Source Code Pro uppercase with 1.2px tracking for technical labels.

## Do's and Don'ts

### Do
- Build depth through border color differences
- Use weight 400 for nearly everything
- Set hero line-height to 1.00
- Use green sparingly (links, logo, accent borders)
- Use pill (9999px) for primary CTAs

### Don't
- Don't add box-shadows on dark backgrounds
- Don't use bold (700) text
- Don't apply green to large surfaces
- Don't lighten backgrounds above `#171717`
- Don't use border-radius between 16px and 9999px
