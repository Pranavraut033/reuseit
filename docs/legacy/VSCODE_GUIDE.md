# VS Code Integration Guide

## Quick Setup

1. **Install recommended extensions** (VS Code will prompt you automatically):
   - ESLint (`dbaeumer.vscode-eslint`)
   - Prettier (`esbenp.prettier-vscode`)
   - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

2. **Reload VS Code** after installing extensions:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Developer: Reload Window"
   - Press Enter

## Features

### ✨ Auto-formatting

- **Format on Save**: Files automatically format when you save (Cmd+S / Ctrl+S)
- **Manual Format**: Press `Shift+Option+F` (Mac) or `Shift+Alt+F` (Windows/Linux)

### 🔍 Auto-linting

- **ESLint on Save**: Auto-fixes ESLint errors when you save
- **Inline Warnings**: See ESLint warnings/errors directly in your code
- **Problems Panel**: View → Problems (Cmd+Shift+M) to see all issues

## Keyboard Shortcuts

| Action          | Mac              | Windows/Linux  |
| --------------- | ---------------- | -------------- |
| Format Document | `Shift+Option+F` | `Shift+Alt+F`  |
| Save & Auto-fix | `Cmd+S`          | `Ctrl+S`       |
| Show Problems   | `Cmd+Shift+M`    | `Ctrl+Shift+M` |
| Quick Fix       | `Cmd+.`          | `Ctrl+.`       |

## Common Tasks

### Format a single file

1. Open the file
2. Press `Shift+Option+F` (Mac) or `Shift+Alt+F` (Windows/Linux)

### Fix ESLint errors in a file

1. Open the file
2. Press `Cmd+.` (Mac) or `Ctrl+.` (Windows/Linux) on any error
3. Select "Fix all auto-fixable problems"

### Format all files in workspace

```bash
pnpm format:code
```

### Check formatting without changes

```bash
pnpm format:check
```

## Troubleshooting

### Prettier not formatting

1. Check the status bar (bottom-right) - should show "Prettier"
2. If it shows a different formatter, right-click in the file → "Format Document With..." → "Configure Default Formatter" → Select "Prettier"
3. Reload VS Code window

### ESLint not showing errors

1. Open Output panel: View → Output
2. Select "ESLint" from the dropdown
3. Check for errors in the output
4. Try reloading the window: `Cmd+Shift+P` → "Developer: Reload Window"

### Format on Save not working

1. Open VS Code Settings: `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
2. Search for "format on save"
3. Ensure "Editor: Format On Save" is checked
4. Check workspace settings in `.vscode/settings.json`

### Different formatting in VS Code vs CLI

1. Ensure you're using the workspace config (not global)
2. Check that `.prettierrc.json` exists in the root
3. Run `pnpm prettier --version` to verify version
4. Reload VS Code window

## VS Code Settings

The workspace is pre-configured with:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### Customize Settings

#### Per-workspace

Edit `.vscode/settings.json` in the workspace root.

#### Per-user

1. Open Settings: `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
2. Click "User" tab
3. Search and modify settings

## File-specific Formatting

### Disable Prettier for a file

Add to the top of the file:

```javascript
/* prettier-ignore-start */
// your code
/* prettier-ignore-end */
```

Or for a single statement:

```javascript
// prettier-ignore
const matrix = [1,2,3,4,5];
```

### Disable ESLint for a file

Add to the top of the file:

```javascript
/* eslint-disable */
```

Or for specific rules:

```javascript
/* eslint-disable @typescript-eslint/no-unused-vars */
```

## Terminal Commands

If VS Code integration isn't working, you can use terminal commands:

```bash
# Format the current file
pnpm prettier --write path/to/file.ts

# Lint the current file
pnpm eslint path/to/file.ts --fix

# Format all source code
pnpm format:code

# Lint all packages
pnpm lint

# Fix all linting issues
pnpm lint:fix
```

## Multi-root Workspaces

This monorepo has workspace-specific configs:

- `apps/mobile/` - Expo + Tailwind CSS
- `apps/backend/` - NestJS + Prettier

VS Code automatically detects and uses the correct config for each file.

## Resources

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [TypeScript ESLint](https://typescript-eslint.io/rules/)
- [VS Code ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [VS Code Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
