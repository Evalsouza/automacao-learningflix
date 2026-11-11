import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import path from 'path';
import { SESSAO_TUTORIAL_USUARIO, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 6 (bloco "Cursos recomendados para seu cargo"), visão do usuário final
// eva.souza (cargo "Analista de Qualidade"): print-33.png a print-35.png. Só leitura.

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão da eva.souza expirada: rode "npm run tutorial:login:usuario".');
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_USUARIO)) throw new Error('Sem sessão da eva.souza: rode "npm run tutorial:login:usuario".');
});

test('Tutorial Skill Link — seção 6 (usuário final)', async ({ page, context }) => {
  test.setTimeout(5 * 60_000);
  page.setDefaultTimeout(60_000);
  await ocultarJudy(context);

  await test.step('Print 33 — bloco na Página inicial', async () => {
    await abrir(page, '/my/');
    const titulo = page.getByText(/Cursos recomendados para (o )?seu cargo/).first();
    await expect(titulo).toBeVisible();
    const bloco = titulo.locator('xpath=ancestor::*[.//a[contains(@href,"course/view.php")]][1]');
    const verTodos = bloco.getByRole('link', { name: /Ver todos/ }).first();
    await page.waitForTimeout(1500);
    await capturar(page, { pasta, arquivo: 'print-33.png', area: bloco, alvos: [{ elemento: verTodos, seta: 'direita' }], margem: 16 });

    // Print 34 — card em destaque: os dados do curso e o progresso aparecem ao passar o mouse
    const card = bloco.locator('a[href*="course/view.php"]').filter({ visible: true }).first();
    await card.hover();
    await page.waitForTimeout(1200);
    const progresso = bloco
      .getByText(/^\s*\d+%\s*$/)
      .filter({ visible: true })
      .first();
    // Sem rolar (o hover se perderia): recorte direto do card aberto, que contém o ícone "i" e o progresso
    const aberto = progresso.locator('xpath=ancestor::*[.//*[contains(@class,"btn-open-modal-info")]][1]');
    const caixa = await aberto.boundingBox();
    if (!caixa) throw new Error('Card aberto sem área visível');
    await page.screenshot({
      path: path.join(pasta, 'print-34.png'),
      clip: { x: Math.max(0, caixa.x - 16), y: Math.max(0, caixa.y - 16), width: caixa.width + 32, height: caixa.height + 32 },
      animations: 'disabled',
    });
    console.log('>> print-34.png salvo');
  });

  await test.step('Print 35 — página Ver todos com os filtros', async () => {
    await abrir(page, '/blocks/skillcourses/index.php');
    const filtros = page
      .getByText('Obrigatoriedade', { exact: true })
      .first()
      .locator('xpath=ancestor::*[.//*[normalize-space()="Buscar"]][1]');
    const primeiroCard = page.locator('a[href*="course/view.php"]').filter({ visible: true }).first();
    await expect(primeiroCard).toBeVisible();
    await page.waitForTimeout(1500);
    await capturar(page, {
      pasta,
      arquivo: 'print-35.png',
      area: filtros.or(primeiroCard),
      alvos: [{ elemento: filtros, seta: false }],
      margem: 16,
    });
  });
});
