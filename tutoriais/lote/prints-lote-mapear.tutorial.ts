import { test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { SESSAO_TUTORIAL } from '../caminhos';
import { ocultarJudy } from '../marcacoes';

// Tutorial Gerar Competências em Lote — mapeamento da tela local/skillbox/migration.php (Administrador Geral).
// Só leitura: troca de aba, abre a ajuda "O que é isso?" e filtra o acompanhamento; não clica em
// "Alterar todos em lote" nem em "Tentar novamente". Grava o mapa e capturas de conferência em MAPA_SAIDA.

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão do Administrador: rode "npm run tutorial:login".');
});

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'domcontentloaded' });
  if (/\/login\//.test(new URL(page.url()).pathname)) throw new Error('Sessão do Administrador expirada: rode "npm run tutorial:login".');
  await page.locator('#region-main').waitFor();
  await page.waitForTimeout(2500);
}

// Estrutura visível da área principal (rótulos, botões, avisos e primeiras linhas da tabela)
const estrutura = (page: Page) =>
  page.locator('#region-main').evaluate((raiz) => {
    const txt = (e: Element | null) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const visivel = (e: Element) => (e as HTMLElement).offsetParent !== null;
    const desc = (e: Element) => {
      const h = e as HTMLElement;
      const cls = typeof h.className === 'string' && h.className.trim() ? `.${h.className.trim().split(/\s+/).join('.')}` : '';
      return `${e.tagName.toLowerCase()}${h.id ? `#${h.id}` : ''}${cls}`;
    };
    const unicos = (l: string[]) => [...new Set(l)];
    return {
      botoesVisiveis: unicos(
        [...raiz.querySelectorAll('button,a.btn,input[type=submit]')]
          .filter(visivel)
          .map(
            (e) =>
              `${desc(e)} "${txt(e) || (e as HTMLInputElement).value}" disabled=${(e as HTMLButtonElement).disabled} form=${e.closest('form')?.getAttribute('action') ?? '-'}`,
          ),
      ),
      textosOcultos: unicos(
        [...raiz.querySelectorAll('p,div,span')].filter((e) => !visivel(e) && txt(e) && e.children.length === 0).map(txt),
      ).slice(0, 30),
      avisosVisiveis: [...raiz.querySelectorAll('.alert,[role=alert],.sb-migration-running,[class*=running],[class*=notice]')]
        .filter(visivel)
        .map((e) => `${desc(e)} ${txt(e)}`),
      opcoesStatus: [...raiz.querySelectorAll('select[name=f_status] option')].map((o) => `${(o as HTMLOptionElement).value}=${txt(o)}`),
      linhas: [...raiz.querySelectorAll('table tbody tr')].slice(0, 6).map((r) => txt(r).slice(0, 160)),
      total: txt(raiz.querySelector('[class*=pagination]')?.parentElement ?? null).slice(0, 120),
    };
  });

test('Mapear tela de geração em lote (só leitura)', async ({ page, context }) => {
  test.setTimeout(8 * 60_000);
  page.setDefaultTimeout(120_000);
  await ocultarJudy(context);
  const saida = process.env.MAPA_SAIDA ?? 'test-results/mapa-lote';
  mkdirSync(saida, { recursive: true });
  const mapa: Record<string, unknown> = {};

  await abrir(page, '/local/skillbox/migration.php');
  mapa.cargos = await estrutura(page);

  // Pendentes e em processamento no acompanhamento (filtro de status por GET)
  for (const status of ['pending', 'processing', 'pendente', 'processando', '0', '1']) {
    const opcao = page.locator(`select[name=f_status] option[value="${status}"]`);
    if (!(await opcao.count())) continue;
    await abrir(page, `/local/skillbox/migration.php?entitytype=position&f_status=${status}`);
    mapa[`cargos_status_${status}`] = (await estrutura(page)).linhas;
  }

  // Ajuda "O que é isso?"
  await abrir(page, '/local/skillbox/migration.php');
  await page.locator('button.sb-migration-help').first().click();
  await page.waitForTimeout(1500);
  mapa.ajuda = await page
    .locator('.modal.show, [role=dialog]:visible, .popover, .sb-migration-help-content')
    .filter({ visible: true })
    .allInnerTexts();
  await page.screenshot({ path: path.join(saida, 'ajuda.png') });
  await page.keyboard.press('Escape');

  // Aba SCORMs LFX (só a tela)
  await abrir(page, '/local/skillbox/migration.php');
  await page
    .getByRole('button', { name: 'SCORMs LFX' })
    .or(page.getByRole('link', { name: 'SCORMs LFX' }))
    .first()
    .click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  mapa.scormUrl = page.url();
  mapa.scorm = await estrutura(page);
  await page.screenshot({ path: path.join(saida, 'scorm.png'), fullPage: true });

  writeFileSync(path.join(saida, 'mapa2.json'), JSON.stringify(mapa, null, 2));
  console.log(`>> Mapa salvo em ${saida}`);
});
