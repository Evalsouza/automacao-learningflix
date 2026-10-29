// Jira LFXP-1941 — Habilitar/desabilitar informações no rodapé — troca das opções — rastreabilidade em RASTREABILIDADE.md
// Altera as opções de footer do Tema, que valem para a plataforma inteira, e restaura os valores iniciais ao final.
// Desligada por padrão: rode com `npm run test:rodape-config`
import { test, expect } from '../../support/e2e';
import type { Browser } from '@playwright/test';
import { RodapePage } from '../../support/rodape_commands/RodapePage';
import { TemaPage } from '../../support/rodape_commands/TemaPage';
import { opcoesRodape, linksDoLogin, linksAposLogin, perfisDoRodape } from '../../fixtures/rodape';

const executar = process.env.EXECUTAR_CONFIG_RODAPE === 'sim';
const semSessao = { cookies: [], origins: [] };
const estadoInicial: Record<string, boolean> = {};

// Abre a página numa sessão separada e devolve se cada link apareceu no rodapé
async function linksVisiveis(browser: Browser, sessao: string | typeof semSessao, url: string, links: string[]) {
  const contexto = await browser.newContext({ storageState: sessao });
  try {
    const rodape = new RodapePage(await contexto.newPage());
    await rodape.page.goto(url);
    await rodape.irParaOFim();
    await expect(rodape.direitos).toBeVisible();
    const exibidos: Record<string, boolean> = {};
    for (const link of links) exibidos[link] = (await rodape.link(link).count()) > 0;
    return exibidos;
  } finally {
    await contexto.close();
  }
}

const todos = (links: string[], exibido: boolean) => Object.fromEntries(links.map((l) => [l, exibido]));

test.describe('Habilitar e desabilitar o footer', { tag: ['@dt-rodape', '@altera-configuracao'] }, () => {
  test.skip(!executar, 'Altera uma configuração da plataforma inteira: rode com npm run test:rodape-config');
  test.use({ storageState: '.auth/administrador.json' });
  test.setTimeout(240_000);

  // Sem `serial`: com 1 worker os testes já rodam em ordem; depois de uma falha o afterAll restaura e o beforeAll relê
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(300_000);
    const contexto = await browser.newContext({ storageState: '.auth/administrador.json' });
    const tema = new TemaPage(await contexto.newPage());
    await tema.acessar();
    for (const { chave } of Object.values(opcoesRodape)) estadoInicial[chave] = await tema.opcao(chave).isChecked();
    await contexto.close();
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(300_000);
    const contexto = await browser.newContext({ storageState: '.auth/administrador.json' });
    const tema = new TemaPage(await contexto.newPage());
    await tema.acessar();
    for (const [chave, marcado] of Object.entries(estadoInicial)) await tema.opcao(chave).setChecked(marcado);
    await tema.botaoSalvar.click();
    await tema.mensagemGravada.waitFor();
    await contexto.close();
  });

  const casos = [
    {
      ids: ['RD10', 'RD11'],
      opcao: opcoesRodape.usuario,
      quem: 'Estudante',
      sessao: '.auth/estudante.json',
      url: '/my/',
      links: linksAposLogin,
    },
    {
      ids: ['RD12', 'RD13'],
      opcao: opcoesRodape.administrador,
      quem: 'Administrador',
      sessao: '.auth/administrador.json',
      url: '/my/',
      links: linksAposLogin,
    },
    {
      ids: ['RD14', 'RD15'],
      opcao: opcoesRodape.login,
      quem: 'Visitante da página de login',
      sessao: semSessao,
      url: '/login/index.php',
      links: linksDoLogin,
    },
  ];

  for (const { ids, opcao, quem, sessao, url, links } of casos) {
    for (const [i, habilitar] of [true, false].entries()) {
      test(`${ids[i]} - Com "${opcao.rotulo}" ${habilitar ? 'habilitada' : 'desabilitada'}, "${quem}" ${habilitar ? 'vê' : 'NÃO vê'} "${links.join('", "')}" no rodapé`, async ({
        browser,
        tema,
      }) => {
        await test.step(`Quando ${habilitar ? 'habilitei' : 'desmarquei'} "${opcao.rotulo}" e cliquei em "Salvar mudanças"`, () =>
          tema.definir(opcao.chave, habilitar));
        await test.step(`Então a opção "${opcao.rotulo}" ficou ${habilitar ? 'habilitada' : 'desmarcada'}`, async () => {
          await tema.acessar();
          if (habilitar) await expect(tema.opcao(opcao.chave)).toBeChecked();
          else await expect(tema.opcao(opcao.chave)).not.toBeChecked();
        });
        await test.step(`E no rodapé de "${quem}" as opções "${links.join('", "')}" ${habilitar ? 'foram' : 'NÃO foram'} exibidas`, async () =>
          expect(await linksVisiveis(browser, sessao, url, links)).toEqual(todos(links, habilitar)));
      });
    }
  }

  test('RD16 - Com as 3 opções habilitadas, cada perfil vê o rodapé conforme a sua permissão', async ({ browser, tema }) => {
    await test.step('Quando habilitei as 3 opções de footer e cliquei em "Salvar mudanças"', async () => {
      await tema.acessar();
      for (const { chave } of Object.values(opcoesRodape)) await tema.opcao(chave).setChecked(true);
      await tema.botaoSalvar.click();
      await tema.mensagemGravada.waitFor();
    });
    for (const { perfil, sessao, opcao } of perfisDoRodape) {
      await test.step(`Então "${perfil}" viu "${linksAposLogin.join('" e "')}" no rodapé — opção "${opcoesRodape[opcao].rotulo}"`, async () =>
        expect(await linksVisiveis(browser, sessao, '/my/', linksAposLogin)).toEqual(todos(linksAposLogin, true)));
    }
    await test.step(`E a página de login exibiu "${linksDoLogin.join('", "')}" no rodapé`, async () =>
      expect(await linksVisiveis(browser, semSessao, '/login/index.php', linksDoLogin)).toEqual(todos(linksDoLogin, true)));
  });
});
