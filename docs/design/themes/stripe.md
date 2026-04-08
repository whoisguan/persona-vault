# Theme: Stripe

> Premium fintech. Deep navy headings. Blue-tinted shadows. Weight 300 authority.
> Source: [awesome-design-md/stripe](https://github.com/VoltAgent/awesome-design-md)

## CSS Variables

```css
:root[data-theme="stripe"] {
  /* Surfaces */
  --bg-primary: #ffffff;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f6f9fc;
  --bg-inverse: #1c1e54;

  /* Text */
  --text-primary: #061b31;
  --text-secondary: #64748d;
  --text-tertiary: #273951;
  --text-inverse: #ffffff;

  /* Brand & Accent */
  --accent-primary: #533afd;
  --accent-hover: #4434d4;
  --accent-subtle: rgba(83, 58, 253, 0.05);
  --accent-link: #533afd;

  /* Decorative (gradient use only) */
  --deco-ruby: #ea2261;
  --deco-magenta: #f96bee;

  /* Borders */
  --border-primary: #e5edf5;
  --border-secondary: #e5edf5;
  --border-focus: #533afd;

  /* Shadows — blue-tinted, multi-layer */
  --shadow-border: none;
  --shadow-card: rgba(23, 23, 23, 0.08) 0px 15px 35px 0px;
  --shadow-elevated: rgba(50, 50, 93, 0.25) 0px 30px 45px -30px,
                     rgba(0, 0, 0, 0.1) 0px 18px 36px -18px;

  /* Radius — conservative */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: 'Sohne', Inter, -apple-system, system-ui, sans-serif;
  --font-mono: 'Source Code Pro', SFMono-Regular, monospace;

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

Font: **sohne-var** with `font-feature-settings: "ss01"`. Fallback to Inter.
Weights: 300 (signature — headlines AND body), 400 (buttons/UI). No 600+.

| Role | Size | Weight | Line Height | Letter Spacing | Features |
|------|------|--------|-------------|----------------|----------|
| Display | 48px | 300 | 1.15 | -0.96px | ss01 |
| H1 | 32px | 300 | 1.10 | -0.64px | ss01 |
| H2 | 24px | 300 | 1.12 | -0.26px | ss01 |
| Body Large | 18px | 300 | 1.40 | normal | ss01 |
| Body | 16px | 300 | 1.40 | normal | ss01 |
| Button | 16px | 400 | 1.00 | normal | ss01 |
| Caption | 13px | 400 | normal | normal | ss01 |
| Numbers | 12px | 300 | 1.33 | -0.36px | tnum |
| Code | 12px (Mono) | 500 | 2.00 | normal | — |

## Key Principles

1. **Light weight as luxury**: Weight 300 for headlines is Stripe's anti-convention signature. Confidence doesn't need boldness.

2. **Blue-tinted shadows**: `rgba(50,50,93,0.25)` creates brand-colored depth. Shadows feel atmospheric.

3. **Deep navy, not black**: `#061b31` for headings. The warmth is subtle but essential.

4. **Conservative radius**: 4-8px range. No pill shapes on buttons or cards.

5. **Two OpenType modes**: `"ss01"` for display/body, `"tnum"` for financial data tables.

6. **Dark brand sections**: `#1c1e54` backgrounds for immersive moments.

## Do's and Don'ts

### Do
- Use `font-feature-settings: "ss01"` on all body text
- Use weight 300 for headlines — lightness is the brand
- Apply blue-tinted shadows for elevation
- Use `#061b31` deep navy for headings
- Use `"tnum"` for tabular data

### Don't
- Don't use weight 600+ for headlines
- Don't use large border-radius (12px+) on cards
- Don't use neutral gray shadows
- Don't use pure black for headings
- Don't use ruby/magenta for buttons (decorative gradients only)
