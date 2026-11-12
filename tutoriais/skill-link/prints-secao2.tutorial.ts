import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 2, visão do Administrador Geral (fim da seção): print-14.png … print-16.png
// Só leitura: abre "Ver detalhes" (janela) e a página "Modificar créditos", sem clicar em
// "Adicionar créditos", "Exportar" nem alterar filtros que gravem algo.

const CREDITOS = '/local/skillbox/tokens.php';

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname)) {
    throw new Error('Sessão expirada: rode "npm run tutorial:login" e faça o login de novo.');
  }
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão salva: rode "npm run tutorial:login" primeiro.');
});

test('Tutorial Skill Link — prints da seção 2', async ({ page, context }) => {
  await ocultarJudy(context);

  await test.step('Print 14 — aba Relatórios > Créditos do Skill Link', async () => {
    await abrir(page, '/admin/search.php');
    const aba = page.getByRole('tab', { name: 'Relatórios', exact: true }).filter({ visible: true }).first();
    await aba.click();
    const link = page.locator('.tab-pane.active').getByRole('link', { name: 'Créditos do Skill Link', exact: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, {
      pasta,
      arquivo: 'print-14.png',
      area: 'tela',
      alvos: [
        { elemento: aba, numero: 1, seta: 'cima' },
        { elemento: link, numero: 2, seta: 'direita' },
      ],
    });
  });

  await test.step('Print 15 — botão Modificar créditos e cards com US$', async () => {
    await abrir(page, CREDITOS);
    const modificar = page.locator('a.sb-credits-change').filter({ visible: true }).first();
    const cards = page.locator('.sb-credits-kpis');
    await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, {
      pasta,
      arquivo: 'print-15.png',
      area: 'tela',
      ate: cards,
      alvos: [
        { elemento: modificar, seta: 'baixo' },
        { elemento: cards, seta: false },
      ],
    });
  });

  await test.step('Print 16 — Modificar créditos (sem adicionar)', async () => {
    await abrir(page, CREDITOS);
    await page.locator('a.sb-credits-change').filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/change_tokens\.php/);
    const campo = page.getByLabel('Quantidade de créditos');
    const botao = page.getByRole('button', { name: 'Adicionar créditos' });
    const formulario = page.locator('form').filter({ has: campo }).first();
    await capturar(page, {
      pasta,
      arquivo: 'print-16.png',
      area: formulario,
      alvos: [
        { elemento: campo, numero: 1, seta: false, ladoNumero: 'direita' },
        { elemento: botao, numero: 2, seta: false, ladoNumero: 'esquerda' },
      ],
    });
    // Não clica em "Adicionar créditos"
  });
});
