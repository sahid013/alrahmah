import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Design system guard (CODING_GUIDELINES.md §9): square corners, no gradient lighting.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/(^|[\\s:])rounded(-|\\s|$)/]',
          message: 'Design system: no border radius. Keep corners square.',
        },
        {
          selector: 'TemplateElement[value.raw=/(^|[\\s:])rounded(-|\\s|$)/]',
          message: 'Design system: no border radius. Keep corners square.',
        },
        {
          selector: 'Literal[value=/gradient/]',
          message: 'Design system: no gradient lighting. Use flat brand colours.',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
