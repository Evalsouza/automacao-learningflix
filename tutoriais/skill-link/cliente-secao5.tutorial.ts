import { test, expect, type Locator, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { SESSAO_TUTORIAL_CLIENTE, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy, type Captura } from '../marcacoes';

// Tutorial Skill Link — Seção 5 (cargos), visão do Adm Cliente: print-32.png … print-37.png
//
// CONSOME CRÉDITOS E GRAVA DADOS (aprovado pela QA em 10/11): cria o cargo CARGO pelo fluxo
// "Encontrar cargos similares no Skill Link" → "Usar esta referência" → Salvar. Se o cargo já
// existir, NÃO cria de novo (não gasta crédito).

const CARGO = 'Analista de Atendimento ao Cliente';
const CARGOS = '/local/hierarchy/index.php/positions';
const ESPERA_IA = 3 * 60_000;

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão do Adm Cliente expirada: rode "npm run tutorial:login:cliente".');
}

const janelaAberta = (page: Page) => page.locator('.modal.show .modal-content').filter({ visible: true }).last();

// Print com marcações; se alguma marcação falhar, salva o print sem marcações (e avisa) para não perder a etapa
async function capturaSegura(page: Page, dados: Captura, reserva: Locator) {
  try {
    await capturar(page, dados);
  } catch (erro) {
    console.log(`>> ${dados.arquivo}: SEM MARCAÇÕES (${String(erro).split('\n')[0].slice(0, 120)})`);
    mkdirSync(pasta, { recursive: true });
    await reserva.screenshot({ path: path.join(pasta, dados.arquivo) });
  }
}

async function registrar(rotulo: string, alvo: Locator) {
  const texto = (await alvo.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  const botoes = await alvo
    .locator('button, a.btn, input[type=submit]')
    .evaluateAll((bs) => bs.map((b) => (b as HTMLElement).innerText.trim() || (b as HTMLInputElement).value).filter(Boolean))
    .catch(() => []);
  console.log(`>> ${rotulo}: ${texto.slice(0, 600)}`);
  console.log(`>> ${rotulo} — botões: ${JSON.stringify(botoes)}`);
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do Adm Cliente: rode "npm run tutorial:login:cliente".');
});

