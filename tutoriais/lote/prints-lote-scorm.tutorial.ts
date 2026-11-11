import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL, PASTA_PRINTS_LOTE as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial: Gerar Competências em Lote — opção SCORMs LFX (SCORMs do Lizza), Administrador Geral
// FASE=antes     prints 07 e 08 (aba SCORMs LFX e ajuda "O que é isso?"), só leitura
// FASE=disparar  clica em "Alterar todos em lote" só na aba SCORMs LFX (só com DISPARAR_SCORM=sim) — print 09
// FASE=depois    espera o lote terminar e captura o resultado (prints 10 e, se houver erros, 11), só leitura

const FASE = process.env.FASE ?? 'antes';
const SCORM = '/local/skillbox/migration.php?entitytype=lizzascorm';

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'domcontentloaded' });
  if (/\/login\//.test(new URL(page.url()).pathname)) throw new Error('Sessão do Administrador expirada: rode "npm run tutorial:login".');
  await page.locator('#region-main').waitFor();
  await page.waitForTimeout(2500);
}

const texto = (page: Page) =>
  page
    .locator('#region-main')
    .innerText()
    .then((t) => t.replace(/\s+/g, ' ').slice(0, 1500));

const abaScorm = (page: Page) =>
  page
    .getByRole('button', { name: 'SCORMs LFX', exact: true })
    .or(page.getByRole('link', { name: 'SCORMs LFX', exact: true }))
    .first();
const botaoLote = (page: Page) => page.locator('button.sb-migration-start').filter({ visible: true }).first();
const cardPendentes = (page: Page) =>
  page
    .getByText('Itens pendentes de alteração em lote', { exact: true })
    .locator('xpath=ancestor::*[contains(@class,"card") or self::section][1]');
const cardAndamento = (page: Page) =>
  page
    .getByText('Alterações em lote em andamento', { exact: true })
    .locator('xpath=ancestor::*[.//button[contains(normalize-space(),"Cancelar")] or .//a[contains(normalize-space(),"Cancelar")]][1]');

// Recorte do acompanhamento: do título (com o filtro) até a 3ª linha da tabela
async function recorte(page: Page) {
  const titulo = page.getByText('Acompanhamento da alteração em lote', { exact: true });
  const linhas = page.locator('#region-main table tbody tr');
  const ultima = Math.min(await linhas.count(), 3) - 1;
  if (ultima < 0) return null;
  return { linhas, area: titulo.or(page.locator('select[name=f_status]')).or(linhas.nth(ultima)) };
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão do Administrador: rode "npm run tutorial:login".');
});

