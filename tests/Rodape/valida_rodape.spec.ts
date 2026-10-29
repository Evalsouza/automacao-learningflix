// Jira LFXP-1941 — Habilitar/desabilitar informações no rodapé (História LFXP-1907) — rastreabilidade em RASTREABILIDADE.md
// Só leitura: confere a configuração atual — as 3 opções desabilitadas — e o rodapé de cada perfil
import { test, expect } from '../../support/e2e';
import { opcoesRodape, padraoDasOpcoes, linksDoLogin, linksAposLogin, perfisDoRodape } from '../../fixtures/rodape';

test.describe('Configuração do footer no Tema', { tag: '@dt-rodape' }, () => {
  test.use({ storageState: '.auth/administrador.json' });

  test('RD01 - "Configurações gerais" do Tema exibe as 3 opções de footer desmarcadas', async ({ tema }) => {
    await test.step('Quando acessei "Administração do site → Aparência → Temas → Tema" e a aba "Configurações gerais"', () =>
      tema.acessar());
    for (const { rotulo, chave } of Object.values(opcoesRodape)) {
      await test.step(`Então a opção "${rotulo}" foi exibida com "${padraoDasOpcoes}" e desmarcada`, async () => {
        await expect(tema.blocoDaOpcao(chave)).toContainText(rotulo);
        await expect(tema.blocoDaOpcao(chave)).toContainText(padraoDasOpcoes);
        await expect(tema.opcao(chave)).not.toBeChecked();
      });
    }
  });
});

test.describe('Rodapé com as opções desabilitadas', { tag: '@dt-rodape' }, () => {
  test.describe('Sem login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test(`RD02 - Página de login exibe só o idioma e os direitos, sem "${linksDoLogin.join('", "')}"`, async ({ page, rodape }) => {
      await test.step('Quando acessei a página de login', () => page.goto('/login/index.php'));
      await test.step('Então o rodapé exibiu o idioma e "© Desenvolvido por"', async () => {
        await rodape.irParaOFim();
        await expect(rodape.idioma).toBeVisible();
        await expect(rodape.direitos).toBeVisible();
      });
      for (const link of linksDoLogin)
        await test.step(`E a opção "${link}" NÃO foi exibida`, () => expect(rodape.link(link)).toHaveCount(0));
    });
  });

  const ids = ['RD03', 'RD04', 'RD05'];
  perfisDoRodape.forEach(({ perfil, sessao }, i) => {
    test.describe(perfil, () => {
      test.use({ storageState: sessao });

      test(`${ids[i]} - "${perfil}" vê o rodapé sem "${linksAposLogin.join('" e "')}"`, async ({ page, rodape }) => {
        await test.step('Quando acessei a "Página inicial"', () => page.goto('/my/'));
        await test.step('Então o rodapé exibiu o idioma e "© Desenvolvido por"', async () => {
          await rodape.irParaOFim();
          await expect(rodape.idioma).toBeVisible();
          await expect(rodape.direitos).toBeVisible();
        });
        for (const link of linksAposLogin)
          await test.step(`E a opção "${link}" NÃO foi exibida`, () => expect(rodape.link(link)).toHaveCount(0));
      });
    });
  });
});
