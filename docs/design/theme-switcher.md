# Theme Switcher Mechanism

## Overview

Users can choose their preferred visual theme from Settings. The selection persists in `localStorage` and applies instantly without page reload.

## Implementation

### 1. Theme Provider (extend existing ThemeProvider)

```tsx
// src/components/providers/ThemeProvider.tsx
// Extend the existing next-themes provider to handle design themes

const DESIGN_THEMES = ['vercel', 'linear', 'stripe', 'notion', 'supabase'] as const
type DesignTheme = typeof DESIGN_THEMES[number]

// next-themes handles light/dark mode
// data-theme attribute handles the design theme (colors, typography, spacing)
// These are independent: Vercel is light-only, Linear/Supabase are dark-only,
// Stripe/Notion are light-only. Selecting a theme auto-sets the color mode.

const THEME_MODE_MAP: Record<DesignTheme, 'light' | 'dark'> = {
  vercel: 'light',
  linear: 'dark',
  stripe: 'light',
  notion: 'light',
  supabase: 'dark',
}
```

### 2. Theme Selector Component

```tsx
// src/components/settings/ThemeSelector.tsx

const themes = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Clean monochrome precision',
    preview: { bg: '#ffffff', accent: '#171717', text: '#171717' },
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Dark developer workspace',
    preview: { bg: '#08090a', accent: '#5e6ad2', text: '#f7f8f8' },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Premium business feel',
    preview: { bg: '#ffffff', accent: '#533afd', text: '#061b31' },
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Warm & approachable',
    preview: { bg: '#ffffff', accent: '#0075de', text: '#000000' },
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Dark open-source identity',
    preview: { bg: '#171717', accent: '#3ecf8e', text: '#fafafa' },
  },
]

// Render as a grid of theme cards, each showing:
// - Color preview swatch (bg + accent + text sample)
// - Theme name
// - One-line description
// - "Active" badge on selected theme
```

### 3. CSS Loading Strategy

All theme variables are defined in a single `themes.css` file, scoped by `data-theme` attribute:

```css
/* src/styles/themes.css */

:root, :root[data-theme="vercel"] {
  /* Vercel variables (default) */
}

:root[data-theme="linear"] {
  /* Linear variables */
}

:root[data-theme="stripe"] {
  /* Stripe variables */
}

:root[data-theme="notion"] {
  /* Notion variables */
}

:root[data-theme="supabase"] {
  /* Supabase variables */
}
```

All variables are loaded upfront (small payload — ~2KB total). No lazy loading needed.

### 4. Switching Logic

```ts
function setDesignTheme(theme: DesignTheme) {
  // 1. Update data-theme attribute
  document.documentElement.setAttribute('data-theme', theme)

  // 2. Auto-set color mode based on theme
  const mode = THEME_MODE_MAP[theme]
  document.documentElement.classList.toggle('dark', mode === 'dark')

  // 3. Persist
  localStorage.setItem('mixia-design-theme', theme)
}
```

### 5. Font Loading

Each theme may use different fonts. Load all theme fonts in `layout.tsx` with `display: swap`:

```tsx
// Geist (Vercel) — via next/font or @vercel/font
// Inter Variable (Linear, Notion fallback) — via next/font/google
// Circular (Supabase) — if licensed, otherwise fallback to Inter
// Sohne (Stripe) — if licensed, otherwise fallback to Inter

// Practical approach: ship Geist + Inter. 
// Themes requiring proprietary fonts (Circular, Sohne) gracefully fall back to Inter.
```

### 6. Where in the UI

Settings page → Appearance section → Theme grid.

The selector should also be accessible from the TopBar via a palette icon for quick switching.

## Migration Path

1. **Phase 1** (now): Create DESIGN.md + theme token files (documentation)
2. **Phase 2** (project init): Create `themes.css` with all variables from these docs
3. **Phase 3** (component build): All components reference `var(--*)`, never hardcoded values
4. **Phase 4** (settings UI): Build ThemeSelector component and persistence
