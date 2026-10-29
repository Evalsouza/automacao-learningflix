// DT/EVT - Tela de Login: possibilidade de ver a senha — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { Factories } from '../../Factories';

const senha = Factories.login.senhaParaExibir();

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(({ login }) => login.acessar());

test.describe('Ícone de "Olho" no campo "Senha"', { tag: '@dt-ver-senha' }, () => {
  test('CT001.1 - Ícone de "Olho" exibido no campo "Senha"', async ({ login }) => {
    await test.step('Então o ícone de "Olho" foi exibido no campo "Senha"', () => expect(login.iconeOlho).toBeVisible());
  });

  test('CT001.2 - Senha é exibida ao clicar no "Olho"', async ({ login }) => {
    await test.step('Quando digitei a senha e cliquei no "Olho"', async () => {
      await login.digitarSenha(senha);
      await login.clicarNoOlho();
    });
    await test.step('Então a senha foi exibida', () => expect(login.campoSenha).toHaveAttribute('type', 'text'));
  });

  test('CT001.3 - Senha é ocultada ao clicar novamente no "Olho"', async ({ login }) => {
    await test.step('Quando digitei a senha e cliquei duas vezes no "Olho"', async () => {
      await login.digitarSenha(senha);
      await login.clicarNoOlho();
      await login.clicarNoOlho();
    });
    await test.step('Então a senha foi ocultada', () => expect(login.campoSenha).toHaveAttribute('type', 'password'));
  });

  test('CT001.4 - Senha digitada após ativar o "Olho" é exibida', async ({ login }) => {
    await test.step('Quando cliquei no "Olho" e depois digitei a senha', async () => {
      await login.clicarNoOlho();
      await login.digitarSenha(senha);
    });
    await test.step('Então a senha foi exibida', () => expect(login.campoSenha).toHaveAttribute('type', 'text'));
  });

  test('CT001.5 - Nome do "Olho" para leitores de tela alterna entre "Exibir a senha" e "Esconder a senha"', async ({ login }) => {
    await test.step('Quando cliquei no "Olho"', () => login.iconeOlhoExibir.click());
    await test.step('Então o nome mudou para "Esconder a senha"', () => expect(login.iconeOlhoEsconder).toBeVisible());
    await test.step('Quando cliquei novamente no "Olho"', () => login.iconeOlhoEsconder.click());
    await test.step('Então o nome voltou para "Exibir a senha"', () => expect(login.iconeOlhoExibir).toBeVisible());
  });
});
