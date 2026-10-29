// DTI/EVTI - Página Criar uma conta — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { CriarContaPage } from '../../support/cadastro_commands/CriarContaPage';
import {
  paginas,
  cargos,
  pais,
  obrigatoriosVerificacao,
  obrigatoriosNovaConta,
  dataNascimento,
  menorDigital,
  verificacoesDeIdade,
} from '../../fixtures/cadastro';
import { Factories } from '../../Factories';

const semSessao = { cookies: [], origins: [] };

test.describe('CENÁRIO 1: Cadastro de usuário com Cargo "Comum"', { tag: '@dt-criar-conta' }, () => {
  test.describe('Administrador', () => {
    test.use({ storageState: '.auth/administrador.json' });

    test('C001 - Campo "Cargo" ativo para exibição no formulário de cadastro', async ({ camposPerfil }) => {
      await test.step('Quando acessei "Campos de perfil do usuário" e editei o campo "Cargo" em "Dados Profissionais"', async () => {
        await camposPerfil.acessar();
        await camposPerfil.editarCampo('Cargo');
      });
      await test.step('Então "Mostrar na página de cadastro?" estava ativo', () =>
        expect(camposPerfil.mostrarNaPaginaDeCadastro.locator('option:checked')).toHaveText('Sim'));
      await test.step('E fechei sem salvar', () => camposPerfil.botaoCancelar.click());
    });

    test('C007 - Cargos de gestão NÃO são exibidos no campo "Cargo" da "Nova conta"', async ({ browser, hierarquia }) => {
      let gestores: string[] = [];
      let disponiveis: string[] = [];
      await test.step('Quando consultei os cargos com "Cargo Gestor" no "Gerenciador de Hierarquia"', async () => {
        await hierarquia.acessarCargos();
        gestores = await hierarquia.cargosGestores();
        expect(gestores.length, 'o Gerenciador de Hierarquia deve ter cargos de gestão').toBeGreaterThan(0);
      });
      await test.step('E acessei a página "Nova conta" sem login', async () => {
        const contexto = await browser.newContext({ storageState: semSessao });
        const criarConta = new CriarContaPage(await contexto.newPage());
        await criarConta.acessarPeloLogin();
        await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
        await criarConta.tituloNovaConta.waitFor();
        disponiveis = await criarConta.cargosDisponiveis();
        await contexto.close();
      });
      await test.step('Então nenhum cargo de gestão foi exibido no campo "Cargo"', () =>
        expect(
          disponiveis.filter((cargo) => gestores.includes(cargo)),
          'cargos de gestão exibidos no cadastro',
        ).toEqual([]));
    });
  });

  test.describe('Sem login', () => {
    test.use({ storageState: semSessao });

    test.beforeEach(({ criarConta }) => criarConta.acessarPeloLogin());

    test('C002 - "Criar uma conta" exibe a página "Verificação de idade e localização"', async ({ criarConta }) => {
      await test.step(`Então a página "${paginas.verificacao}" foi exibida`, () => expect(criarConta.tituloVerificacao).toBeVisible());
    });

    test('C003 - "Continuar" redireciona para a página "Nova conta"', async ({ criarConta }) => {
      await test.step('Quando preenchi idade e país e cliquei em "Continuar"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step(`Então fui redirecionada para a página "${paginas.novaConta}"`, () =>
        expect(criarConta.tituloNovaConta).toBeVisible());
    });

    // Cada teste abre um navegador novo: depois do bloqueio, o navegador continua na página "Menor digital"
    for (const { id, idade, bloqueado } of verificacoesDeIdade) {
      test(`${id} - Idade ${idade} anos ${bloqueado ? `é bloqueada na página "${menorDigital.titulo}"` : `segue para a página "${paginas.novaConta}"`}`, async ({
        page,
        criarConta,
      }) => {
        await test.step(`Quando informei a idade ${idade} anos e o país e cliquei em "Continuar"`, () =>
          criarConta.verificarIdadeELocalizacao(idade, pais));
        if (bloqueado)
          await test.step(`Então fui redirecionada para a página "${menorDigital.titulo}" com a mensagem "${menorDigital.mensagem}"`, async () => {
            await expect(page).toHaveTitle(menorDigital.titulo);
            await expect(criarConta.mensagemMenorDigital).toBeVisible();
          });
        else
          await test.step(`Então fui redirecionada para a página "${paginas.novaConta}"`, () =>
            expect(criarConta.tituloNovaConta).toBeVisible());
      });
    }

    test('C004 - Campo "Cargo" exibe os cargos cadastrados e permite selecionar "Analista de Qualidade"', async ({ criarConta }) => {
      await test.step('Quando acessei a página "Nova conta"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step('Então o campo "Cargo" exibiu os cargos cadastrados', async () =>
        expect(await criarConta.cargosDisponiveis()).toContain(cargos.analistaDeQualidade));
      await test.step(`Quando selecionei o cargo "${cargos.analistaDeQualidade}"`, () =>
        criarConta.selecionarCargo(cargos.analistaDeQualidade));
      await test.step('Então o cargo ficou selecionado', () =>
        expect(criarConta.selectCargo.locator('option:checked')).toHaveText(cargos.analistaDeQualidade));
    });
  });

  test.describe('Estudante', () => {
    test.use({ storageState: '.auth/estudante.json' });

    test('C006 - "Minha página" exibe o Cargo e o Gestor em "Dados Profissionais"', async ({ minhaPagina }) => {
      await test.step('Quando acessei a "Minha página"', () => minhaPagina.acessar());
      await test.step(`Então o campo "Cargo" exibiu "${cargos.analistaDeQualidade}"`, () =>
        expect(minhaPagina.valorDoCampo('Cargo')).toHaveText(cargos.analistaDeQualidade));
      await test.step(`E o campo "Gestor" exibiu "${cargos.gestorDaEstudante}"`, () =>
        expect(minhaPagina.valorDoCampo('Gestor')).toHaveText(cargos.gestorDaEstudante));
    });
  });
});

