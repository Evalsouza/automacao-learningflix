import { test, expect, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { SESSAO_TUTORIAL_CLIENTE, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 5, associação do cargo ao usuário (Adm Cliente): print-31.png e print-32.png
//
// ALTERA O CADASTRO DA eva.souza (aprovado pela QA em 10/11):
//   CARGO_EVA=tutorial  → troca o cargo para "Analista de Atendimento ao Cliente" e captura os prints
//   CARGO_EVA=original  → devolve o cargo anotado em eva-cargo-original.json ("Analista de Qualidade"), sem prints
// Sem CARGO_EVA, não faz nada.

const USUARIO = 'eva.souza';
const CARGO_TUTORIAL = 'Analista de Atendimento ao Cliente';
const MODO = process.env.CARGO_EVA;

function cargoOriginal(): string {
  const dados = JSON.parse(readFileSync(path.join(__dirname, 'eva-cargo-original.json'), 'utf-8')) as { escolhido: string[] };
  return dados.escolhido[0].split('|')[1];
}

async function abrirEdicao(page: Page) {
  await page.goto(`/admin/tool/usermanagement/index.php?search=${USUARIO}`, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão do Adm Cliente expirada: rode "npm run tutorial:login:cliente".');
  const linha = page.locator('tr').filter({ hasText: USUARIO }).first();
  const editar = linha.locator('a[title="Editar usuário"]').first();
  await expect(editar).toBeVisible();
  return { linha, editar };
}

const janelaEdicao = (page: Page) => page.locator('.modal.show .modal-content').filter({ hasText: 'Editar usuário' }).last();
const campoCargo = (page: Page) => janelaEdicao(page).locator('[id^="fitem_id_profile_field_position"]').first();

async function cargoAtual(page: Page) {
  return campoCargo(page)
    .locator('select')
    .first()
    .evaluate((s: HTMLSelectElement) => Array.from(s.selectedOptions).map((o) => o.text.trim()));
}

// Escolhe o cargo no campo de autocompletar e remove qualquer outro cargo selecionado
async function escolherCargo(page: Page, nome: string) {
  const campo = campoCargo(page);
  const entrada = campo.locator('input[type="text"], input[role="combobox"]').filter({ visible: true }).first();
  await entrada.click();
  await entrada.fill('');
  await entrada.pressSequentially(nome.slice(0, 18), { delay: 60 });
  const sugestao = page
    .locator('[role="option"], .form-autocomplete-suggestions li')
    .filter({ hasText: nome })
    .filter({ visible: true })
    .first();
  await expect(sugestao).toBeVisible({ timeout: 30_000 });
  await sugestao.click();
  await page.waitForTimeout(800);
  for (const outro of (await cargoAtual(page)).filter((c) => c !== nome)) {
    console.log(`>> Removendo "${outro}" do campo Cargo`);
    await campo
      .locator('.form-autocomplete-selection [role="option"], .form-autocomplete-selection span')
      .filter({ hasText: outro })
      .first()
      .click();
    await page.waitForTimeout(600);
  }
  const final = await cargoAtual(page);
  if (final.length !== 1 || final[0] !== nome)
    throw new Error(`Campo Cargo ficou com ${JSON.stringify(final)} — esperado só "${nome}". Nada foi salvo.`);
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do Adm Cliente: rode "npm run tutorial:login:cliente".');
});

test('Tutorial Skill Link — cargo da eva.souza', async ({ page, context }) => {
  test.setTimeout(6 * 60_000);
  page.setDefaultTimeout(60_000);
  if (MODO !== 'tutorial' && MODO !== 'original') {
    console.log('>> Sem CARGO_EVA=tutorial|original: nada a fazer');
    return;
  }
  await ocultarJudy(context);
  const alvo = MODO === 'tutorial' ? CARGO_TUTORIAL : cargoOriginal();

  const { linha, editar } = await abrirEdicao(page);
  if (MODO === 'tutorial') {
    await test.step('Print 31 — Editar usuário na lista de usuários', async () => {
      await capturar(page, { pasta, arquivo: 'print-31.png', area: linha, alvos: [{ elemento: editar, seta: 'esquerda' }], margem: 16 });
    });
  }

  await editar.click();
  await expect(campoCargo(page)).toBeVisible();
  await page.waitForTimeout(2500);
  const antes = await cargoAtual(page);
  console.log(`>> Cargo atual da ${USUARIO}: ${JSON.stringify(antes)} → vai para "${alvo}"`);
  if (antes.length === 1 && antes[0] === alvo) {
    console.log('>> Já está com esse cargo: nada a salvar');
  } else {
    await escolherCargo(page, alvo);
  }

  const salvar = janelaEdicao(page).getByRole('button', { name: 'Salvar mudanças' });
  if (MODO === 'tutorial') {
    await test.step('Print 32 — campo Cargo e Salvar mudanças', async () => {
      await campoCargo(page).scrollIntoViewIfNeeded();
      await capturar(page, {
        pasta,
        arquivo: 'print-32.png',
        area: campoCargo(page).or(salvar),
        alvos: [
          { elemento: campoCargo(page), numero: 1, seta: false, ladoNumero: 'esquerda' },
          { elemento: salvar, numero: 2, seta: 'cima' },
        ],
        margem: 8,
      });
    });
  }

  if (!(antes.length === 1 && antes[0] === alvo)) {
    await salvar.click();
    await expect(page.locator('.modal.show')).toHaveCount(0, { timeout: 60_000 });
    // Confere reabrindo a edição
    const { editar: editarDeNovo } = await abrirEdicao(page);
    await editarDeNovo.click();
    await expect(campoCargo(page)).toBeVisible();
    await page.waitForTimeout(2500);
    const depois = await cargoAtual(page);
    console.log(`>> Cargo salvo da ${USUARIO}: ${JSON.stringify(depois)}`);
    expect(depois).toEqual([alvo]);
  }
});
