import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import 'dotenv/config';

// Rotinas: ações em lote no QA que NÃO são testes (não entram nas rodadas diária e semanal).
// Rode a partir da raiz do projeto: npm run rotina:*

export default defineConfig({
  testDir: '.',
  testMatch: /\.rotina\.ts$/,
  outputDir: path.join(__dirname, '..', 'test-results', 'rotinas'),
  timeout: 90_000,
  expect: { timeout: 30_000 },
  workers: 1, // QA não aguenta sessões simultâneas
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    // Mesmo login dos testes: sessão de menos de 2 h é reaproveitada
    { name: 'setup', testDir: path.join(__dirname, '..', 'support'), testMatch: /auth\.setup\.ts/, retries: 2 },
    {
      name: 'rotina',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/administrador.json' },
    },
  ],
});
