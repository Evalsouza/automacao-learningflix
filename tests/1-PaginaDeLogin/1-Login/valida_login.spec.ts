// DT/EVT - Página de Login — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../../support/e2e';
import { semSessao, sessoes, comSessao } from '../../../support/sessoes';
import { ConfiguracaoLoginPage } from '../../../support/login_commands/ConfiguracaoLoginPage';
import { garantirRedefinicaoPersonalizada } from '../../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { usuarios } from '../../../support/usuarios';
import { mensagens } from '../../../fixtures/login';
import { Factories } from '../../../Factories';
import { prioridade } from '../../../fixtures/prioridades';

const { administrador, cliente, estudante } = usuarios;

test.use({ storageState: semSessao });

test.beforeEach(({ login }) => login.acessar());

test.describe('Acesso como Administrador', { tag: '@dt-pagina-de-login' }, () => {
  test('C01 - Página de login exibida', { tag: prioridade('Login', 'C01') }, async ({ login }) => {
    await test.step('Então a página de login exibiu o título "Acesso", os campos "CPF" e "Senha" e o botão "Acessar"', async () => {
      await expect(login.titulo).toBeVisible();
      await expect(login.campoUsuario).toBeVisible();
      await expect(login.campoSenha).toBeVisible();
      await expect(login.botaoAcessar).toBeVisible();
    });
  });

  test('C02 - Login válido redireciona para a página inicial', { tag: prioridade('Login', 'C02') }, async ({ page, login, menu }) => {
    await test.step('Quando entrei com usuário e senha válidos', () => login.entrar(administrador));
    await test.step('Então fui redirecionada para a página inicial', async () => {
      await expect(page).not.toHaveURL(/\/login\//);
      await expect(menu.botaoMenu).toBeVisible();
    });
  });

  test(
    'C02.1 - Sair pelo perfil no menu lateral volta para a página de login',
    { tag: prioridade('Login', 'C02.1') },
    async ({ page, login, menu }) => {
      await test.step('Quando entrei como Administrador', () => login.entrar(administrador));
      await test.step('E fui redirecionada para a página inicial', () => expect(menu.botaoMenu).toBeVisible());
      await test.step('E cliquei no perfil do menu lateral e em "Sair"', () => menu.sair());
      await test.step('Então voltei para a página de login', async () => {
        await expect(page).toHaveURL(/\/login\/index\.php/);
        await expect(login.titulo).toBeVisible();
      });
    },
  );

  test('C03 - Lembrar-me mantém o usuário salvo após Sair', { tag: prioridade('Login', 'C03') }, async ({ page, login, menu }) => {
    await test.step('Quando entrei com "Lembrar-me" marcado', () => login.entrar(administrador, { lembrarMe: true }));
    await test.step('E fui redirecionada para a página inicial', () => expect(page).toHaveURL(/\/my\//));
    await test.step('E saí pelo menu do usuário', () => menu.sair());
    await test.step('Então voltei para a página de login com o usuário salvo', async () => {
      await expect(page).toHaveURL(/\/login\/index\.php/);
      await expect(login.campoUsuario).toHaveValue(administrador.identificacao);
    });
  });

  test(
    'C03.1 - Sem "Lembrar-me", o usuário NÃO fica salvo após Sair',
    { tag: prioridade('Login', 'C03.1') },
    async ({ page, login, menu }) => {
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
    },
  );

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
    test(`${id} - Tentativa ${situacao} exibe mensagem de erro`, { tag: prioridade('Login', id) }, async ({ login }) => {
      await test.step(`Quando tentei entrar ${situacao}`, () => login.entrar(credenciais));
      await test.step('Então a mensagem de usuário ou senha errados foi exibida', () =>
        expect(login.mensagem(mensagens.usuarioOuSenhaErrados)).toBeVisible());
    });
  }

  // A redefinição padrão só aparece com a personalizada desabilitada: o teste a desabilita, se estiver habilitada,
  // e a deixa assim. As suítes da personalizada a habilitam quando começam — decisão da QA (10/11)
  test(
    'C08 - Esqueci a senha redireciona para "Perdeu a senha?"',
    { tag: prioridade('Login', 'C08') },
    async ({ browser, login, perdeuSenha }) => {
      await test.step('Dado que verifiquei a "Redefinição de senha personalizada" e, se habilitada, desabilitei', () =>
        garantirRedefinicaoPersonalizada(browser, false));
      await test.step('Quando cliquei em "Esqueci a senha"', () => login.linkEsqueciSenha.click());
      await test.step('Então a página "Perdeu a senha?" foi exibida, com a busca pela identificação de usuário (CPF) e pelo e-mail', async () => {
        await expect(perdeuSenha.titulo).toBeVisible();
        await expect(perdeuSenha.campoIdentificacaoPadrao).toBeVisible();
        await expect(perdeuSenha.campoEmailPadrao).toBeVisible();
      });
    },
  );
});

test.describe('Acesso por papel', { tag: '@dt-pagina-de-login' }, () => {
  const papeis = [
    { id: 'P01', papel: 'Cliente', usuario: cliente },
    { id: 'P02', papel: 'Estudante', usuario: estudante },
  ];

  for (const { id, papel, usuario } of papeis) {
    test(`${id} - Login válido com o papel ${papel}`, { tag: prioridade('Login', id) }, async ({ login, menu }) => {
      await test.step(`Quando entrei com o usuário ${papel}`, () => login.entrar(usuario));
      await test.step(`Então o menu do usuário exibiu "${usuario.nome}"`, async () => {
        await menu.abrir();
        await expect(menu.nomeUsuario).toContainText(usuario.nome);
      });
    });

    test(
      `${id}.1 - Sair pelo perfil no menu lateral com o papel ${papel}`,
      { tag: prioridade('Login', `${id}.1`) },
      async ({ page, login, menu }) => {
        await test.step(`Quando entrei com o usuário ${papel}`, () => login.entrar(usuario));
        await test.step('E fui redirecionada para a página inicial', () => expect(menu.botaoMenu).toBeVisible());
        await test.step('E cliquei no perfil do menu lateral e em "Sair"', () => menu.sair());
        await test.step('Então voltei para a página de login', async () => {
          await expect(page).toHaveURL(/\/login\/index\.php/);
          await expect(login.titulo).toBeVisible();
        });
      },
    );
  }
});

test.describe('Elementos da página de login', { tag: '@dt-pagina-de-login' }, () => {
  test(
    'LG01 - Elementos exibidos conforme as configurações ativas na plataforma',
    { tag: prioridade('Login', 'LG01') },
    async ({ browser, login }) => {
      const config = await test.step('Dado que li as configurações do login como Administrador (só leitura)', () =>
        comSessao(browser, sessoes.administrador, (page) => new ConfiguracaoLoginPage(page).ler()));
      const exibido = (ativo: boolean) => (ativo ? 'exibido' : 'NÃO exibido');

      await test.step('Então CPF, Senha e "Acessar" foram exibidos', async () => {
        await expect(login.campoUsuario).toBeVisible();
        await expect(login.campoSenha).toBeVisible();
        await expect(login.botaoAcessar).toBeVisible();
      });

      const autoCadastro = config.autoCadastro !== '';
      await test.step(`E "Criar uma conta" foi ${exibido(autoCadastro)} (Auto-cadastro: "${config.autoCadastro || 'Desativar'}")`, () =>
        expect(login.linkCriarConta).toBeVisible({ visible: autoCadastro }));

      const visitante = config.botaoVisitante === 'Mostrar';
      await test.step(`E "Acessar como visitante" foi ${exibido(visitante)} (Botão de entrada como visitante: "${config.botaoVisitante}")`, () =>
        expect(login.botaoVisitante).toBeVisible({ visible: visitante }));

      // "Lembrar nome de usuário": o "Lembrar-me" só aparece em "Opcional" (2); em "Sim" o usuário é lembrado sem perguntar
      const lembrar = config.lembrarUsuario === '2';
      await test.step(`E "Lembrar-me" foi ${exibido(lembrar)} (Lembrar nome de usuário: ${config.lembrarUsuario})`, () =>
        expect(login.checkLembrarMe).toBeVisible({ visible: lembrar }));

      await test.step('E "Esqueci a senha" foi exibido, apontando para a URL configurada ou para a página da plataforma', async () => {
        await expect(login.linkEsqueciSenha).toBeVisible();
        // URL vazia: a plataforma usa a própria página "Perdeu a senha?"
        const destino = config.urlEsqueciSenha || '/login/forgot_password.php';
        expect(await login.linkEsqueciSenha.getAttribute('href')).toContain(destino);
      });
    },
  );
});
