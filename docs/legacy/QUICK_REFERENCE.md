# 🚀 Quick Reference

## Install Extensions (One-time setup)

VS Code will prompt you to install recommended extensions. Click "Install All".

Or manually install:

1. Press `Cmd+Shift+X` (Extensions)
2. Search and install:
   - ESLint
   - Prettier - Code formatter
   - Tailwind CSS IntelliSense

## Daily Usage

### Auto-format & Auto-lint

Just save your file: **`Cmd+S`** (Mac) or **`Ctrl+S`** (Windows/Linux)

Everything happens automatically! ✨

### Manual Format

**`Shift+Option+F`** (Mac) or **`Shift+Alt+F`** (Windows/Linux)

### View All Problems

**`Cmd+Shift+M`** (Mac) or **`Ctrl+Shift+M`** (Windows/Linux)

### Quick Fix

Position cursor on error → **`Cmd+.`** (Mac) or **`Ctrl+.`** (Windows/Linux)

## Terminal Commands

```bash
# Format all source code
pnpm format:code

# Check formatting
pnpm format:check

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Troubleshooting

**Not working?** Try reloading VS Code:

1. Press **`Cmd+Shift+P`** (Mac) or **`Ctrl+Shift+P`** (Windows/Linux)
2. Type "reload"
3. Select "Developer: Reload Window"

**Still not working?** Check the Output panel:

- View → Output
- Select "ESLint" or "Prettier" from dropdown

## Configuration Files

- `.prettierrc.json` - Prettier rules
- `eslint.config.cjs` - ESLint rules (root)
- `.vscode/settings.json` - VS Code settings

**Don't edit these unless you know what you're doing!**

## More Help

See `VSCODE_GUIDE.md` for detailed instructions.
