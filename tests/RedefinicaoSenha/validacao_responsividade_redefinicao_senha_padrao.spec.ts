// Responsividade - DT/EVT - Página de Login — redefinição padrão — rastreabilidade em RASTREABILIDADE.md
// Falha enquanto a redefinição personalizada estiver ativada
import { test, expect } from '../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Redefinição padrão - ${tipo}`, { tag: ['@responsivo', '@dt-pagina-de-login'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Redefinição padrão - ${tipo} ${resolucao}`, async ({ page, perdeuSenha }) => {
      await perdeuSenha.acessarPeloLogin();

      await test.step('Então a recuperação pelo nome de usuário e pelo e-mail ficou dentro da tela', async () => {
        for (const elemento of [perdeuSenha.campoNomeDeUsuarioPadrao, perdeuSenha.campoEmailPadrao]) {
          await expect(elemento, 'Redefinição padrão não exibida: a redefinição personalizada está ativada').toBeVisible();
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
    });
  });
}
