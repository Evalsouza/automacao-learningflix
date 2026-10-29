// Responsividade - DT/EVT - Tela de Login: possibilidade de ver a senha — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { Factories } from '../../Factories';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Visualizar senha - ${tipo}`, { tag: ['@responsivo', '@dt-ver-senha'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Visualizar senha - ${tipo} ${resolucao}`, async ({ page, login }) => {
      await login.acessar();

      await test.step('Então o campo "Senha" e o ícone de "Olho" ficaram dentro da tela', async () => {
        for (const elemento of [login.campoSenha, login.iconeOlho]) {
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step('Quando digitei a senha e cliquei no "Olho"', async () => {
        await login.digitarSenha(Factories.login.senhaParaExibir());
        await login.clicarNoOlho();
      });
      await test.step('Então a senha foi exibida', () => expect(login.campoSenha).toHaveAttribute('type', 'text'));

      await test.step('Quando cliquei novamente no "Olho"', () => login.clicarNoOlho());
      await test.step('Então a senha foi ocultada', () => expect(login.campoSenha).toHaveAttribute('type', 'password'));
    });
  });
}
