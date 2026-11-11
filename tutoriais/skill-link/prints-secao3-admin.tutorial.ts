import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 3, botão "Selecionar vídeo" do VideoHub (só para o Administrador Geral): print-25.png
// Só leitura: abre a atividade VIDEO HUB (3079) do curso 325 e NÃO salva.

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão do Administrador: rode "npm run tutorial:login".');
});

test('Tutorial Skill Link — seção 3, Selecionar vídeo (Administrador Geral)', async ({ page, context }) => {
  test.setTimeout(5 * 60_000);
  page.setDefaultTimeout(120_000); // QA lento com o Administrador
  await ocultarJudy(context);
  await page.goto('/course/modedit.php?update=3079', { waitUntil: 'domcontentloaded' });
  if (/\/login\//.test(new URL(page.url()).pathname)) throw new Error('Sessão do Administrador expirada: rode "npm run tutorial:login".');
  const geral = page.locator('#id_general');
  await geral.waitFor();
  await page.waitForTimeout(3000);
  await expect(page.locator('#id_videosource')).toHaveValue('videohub');
  const selecionar = page.locator('#id_videohub_select');
  const item = (rotulo: RegExp) =>
    geral
      .locator('.fitem, .form-group')
      .filter({ has: page.locator('label, .col-form-label', { hasText: rotulo }) })
      .first();
  await capturar(page, {
    pasta,
    arquivo: 'print-25.png',
    area: item(/Fonte do vídeo/).or(item(/VideoHub: Código Embed/)),
    alvos: [{ elemento: selecionar, seta: 'direita' }],
    margem: 16,
  });
});
