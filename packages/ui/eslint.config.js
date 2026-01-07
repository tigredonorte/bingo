// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import { config } from "@repo/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      'scripts/**',
      'tsup.config.ts',
      'node_modules/**',
      'dist/**',
      'build/**',
      'storybook-static/**',
    ],
  },
  ...config,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'error',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
    },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
  },
  ...storybook.configs["flat/recommended"],
];
