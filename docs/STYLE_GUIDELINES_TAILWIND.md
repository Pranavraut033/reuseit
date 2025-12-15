# Eco‑Connect — Tailwind Style Guidelines (Mobile)

This short guide focuses on the _theme, layout, and interaction flow_ for the ReUseIt mobile app using Tailwind (NativeWind). Components are already designed — use these principles to make layouts and transitions distinct and cohesive (not generic).

Goal: Make the UI feel approachable, purposeful, and unmistakably "Eco‑Connect" — trust, optimism, clarity, and action.

---

## Key tokens (quick reference)

- Colors: `bg-primary` / `text-primary` (green #2ECC71), `bg-secondary` / `text-secondary` (blue #3498DB), `bg-earth-accent` / `text-earth-accent` (orange #E67E22), `bg-canvas` (#F9F9F9), `text-forest` (#34495E)
- Radii: prefer `rounded-md` for surfaces, `rounded-full` for prominent CTAs
- Elevation: `shadow-card`, `shadow-soft`
- Spacing tokens: use `p-*/m-*` tokens in `tailwind.config.js` for consistent rhythm

---

## Layout & visual language (what to prioritize)

- Visual rhythm: establish consistent vertical spacing (rhythm > ad-hoc spacing) to make pages scannable.
- Hierarchy: use scale, weight, and color to separate headline → body → microcopy.
- Breathing room: avoid dense layouts; prefer clear white space around important content.
- Distinctive touches: use the earth-accent and rounded surfaces sparingly to create brand personality (not every element).
- Composition: prefer left-aligned content blocks with occasional asymmetry or overlap for playful emphasis.

---

## Interaction & flow (how screens should behave)

- Meaningful motion: use short, purposeful animations (120–240ms) for transitions and feedback—fade + scale or slide with subtle easing.
- Progressive disclosure: reveal details on demand (collapsible cards, micro-modals) to reduce cognitive load.
- Affordances & feedback: visual state changes (pressed, loading, success) must be quick and obvious.
- Flow-first design: design screens so user paths are clear—prioritize the next action and minimize dead-ends.

---

## Accessibility & localization

- Touch targets >= 44px (`h-12 w-12`).
- Ensure color contrast for text & status indicators; prefer `text-forest` on `bg-canvas` for body copy.
- All user-facing text must come from `i18n.ts`; design with flexible lengths in mind.

---

## How to use this guide

- Prefer applying tokens and layout patterns above creating new visual patterns.
- If you need a new token or variation, add it to `apps/mobile/tailwind.config.js` and document the intent.
- Verify changes visually using the dev `ComponentsShowcase` screen and real devices.

---

This file is intentionally concise — it exists to guide layout, flow, and interaction decisions that make the app feel unique. For implementation details, check component files in `apps/mobile/src/components/`.

Secondary (informational / not destructive)

```
<TouchableOpacity className="bg-secondary rounded-md px-3 py-2 items-center justify-center">
  <Text className="text-white font-medium">Learn More</Text>
</TouchableOpacity>
```

Outline (subtle)

```
<TouchableOpacity className="border-2 border-primary rounded-md px-3 py-2 items-center justify-center">
  <Text className="text-primary font-medium">Outline</Text>
</TouchableOpacity>
```

Disabled variant: add `opacity-50` and `pointer-events-none`.

Notes:

- The `Button` component lives in `apps/mobile/src/components/common/Button.tsx` and implements the primary/neutral/error variants with rounded tokens and `shadow-card` for primary.
- Ensure `title` props or child text are sourced from `i18n.ts`.

### Auth / Login

- Auth buttons (Google, Apple, Phone) should use `rounded-md` with `shadow-card` and semantic text colors (`text-forest`) to match the brand tone.
- Use `accessibilityLabel` and `accessibilityRole="button"` on social buttons for screen reader clarity.
- Place consent/legal text with `text-sm text-gray-600` and make policy links `text-primary underline`.

### Cards

```
<View className="bg-white rounded-lg p-md shadow-card">
  <Text className="text-forest font-semibold text-lg">Title</Text>
  <Text className="text-gray-600 mt-2">Supporting text that is concise.</Text>
</View>
```

Use `overflow-hidden` on media cards for rounded-image crops.

### Badges / Status Tags

```
<View className="bg-earth-accent rounded-full px-2 py-1">
  <Text className="text-white text-xs font-semibold">4pts</Text>
</View>
```

Use `bg-primary` for success, `bg-secondary` for info, `bg-earth-accent` for reward status.

**Implementation note:** component-level implementations live in `apps/mobile/src/components/`. This guide focuses on tokens, layout, and interaction flow — use it to make layouts feel distinctive and cohesive rather than prescribing per-component recipes.

---

## ✨ Micro-interaction Recommendations

- Use short, purposeful animations (120–240ms) for transitions and feedback (fade + scale, slide with subtle easing).
- Design feedback and state changes to be immediate and meaningful (pressed, loading, success).

---

## 💡 Conventions & Best Practices

- Use semantic utilities (e.g., `bg-primary`, `text-forest`) rather than raw hex values.
- Keep a consistent text hierarchy: Headline (16–18sp semibold), Body (14sp), Small (12sp).
- All user-facing text must come from `i18n.ts` and accommodate longer translations.

---

## ✅ Quick Start

1. Apply tokens and layout patterns from this guide.
2. Verify visually using the `ComponentsShowcase` dev screen and on devices.
3. If a new token is required, add it to `apps/mobile/tailwind.config.js` and document it briefly in this file.

---

_Keep this file concise — it exists to guide layout and interaction decisions that give the app its unique feel._
