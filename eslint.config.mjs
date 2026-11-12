import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', '.auth/', 'relatorios/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['tests/**/*.ts', 'support/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Os passos Quando / E / Então ficam juntos, lidos como uma frase
      'playwright/consistent-spacing-between-blocks': 'off',
      // A prioridade vem de prioridade() em fixtures/prioridades.ts, que o TypeScript já valida (tipo Prioridade)
      'playwright/valid-test-tags': 'off',
    },
  },
);
