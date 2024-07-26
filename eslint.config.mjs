import { fixupPluginRules } from '@eslint/compat';
import eslint from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginImport from 'eslint-plugin-import';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import {
  config as tseslintConfig,
  configs as tseslintConfigs,
  parser as tseslintparser,
  plugin as tseslintPlugin,
} from 'typescript-eslint';

export default tseslintConfig(
  {
    ignores: ["**/node_modules"]
  },
  eslint.configs.recommended,
  ...tseslintConfigs.recommended,
  {
    languageOptions: {
      parser: tseslintparser,
      parserOptions: {
        ecmaVersion: 'latest',
      },
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node,
      },
    },
  },
  {
    files: [
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.jsx',
      '**/*.ts',
      '**/*.mts',
      '**/*.cts',
      '**/*.tsx',
      '**/*.d.ts',
    ],
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      import: fixupPluginRules(pluginImport),
    },
    rules: {
      'no-empty': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': [
          '.js',
          '.cjs',
          '.mjs',
          '.jsx',
          '.ts',
          '.mts',
          '.cts',
          '.tsx',
          '.d.ts',
        ],
      },
      'import/resolver': {
        node: {
          extensions: [
            '.js',
            '.cjs',
            '.mjs',
            '.jsx',
            '.ts',
            '.mts',
            '.cts',
            '.tsx',
            '.d.ts',
          ],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    files: [
      'framework/**/*.js',
      'framework/**/*.cjs',
      'framework/**/*.mjs',
      'framework/**/*.jsx',
      'framework/**/*.ts',
      'framework/**/*.mts',
      'framework/**/*.cts',
      'framework/**/*.tsx',
      'framework/**/*.d.ts',
    ],
    plugins: {
      react: pluginReact,
      'react-hooks': fixupPluginRules(pluginReactHooks),
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: [
      'framework/next/**/*.js',
      'framework/next/**/*.cjs',
      'framework/next/**/*.mjs',
      'framework/next/**/*.jsx',
      'framework/next/**/*.ts',
      'framework/next/**/*.mts',
      'framework/next/**/*.cts',
      'framework/next/**/*.tsx',
      'framework/next/**/*.d.ts',
    ],
    plugins: {
      react: pluginReact,
      '@next/next': fixupPluginRules(pluginNext),
      'jsx-a11y': pluginJsxA11y,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      'react/no-unknown-property': 'off',
      'react/jsx-no-target-blank': 'off',
      'jsx-a11y/alt-text': [
        'warn',
        {
          elements: ['img'],
          img: ['Image'],
        },
      ],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
  {
    files: [
      'framework/**/*.js',
      'framework/**/*.cjs',
      'framework/**/*.mjs',
      'framework/**/*.jsx',
      'framework/**/*.ts',
      'framework/**/*.mts',
      'framework/**/*.cts',
      'framework/**/*.tsx',
      'framework/**/*.d.ts',
    ],
    plugins: {
      prettier: pluginPrettier,
      react: pluginReact,
    },
    rules: {
      ...pluginPrettier.configs.recommended.rules,
      curly: 'off',
      'no-unexpected-multiline': 'off',
      'react/jsx-child-element-spacing': 'off',
      'react/jsx-closing-bracket-location': 'off',
      'react/jsx-closing-tag-location': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-curly-spacing': 'off',
      'react/jsx-equals-spacing': 'off',
      'react/jsx-first-prop-new-line': 'off',
      'react/jsx-indent': 'off',
      'react/jsx-indent-props': 'off',
      'react/jsx-max-props-per-line': 'off',
      'react/jsx-newline': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-props-no-multi-spaces': 'off',
      'react/jsx-tag-spacing': 'off',
      'react/jsx-wrap-multilines': 'off',
    },
  },
);
