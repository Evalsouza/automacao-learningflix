// DTI/EVTI - Página Criar uma conta — rastreabilidade em RASTREABILIDADE.md
// Ordem da QA (09/11): Verificação de idade e localização → Nova conta → consultas do Cargo
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../../support/sessoes';
import { CriarContaPage } from '../../../support/cadastro_commands/CriarContaPage';
import { MinhaPaginaPage } from '../../../support/cadastro_commands/MinhaPaginaPage';
import { CamposPerfilPage } from '../../../support/cadastro_commands/CamposPerfilPage';
import { ConfiguracaoPrivacidadePage } from '../../../support/cadastro_commands/ConfiguracaoPrivacidadePage';
import { lerDadosDoUsuario } from '../../../support/redefinicaosenha_commands/dadosDoUsuario';
import { usuarios } from '../../../support/usuarios';
import {
  paginas,
  cargos,
  pais,
  paisesDaVerificacao,
  camposPadraoNovaConta,
  obrigatoriosVerificacao,
  obrigatoriosNovaConta,
  dataNascimento,
  telefone,
  menorDigital,
  verificacoesDeIdade,
} from '../../../fixtures/cadastro';
import { Factories } from '../../../Factories';
import { prioridade } from '../../../fixtures/prioridades';

const paginaDeLogin = /\/login\/index\.php/;

test.describe('Verificação de idade e localização', { tag: '@dt-criar-conta' }, () => {
  test.use({ storageState: semSessao });

  test.beforeEach(({ criarConta }) => criarConta.acessarPeloLogin());

  test(
    'C002 - "Criar uma conta" exibe a página "Verificação de idade e localização"',
    { tag: prioridade('Cadastro', 'C002') },
    async ({ criarConta }) => {
      await test.step(`Então a página "${paginas.verificacao}" foi exibida`, () => expect(criarConta.tituloVerificacao).toBeVisible());
    },
  );

  for (const { id, campo, bloco, mensagem } of obrigatoriosVerificacao) {
    test(
      `${id} - "${campo}" é obrigatório na "Verificação de idade e localização"`,
      { tag: prioridade('Cadastro', id) },
      async ({ criarConta }) => {
        await test.step(`Então o campo "${campo}" foi marcado como obrigatório`, () =>
          expect(criarConta.marcaObrigatorio(bloco)).toBeVisible());
        await test.step('Quando cliquei em "Continuar" sem preencher os campos', () => criarConta.botaoContinuar.click());
        await test.step(`Então a mensagem "${mensagem}" foi exibida`, () => expect(criarConta.mensagemDoCampo(bloco)).toHaveText(mensagem));
        await test.step(`E permaneci na página "${paginas.verificacao}"`, () => expect(criarConta.tituloVerificacao).toBeVisible());
      },
    );
  }

  // Cada teste abre um navegador novo: depois do bloqueio, o navegador continua na página "Menor digital"
  for (const { id, idade, bloqueado } of verificacoesDeIdade) {
    test(
      `${id} - Idade ${idade} anos ${bloqueado ? `é bloqueada na página "${menorDigital.titulo}"` : `segue para a página "${paginas.novaConta}"`}`,
      { tag: prioridade('Cadastro', id) },
      async ({ page, criarConta }) => {
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
      },
    );
  }

  test(
    `IDA01.1 - Depois da "${menorDigital.titulo}", "Criar uma conta" continua na "${menorDigital.titulo}"`,
    { tag: prioridade('Cadastro', 'IDA01.1') },
    async ({ page, criarConta }) => {
      const idade = verificacoesDeIdade[0].idade;
      await test.step(`Quando informei a idade ${idade} anos e fui bloqueada na página "${menorDigital.titulo}"`, async () => {
        await criarConta.verificarIdadeELocalizacao(idade, pais);
        await expect(criarConta.mensagemMenorDigital).toBeVisible();
      });
      await test.step('E voltei para a página de login e cliquei de novo em "Criar uma conta"', () => criarConta.clicarCriarContaNoLogin());
      await test.step(`Então a página "${menorDigital.titulo}" foi exibida de novo, sem a "${paginas.verificacao}"`, async () => {
        await expect(page).toHaveTitle(menorDigital.titulo);
        await expect(criarConta.mensagemMenorDigital).toBeVisible();
        await expect(criarConta.tituloVerificacao).toBeHidden();
      });
    },
  );

  test('C003 - "Continuar" redireciona para a página "Nova conta"', { tag: prioridade('Cadastro', 'C003') }, async ({ criarConta }) => {
    await test.step('Quando preenchi idade e país e cliquei em "Continuar"', () =>
      criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
    await test.step(`Então fui redirecionada para a página "${paginas.novaConta}"`, () => expect(criarConta.tituloNovaConta).toBeVisible());
  });

  for (const { id, pais: paisInformado } of paisesDaVerificacao) {
    test(
      `${id} - País "${paisInformado}" segue para a página "Nova conta"`,
      { tag: prioridade('Cadastro', id) },
      async ({ criarConta }) => {
        await test.step(`Quando informei uma idade adulta e o país "${paisInformado}" e cliquei em "Continuar"`, () =>
          criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), paisInformado));
        await test.step(`Então fui redirecionada para a página "${paginas.novaConta}"`, () =>
          expect(criarConta.tituloNovaConta).toBeVisible());
      },
    );
  }

  test(
    'CAN01 - "Cancelar" na "Verificação de idade e localização" volta para a página de login',
    { tag: prioridade('Cadastro', 'CAN01') },
    async ({ page, criarConta }) => {
      await test.step('Quando cliquei em "Cancelar"', () => criarConta.botaoCancelar.click());
      await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(paginaDeLogin));
    },
  );

  test(
    'CAN01.1 - "Cancelar" com idade e país preenchidos volta para a página de login',
    { tag: prioridade('Cadastro', 'CAN01.1') },
    async ({ page, criarConta }) => {
      await test.step('Quando preenchi a idade e o país', async () => {
        await criarConta.campoIdade.fill(Factories.cadastro.idadeAdulta());
        await criarConta.campoPaisVerificacao.selectOption({ label: pais });
      });
      await test.step('E cliquei em "Cancelar"', () => criarConta.botaoCancelar.click());
      await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(paginaDeLogin));
    },
  );
});

