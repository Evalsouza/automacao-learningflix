import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import 'dotenv/config';
import { SESSAO_TUTORIAL, SESSAO_TUTORIAL_CLIENTE, SESSAO_TUTORIAL_USUARIO } from './caminhos';

// Configuração só dos tutoriais (prints e envio ao Confluence) — separada da suíte de testes.
// Rode a partir da raiz do projeto: npm run tutorial:*

export default defineConfig({
  testDir: '.',
  testMatch: /\.tutorial\.ts$/,
  outputDir: path.join(__dirname, '..', 'test-results', 'tutoriais'),
  timeout: 5 * 60_000, // QA lento: o login do Administrador sozinho leva ~30 s
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    // Abre o navegador visível; a QA faz o login manualmente e a sessão é salva em .auth/
    {
      name: 'login',
      testMatch: /login-manual\.tutorial\.ts$/,
      use: { ...devices['Desktop Chrome'], headless: false, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'prints',
      testMatch: /prints-.*\.tutorial\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        storageState: SESSAO_TUTORIAL,
      },
    },
    // Prints na visão do Adm Cliente (perfil do cliente): arquivos cliente-*.tutorial.ts
    {
      name: 'prints-cliente',
      testMatch: /cliente-.*\.tutorial\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        storageState: SESSAO_TUTORIAL_CLIENTE,
      },
    },
    // Prints na visão do usuário final (eva.souza): arquivos usuario-*.tutorial.ts
    {
      name: 'prints-usuario',
      testMatch: /usuario-.*\.tutorial\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        storageState: SESSAO_TUTORIAL_USUARIO,
      },
    },
    // Não abre navegador: só chamadas à API REST do Confluence
    { name: 'confluence', testMatch: /confluence\.tutorial\.ts$/ },
  ],
});
