// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import shared from '../../eslint.shared.js';
// cast to any to satisfy the tseslint.config TypeScript typing
const sharedConfig = /** @type {any} */ (shared);

export default tseslint.config(
  {
    // Ignore build & tool config JS files so type-aware parsing doesn't complain
    ignores: ['eslint.config.mjs', 'prettier.config.js', '**/*.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  sharedConfig.base,
  sharedConfig.typescript,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.url.replace('file://', '').replace('/eslint.config.mjs', ''),
      },
    },
  }
  // rules are provided via the shared config (eslint.shared.json)
);