test.describe('Nova conta', { tag: '@dt-criar-conta' }, () => {
  test.use({ storageState: semSessao });

  test.beforeEach(({ criarConta }) => criarConta.acessarPeloLogin());

  for (const { id, campo, bloco, mensagem } of obrigatoriosNovaConta) {
    test(`${id} - "${campo}" é obrigatório na "Nova conta"`, { tag: prioridade('Cadastro', id) }, async ({ criarConta }) => {
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

  test(
    `${dataNascimento.id} - "${dataNascimento.campo}" é marcado como obrigatório na "Nova conta"`,
    { tag: prioridade('Cadastro', dataNascimento.id) },
    async ({ criarConta }) => {
      await test.step('Quando acessei a página "Nova conta"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step(`Então o campo "${dataNascimento.campo}" foi marcado como obrigatório`, () =>
        expect(criarConta.marcaObrigatorio(dataNascimento.bloco)).toBeVisible());
    },
  );

  // Pedido da QA (17/11): o "Telefone" obrigatório sem aparecer no cadastro impedia a criação da conta
  test(
    `${telefone.id} - "${telefone.campo}" é obrigatório na "Nova conta"`,
    { tag: prioridade('Cadastro', telefone.id) },
    async ({ criarConta }) => {
      await test.step('Quando acessei a página "Nova conta"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step(`Então o campo "${telefone.campo}" foi exibido e marcado como obrigatório`, () =>
        expect(criarConta.marcaObrigatorio(telefone.bloco)).toBeVisible());
      await test.step('Quando cliquei em "Criar minha conta" sem preencher os campos', () => criarConta.botaoCriarMinhaConta.click());
      await test.step(`Então a mensagem "${telefone.mensagem}" foi exibida`, () =>
        expect(criarConta.mensagemDoCampo(telefone.bloco)).toHaveText(telefone.mensagem));
      await test.step(`E permaneci na página "${paginas.novaConta}", sem criar a conta`, () =>
        expect(criarConta.tituloNovaConta).toBeVisible());
    },
  );

  test(
    'C004 - Campo "Cargo" exibe os cargos cadastrados e permite selecionar "Analista de Qualidade"',
    { tag: prioridade('Cadastro', 'C004') },
    async ({ criarConta }) => {
      await test.step('Quando acessei a página "Nova conta"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step('Então o campo "Cargo" exibiu os cargos cadastrados', async () =>
        expect(await criarConta.cargosDisponiveis()).toContain(cargos.analistaDeQualidade));
      await test.step(`Quando selecionei o cargo "${cargos.analistaDeQualidade}"`, () =>
        criarConta.selecionarCargo(cargos.analistaDeQualidade));
      await test.step('Então o cargo ficou selecionado', () =>
        expect(criarConta.selectCargo.locator('option:checked')).toHaveText(cargos.analistaDeQualidade));
    },
  );

  test(
    'CAN02 - "Cancelar" na "Nova conta" volta para a página de login',
    { tag: prioridade('Cadastro', 'CAN02') },
    async ({ page, criarConta }) => {
      await test.step('Quando acessei a "Nova conta" e cliquei em "Cancelar"', async () => {
        await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
        await criarConta.botaoCancelar.click();
      });
      await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(paginaDeLogin));
    },
  );

  test(
    'CAN02.1 - Depois de "Cancelar" na "Nova conta", "Criar uma conta" NÃO exibe a "Verificação de idade e localização"',
    { tag: prioridade('Cadastro', 'CAN02.1') },
    async ({ page, criarConta }) => {
      await test.step('Quando acessei a "Nova conta" e cliquei em "Cancelar"', async () => {
        await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
        await criarConta.botaoCancelar.click();
        await expect(page).toHaveURL(paginaDeLogin);
      });
      await test.step('E cliquei de novo em "Criar uma conta"', () => criarConta.clicarCriarContaNoLogin());
      await test.step(`Então fui direto para a página "${paginas.novaConta}", sem a "${paginas.verificacao}"`, async () => {
        await expect(criarConta.tituloNovaConta).toBeVisible();
        await expect(criarConta.tituloVerificacao).toBeHidden();
      });
    },
  );
});

test.describe('Campos exibidos conforme a configuração', { tag: '@dt-criar-conta' }, () => {
  test.use({ storageState: semSessao });

  // Só leitura: a configuração é lida como Administrador e comparada com a tela
  test(
    'CD01 - "Criar uma conta" exibe os campos ativos na plataforma',
    { tag: prioridade('Cadastro', 'CD01') },
    async ({ browser, page, criarConta }) => {
      // Lê a configuração de cada campo exibido como Administrador: com o "Telefone" (17/11) são 4 janelas de edição
      test.setTimeout(180_000);
      const verificacaoAtiva =
        await test.step('Dado que li a "Verificação da idade de consentimento digital" em "Configurações de privacidade"', () =>
          comSessao(browser, sessoes.administrador, (pagina) => new ConfiguracaoPrivacidadePage(pagina).lerVerificacaoDeIdade()));
      const exibida = verificacaoAtiva ? 'exibida' : 'NÃO exibida';

      await test.step('Quando cliquei em "Criar uma conta" na página de login', () => criarConta.clicarCriarContaNoLogin());
      await test.step(`Então a "${paginas.verificacao}" foi ${exibida}, com "Qual é a sua idade?" e "Em qual país você vive?"`, async () => {
        await expect(criarConta.tituloVerificacao).toBeVisible({ visible: verificacaoAtiva });
        await expect(criarConta.campoIdade).toBeVisible({ visible: verificacaoAtiva });
        await expect(criarConta.campoPaisVerificacao).toBeVisible({ visible: verificacaoAtiva });
      });

      await test.step(`Quando segui para a página "${paginas.novaConta}"`, () =>
        criarConta.avancarParaNovaConta(Factories.cadastro.idadeAdulta(), pais));
      await test.step('Então os campos padrão foram exibidos', async () => {
        for (const { campo, bloco } of camposPadraoNovaConta) await expect.soft(page.locator(`#${bloco}`), campo).toBeVisible();
      });

      const exibidos = await criarConta.camposDePerfilExibidos();
      expect(exibidos.length, 'campos de perfil na "Nova conta"').toBeGreaterThan(0);
      const configuracao =
        await test.step(`E li em "Campos de perfil do usuário" os campos exibidos: ${exibidos.map((c) => `"${c.rotulo}"`).join(', ')}`, () =>
          comSessao(browser, sessoes.administrador, async (pagina) => {
            const campos = new CamposPerfilPage(pagina);
            const lidos: Record<string, { mostrarNoCadastro: string; obrigatorio: string }> = {};
            for (const { rotulo } of exibidos) lidos[rotulo] = await campos.lerCadastro(rotulo);
            return lidos;
          }));

      for (const { rotulo, obrigatorio } of exibidos) {
        await test.step(`E "${rotulo}" tem "Mostrar na página de cadastro?" = "Sim" e a marca de obrigatório segue "Este campo é obrigatório?"`, () => {
          expect.soft(configuracao[rotulo].mostrarNoCadastro, `"${rotulo}" exibido no cadastro`).toBe('Sim');
          expect.soft(obrigatorio, `marca de obrigatório de "${rotulo}"`).toBe(configuracao[rotulo].obrigatorio === 'Sim');
        });
      }
    },
  );
});

test.describe('CENÁRIO 1: Cadastro de usuário com Cargo "Comum"', { tag: '@dt-criar-conta' }, () => {
  test.describe('Administrador', () => {
    test.use({ storageState: sessoes.administrador });

    test(
      'C001 - Campo "Cargo" ativo para exibição no formulário de cadastro',
      { tag: prioridade('Cadastro', 'C001') },
      async ({ camposPerfil }) => {
        await test.step('Quando acessei "Campos de perfil do usuário" e editei o campo "Cargo" em "Dados Profissionais"', async () => {
          await camposPerfil.acessar();
          await camposPerfil.editarCampo('Cargo');
        });
        await test.step('Então "Mostrar na página de cadastro?" estava ativo', () =>
          expect(camposPerfil.mostrarNaPaginaDeCadastro.locator('option:checked')).toHaveText('Sim'));
        await test.step('E fechei sem salvar', () => camposPerfil.botaoCancelar.click());
      },
    );

    test(
      'C007 - Cargos de gestão NÃO são exibidos no campo "Cargo" da "Nova conta"',
      { tag: prioridade('Cadastro', 'C007') },
      async ({ browser, hierarquia }) => {
        let gestores: string[] = [];
        let disponiveis: string[] = [];
        await test.step('Quando consultei os cargos com "Cargo Gestor" no "Gerenciador de Hierarquia"', async () => {
          await hierarquia.acessarCargos();
          gestores = await hierarquia.cargosGestores();
          expect(gestores.length, 'o Gerenciador de Hierarquia deve ter cargos de gestão').toBeGreaterThan(0);
        });
        await test.step('E acessei a página "Nova conta" sem login', () =>
          comSessao(browser, semSessao, async (pagina) => {
            const criarConta = new CriarContaPage(pagina);
            await criarConta.acessarPeloLogin();
            await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
            await criarConta.tituloNovaConta.waitFor();
            disponiveis = await criarConta.cargosDisponiveis();
          }));
        await test.step('Então nenhum cargo de gestão foi exibido no campo "Cargo"', () =>
          expect(
            disponiveis.filter((cargo) => gestores.includes(cargo)),
            'cargos de gestão exibidos no cadastro',
          ).toEqual([]));
      },
    );

    test(
      'CAN03 - "Cancelar" na edição do campo "Cargo" fecha sem alterar a configuração',
      { tag: prioridade('Cadastro', 'CAN03') },
      async ({ camposPerfil }) => {
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
      },
    );
  });

  test.describe('Estudante', () => {
    test.use({ storageState: sessoes.estudante });

    // O Cargo da Eva muda na plataforma: é lido do cadastro na hora — decisão da QA (04/11).
    // Lido com o Adm Cliente, sem usar o Administrador — decisão da QA (09/11)
    test(
      'C006 - "Minha página" exibe o Cargo e o Gestor em "Dados Profissionais"',
      { tag: prioridade('Cadastro', 'C006') },
      async ({ browser, minhaPagina }) => {
        const cargo =
          await test.step('Dado que li, com o Adm Cliente, o Cargo da "Eva Souza" em "Gerenciar usuários" → "Editar usuário", sem salvar', async () =>
            (await lerDadosDoUsuario(browser, usuarios.estudante.nome, sessoes.cliente)).position);
        await test.step('Quando acessei a "Minha página"', () => minhaPagina.acessar());
        await test.step(`Então o campo "Cargo" exibiu o Cargo do cadastro, "${cargo}"`, () =>
          expect(minhaPagina.valorDoCampo('Cargo')).toHaveText(cargo));
        await test.step(`E o campo "Gestor" exibiu "${cargos.gestorDaEstudante}"`, () =>
          expect(minhaPagina.valorDoCampo('Gestor')).toHaveText(cargos.gestorDaEstudante));
      },
    );
  });
});

test.describe('CENÁRIO 2: Consulta do cadastro do usuário na página de Cadastro do usuário', { tag: '@dt-criar-conta' }, () => {
  const consultas = [
    { id: 'C009', perfil: 'Adm Cliente', sessao: sessoes.cliente },
    { id: 'C010', perfil: 'Administrador', sessao: sessoes.administrador },
  ];

  for (const { id, perfil, sessao } of consultas) {
    test.describe(perfil, () => {
      test.use({ storageState: sessao });

      // Inclui o antigo CAN04: "Cancelar" fecha a janela sem alterar o Cargo — decisão da QA (09/11)
      test(
        `${id} - "${perfil}" consulta o Cargo de "Eva Souza" em "Gerenciar usuários"`,
        { tag: prioridade('Cadastro', id) },
        async ({ browser, gerenciarUsuarios }) => {
          const cargo = await test.step('Dado que li o Cargo na "Minha página" da "Eva Souza"', () =>
            comSessao(browser, sessoes.estudante, async (pagina) => {
              const minhaPagina = new MinhaPaginaPage(pagina);
              await minhaPagina.acessar();
              return minhaPagina.valorOuVazio('Cargo');
            }));
          await test.step('Quando acessei "Administração → Gerenciar usuários" e pesquisei "Eva Souza"', async () => {
            await gerenciarUsuarios.acessarPelaAdministracao();
            await gerenciarUsuarios.pesquisar('Eva Souza');
          });
          await test.step('E abri "Editar usuário"', () => gerenciarUsuarios.abrirEdicao('Eva Souza'));
          await test.step(`Então o campo "Cargo" exibiu o mesmo Cargo da "Minha página", "${cargo}"`, () =>
            expect(gerenciarUsuarios.cargoNoModal).toHaveText(cargo));
          await test.step('Quando cliquei em "Cancelar"', () => gerenciarUsuarios.botaoCancelarModal.click());
          await test.step('Então a janela foi fechada', () => expect(gerenciarUsuarios.modalEditar).toBeHidden());
          await test.step('E ao reabrir "Editar usuário" o Cargo continuou o mesmo', async () => {
            await gerenciarUsuarios.abrirEdicao('Eva Souza');
            await expect(gerenciarUsuarios.cargoNoModal).toHaveText(cargo);
            await gerenciarUsuarios.botaoCancelarModal.click();
          });
        },
      );
    });
  }
});
