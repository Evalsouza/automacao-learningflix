// Responsividade - DT/EVT - Página de Login — redefinição padrão — rastreabilidade em RASTREABILIDADE.md
// Desabilita a redefinição personalizada antes de começar
import { test, expect } from '../../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../../support/responsividade';
import { garantirRedefinicaoPersonalizada } from '../../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { prioridade } from '../../../fixtures/prioridades';

// A redefinição padrão só aparece com a personalizada desabilitada: desabilita antes, se estiver habilitada — decisão da QA (10/11)
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await garantirRedefinicaoPersonalizada(browser, false);
});

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Redefinição padrão - ${tipo}`, { tag: ['@responsivo', '@dt-pagina-de-login'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Redefinição padrão - ${tipo} ${resolucao}`, { tag: prioridade('RedefinicaoSenha') }, async ({ page, perdeuSenha }) => {
      await perdeuSenha.acessarPeloLogin();

      await test.step('Então a recuperação pela identificação de usuário (CPF) e pelo e-mail ficou dentro da tela', async () => {
        for (const elemento of [perdeuSenha.campoIdentificacaoPadrao, perdeuSenha.campoEmailPadrao]) {
          await expect(
            elemento,
            'Redefinição padrão não exibida: busca por identificação de usuário (CPF) e por e-mail não encontrada — confira se a personalizada está desativada ou se a página mudou',
          ).toBeVisible();
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
    });
  });
}
