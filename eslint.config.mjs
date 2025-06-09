import js from '@eslint/js';
import json from '@eslint/json';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['lib/', 'node_modules/', 'package-lock.json']),

  { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },

  // custom
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': ['off'],
      '@typescript-eslint/no-explicit-any': ['off'],
    },
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.mjs'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
    },
  },
]);
