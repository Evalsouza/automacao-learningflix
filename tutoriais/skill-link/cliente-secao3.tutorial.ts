import { test, expect, type Locator, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL_CLIENTE as SESSAO_TUTORIAL, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 3, na visão do Adm Cliente (Gere competências em cursos e atividades), curso 325
// "Geração de Competências com Skill Link" — massa indicada pela QA (10/11).
//
// CONSOME CRÉDITOS E GRAVA DADOS (aprovado pela QA): clica em "Gerar competências com o Skill Link"
// uma vez no curso e em cada atividade e salva. Item que já tem competências marcadas NÃO é gerado de
// novo: o script só captura a tela como está (sem gastar crédito).

const CURSO = 325;
// arquivo null = gera (se preciso) sem print; o SCORM do Lizza tem a mesma tela do SCORM do cliente
const ITENS = [
  { arquivo: 'print-17.png', rotulo: 'Curso', url: `/course/edit.php?id=${CURSO}`, atividade: false },
  { arquivo: 'print-19.png', rotulo: 'SCORM do cliente', url: '/course/modedit.php?update=3076', atividade: true },
  { arquivo: null, rotulo: 'SCORM Lizza', url: '/course/modedit.php?update=3077', atividade: true },
  { arquivo: 'print-20.png', rotulo: 'Vídeo (Vimeo)', url: '/course/modedit.php?update=3078', atividade: true },
  { arquivo: 'print-21.png', rotulo: 'Arquivo', url: '/course/modedit.php?update=3075', atividade: true },
];
const GERAR = process.env.GERAR === 'sim'; // sem GERAR=sim, nunca clica em "Gerar" (não gasta crédito)
const ESPERA_GERACAO = 4 * 60_000; // Prisma em QA: a extração de SCORM e vídeo pode demorar

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname)) {
    throw new Error('Sessão expirada: rode "npm run tutorial:login:cliente".');
  }
}

const secaoSkill = (page: Page) =>
  page
    .locator('fieldset')
    .filter({ has: page.locator('legend', { hasText: 'Skill Link' }) })
    .first();

async function selecionadas(secao: Locator) {
  const texto =
    (await secao
      .getByText(/\d+\s+competências? selecionadas?/)
      .first()
      .textContent()) ?? '0';
  return Number(/\d+/.exec(texto)?.[0] ?? 0);
}

// Linhas marcadas na tabela (para conferir e para o relatório)
async function marcadas(secao: Locator) {
  return secao
    .locator('tbody tr')
    .evaluateAll((linhas) =>
      linhas
        .filter((tr) => (tr.querySelector('input[type=checkbox]') as HTMLInputElement | null)?.checked)
        .map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, ' ').trim()),
    );
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão salva: rode "npm run tutorial:login:cliente" primeiro.');
});

