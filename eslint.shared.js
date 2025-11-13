/* Shared ESLint config that registers @typescript-eslint plugin and parser.
   Exported as CommonJS so both CJS and ESM configs can require/import it.
*/
// Export two pieces: a base (non-TypeScript-specific) config and a TypeScript-scoped config
module.exports = {
  base: {
    rules: {
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
  typescript: {
    // scope these rules to TS files only
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
};

