# ESLint & Prettier Configuration

This monorepo uses ESLint and Prettier for code quality and formatting.

## Structure

- **Root level**: Shared Prettier and ESLint configurations
- **apps/backend**: NestJS backend with TypeScript ESLint config
- **apps/mobile**: Expo mobile app with Tailwind CSS support

## Configuration Files

### Prettier
- `.prettierrc.json` - Root Prettier configuration
- `.prettierignore` - Files/folders to ignore
- `apps/mobile/prettier.config.js` - Mobile-specific overrides (Tailwind plugin)
- `apps/backend/.prettierrc` - Backend-specific overrides

### ESLint
- `eslint.shared.js` - Shared ESLint rules for the monorepo
- `eslint.config.cjs` - Root ESLint configuration
- `apps/mobile/eslint.config.js` - Mobile ESLint config (Expo rules)
- `apps/backend/eslint.config.mjs` - Backend ESLint config (NestJS rules)

### VS Code
- `.vscode/settings.json` - Editor settings for auto-format and ESLint
- `.vscode/extensions.json` - Recommended extensions

## VS Code Integration

### Required Extensions
1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier** (`esbenp.prettier-vscode`)
3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - for mobile

Install these by opening the Extensions panel and searching, or by accepting the workspace recommendations.

### Auto-formatting
Files are automatically formatted on save with Prettier and linted with ESLint. The configuration:
- Formats on save
- Fixes ESLint errors on save
- Uses Prettier as the default formatter for JS/TS/JSON files

## NPM Scripts

### Root level
```bash
pnpm lint              # Lint all packages
pnpm lint:fix          # Fix ESLint errors across the repo
pnpm format            # Format all files with Prettier
pnpm format:check      # Check formatting without fixing
```

### Mobile app
```bash
pnpm --filter mobile lint     # Lint mobile app
pnpm --filter mobile format   # Format mobile app
```

### Backend
```bash
pnpm --filter backend lint    # Lint backend
pnpm --filter backend format  # Format backend
```

## Manual Usage

### Format a specific file
```bash
prettier --write path/to/file.ts
```

### Lint a specific file
```bash
eslint path/to/file.ts --fix
```

### Check if files are formatted
```bash
prettier --check "**/*.{js,jsx,ts,tsx,json}"
```

## Troubleshooting

### ESLint not working in VS Code
1. Reload VS Code window: `Cmd+Shift+P` → "Developer: Reload Window"
2. Check the Output panel: View → Output → Select "ESLint" from dropdown
3. Ensure ESLint extension is installed and enabled

### Prettier not formatting
1. Check that Prettier is set as the default formatter
2. Verify `editor.formatOnSave` is `true` in settings
3. Check the Output panel: View → Output → Select "Prettier" from dropdown

### Conflicting rules
If you see ESLint and Prettier conflicts:
1. `eslint-config-prettier` is already installed to disable conflicting ESLint rules
2. Prettier should always win for formatting concerns
3. ESLint focuses on code quality (unused vars, etc.)

## Prettier Configuration

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Mobile app adds Tailwind CSS class sorting via `prettier-plugin-tailwindcss`.
