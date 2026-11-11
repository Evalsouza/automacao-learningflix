import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL, PASTA_PRINTS_LOTE as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial: Gerar Competências em Lote (Administrador Geral) — local/skillbox/migration.php
// FASE=antes   prints 01 e 02 (só leitura)
// FASE=disparar  clica em "Alterar todos em lote" só na aba Cargos e captura a confirmação e o início
//                (só com DISPARAR_CARGOS=sim; a aba SCORMs LFX nunca é disparada)
// FASE=depois  captura o acompanhamento com o resultado do lote de Cargos (só leitura)

const FASE = process.env.FASE ?? 'antes';
const MIGRACAO = '/local/skillbox/migration.php';

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'domcontentloaded' });
  if (/\/login\//.test(new URL(page.url()).pathname)) throw new Error('Sessão do Administrador expirada: rode "npm run tutorial:login".');
  await page.locator('#region-main').waitFor();
  await page.waitForTimeout(2500);
}

const textoPrincipal = (page: Page) =>
  page
    .locator('#region-main')
    .innerText()
    .then((t) => t.replace(/\s+/g, ' ').slice(0, 1500));

const abaCargos = (page: Page) =>
  page
    .getByRole('button', { name: 'Cargos', exact: true })
    .or(page.getByRole('link', { name: 'Cargos', exact: true }))
    .first();
const botaoLote = (page: Page) => page.locator('button.sb-migration-start').filter({ visible: true }).first();
const cardPendentes = (page: Page) =>
  page
    .getByText('Itens pendentes de alteração em lote', { exact: true })
    .locator('xpath=ancestor::*[.//button[contains(@class,"sb-migration-start")]][1]');

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão do Administrador: rode "npm run tutorial:login".');
});

