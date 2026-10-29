// DTI/EVTI - Redefinição de Senha Personalizada — rastreabilidade em RASTREABILIDADE.md
// Nenhum teste salva senha nova: os positivos param na página "Redefinir senha".
// RP08 — usuário sem o dado cadastrado — fica na suíte de configuração, com "Cidade de Nascimento" no "Campo secundário"
import { test, expect } from '../../support/e2e';
import { usuariosRedefinicao } from '../../support/usuarios';
import { lerDadosDoUsuario } from '../../support/redefinicaosenha_commands/dadosDoUsuario';
import { mensagens, paginas, configuracaoAtual, configuracaoPrimario } from '../../fixtures/redefinicaosenha';
import { Factories } from '../../Factories';

const { evaSouza, meridaValente, anyaForger, qaAluno21 } = usuariosRedefinicao;
const semSessao = { cookies: [], origins: [] };

test.describe('CENÁRIO 1: Ativação do Reset de Senha Personalizado', { tag: '@dt-redefinicao-personalizada' }, () => {
  test.use({ storageState: '.auth/administrador.json' });

  test('RP01 - Campo "Cargo" exibido em "Dados Profissionais" de "Campos de perfil do usuário"', async ({ page, camposPerfil }) => {
    await test.step('Quando acessei "Campos de perfil do usuário"', () => camposPerfil.acessar());
    await test.step('Então o campo "Cargo" foi exibido em "Dados Profissionais"', () =>
      expect(page.getByRole('row', { name: /^Cargo Editar/ })).toBeVisible());
  });

  test('RP02 - Redefinição personalizada ativa com "CPF" e "Data de Nascimento"', async ({ configuracaoRedefinicao: config }) => {
    await test.step('Quando acessei "Configurações - Redefinição de senha personalizada"', () => config.acessar());
    await test.step('Então a redefinição personalizada estava ativa', () => expect(config.ativar).toBeChecked());
    await test.step(`E o "Campo primário" era "${configuracaoAtual.primario}" e o "Campo secundário" "${configuracaoAtual.secundario}"`, async () => {
      await expect(config.selecionado(config.campoPrimario)).toHaveText(configuracaoAtual.primario);
      await expect(config.selecionado(config.campoSecundario)).toHaveText(configuracaoAtual.secundario);
    });
  });

  test('RP09 - "Telefone" configurado como obrigatório, único e visível para o usuário', async ({ camposPerfil }) => {
    const atual = await test.step('Quando acessei a configuração do campo "Telefone"', () => camposPerfil.lerConfiguracao('Telefone'));
    await test.step(`Então "Este campo é obrigatório?" estava "${configuracaoPrimario.obrigatorio}"`, () =>
      expect(atual.obrigatorio).toBe(configuracaoPrimario.obrigatorio));
    await test.step(`E "A informação deve ser única?" estava "${configuracaoPrimario.unica}"`, () =>
      expect(atual.unica).toBe(configuracaoPrimario.unica));
    await test.step(`E "Quem pode ver este campo?" estava "${configuracaoPrimario.visibilidade}"`, () =>
      expect(atual.visibilidade).toBe(configuracaoPrimario.visibilidade));
  });

  test('RP10 - "Telefone" exibido para seleção no "Campo primário"', async ({ configuracaoRedefinicao: config }) => {
    await test.step('Quando acessei "Configurações - Redefinição de senha personalizada"', () => config.acessar());
    await test.step('Então a opção "Telefone" foi exibida no "Campo primário"', async () =>
      expect(await config.opcoes(config.campoPrimario)).toContain('Telefone'));
  });
});

test.describe('CENÁRIO 2: Redefinição da senha pelo usuário', { tag: '@dt-redefinicao-personalizada' }, () => {
  test.use({ storageState: semSessao });

  test(`RP03 - "Perdeu a senha?" exibe "${configuracaoAtual.primario}" e "${configuracaoAtual.secundario}"`, async ({ perdeuSenha }) => {
    await test.step('Quando cliquei em "Esqueci a senha" na página de login', () => perdeuSenha.acessarPeloLogin());
    await test.step(`Então a página "${paginas.perdeuSenha}" exibiu os campos "${configuracaoAtual.primario}" e "${configuracaoAtual.secundario}"`, async () => {
      await expect(perdeuSenha.titulo).toBeVisible();
      await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoPrimario)).toHaveText(configuracaoAtual.primario);
      await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoSecundario)).toHaveText(configuracaoAtual.secundario);
    });
  });

  const corretos = [
    { id: 'RP04', usuario: evaSouza },
    { id: 'RP05', usuario: meridaValente },
  ];
  for (const { id, usuario } of corretos) {
    test(`${id} - "${usuario.identificacao}" com a data de nascimento do cadastro é redirecionado para "${paginas.redefinir}"`, async ({
      browser,
      perdeuSenha,
    }) => {
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
    });
  }

  test(`RP06 - "${anyaForger.identificacao}" com a data de nascimento errada NÃO altera a senha`, async ({ browser, perdeuSenha }) => {
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
  });

  test(`RP07 - Identificação errada com a data de nascimento correta de "${qaAluno21.identificacao}" NÃO altera a senha`, async ({
    browser,
    perdeuSenha,
  }) => {
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
  });
});

test.describe('Campos obrigatórios e "Cancelar"', { tag: '@dt-redefinicao-personalizada' }, () => {
  test.use({ storageState: semSessao });

  test.beforeEach(({ perdeuSenha }) => perdeuSenha.acessar());

  for (const { id, bloco } of [
    { id: 'OBR01', bloco: 'primario' as const },
    { id: 'OBR02', bloco: 'secundario' as const },
  ]) {
    const nome = bloco === 'primario' ? configuracaoAtual.primario : configuracaoAtual.secundario;
    test(`${id} - "${nome}" é obrigatório em "Perdeu a senha?"`, async ({ perdeuSenha }) => {
      const campo = bloco === 'primario' ? perdeuSenha.blocoPrimario : perdeuSenha.blocoSecundario;
      await test.step(`Então o campo "${nome}" foi marcado como obrigatório`, () =>
        expect(perdeuSenha.marcaObrigatorio(campo)).toBeVisible());
      await test.step('Quando cliquei em "Enviar" sem preencher os campos', () => perdeuSenha.botaoEnviar.click());
      await test.step(`Então a mensagem "${mensagens.campoObrigatorio}" foi exibida`, () =>
        expect(perdeuSenha.mensagemDoCampo(campo)).toHaveText(mensagens.campoObrigatorio));
    });
  }

  test('CAN01 - "Cancelar" em "Perdeu a senha?" volta para a página de login', async ({ page, perdeuSenha }) => {
    await test.step('Quando cliquei em "Cancelar"', () => perdeuSenha.botaoCancelar.click());
    await test.step('Então voltei para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
  });
});