test.describe('CENÁRIO 2: Consulta do cadastro do usuário na página de Cadastro do usuário', { tag: '@dt-criar-conta' }, () => {
  const consultas = [
    { id: 'C009', perfil: 'Adm Cliente', sessao: '.auth/cliente.json' },
    { id: 'C010', perfil: 'Administrador', sessao: '.auth/administrador.json' },
  ];

  for (const { id, perfil, sessao } of consultas) {
    test.describe(perfil, () => {
      test.use({ storageState: sessao });

      test(`${id} - "${perfil}" consulta o Cargo de "Eva Souza" em "Gerenciar usuários"`, async ({ gerenciarUsuarios }) => {
        await test.step('Quando acessei "Administração → Gerenciar usuários" e pesquisei "Eva Souza"', async () => {
          await gerenciarUsuarios.acessarPelaAdministracao();
          await gerenciarUsuarios.pesquisar('Eva Souza');
        });
        await test.step('E abri "Editar usuário"', () => gerenciarUsuarios.abrirEdicao('Eva Souza'));
        await test.step(`Então o campo "Cargo" exibiu "${cargos.analistaDeQualidade}"`, () =>
          expect(gerenciarUsuarios.cargoNoModal).toHaveText(cargos.analistaDeQualidade));
        await test.step('E fechei sem salvar', () => gerenciarUsuarios.botaoCancelarModal.click());
      });
    });
  }
});