test('Tutorial Skill Link — prints da seção 3 (gera competências)', async ({ page, context }) => {
  test.setTimeout(GERAR ? ITENS.length * (ESPERA_GERACAO + 120_000) : 6 * 60_000);
  await ocultarJudy(context);

  for (const item of ITENS) {
    await test.step(`${item.rotulo} — gerar, capturar e salvar`, async () => {
      await abrir(page, item.url);
      const secao = secaoSkill(page);
      const expandir = secao.locator('legend a[aria-expanded="false"], legend [data-bs-toggle="collapse"][aria-expanded="false"]');
      if (await expandir.count()) await expandir.first().click();
      const botao = secao.getByRole('button', { name: 'Gerar competências com o Skill Link' });
      await expect(botao).toBeVisible();

      const antes = await selecionadas(secao);
      let gerou = false;
      if (antes === 0 && !GERAR) {
        throw new Error(`${item.rotulo}: sem competências. Para gerar (gasta crédito), rode com GERAR=sim`);
      }
      if (antes === 0) {
        console.log(`>> ${item.rotulo}: gerando competências (consome crédito, exceto SCORM do Lizza)`);
        await botao.click();
        gerou = true;
        await expect
          .poll(() => selecionadas(secao), {
            timeout: ESPERA_GERACAO,
            intervals: [3000],
            message: `${item.rotulo}: nenhuma competência após gerar`,
          })
          .toBeGreaterThan(0);
      } else {
        console.log(`>> ${item.rotulo}: já tem ${antes} competências — não gera de novo`);
      }
      const lista = await marcadas(secao);
      console.log(`>> ${item.rotulo}: ${lista.length} marcadas — ${lista.slice(0, 6).join(' | ')}`);

      // Captura a seção como está: 1 botão Gerar, 2 contador e 3 filtro de categoria (curso) ou
      // etiqueta "curso" das competências que vêm do curso (atividades)
      const contador = secao.getByText(/\d+\s+competências? selecionadas?/).first();
      const terceiro = item.atividade
        ? secao.getByText('curso', { exact: true }).first()
        : secao.locator('select').filter({ visible: true }).first();
      if (item.arquivo) {
        await capturar(page, {
          pasta,
          arquivo: item.arquivo,
          area: secao,
          alvos: [
            { elemento: botao, numero: 1, seta: 'baixo' },
            { elemento: contador, numero: 2, seta: false, ladoNumero: 'direita' },
            { elemento: terceiro, numero: 3, seta: false, ladoNumero: item.atividade ? 'direita' : 'esquerda' },
          ],
          espera: 1500,
        });
      }

      // Nome exato dos botões de salvar (para o texto do tutorial)
      const salvar = await page
        .locator('input[type=submit], button[type=submit]')
        .evaluateAll((bs) =>
          bs.map((b) => (b as HTMLInputElement).value || (b as HTMLElement).innerText).filter((t) => /Salvar|Cancelar/.test(t)),
        );
      console.log(`>> ${item.rotulo}: botões ${JSON.stringify(salvar)}`);

      // Print 18 — competência expandida, com descrição (só abre a descrição; não altera nada)
      if (!item.atividade) {
        const linhas = secao.locator('tbody tr').filter({ visible: true });
        const expandir = (tr: Locator) =>
          tr.evaluate((n) => {
            const ultima = n.querySelector('td:last-child') as HTMLElement | null;
            const alvo =
              (ultima?.querySelector('i, svg, [class*="chev"], [class*="toggle"], [class*="expand"]') as HTMLElement | null) ?? ultima;
            alvo?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          });
        // Procura, entre as primeiras linhas marcadas, uma competência com descrição
        let escolhida: Locator | null = null;
        for (let i = 0; i < 12 && !escolhida; i++) {
          const linha = linhas.nth(i);
          await expandir(linha);
          await page.waitForTimeout(700);
          const desc = (await linhas.nth(i + 1).innerText()).replace(/\s+/g, ' ').trim();
          if (desc && !/Sem descrição disponível/.test(desc)) {
            escolhida = linha;
            console.log(`>> Expandida: ${(await linha.innerText()).replace(/\s+/g, ' ').trim()} — ${desc.slice(0, 120)}`);
          } else {
            await expandir(linha); // fecha de novo
            await page.waitForTimeout(400);
          }
        }
        if (!escolhida) throw new Error('Nenhuma das 12 primeiras competências do curso tem descrição');
        const descricao = escolhida.locator('xpath=following-sibling::tr[1]');
        await capturar(page, {
          pasta,
          arquivo: 'print-18.png',
          area: descricao.locator('xpath=following-sibling::tr[1]'),
          alvos: [{ elemento: escolhida.or(descricao), seta: false }],
          margem: 8,
        });
      }

      if (gerou) {
        await page
          .getByRole('button', { name: /^Salvar e (voltar ao curso|mostrar)$/ })
          .first()
          .click();
        await page.waitForLoadState('load');
        await expect(page).not.toHaveURL(/edit\.php|modedit\.php/);
        console.log(`>> ${item.rotulo}: salvo`);
      }
    });
  }
});
