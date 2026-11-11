import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL_CLIENTE, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 4 (Visualize as competências), visão do Adm Cliente: print-22.png … print-24.png
// Só leitura: abre a janela do ícone "i" do curso 325 no Catálogo e clica em "Ver todas" / "Ver menos".

const BUSCA = '/local/catalog/index.php?search=' + encodeURIComponent('Geração de Competências com Skill Link');

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão do Adm Cliente expirada: rode "npm run tutorial:login:cliente".');
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do Adm Cliente: rode "npm run tutorial:login:cliente".');
});

test('Tutorial Skill Link — seção 4 (Adm Cliente)', async ({ page, context }) => {
  test.setTimeout(5 * 60_000);
  await ocultarJudy(context);

  // Conferência: os cards dos blocos da Página inicial também têm o ícone "i" com Competências
  await abrir(page, '/my/');
  const naInicial = await page.evaluate(() => ({
    icones: document.querySelectorAll('.btn-open-modal-info').length,
    janelasComCompetencias: Array.from(document.querySelectorAll('.course-info-modal')).filter((m) =>
      /Competências/.test(m.textContent ?? ''),
    ).length,
    blocos: Array.from(document.querySelectorAll('h2,h3,h4'))
      .map((h) => (h as HTMLElement).innerText.trim())
      .filter((t) => t && t.length < 50)
      .slice(0, 12),
  }));
  console.log('>> Página inicial:', JSON.stringify(naInicial));

  await abrir(page, BUSCA);
  const card = page.locator('a.card-link[href*="id=325"]').first();
  const icone = page.locator('.btn-open-modal-info').filter({ visible: true }).first();

  await test.step('Print 22 — ícone i no card do curso', async () => {
    await card.hover();
    await page.waitForTimeout(600);
    await capturar(page, {
      pasta,
      arquivo: 'print-22.png',
      area: card.locator('xpath=ancestor::*[contains(@class,"card")][1]').or(card),
      alvos: [{ elemento: icone, seta: 'direita' }],
      margem: 20,
    });
  });

  await test.step('Print 23 — janela com a seção Competências', async () => {
    await card.hover();
    await icone.click({ force: true });
    const janela = page.locator('.course-info-modal.show .modal-content').first();
    await expect(janela).toContainText('Competências');
    await page.waitForTimeout(800);
    const titulo = janela.getByText('Competências', { exact: true }).first();
    const etiquetas = titulo.locator('xpath=following-sibling::*[1]');
    const verTodas = janela.getByText('Ver todas', { exact: true });
    await capturar(page, {
      pasta,
      arquivo: 'print-23.png',
      area: janela,
      alvos: [
        { elemento: titulo.or(etiquetas), numero: 1, seta: false, ladoNumero: 'direita' },
        { elemento: verTodas, numero: 2, seta: false, ladoNumero: 'direita' },
      ],
      margem: 8,
    });

    await test.step('Print 24 — lista aberta com Ver menos', async () => {
      await verTodas.click();
      await page.waitForTimeout(800);
      const verMenos = janela.getByText('Ver menos', { exact: true });
      await expect(verMenos).toBeVisible();
      await capturar(page, { pasta, arquivo: 'print-24.png', area: janela, alvos: [{ elemento: verMenos, seta: 'direita' }], margem: 8 });
    });
  });
});
