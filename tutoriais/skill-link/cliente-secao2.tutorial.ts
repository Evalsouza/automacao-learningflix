import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL_CLIENTE, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 2 na visão do Adm Cliente: print-09.png … print-13.png
// Só leitura: abre a janela do atalho Cursos e fecha, sem selecionar curso; não clica em Exportar.

const CREDITOS = '/local/skillbox/credits.php';

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname)) {
    throw new Error('Sessão do Adm Cliente expirada: rode "npm run tutorial:login:cliente".');
  }
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do Adm Cliente: rode "npm run tutorial:login:cliente".');
});

test('Tutorial Skill Link — seção 2 (Adm Cliente)', async ({ page, context }) => {
  test.setTimeout(5 * 60_000);
  await ocultarJudy(context);

  await test.step('Print 09 — menu Administração > Créditos do Skill Link', async () => {
    await abrir(page, '/theme/smart/client_admin.php');
    const menu = page.locator('section.d-lg-block a[href*="client_admin.php"]').filter({ visible: true }).first();
    const link = page.locator('#region-main, main').getByRole('link', { name: 'Créditos do Skill Link' }).filter({ visible: true }).first();
    await link.scrollIntoViewIfNeeded();
    const caixa = await link.boundingBox();
    const cabe = !!caixa && caixa.y + caixa.height < 880;
    if (cabe) await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, {
      pasta,
      arquivo: 'print-09.png',
      area: cabe ? 'tela' : undefined,
      alvos: [
        { elemento: menu, numero: 1, seta: 'direita' },
        { elemento: link, numero: 2, seta: 'cima' },
      ],
      margem: 24,
    });
  });

  await test.step('Print 10 — filtro de período e botões de atalho', async () => {
    await abrir(page, CREDITOS);
    const periodo = page.locator('select.sb-credits-select').first();
    const atalhos = page.getByText('Todos', { exact: true }).first().locator('xpath=ancestor::*[.//*[normalize-space()="SCORM"]][1]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, {
      pasta,
      arquivo: 'print-10.png',
      area: 'tela',
      ate: page.locator('.sb-credits-kpis'),
      alvos: [
        { elemento: periodo, numero: 1, seta: 'baixo' },
        { elemento: atalhos.locator(':scope > *'), numero: 2, seta: false, ladoNumero: 'direita' },
      ],
    });
  });

  await test.step('Print 11 — janela do atalho Cursos', async () => {
    await page.locator('[data-mode="course"]').filter({ visible: true }).first().click();
    const janela = page.locator('.sb-credits-modal__dialog').filter({ visible: true });
    await expect(janela).toContainText('Editar curso');
    const categoria = janela.locator('select').first();
    const curso = janela.locator('select, input:not([type=hidden])').nth(1);
    await capturar(page, {
      pasta,
      arquivo: 'print-11.png',
      area: janela,
      alvos: [
        { elemento: categoria, numero: 1, seta: false, ladoNumero: 'direita' },
        { elemento: curso, numero: 2, seta: false, ladoNumero: 'direita' },
      ],
      margem: 16,
    });
    await page.keyboard.press('Escape');
  });

  await test.step('Print 12 — gráficos de consumo', async () => {
    await abrir(page, CREDITOS);
    const graficos = page.locator('section.sb-credits-panel:not(.sb-credits-history)');
    await expect(graficos.first()).toBeVisible();
    await capturar(page, { pasta, arquivo: 'print-12.png', area: graficos, alvos: [{ elemento: graficos, seta: false }], espera: 3000 });
  });

  await test.step('Print 13 — histórico: filtro de tipo, Exportar e Ver detalhes', async () => {
    const historico = page.locator('section.sb-credits-history');
    const tipo = historico.locator('select.sb-credits-select').first();
    const exportar = historico.locator('a.sb-credits-export');
    const detalhes = historico.locator('button.sb-credits-eye').first();
    await capturar(page, {
      pasta,
      arquivo: 'print-13.png',
      area: historico.locator('tbody tr').nth(2).or(tipo),
      alvos: [
        { elemento: tipo, numero: 1, seta: 'cima' },
        { elemento: exportar, numero: 2, seta: 'cima' },
        { elemento: detalhes, numero: 3, seta: false, ladoNumero: 'direita' },
      ],
      margem: 24,
    });
  });
});
