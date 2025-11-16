/* eslint-env node */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const shared = require('../../eslint.shared.js');

module.exports = defineConfig([
  // shared rules from repo root (split into base and typescript below)
  expoConfig,
  {
    ignores: [
      'dist/*',
      '.expo/**',
      'android/**',
      'ios/**',
      'node_modules/**',
      'eslint.config.js',
      './src/__generated__/**',
    ],
  },
  // base shared rules
  shared.base,
  // typescript-specific shared config (scoped to TS files)
  shared.typescript,
  // enable type-aware rules for this package by pointing parserOptions.project to the package tsconfig
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        // Use the TypeScript project service to auto-detect the nearest tsconfig
        projectService: true,
        // Ensure relative resolution from the mobile package directory
        tsconfigRootDir: __dirname,
        // Keep explicit project for editors/linters that still prefer it
      },
    },
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
