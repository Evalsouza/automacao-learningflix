// DTI/EVTI - Redefinição de Senha Personalizada — rastreabilidade em RASTREABILIDADE.md
// Nenhum teste salva senha nova: os positivos param na página "Redefinir senha".
// RP08 — usuário sem o dado cadastrado — fica na suíte de configuração, com "Cidade de Nascimento" no "Campo secundário"
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../../support/sessoes';
import {
  ConfiguracaoRedefinicaoPage,
  garantirRedefinicaoPersonalizada,
  prepararRedefinicaoPersonalizada,
} from '../../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { usuariosRedefinicao } from '../../../support/usuarios';
import { lerDadosDoUsuario } from '../../../support/redefinicaosenha_commands/dadosDoUsuario';
import { mensagens, paginas, configuracaoAtual, configuracaoPrimario } from '../../../fixtures/redefinicaosenha';
import { Factories } from '../../../Factories';
import { prioridade } from '../../../fixtures/prioridades';

const { evaSouza, anyaForger, qaAluno21 } = usuariosRedefinicao;

// Habilita a personalizada antes, se estiver desabilitada, e desabilita no final — decisão da QA (10/11).
// Desde 26/11 também define "CPF" e "Data de Nascimento" nos campos antes dos testes (em 26/11 o secundário estava em
// "Telefone"): é a configuração de referência, por isso fica na diária — decisão da QA
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await prepararRedefinicaoPersonalizada(browser);
});
test.afterAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await garantirRedefinicaoPersonalizada(browser, false);
});

test.describe('CENÁRIO 1: Ativação do Reset de Senha Personalizado', { tag: '@dt-redefinicao-personalizada' }, () => {
  test.use({ storageState: sessoes.administrador });

  test(
    'RP01 - Campo "Cargo" exibido em "Dados Profissionais" de "Campos de perfil do usuário"',
    { tag: prioridade('RedefinicaoSenha', 'RP01') },
    async ({ page, camposPerfil }) => {
      await test.step('Quando acessei "Campos de perfil do usuário"', () => camposPerfil.acessar());
      await test.step('Então o campo "Cargo" foi exibido em "Dados Profissionais"', () =>
        expect(page.getByRole('row', { name: /^Cargo Editar/ })).toBeVisible());
    },
  );

  test(
    'RP02 - Redefinição personalizada ativa, com "CPF" no "Campo primário" e "Data de Nascimento" no "Campo secundário"',
    { tag: prioridade('RedefinicaoSenha', 'RP02') },
    async ({ configuracaoRedefinicao: config }) => {
      await test.step(`Quando, em "Configurações - Redefinição de senha personalizada", selecionei "${configuracaoAtual.primario}" no "Campo primário" e "${configuracaoAtual.secundario}" no "Campo secundário" e salvei`, () =>
        config.definirCampos(configuracaoAtual.primario, configuracaoAtual.secundario));
      await test.step('Então a redefinição personalizada estava ativa', () => expect(config.ativar).toBeChecked());
      await test.step(`E o "Campo primário" ficou "${configuracaoAtual.primario}" e o "Campo secundário" "${configuracaoAtual.secundario}"`, async () => {
        await expect(config.selecionado(config.campoPrimario)).toHaveText(configuracaoAtual.primario);
        await expect(config.selecionado(config.campoSecundario)).toHaveText(configuracaoAtual.secundario);
      });
    },
  );

  test(
    'RP09 - "Telefone" configurado como obrigatório, único e visível para o usuário',
    { tag: prioridade('RedefinicaoSenha', 'RP09') },
    async ({ camposPerfil }) => {
      const atual = await test.step('Quando acessei a configuração do campo "Telefone"', () => camposPerfil.lerConfiguracao('Telefone'));
      await test.step(`Então "Este campo é obrigatório?" estava "${configuracaoPrimario.obrigatorio}"`, () =>
        expect(atual.obrigatorio).toBe(configuracaoPrimario.obrigatorio));
      await test.step(`E "A informação deve ser única?" estava "${configuracaoPrimario.unica}"`, () =>
        expect(atual.unica).toBe(configuracaoPrimario.unica));
      await test.step(`E "Quem pode ver este campo?" estava "${configuracaoPrimario.visibilidade}"`, () =>
        expect(atual.visibilidade).toBe(configuracaoPrimario.visibilidade));
    },
  );

  test(
    'RP10 - "Telefone" exibido para seleção no "Campo primário"',
    { tag: prioridade('RedefinicaoSenha', 'RP10') },
    async ({ configuracaoRedefinicao: config }) => {
      await test.step('Quando acessei "Configurações - Redefinição de senha personalizada"', () => config.acessar());
      await test.step('Então a opção "Telefone" foi exibida no "Campo primário"', async () =>
        expect(await config.opcoes(config.campoPrimario)).toContain('Telefone'));
    },
  );
});

