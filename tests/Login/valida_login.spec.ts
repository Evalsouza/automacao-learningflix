// DT/EVT - Página de Login — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { usuarios } from '../../support/usuarios';
import { mensagens, paginas } from '../../fixtures/login';
import { Factories } from '../../Factories';

const { administrador, cliente, estudante } = usuarios;

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(({ login }) => login.acessar());

test.describe('Acesso como Administrador', { tag: '@dt-pagina-de-login' }, () => {
  test('C01 - Página de login exibida', async ({ login }) => {
    await test.step('Então a página para realizar login foi exibida', async () => {
      await expect(login.titulo).toBeVisible();
      await expect(login.campoUsuario).toBeVisible();
      await expect(login.campoSenha).toBeVisible();
      await expect(login.botaoAcessar).toBeVisible();
    });
  });

  test('C02 - Login válido redireciona para a página inicial', async ({ page, login, menu }) => {
    await test.step('Quando entrei com usuário e senha válidos', () => login.entrar(administrador));
    await test.step('Então fui redirecionada para a página inicial', async () => {
      await expect(page).not.toHaveURL(/\/login\//);
      await expect(menu.botaoMenu).toBeVisible();
    });
  });

  test('C03 - Lembrar-me mantém o usuário salvo após Sair', async ({ page, login, menu }) => {
    await test.step('Quando entrei com "Lembrar-me" marcado', () => login.entrar(administrador, { lembrarMe: true }));
    await test.step('E fui redirecionada para a página inicial', () => expect(page).toHaveURL(/\/my\//));
    await test.step('E saí pelo menu do usuário', () => menu.sair());
    await test.step('Então voltei para a página de login com o usuário salvo', async () => {
      await expect(page).toHaveURL(/\/login\/index\.php/);
      await expect(login.campoUsuario).toHaveValue(administrador.identificacao);
    });
  });

  test('C03.1 - Sem "Lembrar-me", o usuário NÃO fica salvo após Sair', async ({ page, login, menu }) => {
    await test.step('Quando entrei com "Lembrar-me" desmarcado', async () => {
      await expect(login.checkLembrarMe).not.toBeChecked();
      await login.entrar(administrador);
    });
    await test.step('E fui redirecionada para a página inicial', () => expect(page).toHaveURL(/\/my\//));
    await test.step('E saí pelo menu do usuário', () => menu.sair());
    await test.step('Então voltei para a página de login sem o usuário salvo', async () => {
      await expect(page).toHaveURL(/\/login\/index\.php/);
      await expect(login.campoUsuario).toHaveValue('');
      await expect(login.checkLembrarMe).not.toBeChecked();
    });
  });

  const tentativasInvalidas = [
    { id: 'C04', situacao: 'sem usuário e com senha', credenciais: { senha: administrador.senha } },
    { id: 'C05', situacao: 'com usuário e sem senha', credenciais: { identificacao: administrador.identificacao } },
    { id: 'C06', situacao: 'sem usuário e sem senha', credenciais: {} },
    {
      id: 'C07',
      situacao: 'com usuário não cadastrado e senha inválida',
      credenciais: { identificacao: Factories.login.usuarioNaoCadastrado(), senha: Factories.login.senhaInvalida() },
    },
  ];

  for (const { id, situacao, credenciais } of tentativasInvalidas) {
    test(`${id} - Tentativa ${situacao} exibe mensagem de erro`, async ({ login }) => {
      await test.step(`Quando tentei entrar ${situacao}`, () => login.entrar(credenciais));
      await test.step('Então a mensagem de usuário ou senha errados foi exibida', () =>
        expect(login.mensagem(mensagens.usuarioOuSenhaErrados)).toBeVisible());
    });
  }

  test('C08 - Esqueci a senha redireciona para "Perdeu a senha?"', async ({ page, login }) => {
    await test.step('Quando cliquei em "Esqueci a senha"', () => login.linkEsqueciSenha.click());
    await test.step('Então a página "Perdeu a senha?" foi exibida', () =>
      expect(page.getByRole('heading', { name: paginas.perdeuSenha })).toBeVisible());
  });
});

test.describe('Acesso por papel', { tag: '@dt-pagina-de-login' }, () => {
  const papeis = [
    { id: 'P01', papel: 'Cliente', usuario: cliente },
    { id: 'P02', papel: 'Estudante', usuario: estudante },
  ];

  for (const { id, papel, usuario } of papeis) {
    test(`${id} - Login válido com o papel ${papel}`, async ({ login, menu }) => {
      await test.step(`Quando entrei com o usuário ${papel}`, () => login.entrar(usuario));
      await test.step(`Então o menu do usuário exibiu "${usuario.nome}"`, async () => {
        await menu.abrir();
        await expect(menu.nomeUsuario).toContainText(usuario.nome);
      });
    });
  }
});
