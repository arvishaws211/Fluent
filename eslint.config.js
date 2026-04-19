// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
// @ts-check
/**
 * Flat ESLint config for the Fluent web client.
 *
 * - `typescript-eslint` provides type-aware linting for all .ts sources.
 * - `angular-eslint` supplies component/directive selector + inline-template
 *   processing rules tuned for Angular 21 with the new control-flow syntax.
 * - `eslint-config-prettier` is applied last to disable purely stylistic
 *   rules that would otherwise fight Prettier.
 */
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'warn',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'functions/lib/**',
      'functions/node_modules/**',
      '.angular/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      '*.config.js',
      'vitest.config.ts',
      'playwright.config.ts',
      'e2e/**',
      'src/environments/environment.local.ts',
      'src/environments/environment.prod.ts',
      'src/environments/environment.example.ts',
    ],
  },
);