test.describe('CENÁRIO 2: Redefinição da senha pelo usuário', { tag: '@dt-redefinicao-personalizada' }, () => {
  test.use({ storageState: semSessao });

  test(
    `RP03 - "Perdeu a senha?" exibe "${configuracaoAtual.primario}" e "${configuracaoAtual.secundario}"`,
    { tag: prioridade('RedefinicaoSenha', 'RP03') },
    async ({ perdeuSenha }) => {
      await test.step('Quando cliquei em "Esqueci a senha" na página de login', () => perdeuSenha.acessarPeloLogin());
      await test.step(`Então a página "${paginas.perdeuSenha}" exibiu os campos "${configuracaoAtual.primario}" e "${configuracaoAtual.secundario}"`, async () => {
        await expect(perdeuSenha.titulo).toBeVisible();
        await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoPrimario)).toHaveText(configuracaoAtual.primario);
        await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoSecundario)).toHaveText(configuracaoAtual.secundario);
      });
    },
  );

  // Ordem da QA (09/11): os obrigatórios e o "Cancelar" logo depois de abrir a página
  for (const { id, bloco } of [
    { id: 'OBR01', bloco: 'primario' as const },
    { id: 'OBR02', bloco: 'secundario' as const },
  ]) {
    const nome = bloco === 'primario' ? configuracaoAtual.primario : configuracaoAtual.secundario;
    test(`${id} - "${nome}" é obrigatório em "Perdeu a senha?"`, { tag: prioridade('RedefinicaoSenha', id) }, async ({ perdeuSenha }) => {
      const campo = bloco === 'primario' ? perdeuSenha.blocoPrimario : perdeuSenha.blocoSecundario;
      await test.step(`Quando acessei a página "${paginas.perdeuSenha}"`, () => perdeuSenha.acessar());
      await test.step(`Então o campo "${nome}" foi marcado como obrigatório`, () =>
        expect(perdeuSenha.marcaObrigatorio(campo)).toBeVisible());
      await test.step('Quando cliquei em "Enviar" sem preencher os campos', () => perdeuSenha.botaoEnviar.click());
      await test.step(`Então a mensagem "${mensagens.campoObrigatorio}" foi exibida`, () =>
        expect(perdeuSenha.mensagemDoCampo(campo)).toHaveText(mensagens.campoObrigatorio));
    });
  }

  test(
    'CAN01 - "Cancelar" em "Perdeu a senha?" volta para a página de login',
    { tag: prioridade('RedefinicaoSenha', 'CAN01') },
    async ({ page, perdeuSenha }) => {
      await test.step(`Quando acessei a página "${paginas.perdeuSenha}" e cliquei em "Cancelar"`, async () => {
        await perdeuSenha.acessar();
        await perdeuSenha.botaoCancelar.click();
      });
      await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
    },
  );

  test(
    `CAN01.1 - "Cancelar" com "${configuracaoAtual.primario}" e "${configuracaoAtual.secundario}" preenchidos volta para a página de login`,
    { tag: prioridade('RedefinicaoSenha', 'CAN01.1') },
    async ({ browser, page, perdeuSenha }) => {
      const dados = await test.step('Dado que consultei a data de nascimento no cadastro do usuário', () =>
        lerDadosDoUsuario(browser, evaSouza.nome));
      await test.step(`Quando preenchi "${configuracaoAtual.primario}" e "${configuracaoAtual.secundario}"`, async () => {
        await perdeuSenha.acessar();
        await perdeuSenha.preencherCampos(evaSouza.identificacao, dados.dtanasc);
      });
      await test.step('E cliquei em "Cancelar"', () => perdeuSenha.botaoCancelar.click());
      await test.step('Então voltei para a página de login, sem ir para "Redefinir senha"', async () => {
        await expect(page).toHaveURL(/\/login\/index\.php/);
        await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
      });
    },
  );

  // Só leitura: a configuração é lida como Administrador e comparada com a tela — pedido da QA (09/11)
  test(
    'RP11 - "Perdeu a senha?" exibe só os campos configurados na redefinição personalizada',
    { tag: prioridade('RedefinicaoSenha', 'RP11') },
    async ({ browser, perdeuSenha }) => {
      const config = await test.step('Dado que li o "Campo primário" e o "Campo secundário" em "Redefinição de senha personalizada"', () =>
        comSessao(browser, sessoes.administrador, async (pagina) => {
          const configuracao = new ConfiguracaoRedefinicaoPage(pagina);
          await configuracao.acessar();
          return {
            ativa: await configuracao.ativar.isChecked(),
            primario: (await configuracao.selecionado(configuracao.campoPrimario).innerText()).trim(),
            secundario: (await configuracao.selecionado(configuracao.campoSecundario).innerText()).trim(),
          };
        }));
      await test.step('E a redefinição personalizada estava ativa — desativada, a página padrão é coberta pelo RS01', () =>
        expect(config.ativa).toBe(true));
      await test.step(`Quando acessei a página "${paginas.perdeuSenha}"`, () => perdeuSenha.acessar());
      await test.step(`Então foram exibidos "${config.primario}" no primeiro campo e "${config.secundario}" no segundo`, async () => {
        await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoPrimario)).toHaveText(config.primario);
        await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoSecundario)).toHaveText(config.secundario);
      });
      await test.step('E os campos da redefinição padrão (identificação de usuário e e-mail) NÃO foram exibidos', async () => {
        await expect(perdeuSenha.campoIdentificacaoPadrao).toBeHidden();
        await expect(perdeuSenha.campoEmailPadrao).toBeHidden();
      });
      await test.step('E os botões "Enviar" e "Cancelar" foram exibidos', async () => {
        await expect(perdeuSenha.botaoEnviar).toBeVisible();
        await expect(perdeuSenha.botaoCancelar).toBeVisible();
      });
    },
  );

  // RP05 foi para a suíte semanal valida_troca_senha_redefinicao.spec.ts em 23/11: troca a senha e envia e-mail (pedido da QA)
  const corretos = [{ id: 'RP04', usuario: evaSouza }];
  for (const { id, usuario } of corretos) {
    test(
      `${id} - "${usuario.identificacao}" com a data de nascimento do cadastro é redirecionado para "${paginas.redefinir}"`,
      { tag: prioridade('RedefinicaoSenha', id) },
      async ({ browser, perdeuSenha }) => {
        const dados = await test.step('Dado que consultei a data de nascimento no cadastro do usuário', () =>
          lerDadosDoUsuario(browser, usuario.nome));
        await test.step(`Quando preenchi "${usuario.identificacao}" e a data de nascimento correta e cliquei em "Enviar"`, async () => {
          await perdeuSenha.acessar();
          await perdeuSenha.redefinir(usuario.identificacao, dados.dtanasc);
        });
        await test.step(`Então fui redirecionada para a página "${paginas.redefinir}"`, async () => {
          await expect(perdeuSenha.tituloRedefinir).toBeVisible();
          await expect(perdeuSenha.campoNovaSenha).toHaveCount(1);
        });
      },
    );
  }

  test(
    `RP06 - "${anyaForger.identificacao}" com a data de nascimento errada NÃO altera a senha`,
    { tag: prioridade('RedefinicaoSenha', 'RP06') },
    async ({ browser, perdeuSenha }) => {
      const dados = await test.step('Dado que consultei a data de nascimento no cadastro do usuário', () =>
        lerDadosDoUsuario(browser, anyaForger.nome));
      await test.step(`Quando preenchi "${anyaForger.identificacao}" e uma data de nascimento errada e cliquei em "Enviar"`, async () => {
        await perdeuSenha.acessar();
        await perdeuSenha.redefinir(anyaForger.identificacao, Factories.redefinicao.dataDiferente(dados.dtanasc));
      });
      await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
        await expect(perdeuSenha.mensagemErro).toBeVisible();
        await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
      });
    },
  );

  test(
    `RP07 - Identificação errada com a data de nascimento correta de "${qaAluno21.identificacao}" NÃO altera a senha`,
    { tag: prioridade('RedefinicaoSenha', 'RP07') },
    async ({ browser, perdeuSenha }) => {
      const dados = await test.step('Dado que consultei a data de nascimento no cadastro do usuário', () =>
        lerDadosDoUsuario(browser, qaAluno21.nome));
      await test.step('Quando preenchi uma identificação errada e a data de nascimento correta e cliquei em "Enviar"', async () => {
        await perdeuSenha.acessar();
        await perdeuSenha.redefinir(Factories.redefinicao.identificacaoInexistente(), dados.dtanasc);
      });
      await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
        await expect(perdeuSenha.mensagemErro).toBeVisible();
        await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
      });
    },
  );
  // RP12 foi para a suíte de configuração em 23/11: troca o "Campo secundário" para "Telefone" (pedido da QA)
});
