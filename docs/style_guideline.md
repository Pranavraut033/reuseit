---
title: Style Guideline
---

# ReUseIt — Style Guidelines (Primary Source of Truth)

Purpose: this file is the authoritative design reference for ReUseIt. It defines the look & feel, visual principles, component behavior, and UX philosophy that all UI code and design artifacts must follow.

## 1. Look & Feel ✅

- Modern, clean, and human-centered: prioritize clarity and usefulness over decoration.
- Calm, eco‑inspired language: visual language should feel grounded and optimistic—think natural greens, soft earth accents, and readable neutrals.
- Helpful and community-driven tone: microcopy and interactions should encourage, teach, and celebrate sustainable actions.
- Minimal clutter: high readability, clear purpose, and fast paths to the most important actions (scan, find, post, join).

## 2. Visual Design Principles 🎨

- Consistent spacing and layout rhythm: establish vertical rhythm and reuse tokenized spacing (see `apps/mobile/tailwind.config.js`).
- Strong visual hierarchy: maps, posts, events, and CTAs must be clearly prioritized using scale, weight, and color.
- Friendly, professional typography: readable sizes, generous leading, and clear contrast across devices.
- Color for meaning, not noise: use the palette to reinforce sustainability and trust—reserve vivid accents for rewards and confirmations.
- No generic-looking components: components must feel custom-made for ReUseIt (avoid stock Bootstrap/Material defaults or other templated aesthetics).

## 3. Component Behavior & Interaction 🔧

- Exploration-first components: cards, lists, feeds, and map markers should encourage discovery with progressive disclosure.
- Clear affordances: primary actions such as Recycle, Share, Join, and Give should be unmistakable and accessible.
- Purposeful motion: use short, meaningful micro‑interactions (120–240ms); transitions should guide attention without distracting.
- Immediate feedback: classification results, reward grants, and success states must provide clear visual and textual confirmation.

## 4. UX Philosophy & Goals 🌱

- Minimize cognitive load: reduce steps, make defaults sensible (e.g., guess nearest recycling category), and surface clear next actions.
- Make sustainability feel easy and rewarding: gamify thoughtfully (points, badges), surface social proof (who else participated), and make progress visible.
- Support both fast and deep paths: scanning or quick posts must be fast; event creation, impact reporting, and profile exploration can be deeper, richer experiences.
- Accessibility & responsiveness: accessibility is mandatory—WCAG-friendly contrast, tappable targets >= 44px, semantic labels, and proper localization support.

## 5. Do / Don't (Practical Guidance) ✅ / ❌

Do:
- Use semantic tokens (`bg-primary`, `text-forest`) from `tailwind.config.js`.
- Source all user-facing strings from `i18n.ts`.
- Use components in `apps/mobile/src/components/` and extend them consistently.
- Provide clear success/failure states with both visuals and microcopy.

Don't:
- Use default framework skins (unmodified Bootstrap, Material defaults, etc.).
- Ship components that look generic or templated — visual distinctiveness matters.
- Hardcode strings or colors—always use tokens and i18n.

## 6. Examples (How principles apply)

- Map: prioritize readable markers and filters, cluster gracefully, and use contrast to surface proximity and category.
- Waste classifier: show confidence, disposal instructions, and “nearest point” CTA in a single compact card. Use color or an icon to show category instantly.
- Giveaway post: photo-first card, clear pickup status, and a prominent `Claim` action with confirmation microflow.
- Events: date/time prominence, RSVP affordance, and visual badges for community impact (e.g., `50kg diverted`).

## 7. Enforcement & Workflow 🔒

- This file is the authoritative design reference for all UI work.
- All generated components must comply with these guidelines. Designers and engineers must review new components for alignment before merging.
- If a new token or pattern is required, update `apps/mobile/tailwind.config.js` and document the rationale in this file or `docs/STYLE_GUIDELINES_TAILWIND.md`.

## 8. Accessibility & Localization 🧭

- Ensure color contrast meets WCAG AA for body text and large text as a minimum.
- Provide accessible roles, labels, and properties for interactive elements.
- Design with flexible copy lengths and test translations using `i18n.ts` keys.

## 9. Quick Checklist for PR Review ✅

1. Does the UI follow spacing and token usage (no ad-hoc margins)?
2. Are all strings in `i18n.ts` and translations updated if needed?
3. Are touch targets and contrast accessible?
4. Does the component feel custom (not generic)? If not, improve visual distinctiveness.

---

For implementation guidance, see `docs/STYLE_GUIDELINES_TAILWIND.md` (mobile token and layout details) and `apps/mobile/src/components/` for existing patterns.

If you have questions about applying these guidelines to a new component, open a short design review PR and tag the design owner.
