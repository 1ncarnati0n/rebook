import js from '@eslint/js'
import globals from 'globals'
import svelteConfig from './svelte.config.js'
import svelte from 'eslint-plugin-svelte'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig(
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,ts,svelte}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  svelte.configs.recommended,
  {
    files: ['**/*.svelte', '**/*.svelte.{js,ts}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
        svelteConfig,
      },
    },
  },
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: globals.webextensions,
    },
  },
)
