import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import path from 'path';
import { SESSAO_TUTORIAL, PASTA_PRINTS_SKILL_LINK as pasta } from '../caminhos';
import { borrar, capturar, ocultarJudy } from '../marcacoes';

// Tutorial Skill Link — Seção 1 (Configurar o Skill Link): print-01.png … print-08.png
//
// ALTERA CONFIGURAÇÃO DO QA (pedido da QA): em "Configurações de competências" marca de volta
// "Habilitar geração de competências com IA para cursos" e salva — estado original: as 5 opções de IA
// marcadas e "Créditos iniciais" = 500. O botão "Gerar competências com o Skill Link" NÃO é clicado
// e o formulário do curso 283 NÃO é salvo.

const CONFIG_SKILLBOX = '/admin/settings.php?section=local_skillbox';
const CURSO = '/course/edit.php?id=283';
const CREDITOS_INICIAIS = '500';

// Linha de uma configuração do Moodle (rótulo + campo + "Padrão: …") pelo texto do rótulo
const linha = (page: Page, rotulo: string | RegExp) =>
  page.locator('.form-item').filter({ has: page.locator('.form-label label', { hasText: rotulo }) });

// Campos com URL, chave e token: borrados na tela antes de QUALQUER print da página de configuração
const camposSensiveis = (page: Page) =>
  page.locator('.form-item').filter({
    has: page.locator('.form-label label', { hasText: /URL da API Prisma|Chave de API Prisma|URL da Lizza|Token da Lizza/ }),
  });

async function borrarSegredos(page: Page) {
  const linhas = camposSensiveis(page);
  await expect(linhas, 'Esperados os 4 campos Prisma/Lizza').toHaveCount(4);
  // Valor digitado, máscara da senha e o "Padrão: …" (que pode trazer a URL)
  await borrar(
    linhas.locator(
      '.form-setting input:not([type="hidden"]), .form-setting textarea, .form-setting [data-passwordunmask="displayvalue"], .form-defaultinfo',
    ),
  );
}

async function abrir(page: Page, caminho: string) {
  await page.goto(caminho, { waitUntil: 'load' });
  if (/\/login\//.test(new URL(page.url()).pathname)) {
    throw new Error('Sessão expirada: rode "npm run tutorial:login" e faça o login de novo.');
  }
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL)) throw new Error('Sem sessão salva: rode "npm run tutorial:login" primeiro.');
});

