import { test, expect, type Locator, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL_CLIENTE, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 3, configuração do curso e das atividades antes de gerar (Adm Cliente, curso 325):
// print-17 (Gerar descrição com IA), print-20 (pacote SCORM), print-22 (Fonte do vídeo), print-23 (Vimeo),
// print-24 (VideoHub) e print-27 (arquivo PDF). Só leitura: abre os formulários e NÃO salva.

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão do Adm Cliente expirada: rode "npm run tutorial:login:cliente".');
  await page.waitForTimeout(2500);
}

// Abre a seção do formulário se ela estiver recolhida
async function expandir(secao: Locator) {
  const recolhida = secao.locator(
    'legend a[aria-expanded="false"], [data-toggle="collapse"][aria-expanded="false"], [data-bs-toggle="collapse"][aria-expanded="false"]',
  );
  if (await recolhida.count()) await recolhida.first().click();
}

// Item do formulário (rótulo + campo) pelo texto do rótulo
const item = (raiz: Locator, rotulo: RegExp) =>
  raiz
    .locator('.fitem, .form-group')
    .filter({ has: raiz.page().locator('label, .col-form-label', { hasText: rotulo }) })
    .first();

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do Adm Cliente: rode "npm run tutorial:login:cliente".');
});

test('Tutorial Skill Link — seção 3, configuração antes de gerar (Adm Cliente)', async ({ page, context }) => {
  test.setTimeout(6 * 60_000);
  page.setDefaultTimeout(60_000);
  await ocultarJudy(context);

  await test.step('Print 17 — Descrição e Gerar descrição com IA (curso)', async () => {
    await abrir(page, '/course/edit.php?id=325');
    const secao = page.locator('#id_descriptionhdr');
    await expandir(secao);
    const botao = secao.getByRole('button', { name: 'Gerar descrição com IA' }).first();
    await expect(botao).toBeVisible();
    await capturar(page, { pasta, arquivo: 'print-17.png', area: secao, alvos: [{ elemento: botao, seta: 'esquerda' }] });
  });

  await test.step('Print 20 — Pacote do SCORM', async () => {
    await abrir(page, '/course/modedit.php?update=3076');
    const secao = page.locator('#id_packagehdr');
    await expandir(secao);
    // Nome do pacote na lista de arquivos (a linha da tabela com o .zip)
    const arquivo = secao
      .locator('tr')
      .filter({ hasText: /\.zip/ })
      .filter({ visible: true })
      .first()
      .locator('a')
      .filter({ hasText: /\.zip/ })
      .first();
    await capturar(page, { pasta, arquivo: 'print-20.png', area: secao, alvos: [{ elemento: arquivo, seta: 'direita' }] });
  });

  await test.step('Prints 22 e 23 — Fonte do vídeo e campos do Vimeo', async () => {
    await abrir(page, '/course/modedit.php?update=3078');
    const geral = page.locator('#id_general');
    const fonte = page.locator('#id_videosource');
    await expect(fonte).toHaveValue('url'); // "Vimeo"
    // Mostra as três opções abertas (só visual): vira lista de 3 linhas e volta depois
    await fonte.evaluate((s: HTMLSelectElement) => {
      s.size = 3;
      s.style.height = 'auto';
    });
    await capturar(page, {
      pasta,
      arquivo: 'print-22.png',
      area: item(geral, /Fonte do vídeo/),
      alvos: [{ elemento: fonte, seta: 'direita' }],
      margem: 16,
    });
    await fonte.evaluate((s: HTMLSelectElement) => {
      s.size = 0;
      s.style.height = '';
    });
    const url = item(geral, /^\s*URL do vídeo/);
    await capturar(page, {
      pasta,
      arquivo: 'print-23.png',
      area: item(geral, /Fonte do vídeo/).or(url),
      alvos: [
        { elemento: fonte, numero: 1, seta: false, ladoNumero: 'direita' },
        { elemento: url.locator('input').first(), numero: 2, seta: false, ladoNumero: 'direita' },
      ],
      margem: 16,
    });
  });

  await test.step('Print 24 — campos do VideoHub', async () => {
    await abrir(page, '/course/modedit.php?update=3079');
    const geral = page.locator('#id_general');
    await expect(page.locator('#id_videosource')).toHaveValue('videohub');
    const campos = item(geral, /VideoHub: ID do vídeo/)
      .or(item(geral, /VideoHub: URL de transcrição/))
      .or(item(geral, /VideoHub: Código Embed/));
    await capturar(page, {
      pasta,
      arquivo: 'print-24.png',
      area: item(geral, /Fonte do vídeo/).or(campos),
      alvos: [{ elemento: campos, seta: false }],
      margem: 16,
    });
  });

  await test.step('Print 27 — arquivo PDF da atividade Arquivo', async () => {
    await abrir(page, '/course/modedit.php?update=3075');
    const secao = page.locator('#id_files_fieldset').or(page.locator('[id^="fitem_id_files"]')).first();
    const tipo = page.getByText('Documento PDF', { exact: true }).filter({ visible: true }).first();
    const nome = page
      .getByText(/\.pdf$/)
      .filter({ visible: true })
      .first();
    await capturar(page, {
      pasta,
      arquivo: 'print-27.png',
      area: secao,
      alvos: [
        { elemento: nome, numero: 1, seta: false, ladoNumero: 'esquerda' },
        { elemento: tipo, numero: 2, seta: false, ladoNumero: 'direita' },
      ],
      margem: 12,
    });
  });
});
