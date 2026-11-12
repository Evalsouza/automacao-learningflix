import { test, expect, type Page } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'fs';
import os from 'os';
import path from 'path';
import { SESSAO_TUTORIAL_CLIENTE, PASTA_PRINTS_CONVERSOR as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial: Converter PPTX para SCORM (adm.cliente) — print-01.png … print-05.png
// Envia o .pptx ao conversor (local/pptxscorm) e clica em "Converter e Baixar". O .zip gerado é salvo
// em SAIDA_DOWNLOAD (pasta temporária), nunca em Downloads, para não sobrescrever o arquivo da QA.
//   ARQUIVO_PPTX   caminho do .pptx (padrão: o arquivo da QA em Downloads)
//   SAIDA_DOWNLOAD pasta onde o .zip convertido é salvo (obrigatória)

const CONVERSOR = '/local/pptxscorm/index.php';
const ARQUIVO_PPTX =
  process.env.ARQUIVO_PPTX ?? path.join(os.homedir(), 'Downloads', 'Evolução da Estratégia de Evidências de Teste (1) (8).pptx');

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão do adm.cliente expirada: rode "npm run tutorial:login:cliente".');
  await page.waitForTimeout(2500);
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do adm.cliente: rode "npm run tutorial:login:cliente".');
  if (!existsSync(ARQUIVO_PPTX)) throw new Error(`Arquivo .pptx não encontrado: ${ARQUIVO_PPTX}`);
  if (!process.env.SAIDA_DOWNLOAD) throw new Error('Informe SAIDA_DOWNLOAD (pasta temporária para o .zip convertido).');
});