test('Tutorial Skill Link — seção 5 (Adm Cliente): cria o cargo', async ({ page, context }) => {
  test.setTimeout(15 * 60_000);
  await ocultarJudy(context);
  page.setDefaultTimeout(60_000); // nenhuma ação espera mais que 1 min (a geração tem espera própria)
  await abrir(page, CARGOS);

  // O cargo já foi criado em 10/11. A lista é montada por JavaScript, então não dá para conferir pelo HTML:
  // para não duplicar, só cria com CRIAR_CARGO=sim (gasta crédito e grava um cargo novo)
  // RECAPTURAR=sim refaz os prints 32 a 37 SEM salvar o cargo ("Encontrar" e "Usar esta referência" podem gastar crédito)
  const RECAPTURAR = process.env.RECAPTURAR === 'sim';
  if (process.env.CRIAR_CARGO !== 'sim' && !RECAPTURAR) {
    console.log(`>> Sem CRIAR_CARGO=sim ou RECAPTURAR=sim: não faz nada ("${CARGO}" já existe no QA desde 10/11)`);
    return;
  }

  const adicionar = page
    .getByRole('button', { name: /Adicionar/ })
    .or(page.getByRole('link', { name: /Adicionar/ }))
    .filter({ visible: true })
    .last();
  const abaCargos = page
    .getByRole('link', { name: 'Cargos', exact: true })
    .or(page.getByRole('tab', { name: 'Cargos', exact: true }))
    .filter({ visible: true })
    .first();

  await test.step('Print 32 — aba Cargos e botão Adicionar', async () => {
    await capturaSegura(
      page,
      {
        pasta,
        arquivo: 'print-32.png',
        area: 'tela',
        alvos: [
          { elemento: abaCargos, numero: 1, seta: 'baixo' },
          { elemento: adicionar, numero: 2, seta: 'esquerda' },
        ],
      },
      page.locator('body'),
    );
  });

  await adicionar.click();
  const janela = janelaAberta(page);
  await expect(janela).toContainText('Adicionar cargo');
  const nome = janela.getByPlaceholder('Digite o nome do cargo');
  await nome.fill(CARGO);
  const encontrar = janela.getByRole('button', { name: /Encontrar cargos similares/ });

  await test.step('Print 33 — nome do cargo e Encontrar cargos similares', async () => {
    await capturaSegura(
      page,
      {
        pasta,
        arquivo: 'print-33.png',
        area: janela,
        alvos: [
          { elemento: nome, numero: 1, seta: false, ladoNumero: 'esquerda' },
          { elemento: encontrar, numero: 2, seta: false, ladoNumero: 'direita' },
        ],
        margem: 8,
      },
      janela,
    );
  });

  await test.step('Encontrar cargos similares (Skill Link)', async () => {
    console.log('>> Clicando em "Encontrar cargos similares no Skill Link"');
    await encontrar.click();
    await expect(janela.getByText(/similares encontrados/i)).toBeVisible({ timeout: ESPERA_IA });
    await page.waitForTimeout(1500);
    await registrar('Resultado', janela);
  });

  // Lista sanfonada de cargos similares, logo abaixo do texto "Cargos similares encontrados"
  const tabela = janela.getByText(/similares encontrados/i).locator('xpath=following-sibling::*[1]');
  await test.step('Print 34 — cargos similares encontrados', async () => {
    await capturaSegura(
      page,
      { pasta, arquivo: 'print-34.png', area: janela, alvos: [{ elemento: tabela, seta: false }], margem: 8 },
      janela,
    );
  });

  // Expande a primeira linha para mostrar "Usar esta referência" e "Visualizar Cargo"
  await tabela.locator(':scope > *').first().click();
  await page.waitForTimeout(1200);
  const usar = janela
    .getByRole('button', { name: /Usar esta referência/ })
    .filter({ visible: true })
    .first();
  const visualizar = janela
    .getByRole('button', { name: /Visualizar cargo/i })
    .filter({ visible: true })
    .first();
  await expect(usar).toBeVisible({ timeout: 15_000 });
  await registrar('Linha expandida', tabela);

  await test.step('Print 35 — Visualizar Cargo e Usar esta referência', async () => {
    await capturaSegura(
      page,
      {
        pasta,
        arquivo: 'print-35.png',
        area: tabela,
        alvos: [
          { elemento: visualizar, numero: 1, seta: false, ladoNumero: 'direita' },
          { elemento: usar, numero: 2, seta: false, ladoNumero: 'esquerda' },
        ],
        margem: 8,
      },
      janela,
    );
  });

  await test.step('Print 36 — painel Visualizar cargo', async () => {
    if (!(await visualizar.count())) return console.log('>> Sem botão "Visualizar cargo": print 29 pulado');
    await visualizar.click();
    // Painel com o título do cargo (h6), "Resumo do cargo", "Competências associadas" e "Distribuição por categoria"
    const titulo = page.locator('h6').filter({ hasText: CARGO }).filter({ visible: true }).last();
    await expect(titulo).toBeVisible();
    const painel = titulo.locator('xpath=ancestor::*[.//*[normalize-space()="Distribuição por categoria"]][1]');
    // Espera os indicadores de carregamento do resumo, das competências e do gráfico sumirem
    await expect(
      painel.locator('.spinner-border, .spinner-grow, [class*="spinner"], [class*="loading"]').filter({ visible: true }),
    ).toHaveCount(0, { timeout: 90_000 });
    await page.waitForTimeout(1500);
    await registrar('Painel Visualizar cargo', painel);
    await capturaSegura(
      page,
      { pasta, arquivo: 'print-36.png', area: painel, alvos: [{ elemento: painel, seta: false }], margem: 8, espera: 1500 },
      painel,
    );
    // Fecha só o painel (botão ao lado do título), nunca a janela "Adicionar cargo"
    await titulo.locator('xpath=following-sibling::button[1]').click();
    await expect(titulo).toBeHidden();
    await expect(janela).toContainText('Adicionar cargo');
  });

  await test.step('Usar esta referência e Print 37 — descrição e competências', async () => {
    console.log('>> Clicando em "Usar esta referência"');
    await usar.click();
    await expect(
      janela
        .getByText(/geradas com sucesso/i)
        .or(janela.getByText(/\d+\s+selecionadas/i))
        .first(),
    ).toBeVisible({ timeout: ESPERA_IA });
    await page.waitForTimeout(2000);
    // O contador começa em "0 selecionadas" e sobe quando as competências da referência carregam
    const numeroSelecionadas = async () =>
      Number(
        /(\d+)/.exec(
          (await janela
            .getByText(/\d+\s+selecionadas/i)
            .first()
            .innerText()
            .catch(() => '0')) ?? '0',
        )?.[1] ?? 0,
      );
    await expect.poll(numeroSelecionadas, { timeout: ESPERA_IA, intervals: [2000] }).toBeGreaterThan(0);
    // A camada do painel "Visualizar cargo" pode continuar sobre a janela: fecha clicando fora do painel
    const camada = page.locator('.job-preview-overlay').filter({ visible: true });
    if (await camada.count()) {
      await camada.first().click({ position: { x: 5, y: 5 } });
      await expect(camada).toHaveCount(0);
    }
    await page.waitForTimeout(1000);
    await registrar('Depois de usar a referência', janela);
    const valorDescricao = await janela
      .getByLabel(/Descrição do cargo/)
      .inputValue()
      .catch(() => '(não lido)');
    console.log(`>> Descrição do cargo preenchida: "${valorDescricao.slice(0, 200)}"`);
    const descricao = janela.getByLabel(/Descrição do cargo/);
    const contador = janela.getByText(/\d+\s+selecionadas/i).first();
    await capturaSegura(
      page,
      {
        pasta,
        arquivo: 'print-37.png',
        area: janela,
        alvos: [
          { elemento: descricao, numero: 1, seta: false, ladoNumero: 'direita' },
          { elemento: contador, numero: 2, seta: false, ladoNumero: 'direita' },
        ],
        margem: 8,
      },
      janela,
    );
  });

  if (RECAPTURAR) {
    // Não salva: ao fim do teste o navegador fecha com a janela aberta, e nada é gravado
    console.log('>> RECAPTURAR: prints refeitos sem salvar o cargo');
    return;
  }

  await test.step('Salvar o cargo', async () => {
    await janela.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.locator('.modal.show')).toHaveCount(0, { timeout: 60_000 });
    await page.waitForTimeout(2000);
    await abrir(page, CARGOS);
    console.log(`>> Cargo "${CARGO}" salvo — confira no filtro "Cargo" do Gerenciador de Hierarquia`);
  });
});