test('Tutorial Gerar Competências em Lote (Administrador Geral)', async ({ page, context }) => {
  test.setTimeout(10 * 60_000);
  page.setDefaultTimeout(120_000);
  await ocultarJudy(context);

  if (FASE === 'antes') {
    await test.step('Print 01 — Administração do site > Alteração em lote de competências', async () => {
      // A tela não fica nas abas da Administração do site: o caminho é a busca da Administração
      await abrir(page, '/admin/search.php');
      const busca = page.locator('#region-main input[name=query]').first();
      await busca.fill('Alteração em lote');
      await busca.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('#region-main').waitFor();
      await page.waitForTimeout(2500);
      const visivel = page.locator(`#region-main a[href$="${MIGRACAO}"]`).filter({ visible: true }).first();
      await expect(visivel).toBeVisible();
      const grupo = visivel.locator('xpath=ancestor::div[contains(@class,"row")][1]');
      console.log(`>> Resultado da busca: ${(await page.locator('#region-main').innerText()).replace(/\s+/g, ' ').slice(0, 600)}`);
      await capturar(page, {
        pasta,
        arquivo: 'print-01.png',
        area: busca.or(grupo),
        alvos: [
          { elemento: busca, numero: 1, seta: 'baixo' },
          { elemento: visivel, numero: 2, seta: 'direita' },
        ],
        margem: 30,
      });
    });

    await test.step('Print 02 — tela Alteração em lote de competências, aba Cargos', async () => {
      await abrir(page, MIGRACAO);
      await capturar(page, {
        pasta,
        arquivo: 'print-02.png',
        area: 'tela',
        alvos: [
          { elemento: abaCargos(page), numero: 1, seta: false },
          { elemento: cardPendentes(page), numero: 2, seta: false },
          { elemento: botaoLote(page), numero: 3, seta: 'esquerda' },
        ],
      });
    });
    return;
  }

  if (FASE === 'disparar') {
    if (process.env.DISPARAR_CARGOS !== 'sim') throw new Error('Para disparar o lote de Cargos, use DISPARAR_CARGOS=sim.');
    await abrir(page, `${MIGRACAO}?entitytype=position`);
    // Garante que o botão é o do lote de Cargos (formulário entitytype=position), nunca o de SCORMs LFX
    const acao = await botaoLote(page).evaluate((b) => b.closest('form')?.getAttribute('action') ?? '');
    if (!/entitytype=position(&|$)/.test(acao)) throw new Error(`O botão não é do lote de Cargos: ${acao}`);
    console.log(`>> Antes: ${await textoPrincipal(page)}`);
    await botaoLote(page).click();
    await page.waitForTimeout(2500);

    // Confirmação (se houver): print-03 com o botão de confirmar
    const modal = page.locator('.modal.show, [role=dialog], [role=alertdialog]').filter({ visible: true }).first();
    let proximo = 3;
    if (await modal.count()) {
      console.log(`>> Confirmação: ${(await modal.innerText()).replace(/\s+/g, ' ')}`);
      const confirmar = modal
        .locator('button, a.btn, input[type=submit]')
        .filter({ visible: true })
        .filter({ hasNotText: /cancelar|fechar|não|×/i })
        .last();
      await capturar(page, { pasta, arquivo: `print-0${proximo++}.png`, area: 'tela', alvos: [{ elemento: confirmar, seta: 'esquerda' }] });
      await confirmar.click();
    } else console.log('>> Sem janela de confirmação');

    await page.waitForLoadState('domcontentloaded');
    await page.locator('#region-main').waitFor();
    await page.waitForTimeout(4000);
    console.log(`>> Depois: ${await textoPrincipal(page)}`);
    const aviso = page.locator('.alert, [role=alert], .toast').filter({ visible: true }).first();
    const alvos = (await aviso.count()) ? [{ elemento: aviso, numero: 1, seta: false as const }] : [];
    await capturar(page, {
      pasta,
      arquivo: `print-0${proximo}.png`,
      area: 'tela',
      alvos: [...alvos, { elemento: cardPendentes(page), numero: alvos.length + 1, seta: false }],
    });
    return;
  }

  // FASE=andamento: espera o progresso sair de 0 e captura o card "Alterações em lote em andamento"
  if (FASE === 'andamento') {
    const limite = Date.now() + 8 * 60_000;
    let progresso = '';
    for (;;) {
      await abrir(page, `${MIGRACAO}?entitytype=position`);
      const titulo = page.getByText('Alterações em lote em andamento', { exact: true });
      if (!(await titulo.count())) throw new Error('Nenhuma alteração em lote em andamento (o lote já terminou?)');
      progresso = (await page.locator('#region-main').innerText()).match(/\d+\/\d+ \(\d+%\)/)?.[0] ?? '';
      console.log(`>> Progresso: ${progresso}`);
      if (!/^0\//.test(progresso) || Date.now() > limite) break;
      await page.waitForTimeout(45_000);
    }
    const card = page
      .getByText('Alterações em lote em andamento', { exact: true })
      .locator('xpath=ancestor::*[.//button[contains(normalize-space(),"Cancelar")] or .//a[contains(normalize-space(),"Cancelar")]][1]');
    const cancelar = card.getByText('Cancelar').filter({ visible: true }).first();
    await capturar(page, {
      pasta,
      arquivo: 'print-04.png',
      area: 'tela',
      alvos: [
        { elemento: card, numero: 1, seta: false },
        { elemento: cancelar, numero: 2, seta: 'baixo' },
      ],
    });
    return;
  }

  if (FASE === 'depois') {
    // Espera o lote terminar (o card "em andamento" some) por até 30 min
    test.setTimeout(40 * 60_000);
    const limite = Date.now() + 30 * 60_000;
    for (;;) {
      await abrir(page, `${MIGRACAO}?entitytype=position`);
      const andamento = (await page.locator('#region-main').innerText()).match(
        /Alterações em lote em andamento[\s\S]*?(\d+\/\d+ \(\d+%\)[^\n]*)/,
      );
      if (!andamento) break;
      console.log(`>> Ainda em andamento: ${andamento[1]}`);
      if (Date.now() > limite) throw new Error('O lote não terminou em 30 min.');
      await page.waitForTimeout(60_000);
    }
    console.log(`>> Situação: ${await textoPrincipal(page)}`);
    // Recorte: do título "Acompanhamento da alteração em lote" (com o filtro) até a 3ª linha da tabela
    const recorte = async (page: Page) => {
      const titulo = page.getByText('Acompanhamento da alteração em lote', { exact: true });
      const linhas = page.locator('#region-main table tbody tr');
      const ultima = Math.min(await linhas.count(), 3) - 1;
      if (ultima < 0) throw new Error('Nenhuma linha no acompanhamento com este filtro');
      return { linhas, area: titulo.or(page.locator('select[name=f_status]')).or(linhas.nth(ultima)) };
    };

    // Print 05 — filtro "Alterado": cargo com as competências associadas pelo lote
    await abrir(page, `${MIGRACAO}?entitytype=position&f_status=success`);
    {
      const { linhas, area } = await recorte(page);
      const filtro = page.locator('select[name=f_status]').first();
      console.log(
        `>> Alterados: ${(await linhas.allInnerTexts())
          .slice(0, 3)
          .map((t) => t.replace(/\s+/g, ' ').slice(0, 200))
          .join(' | ')}`,
      );
      await capturar(page, {
        pasta,
        arquivo: 'print-05.png',
        area,
        alvos: [
          { elemento: filtro, numero: 1, seta: 'esquerda' },
          { elemento: linhas.first().locator('td').nth(4), numero: 2, seta: false, ladoNumero: 'direita' },
        ],
        margem: 16,
      });
    }

    // Print 06 — filtro "Erro": motivo do erro e ação "Tentar novamente" (não é clicada)
    await abrir(page, `${MIGRACAO}?entitytype=position&f_status=error`);
    {
      const { linhas, area } = await recorte(page);
      const tentar = linhas.first().locator('button.sb-credits-eye').filter({ visible: true }).first();
      await capturar(page, {
        pasta,
        arquivo: 'print-06.png',
        area,
        alvos: [
          // Status + motivo do erro: o número fica à esquerda do selo "Erro", sem cobri-lo
          { elemento: linhas.first().locator('td').nth(3).or(linhas.first().locator('td').nth(4)), numero: 1, seta: false },
          { elemento: tentar, numero: 2, seta: 'baixo' },
        ],
        margem: 16,
      });
    }
    return;
  }

  throw new Error(`FASE desconhecida: ${FASE}`);
});
