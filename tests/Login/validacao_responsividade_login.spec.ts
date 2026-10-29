// Responsividade - DT/EVT - Página de Login — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { usuarios } from '../../support/usuarios';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Login - ${tipo}`, { tag: ['@responsivo', '@dt-pagina-de-login'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Login - ${tipo} ${resolucao}`, async ({ page, login, menu }) => {
      await login.acessar();

      await test.step('Então os campos "CPF" e "Senha", o botão "Acessar" e "Esqueci a senha" ficaram dentro da tela', async () => {
        for (const elemento of [login.campoUsuario, login.campoSenha, login.botaoAcessar, login.linkEsqueciSenha]) {
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step('Quando entrei com usuário e senha válidos', () => login.entrar(usuarios.administrador));
      await test.step('Então fui redirecionada para a página inicial', async () => {
        await expect(page).not.toHaveURL(/\/login\//);
        await expect(menu.botaoMenu).toBeVisible();
      });
    });
  });
}
