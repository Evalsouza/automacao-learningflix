import { test, expect, type Locator, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL, PASTA_PRINTS_JUDY as pasta } from '../caminhos';
import { borrarParcial, capturar, ocultarJudy } from '../marcacoes';

// Tutorial competências com a Judy — configuração (Administrador Geral): print-01.png … print-04.png
// Só leitura: não altera nenhuma configuração. Token e IDs das assistentes ficam parcialmente borrados.

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'domcontentloaded' });
  if (/\/login\//.test(new URL(page.url()).pathname)) throw new Error('Sessão do Administrador expirada: rode "npm run tutorial:login".');
  await page.locator('#region-main').waitFor();
  await page.waitForTimeout(2500);
}

// Linha de configuração do Moodle (rótulo + campo) pelo texto do rótulo
const linha = (raiz: Locator, rotulo: RegExp) =>
  raiz
    .locator('.form-item')
    .filter({ has: raiz.page().locator('.form-label label', { hasText: rotulo }) })
    .first();

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão do Administrador: rode "npm run tutorial:login".');
});

test('Tutorial Judy — configuração (Administrador Geral)', async ({ page, context }) => {
  test.setTimeout(8 * 60_000);
  page.setDefaultTimeout(120_000); // QA lento com o Administrador
  await ocultarJudy(context);

  await test.step('Print 01 — Plugins locais > Judy > Configurações de integração', async () => {
    await abrir(page, '/admin/search.php');
    await page.getByRole('tab', { name: 'Plugins', exact: true }).filter({ visible: true }).first().click();
    const painel = page.locator('.tab-pane.active');
    const link = painel.locator('a[href*="section=local_judy_integration_settings"]').first();
    const titulo = painel.getByText('Plugins locais', { exact: true }).first();
    await capturar(page, {
      pasta,
      arquivo: 'print-01.png',
      area: titulo.or(link),
      alvos: [{ elemento: link, seta: 'direita' }],
      margem: 40,
    });
  });

  await test.step('Print 02 — URL da API da Judy e Token de acesso', async () => {
    await abrir(page, '/admin/settings.php?section=local_judy_integration_settings');
    const linhas = linha(page.locator('#region-main'), /URL da API da Judy/).or(
      linha(page.locator('#region-main'), /^\s*Token de acesso\s*$/),
    );
    await expect(linhas).toHaveCount(2);
    await borrarParcial(linhas.locator('.form-setting input:not([type="hidden"]), .form-setting [data-passwordunmask="displayvalue"]'));
    await borrarParcial(linhas.locator('.form-defaultinfo'), 0.2);
    await capturar(page, {
      pasta,
      arquivo: 'print-02.png',
      area: linhas,
      alvos: [{ elemento: linhas.locator('.form-setting'), seta: false }],
    });
  });

  await test.step('Print 03 — Aparência > Tema', async () => {
    await abrir(page, '/admin/search.php');
    const aba = page.getByRole('tab', { name: 'Aparência', exact: true }).filter({ visible: true }).first();
    await aba.click();
    const link = page.locator('.tab-pane.active a[href*="section=themesettingsmart"]').first();
    console.log(`>> Link do tema: "${(await link.innerText()).trim()}"`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, {
      pasta,
      arquivo: 'print-03.png',
      area: aba.or(link),
      alvos: [
        { elemento: aba, numero: 1, seta: 'cima' },
        { elemento: link, numero: 2, seta: 'direita' },
      ],
      margem: 40,
    });
  });

  await test.step('Print 04 — aba Configurações de IA e IDs das assistentes', async () => {
    await abrir(page, '/admin/settings.php?section=themesettingsmart');
    const aba = page.getByRole('tab', { name: /Configurações de IA/ }).first();
    await aba.click();
    await page.waitForTimeout(1200);
    const painel = page.locator('.tab-pane.active');
    const geral = linha(painel, /ID da assistente geral/);
    const cliente = linha(painel, /ID da assistente do cliente/);
    await borrarParcial(geral.locator('.form-setting input').first());
    await borrarParcial(cliente.locator('.form-setting input').first());
    await borrarParcial(geral.locator('.form-defaultinfo').or(cliente.locator('.form-defaultinfo')), 0.2);
    const iguais = await page.evaluate(() => {
      const v = (n: string) => (document.querySelector(`[name="s_theme_smart_${n}"]`) as HTMLInputElement | null)?.value ?? '';
      return {
        iguais: v('ai_assistantid') === v('ai_assistantid_client'),
        tamanhos: [v('ai_assistantid').length, v('ai_assistantid_client').length],
      };
    });
    console.log(`>> IDs das assistentes iguais? ${JSON.stringify(iguais)}`);
    await capturar(page, {
      pasta,
      arquivo: 'print-04.png',
      area: aba.or(cliente),
      alvos: [
        { elemento: aba, numero: 1, seta: false, ladoNumero: 'direita' },
        { elemento: geral.locator('.form-setting input').first(), numero: 2, seta: false, ladoNumero: 'direita' },
        { elemento: cliente.locator('.form-setting input').first(), numero: 3, seta: false, ladoNumero: 'direita' },
      ],
      margem: 16,
    });
  });
});
