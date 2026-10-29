// DT/EVT - Página de Login — "Esqueci a senha", redefinição padrão (C09 a C14) — rastreabilidade em RASTREABILIDADE.md
// A redefinição padrão só aparece com a personalizada desativada: enquanto ela estiver ativa, estes testes falham.
// "Buscar" envia e-mail de recuperação para a usuária
import { test, expect } from '../../support/e2e';
import { usuarios } from '../../support/usuarios';
import { paginas } from '../../fixtures/redefinicaosenha';

const motivoPadraoIndisponivel = 'Redefinição padrão não exibida: a redefinição personalizada está ativada';
const emailDaEstudante = 'eva.souza@yopmail.com';

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(({ perdeuSenha }) => perdeuSenha.acessarPeloLogin());

test.describe('Redefinição de senha padrão', { tag: '@dt-pagina-de-login' }, () => {
  test('RS01 - "Perdeu a senha?" exibe as duas formas de recuperar o acesso', async ({ perdeuSenha }) => {
    await test.step(`Então a página "${paginas.perdeuSenha}" exibiu a recuperação pelo nome de usuário e pelo e-mail`, async () => {
      await expect(perdeuSenha.campoNomeDeUsuarioPadrao, motivoPadraoIndisponivel).toBeVisible();
      await expect(perdeuSenha.campoEmailPadrao, motivoPadraoIndisponivel).toBeVisible();
    });
  });

  test('RS02 - "Buscar" pelo nome de usuário confirma a recuperação e "Continuar" volta para o login', async ({ page, perdeuSenha }) => {
    await test.step(`Quando informei "${usuarios.estudante.identificacao}" e cliquei em "Buscar"`, async () => {
      await expect(perdeuSenha.campoNomeDeUsuarioPadrao, motivoPadraoIndisponivel).toBeVisible();
      await perdeuSenha.campoNomeDeUsuarioPadrao.fill(usuarios.estudante.identificacao);
      await perdeuSenha.campoNomeDeUsuarioPadrao.locator('xpath=ancestor::form[1]').getByRole('button', { name: 'Buscar' }).click();
    });
    await test.step('Então foi exibida a página para confirmar a recuperação', () => expect(perdeuSenha.botaoContinuar).toBeVisible());
    await test.step('Quando cliquei em "Continuar"', () => perdeuSenha.botaoContinuar.click());
    await test.step('Então fui redirecionada para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
  });

  test('RS03 - "Buscar" pelo e-mail confirma a recuperação e "Continuar" volta para o login', async ({ page, perdeuSenha }) => {
    await test.step(`Quando informei "${emailDaEstudante}" e cliquei em "Buscar"`, async () => {
      await expect(perdeuSenha.campoEmailPadrao, motivoPadraoIndisponivel).toBeVisible();
      await perdeuSenha.campoEmailPadrao.fill(emailDaEstudante);
      await perdeuSenha.campoEmailPadrao.locator('xpath=ancestor::form[1]').getByRole('button', { name: 'Buscar' }).click();
    });
    await test.step('Então foi exibida a página para confirmar a recuperação', () => expect(perdeuSenha.botaoContinuar).toBeVisible());
    await test.step('Quando cliquei em "Continuar"', () => perdeuSenha.botaoContinuar.click());
    await test.step('Então fui redirecionada para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
  });

  test('RS04 - "Voltar ao acesso" volta para a página de login', async ({ page, perdeuSenha }) => {
    await test.step('Quando cliquei em "Voltar ao acesso"', async () => {
      await expect(perdeuSenha.voltarAoAcesso, motivoPadraoIndisponivel).toBeVisible();
      await perdeuSenha.voltarAoAcesso.click();
    });
    await test.step('Então fui redirecionada para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
  });

  for (const [id, caso] of [
    ['RS05', 'E-mail de recuperação recebido com o link — C10 e C12'],
    ['RS06', 'Link do e-mail leva à página de recuperação de senha — C10 e C12'],
    ['RS07', 'Link expirado após 30 minutos exibe a mensagem de link expirado — C13'],
  ]) {
    test(`${id} - ${caso}`, async () => {
      test.fixme(true, 'Depende de ler o e-mail: pendente até o QA ter uma caixa de teste com API (Mailpit)');
    });
  }
});