test('Tutorial Gerar Competências em Lote — SCORMs LFX (Administrador Geral)', async ({ page, context }) => {
  test.setTimeout(50 * 60_000);
  page.setDefaultTimeout(120_000);
  await ocultarJudy(context);

  if (FASE === 'antes') {
    await abrir(page, SCORM);
    console.log(`>> Aba SCORMs LFX: ${await texto(page)}`);
    await test.step('Print 07 — aba SCORMs LFX, itens pendentes e Alterar todos em lote', async () => {
      await capturar(page, {
        pasta,
        arquivo: 'print-07.png',
        area: 'tela',
        alvos: [
          { elemento: abaScorm(page), numero: 1, seta: false, ladoNumero: 'direita' },
          { elemento: cardPendentes(page), numero: 2, seta: false },
          { elemento: botaoLote(page), numero: 3, seta: 'esquerda' },
        ],
      });
    });
    await test.step('Print 08 — ajuda "O que é isso?" do card SCORMs LFX', async () => {
      const ajuda = page.locator('button.sb-migration-help').filter({ visible: true }).first();
      await ajuda.click();
      await page.waitForTimeout(1500);
      const balao = page
        .getByText(/A detecção dos SCORMs LFX fica guardada em cache/)
        .filter({ visible: true })
        .first();
      await expect(balao).toBeVisible();
      console.log(`>> Ajuda: ${(await balao.innerText()).replace(/\s+/g, ' ')}`);
      await capturar(page, {
        pasta,
        arquivo: 'print-08.png',
        area: 'tela',
        alvos: [
          { elemento: ajuda, numero: 1, seta: false, ladoNumero: 'direita' },
          { elemento: balao, numero: 2, seta: false },
        ],
      });
    });
    return;
  }

  if (FASE === 'disparar') {
    if (process.env.DISPARAR_SCORM !== 'sim') throw new Error('Para disparar o lote de SCORMs LFX, use DISPARAR_SCORM=sim.');
    await abrir(page, SCORM);
    // Garante que o botão é o do lote de SCORMs LFX (formulário entitytype=lizzascorm), nunca o de Cargos
    const acao = await botaoLote(page).evaluate((b) => b.closest('form')?.getAttribute('action') ?? '');
    if (!/entitytype=lizzascorm(&|$)/.test(acao)) throw new Error(`O botão não é do lote de SCORMs LFX: ${acao}`);
    console.log(`>> Antes: ${await texto(page)}`);
    await botaoLote(page).click();
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#region-main').waitFor();
    await page.waitForTimeout(4000);
    console.log(`>> Depois: ${await texto(page)}`);
    const aviso = page.locator('.alert, [role=alert]').filter({ visible: true }).first();
    await capturar(page, {
      pasta,
      arquivo: 'print-09.png',
      area: 'tela',
      alvos: [
        ...((await aviso.count()) ? [{ elemento: aviso, numero: 1, seta: false as const }] : []),
        { elemento: cardAndamento(page), numero: (await aviso.count()) ? 2 : 1, seta: false },
      ],
    });
    return;
  }

  if (FASE === 'depois') {
    const limite = Date.now() + 40 * 60_000;
    for (;;) {
      await abrir(page, SCORM);
      const andamento = (await page.locator('#region-main').innerText()).match(
        /Alterações em lote em andamento[\s\S]*?(\d+\/\d+ \(\d+%\)[^\n]*)/,
      );
      if (!andamento) break;
      console.log(`>> Ainda em andamento: ${andamento[1]}`);
      if (Date.now() > limite) throw new Error('O lote de SCORMs LFX não terminou em 40 min.');
      await page.waitForTimeout(60_000);
    }
    console.log(`>> Situação: ${await texto(page)}`);

    await abrir(page, `${SCORM}&f_status=success`);
    const alterados = await recorte(page);
    if (!alterados) throw new Error('Nenhum SCORM LFX com status Alterado');
    console.log(
      `>> Alterados: ${(await alterados.linhas.allInnerTexts())
        .slice(0, 3)
        .map((t) => t.replace(/\s+/g, ' ').slice(0, 200))
        .join(' | ')}`,
    );
    await capturar(page, {
      pasta,
      arquivo: 'print-10.png',
      area: alterados.area,
      alvos: [
        { elemento: page.locator('select[name=f_status]').first(), numero: 1, seta: 'esquerda' },
        { elemento: alterados.linhas.first().locator('td').nth(4), numero: 2, seta: false, ladoNumero: 'direita' },
      ],
      margem: 16,
    });

    await abrir(page, `${SCORM}&f_status=error`);
    const erros = await recorte(page);
    if (erros) {
      console.log(
        `>> Erros: ${(await erros.linhas.allInnerTexts())
          .slice(0, 5)
          .map((t) => t.replace(/\s+/g, ' ').slice(0, 200))
          .join(' | ')}`,
      );
      await capturar(page, {
        pasta,
        arquivo: 'print-11.png',
        area: erros.area,
        alvos: [{ elemento: erros.linhas.first().locator('td').nth(3).or(erros.linhas.first().locator('td').nth(4)), seta: false }],
        margem: 16,
      });
    } else console.log('>> Nenhum SCORM LFX com erro');
    return;
  }

  // FASE=contagem: total de itens por status no acompanhamento (só leitura)
  if (FASE === 'contagem') {
    for (const status of ['', 'pending', 'waiting_extraction', 'success', 'error', 'skipped']) {
      await abrir(page, `${SCORM}&f_status=${status}`);
      const total = (await page.locator('#region-main').innerText()).match(/de (\d+) resultados/)?.[1] ?? '?';
      const motivos = status === 'error' ? await page.locator('#region-main table tbody tr td:nth-child(5)').allInnerTexts() : [];
      console.log(
        `>> ${status || 'todos'}: ${total}${motivos.length ? ` — motivos na 1ª página: ${[...new Set(motivos.map((m) => m.trim()))].join(' | ')}` : ''}`,
      );
    }
    return;
  }

  throw new Error(`FASE desconhecida: ${FASE}`);
});
