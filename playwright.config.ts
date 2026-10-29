import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000, // Moodle em QA é lento: só o login do administrador leva ~30 s
  expect: { timeout: 30_000 }, // redirecionamentos — login, logout — passam dos 5 s padrão
  fullyParallel: false,
  workers: 1, // QA não aguenta logins simultâneos: em paralelo os testes estouram o tempo
  retries: 0, // falha precisa aparecer; retry esconde defeito intermitente
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/resultado.json' }],
    ['./support/reporters/resumo.ts'], // resumo da rodada no terminal — e em test-results/resumo.txt
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    { name: 'setup', testDir: './support', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
