# Tailwind / NativeWind Usage — Mobile

This file documents quick usage and conventions for the mobile app Tailwind (NativeWind) setup.

Where to edit tokens

- Update design tokens and semantic colors in `apps/mobile/tailwind.config.js`.
- After changing tokens, restart Metro / Expo dev server.

Conventions

- Use semantic classes (e.g., `bg-primary`, `text-forest`) not hex-coded utilities.
- Design and layout should follow the tokens and layout guidance in `docs/STYLE_GUIDELINES_TAILWIND.md` (components are pre-designed).
- Keep `i18n.ts` for any user-facing strings.

Examples

- Primary button: `className="bg-primary rounded-full px-4 py-3 items-center justify-center shadow-card"`
- Card: `className="bg-white rounded-lg p-md shadow-card"`
- Badge: `className="px-2 py-1 rounded-full bg-earth-accent"`

Testing & linting

- After edits, run the app and visually confirm components. Unit tests can be added per component using the repository testing patterns.

If you have an addition to tokens, please open a PR and add a short note to `docs/STYLE_GUIDELINES_TAILWIND.md` documenting the new token.
