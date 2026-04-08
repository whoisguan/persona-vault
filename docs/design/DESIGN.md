# MIXIA Builder Design System

> AI-readable design specification for MIXIA Builder.
> Default theme: **Vercel** (monochrome, precision-engineered minimalism).
> Users can switch to alternative themes: Linear, Stripe, Notion, Supabase.

## 1. Design Philosophy

MIXIA Builder is an AI-powered project delivery platform for PMs. The UI must:
- Feel **professional and trustworthy** — PMs are handing over their product vision
- Stay **out of the way** — content and AI output are the focus, not chrome
- Support **long sessions** — low eye strain, clear hierarchy, generous whitespace
- Be **information-dense when needed** — DAG maps, kanban boards, acceptance checklists

## 2. Theme Architecture

Themes are implemented via CSS custom properties on `:root`. Switching themes swaps the variable set. All components reference variables, never hardcoded colors.

```
:root[data-theme="vercel"]   { /* default */ }
:root[data-theme="linear"]   { /* dark developer */ }
:root[data-theme="stripe"]   { /* premium fintech */ }
:root[data-theme="notion"]   { /* warm content-first */ }
:root[data-theme="supabase"] { /* dark open-source */ }
```

### CSS Variable Contract

Every theme MUST define these variables:

```css
/* Surfaces */
--bg-primary          /* page background */
--bg-secondary        /* card/panel background */
--bg-tertiary         /* elevated surface / hover */
--bg-inverse          /* dark surface for contrast sections */

/* Text */
--text-primary        /* headings, primary content */
--text-secondary      /* body text, descriptions */
--text-tertiary       /* muted labels, metadata */
--text-inverse        /* text on inverse backgrounds */

/* Brand & Accent */
--accent-primary      /* CTA buttons, links, active states */
--accent-hover        /* hover state for accent */
--accent-subtle       /* tinted backgrounds for badges */

/* Borders */
--border-primary      /* card borders, dividers */
--border-secondary    /* subtle dividers */
--border-focus        /* focus ring color */

/* Shadows */
--shadow-card         /* standard card elevation */
--shadow-elevated     /* dropdowns, modals */

/* Radius */
--radius-sm           /* buttons, inputs */
--radius-md           /* cards */
--radius-lg           /* featured panels */
--radius-pill         /* badges, pills */

/* Typography */
--font-sans           /* primary font family */
--font-mono           /* code / technical labels */
```

## 3. Default Theme: Vercel

See [themes/vercel.md](themes/vercel.md) for complete token definitions.

### Quick Reference

| Token | Value |
|-------|-------|
| `--bg-primary` | `#ffffff` |
| `--bg-secondary` | `#fafafa` |
| `--text-primary` | `#171717` |
| `--text-secondary` | `#666666` |
| `--accent-primary` | `#171717` (dark CTA) |
| `--border-primary` | `rgba(0,0,0,0.08) 0px 0px 0px 1px` (shadow-as-border) |
| `--font-sans` | `Geist, Inter, -apple-system, sans-serif` |
| `--font-mono` | `Geist Mono, ui-monospace, monospace` |
| `--radius-sm` | `6px` |
| `--radius-md` | `8px` |

### Typography Scale (Vercel default)

| Role | Size | Weight | Letter Spacing |
|------|------|--------|----------------|
| Display | 48px | 600 | -2.4px |
| H1 | 32px | 600 | -1.28px |
| H2 | 24px | 600 | -0.96px |
| Body Large | 20px | 400 | normal |
| Body | 16px | 400 | normal |
| Caption | 14px | 500 | normal |
| Mono Label | 12px | 500 | normal, uppercase |

### Weight System
- **400** — body text, reading
- **500** — UI elements, interactive
- **600** — headings, emphasis
- No bold (700) in primary UI

## 4. Component Patterns (Theme-Agnostic)

These patterns apply across all themes. Colors/radius come from CSS variables.

### Buttons