test.describe('Campos obrigatórios', { tag: '@dt-criar-conta' }, () => {
  test.use({ storageState: semSessao });

  test.beforeEach(({ criarConta }) => criarConta.acessarPeloLogin());

  for (const { id, campo, bloco, mensagem } of obrigatoriosVerificacao) {
    test(`${id} - "${campo}" é obrigatório na "Verificação de idade e localização"`, async ({ criarConta }) => {
      await test.step(`Então o campo "${campo}" foi marcado como obrigatório`, () =>
        expect(criarConta.marcaObrigatorio(bloco)).toBeVisible());
      await test.step('Quando cliquei em "Continuar" sem preencher os campos', () => criarConta.botaoContinuar.click());
      await test.step(`Então a mensagem "${mensagem}" foi exibida`, () => expect(criarConta.mensagemDoCampo(bloco)).toHaveText(mensagem));
      await test.step(`E permaneci na página "${paginas.verificacao}"`, () => expect(criarConta.tituloVerificacao).toBeVisible());
    });
  }

  for (const { id, campo, bloco, mensagem } of obrigatoriosNovaConta) {
    test(`${id} - "${campo}" é obrigatório na "Nova conta"`, async ({ criarConta }) => {
      await test.step('Quando acessei a página "Nova conta"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step(`Então o campo "${campo}" foi marcado como obrigatório`, () =>
        expect(criarConta.marcaObrigatorio(bloco)).toBeVisible());
      await test.step('Quando cliquei em "Criar minha conta" sem preencher os campos', () => criarConta.botaoCriarMinhaConta.click());
      await test.step(`Então a mensagem "${mensagem}" foi exibida`, () => expect(criarConta.mensagemDoCampo(bloco)).toHaveText(mensagem));
      await test.step(`E permaneci na página "${paginas.novaConta}", sem criar a conta`, () =>
        expect(criarConta.tituloNovaConta).toBeVisible());
    });
  }

  test(`${dataNascimento.id} - "${dataNascimento.campo}" é marcado como obrigatório na "Nova conta"`, async ({ criarConta }) => {
    await test.step('Quando acessei a página "Nova conta"', () =>
      criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
    await test.step(`Então o campo "${dataNascimento.campo}" foi marcado como obrigatório`, () =>
      expect(criarConta.marcaObrigatorio(dataNascimento.bloco)).toBeVisible());
  });
});

test.describe('Botão "Cancelar"', { tag: '@dt-criar-conta' }, () => {
  test.describe('Sem login', () => {
    test.use({ storageState: semSessao });

    test.beforeEach(({ criarConta }) => criarConta.acessarPeloLogin());

    test('CAN01 - "Cancelar" na "Verificação de idade e localização" volta para a página de login', async ({ page, criarConta }) => {
      await test.step('Quando cliquei em "Cancelar"', () => criarConta.botaoCancelar.click());
      await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
    });

    test('CAN02 - "Cancelar" na "Nova conta" volta para a página de login', async ({ page, criarConta }) => {
      await test.step('Quando acessei a "Nova conta" e cliquei em "Cancelar"', async () => {
        await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
        await criarConta.botaoCancelar.click();
      });
      await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
    });
  });

  test.describe('Administrador', () => {
    test.use({ storageState: '.auth/administrador.json' });

    test('CAN03 - "Cancelar" na edição do campo "Cargo" fecha sem alterar a configuração', async ({ camposPerfil }) => {
      await test.step('Quando editei o campo "Cargo" e cliquei em "Cancelar"', async () => {
        await camposPerfil.acessar();
        await camposPerfil.editarCampo('Cargo');
        await camposPerfil.botaoCancelar.click();
      });
      await test.step('Então a janela foi fechada', () => expect(camposPerfil.modal).toBeHidden());
      await test.step('E "Mostrar na página de cadastro?" continuou ativo', async () => {
        await camposPerfil.editarCampo('Cargo');
        await expect(camposPerfil.mostrarNaPaginaDeCadastro.locator('option:checked')).toHaveText('Sim');
        await camposPerfil.botaoCancelar.click();
      });
    });
  });

  test.describe('Adm Cliente', () => {
    test.use({ storageState: '.auth/cliente.json' });

    test('CAN04 - "Cancelar" em "Editar usuário" fecha sem alterar o Cargo', async ({ gerenciarUsuarios }) => {
      await test.step('Quando abri "Editar usuário" de "Eva Souza" e cliquei em "Cancelar"', async () => {
        await gerenciarUsuarios.acessarPelaAdministracao();
        await gerenciarUsuarios.pesquisar('Eva Souza');
        await gerenciarUsuarios.abrirEdicao('Eva Souza');
        await gerenciarUsuarios.botaoCancelarModal.click();
      });
      await test.step('Então a janela foi fechada', () => expect(gerenciarUsuarios.modalEditar).toBeHidden());
      await test.step(`E o Cargo continuou "${cargos.analistaDeQualidade}"`, async () => {
        await gerenciarUsuarios.abrirEdicao('Eva Souza');
        await expect(gerenciarUsuarios.cargoNoModal).toHaveText(cargos.analistaDeQualidade);
        await gerenciarUsuarios.botaoCancelarModal.click();
      });
    });
  });
});