test('Tutorial Skill Link — prints da seção 1', async ({ page, context }) => {
  await ocultarJudy(context);

  await test.step('Print 01 — Administração do site > aba Plugins', async () => {
    await abrir(page, '/admin/search.php');
    const iconeAdministracao = page
      .locator('a[title="Administração do site"], a[aria-label="Administração do site"]')
      .or(page.getByRole('link', { name: 'Administração do site', exact: true }))
      .filter({ visible: true })
      .first();
    const abaPlugins = page.getByRole('tab', { name: 'Plugins', exact: true }).filter({ visible: true }).first();
    await capturar(page, {
      pasta,
      arquivo: 'print-01.png',
      area: 'tela',
      alvos: [
        { elemento: iconeAdministracao, numero: 1, seta: 'direita' },
        { elemento: abaPlugins, numero: 2, seta: 'cima' },
      ],
    });
  });

  await test.step('Print 02 — link "Configurações de competências" em "Plugins locais"', async () => {
    await page.getByRole('tab', { name: 'Plugins', exact: true }).filter({ visible: true }).first().click();
    const painel = page.locator('.tab-pane.active');
    const link = painel.getByRole('link', { name: 'Configurações de competências', exact: true });
    // Recorte do título "Plugins locais" até o link, com a largura do link mais longo do trecho
    const titulo = painel.getByText('Plugins locais', { exact: true }).first();
    const maisLongo = painel.getByRole('link', { name: 'Campos personalizados para módulos de atividades', exact: true });
    await capturar(page, {
      pasta,
      arquivo: 'print-02.png',
      area: titulo.or(maisLongo),
      alvos: [{ elemento: link, seta: 'direita' }],
    });
    await link.click();
    await expect(page).toHaveURL(/section=local_skillbox/);
  });

  // Ordem: primeiro restaura e salva (print 08), depois tira os prints 03–07 da tela já restaurada,
  // para que nenhum print mostre a opção de cursos desmarcada
  const opcoesIA = linha(page, /Habilitar geração de competências com IA para/);

  await test.step('Restaura a configuração e Print 08 — "Mudanças gravadas"', async () => {
    await abrir(page, CONFIG_SKILLBOX);
    await expect(opcoesIA, 'Esperadas 5 opções "Habilitar geração de competências com IA para…"').toHaveCount(5);
    let alterou = false;
    for (const opcao of await opcoesIA.locator('input[type="checkbox"]').all()) {
      if (!(await opcao.isChecked())) {
        console.log(`>> Marcando ${await opcao.getAttribute('id')}`);
        await opcao.check();
        alterou = true;
      }
    }
    const creditos = linha(page, /^\s*Créditos iniciais\s*$/).locator('input[type="text"], input[type="number"]');
    if ((await creditos.inputValue()) !== CREDITOS_INICIAIS) {
      console.log(`>> Créditos iniciais estava "${await creditos.inputValue()}": voltando para ${CREDITOS_INICIAIS}`);
      await creditos.fill(CREDITOS_INICIAIS);
      alterou = true;
    }
    // O Moodle só mostra "Mudanças gravadas" quando algum valor muda. Já restaurado (execução anterior):
    // não salva de novo e mantém o print-08 daquele salvamento
    if (!alterou) {
      if (!existsSync(path.join(pasta, 'print-08.png'))) {
        throw new Error('Configuração já restaurada e sem print-08.png: não há o que salvar para gerar "Mudanças gravadas".');
      }
      console.log('>> Já restaurado: print-08.png da execução anterior mantido');
      return;
    }
    await page.getByRole('button', { name: 'Salvar mudanças' }).click();
    const aviso = page.locator('.alert, [role="alert"]').filter({ hasText: 'Mudanças gravadas' }).first();
    await expect(aviso).toBeVisible();
    await borrarSegredos(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    // Corta logo abaixo do título da página: os campos não aparecem neste print
    const titulo = page.getByRole('heading', { name: 'Configurações de competências' }).first();
    await capturar(page, {
      pasta,
      arquivo: 'print-08.png',
      area: 'tela',
      ate: titulo,
      alvos: [{ elemento: aviso, seta: 'esquerda' }],
    });
  });

  await test.step('Confere o estado salvo', async () => {
    await abrir(page, CONFIG_SKILLBOX);
    for (const opcao of await opcoesIA.locator('input[type="checkbox"]').all()) await expect(opcao).toBeChecked();
    await expect(page.locator('#id_s_local_skillbox_ai_generation_enabled_course')).toBeChecked();
    await expect(linha(page, /^\s*Créditos iniciais\s*$/).locator('input:not([type="hidden"])')).toHaveValue(CREDITOS_INICIAIS);
    await borrarSegredos(page);
  });

  await test.step('Print 03 — "Habilitado"', async () => {
    const habilitado = linha(page, /^\s*Habilitado\s*$/);
    const caixa = habilitado.locator('input[type="checkbox"]');
    await expect(caixa, '"Habilitado" deveria estar marcado — o script não altera esta opção').toBeChecked();
    // Contorno em caixa + "Padrão: …"; a seta vem do espaço vazio à direita
    await capturar(page, {
      pasta,
      arquivo: 'print-03.png',
      area: habilitado,
      alvos: [{ elemento: habilitado.locator('input[type="checkbox"], .form-defaultinfo'), seta: 'direita' }],
    });
  });

  await test.step('Print 04 — URL/Chave Prisma e URL/Token Lizza, valores borrados', async () => {
    const linhas = camposSensiveis(page);
    // Um contorno só para os 4 campos (valores borrados); a seta vem de cima, no espaço vazio
    await capturar(page, {
      pasta,
      arquivo: 'print-04.png',
      area: linhas,
      alvos: [{ elemento: linhas.locator('.form-setting'), seta: 'cima' }],
    });
  });

  await test.step('Print 05 — as 5 opções de geração com IA, numeradas', async () => {
    // Contorno em caixa + "Padrão: Sim"; o número fica à direita, no espaço vazio da linha
    const opcoes = await opcoesIA.all();
    await capturar(page, {
      pasta,
      arquivo: 'print-05.png',
      area: opcoesIA,
      alvos: opcoes.map((opcao, i) => ({
        elemento: opcao.locator('input[type="checkbox"], .form-defaultinfo'),
        numero: i + 1,
        seta: false as const,
        ladoNumero: 'direita' as const,
      })),
    });
  });

  await test.step('Print 07 — "Créditos iniciais"', async () => {
    const creditos = linha(page, /^\s*Créditos iniciais\s*$/);
    await capturar(page, {
      pasta,
      arquivo: 'print-07.png',
      area: creditos,
      alvos: [{ elemento: creditos.locator('input:not([type="hidden"]), .form-defaultinfo'), seta: 'direita' }],
    });
  });

  await test.step('Print 06 — curso 283, seção "Skill Link"', async () => {
    await abrir(page, CURSO);
    const secao = page.locator('fieldset').filter({ has: page.locator('legend', { hasText: 'Skill Link' }) });
    const expandir = secao.locator('legend a[aria-expanded="false"], legend [data-bs-toggle="collapse"][aria-expanded="false"]');
    if (await expandir.count()) await expandir.first().click();
    const botao = secao
      .getByRole('button', { name: 'Gerar competências com o Skill Link' })
      .or(secao.getByRole('link', { name: 'Gerar competências com o Skill Link' }));
    await capturar(page, { pasta, arquivo: 'print-06.png', area: secao, alvos: [{ elemento: botao, seta: 'baixo' }] });
    // Não clica no botão nem salva o curso
  });
});