| Variant | Background | Text | Border | Radius |
|---------|-----------|------|--------|--------|
| Primary | `var(--accent-primary)` | `var(--text-inverse)` | none | `var(--radius-sm)` |
| Secondary | `var(--bg-primary)` | `var(--text-primary)` | `var(--border-primary)` | `var(--radius-sm)` |
| Ghost | transparent | `var(--text-secondary)` | none | `var(--radius-sm)` |
| Pill Badge | `var(--accent-subtle)` | `var(--accent-primary)` | none | `var(--radius-pill)` |

### Cards
- Background: `var(--bg-secondary)`
- Border: `var(--border-primary)`
- Radius: `var(--radius-md)`
- Shadow: `var(--shadow-card)`
- Hover: shadow intensifies subtly

### Navigation (TopBar)
- Background: `var(--bg-primary)` with sticky positioning
- Logo left, nav links center, user actions right
- Font: 14px weight 500, `var(--text-primary)`
- Bottom border: `var(--border-secondary)`

### Three-Panel Workbench Layout
- Left panel: Conversation (min 320px)
- Center panel: Feature Map / Kanban / Acceptance (flex grow)
- Right panel: Progress (min 280px)
- Panels separated by draggable dividers using `var(--border-secondary)`
- Each panel: `var(--bg-primary)` background

### Inputs & Forms
- Background: `var(--bg-primary)`
- Border: `var(--border-primary)`
- Radius: `var(--radius-sm)`
- Focus: `2px solid var(--border-focus)`
- Placeholder: `var(--text-tertiary)`

## 5. Spacing System

Base unit: **8px**

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Tight gaps, inline spacing |
| `--space-2` | 8px | Default element gap |
| `--space-3` | 12px | Comfortable padding |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-6` | 24px | Panel padding |
| `--space-8` | 32px | Section spacing |
| `--space-12` | 48px | Major section spacing |
| `--space-16` | 64px | Hero / page-level spacing |

## 6. Responsive Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | <768px | Single panel, tab navigation |
| Tablet | 768-1024px | Two panels visible |
| Desktop | 1024-1440px | Full three-panel workbench |
| Wide | >1440px | Three panels with generous margins |

On mobile, the three-panel workbench collapses to tab-based navigation:
Conversation | Map | Progress — swipe or tap to switch.

## 7. Available Themes

| Theme | Mood | Best For | File |
|-------|------|----------|------|
| **Vercel** (default) | Monochrome precision | Clean, professional | [vercel.md](themes/vercel.md) |
| **Linear** | Dark developer tool | Late-night sessions | [linear.md](themes/linear.md) |
| **Stripe** | Premium fintech | Business credibility | [stripe.md](themes/stripe.md) |
| **Notion** | Warm & approachable | Content-heavy workflows | [notion.md](themes/notion.md) |
| **Supabase** | Dark open-source | Developer identity | [supabase.md](themes/supabase.md) |

See [theme-switcher.md](theme-switcher.md) for the switching mechanism.

## 8. Agent Prompt Guide

When building MIXIA Builder components, always:

1. Reference CSS variables, never hardcoded colors
2. Use the typography scale from Section 3 (adjust per theme)
3. Follow the component patterns from Section 4
4. Apply spacing from Section 5
5. Test in at least the default theme (Vercel) + one dark theme (Linear)

### Example Prompts

- "Create the TopBar component: sticky, `var(--bg-primary)` background, MIXIA logo left, nav links (Projects, Templates, Settings) at 14px weight 500, user avatar right. Bottom border `var(--border-secondary)`. Height 48px."
- "Build a ConversationPanel message bubble: user messages right-aligned with `var(--accent-subtle)` background, AI messages left-aligned with `var(--bg-secondary)` background. Both use `var(--radius-md)` corners. Body text 16px weight 400."
- "Design a FeatureMapNode for ReactFlow: `var(--bg-secondary)` fill, `var(--border-primary)` stroke, `var(--radius-sm)` corners. Title 14px weight 600, status badge as pill with `var(--accent-subtle)` background."
