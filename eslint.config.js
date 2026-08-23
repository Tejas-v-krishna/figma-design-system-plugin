import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * Flat config for a TypeScript Figma plugin.
 *
 * The plugin is two separate runtimes that share ./src/shared, and they have
 * disjoint globals: src/plugin runs in Figma's sandbox where `figma` exists and
 * there is no DOM, and src/ui runs in an iframe where the DOM exists and `figma`
 * does not. Declaring those per-directory means a `document` reference that
 * strayed into the sandbox is a lint error rather than a runtime crash.
 *
 * Rule selection is deliberately narrow. The full recommendedTypeChecked set
 * fires several hundred no-unsafe-* diagnostics on this codebase's `any` usage,
 * which buries the handful of rules that catch real defects. The type-aware
 * rules enabled below are the ones that find actual bugs in plugin code:
 * unawaited Figma API calls, promises passed where a void callback is expected,
 * and conditions that can never be false.
 */
export default tseslint.config(
  {
    // scripts/__snapshots__ holds generated exporter output kept for diffing,
    // including Tailwind configs that are CommonJS by design. Linting a fixture
    // tells you about the exporter's output format, which is the thing the
    // snapshot exists to record, not a defect to fix.
    ignores: ['dist/**', 'node_modules/**', '*.config.ts', '*.config.js', 'scripts/__snapshots__/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---- Type-aware rules, src + dev only (both are in tsconfig.json's include)
  {
    files: ['src/**/*.{ts,tsx}', 'dev/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A dropped await on a Figma API call is the single most common bug class
      // in plugin code: the sandbox tears down at the end of the run and the
      // pending work is lost with no error anywhere.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'warn',
      // Finds guards that can never fire — usually a sign the type says one
      // thing and the author believed another.
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // ---- Plugin sandbox: `figma` global, no DOM
  {
    files: ['src/plugin/**/*.ts'],
    languageOptions: {
      globals: {
        figma: 'readonly',
        __html__: 'readonly',
        console: 'readonly',
      },
    },
  },

  // ---- UI iframe: DOM + React, no `figma`
  {
    files: ['src/ui/**/*.{ts,tsx}', 'dev/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // ---- Shared: must stay runtime-agnostic, so neither set of globals applies
  {
    files: ['src/shared/**/*.ts'],
    languageOptions: {
      globals: {},
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ---- Validation scripts: stdout is the product
  //
  // no-console exists because neither of the plugin's runtimes has a console a
  // user will ever look at — a console.log in src/ is a debug statement someone
  // forgot to delete. These files are Node CLIs run by `npm run check:*`, where
  // printing the results is the entire point, so the rule is off here rather
  // than disabled line by line at every assertion.
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  }
);