test('Tutorial Converter PPTX para SCORM (adm.cliente)', async ({ page, context }) => {
  test.setTimeout(25 * 60_000);
  page.setDefaultTimeout(90_000);
  await ocultarJudy(context);

  await test.step('Print 01 — Administração > Conversor PPTX para SCORM', async () => {
    await abrir(page, '/theme/smart/client_admin.php');
    const menu = page.locator('section.d-lg-block a[href*="client_admin.php"]').filter({ visible: true }).first();
    const link = page.locator('#region-main, main').locator(`a[href*="${CONVERSOR}"]`).filter({ visible: true }).first();
    await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, {
      pasta,
      arquivo: 'print-01.png',
      area: 'tela',
      alvos: [
        { elemento: menu, numero: 1, seta: 'direita' },
        { elemento: link, numero: 2, seta: 'baixo' },
      ],
    });
  });

  const campo = page.locator('#fitem_id_presentationfile');

  await test.step('Print 02 — tela do conversor e campo Arquivo PowerPoint', async () => {
    await abrir(page, CONVERSOR);
    await capturar(page, {
      pasta,
      arquivo: 'print-02.png',
      area: 'tela',
      alvos: [{ elemento: campo.locator('.felement, [data-fieldtype]').first(), seta: false }],
    });
  });

  await test.step('Print 03 — seletor de arquivos: aba de envio, Anexo e Enviar este arquivo', async () => {
    await campo.locator('input.fp-btn-choose, button.fp-btn-choose').first().click();
    const seletor = page
      .getByRole('dialog', { name: 'Seletor de arquivos' })
      .or(page.locator('.file-picker, .filepicker').filter({ visible: true }))
      .first();
    await expect(seletor).toBeVisible();
    // No QA a aba de envio se chama "Teste de arquivo" e já abre selecionada; só clica se o formulário não estiver na tela
    const entrada = seletor.locator('input[type=file][name=repo_upload_file]').first();
    if (!(await entrada.count())) {
      await seletor
        .locator('.fp-repo')
        .filter({ hasText: /enviar um arquivo|teste de arquivo|upload/i })
        .first()
        .click();
    }
    const aba = seletor.getByRole('tab', { selected: true }).first();
    console.log(`>> Aba de envio: ${(await aba.innerText()).trim()}`);
    console.log(
      `>> Botões do seletor: ${(await seletor.locator('button:visible').allInnerTexts())
        .map((t) => t.trim())
        .filter(Boolean)
        .join(' | ')}`,
    );
    // Anexa pelo botão "Anexo" da aba aberta (o seletor tem outros campos de arquivo escondidos)
    const anexo = seletor.getByRole('button', { name: 'Anexo' }).filter({ visible: true }).first();
    const escolha = page.waitForEvent('filechooser');
    await anexo.click();
    await (await escolha).setFiles(ARQUIVO_PPTX);
    await page.waitForTimeout(1500);
    const enviar = seletor
      .locator('.fp-upload-btn')
      .or(seletor.getByRole('button', { name: /Enviar este arquivo/i }))
      .filter({ visible: true })
      .first();
    await capturar(page, {
      pasta,
      arquivo: 'print-03.png',
      area: 'tela',
      alvos: [
        { elemento: aba, numero: 1, seta: false },
        { elemento: anexo, numero: 2, seta: false },
        { elemento: enviar, numero: 3, seta: 'direita' },
      ],
    });
    await enviar.click();
    // Envio de ~10 MB: espera o seletor fechar; para na hora se o Moodle mostrar uma mensagem de erro
    const erro = page.getByRole('alertdialog').filter({ visible: true }).first();
    await expect
      .poll(
        async () => {
          if (await erro.count()) throw new Error(`Erro no envio: ${(await erro.innerText()).replace(/\s+/g, ' ')}`);
          return seletor.isVisible();
        },
        { timeout: 10 * 60_000, intervals: [2000] },
      )
      .toBe(false);
  });

  const botao = page.locator('#id_submitbutton');

  await test.step('Print 04 — arquivo enviado e botão Converter e Baixar', async () => {
    // O campo de arquivo único mostra o nome do arquivo enviado como link (draftfile.php)
    const arquivo = campo.locator('a[href*="draftfile.php"]').filter({ visible: true }).first();
    await expect(arquivo).toBeVisible({ timeout: 60_000 });
    console.log(`>> Arquivo no campo: ${(await campo.innerText()).replace(/\s+/g, ' ').slice(0, 200)}`);
    await capturar(page, {
      pasta,
      arquivo: 'print-04.png',
      area: 'tela',
      alvos: [
        { elemento: arquivo, numero: 1, seta: false },
        { elemento: botao, numero: 2, seta: 'direita' },
      ],
    });
  });

  await test.step('Converter e Baixar — salva o .zip na pasta temporária', async () => {
    // Espera o download ou uma mensagem de erro da plataforma (ex.: conversor não configurado no servidor)
    const download = page.waitForEvent('download', { timeout: 20 * 60_000 });
    const erro = page.locator('.alert-danger, .alert-error, .notifyproblem').filter({ visible: true }).first();
    await botao.click();
    const resultado = await Promise.race([
      download.then((d) => ({ d })),
      erro.waitFor({ timeout: 20 * 60_000 }).then(async () => ({ erro: (await erro.innerText()).replace(/\s+/g, ' ').trim() })),
    ]);
    mkdirSync(process.env.SAIDA_DOWNLOAD!, { recursive: true });
    if ('erro' in resultado) {
      await page.screenshot({ path: path.join(process.env.SAIDA_DOWNLOAD!, 'erro-conversao.png') });
      throw new Error(`A plataforma não converteu o arquivo: ${resultado.erro}`);
    }
    const d = resultado.d;
    const saida = process.env.SAIDA_DOWNLOAD!;
    mkdirSync(saida, { recursive: true });
    const destino = path.join(saida, d.suggestedFilename());
    await d.saveAs(destino);
    console.log(`>> Download: "${d.suggestedFilename()}" (${(statSync(destino).size / 1024 / 1024).toFixed(1)} MB)`);
  });
});
