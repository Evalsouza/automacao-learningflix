import { test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { SESSAO_TUTORIAL_CLIENTE } from '../caminhos';
import { ocultarJudy } from '../marcacoes';

// Tutorial: Converter PPTX para SCORM — mapeamento (adm.cliente). Só leitura: procura o link do conversor
// nos menus e no painel do cliente e grava a estrutura da tela. Não envia arquivo nem formulário.
// Saída em MAPA_SAIDA (fora do projeto).

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_CLIENTE)) throw new Error('Sem sessão do adm.cliente: rode "npm run tutorial:login:cliente".');
});

const links = (page: Page) =>
  page.locator('a[href]').evaluateAll((as) =>
    as
      .map((a) => ({
        texto: (a.textContent ?? '').replace(/\s+/g, ' ').trim() || a.getAttribute('title') || a.getAttribute('aria-label') || '',
        href: (a as HTMLAnchorElement).href,
      }))
      .filter((l) => /pptx|scorm|convers|convert|powerpoint/i.test(`${l.texto} ${l.href}`)),
  );

test('Mapear conversor PPTX para SCORM (só leitura)', async ({ page, context }) => {
  test.setTimeout(8 * 60_000);
  page.setDefaultTimeout(90_000);
  await ocultarJudy(context);
  const saida = process.env.MAPA_SAIDA ?? 'test-results/mapa-conversor';
  mkdirSync(saida, { recursive: true });
  const mapa: Record<string, unknown> = {};

  for (const caminho of ['/my/', '/theme/smart/client_admin.php']) {
    await page.goto(caminho, { waitUntil: 'domcontentloaded' });
    if (/\/login\//.test(new URL(page.url()).pathname))
      throw new Error('Sessão do adm.cliente expirada: rode "npm run tutorial:login:cliente".');
    await page.waitForTimeout(4000);
    mapa[caminho] = await links(page);
    await page.screenshot({ path: path.join(saida, `${caminho.replace(/\W+/g, '_')}.png`) });
  }

  const candidatos = [...new Set(Object.values(mapa).flatMap((l) => (l as { href: string }[]).map((x) => x.href)))];
  mapa.candidatos = candidatos;
  const alvo = candidatos.find((h) => /pptx|convert|convers/i.test(h));
  if (alvo) {
    await page.goto(alvo, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    mapa.tela = await page
      .locator('#region-main, main, body')
      .first()
      .evaluate((raiz) => {
        const txt = (e: Element | null) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
        const visivel = (e: Element) => (e as HTMLElement).offsetParent !== null;
        return {
          url: location.href,
          titulos: [...raiz.querySelectorAll('h1,h2,h3,h4,legend,label')].filter(visivel).map((e) => `${e.tagName} ${txt(e)}`),
          campos: [...raiz.querySelectorAll('input,select,textarea')].map((e) => {
            const i = e as HTMLInputElement;
            return `${e.tagName.toLowerCase()}${i.id ? '#' + i.id : ''} type=${i.type} name=${i.name} accept=${i.accept ?? ''} visivel=${visivel(e)} classe=${i.className}`;
          }),
          botoes: [...raiz.querySelectorAll('button,a.btn,input[type=submit],[role=button]')]
            .filter(visivel)
            .map((e) => `${e.tagName.toLowerCase()}.${(e as HTMLElement).className} "${txt(e) || (e as HTMLInputElement).value}"`),
          texto: txt(raiz).slice(0, 4000),
        };
      });
    await page.screenshot({ path: path.join(saida, 'conversor.png'), fullPage: true });
  }
  writeFileSync(path.join(saida, 'mapa.json'), JSON.stringify(mapa, null, 2));
  console.log(`>> Mapa salvo em ${saida} — conversor: ${alvo ?? 'não encontrado'}`);
});
