// DTI/EVTI - Redefinição de Senha Personalizada — configuração dos campos — rastreabilidade em RASTREABILIDADE.md
// Altera campos de perfil e a redefinição personalizada, que valem para a plataforma inteira.
// Ao final restaura tudo, mesmo se falhar. Desligada por padrão: rode com `npm run test:redefinicao-config`
import { test, expect } from '../../support/e2e';
import type { Browser } from '@playwright/test';
import { CamposPerfilPage, ConfiguracaoCampo } from '../../support/cadastro_commands/CamposPerfilPage';
import { CriarContaPage } from '../../support/cadastro_commands/CriarContaPage';
import { MinhaPaginaPage } from '../../support/cadastro_commands/MinhaPaginaPage';
import { GerenciarUsuariosPage } from '../../support/cadastro_commands/GerenciarUsuariosPage';
import { ConfiguracaoRedefinicaoPage } from '../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { lerDadosDoUsuario } from '../../support/redefinicaosenha_commands/dadosDoUsuario';
import { usuariosRedefinicao } from '../../support/usuarios';
import {
  mensagens,
  paginas,
  visibilidades,
  apareceNoSecundario,
  camposSecundarios,
  camposPrimarios,
  configuracaoPrimario,
  cargoEm22Out,
} from '../../fixtures/redefinicaosenha';
import { pais } from '../../fixtures/cadastro';
import { Factories } from '../../Factories';

const executar = process.env.EXECUTAR_CONFIG_REDEFINICAO === 'sim';
const { evaSouza, rayssaLima } = usuariosRedefinicao;
const semSessao = { cookies: [], origins: [] };
const camposAlterados = [...new Set([...camposSecundarios, ...camposPrimarios].map((c) => c.campo))];

const configuracaoInicial: Record<string, Required<ConfiguracaoCampo>> = {};
let redefinicaoInicial = { primario: '', secundario: '' };

async function comoAdministrador<T>(browser: Browser, acao: (pagina: import('@playwright/test').Page) => Promise<T>) {
  const contexto = await browser.newContext({ storageState: '.auth/administrador.json' });
  try {
    return await acao(await contexto.newPage());
  } finally {
    await contexto.close();
  }
}

async function cargoVisivel(browser: Browser, sessao: string, idDaEva: string) {
  const contexto = await browser.newContext({ storageState: sessao });
  try {
    const perfil = new MinhaPaginaPage(await contexto.newPage());
    await perfil.page.goto(sessao.includes('estudante') ? '/user/profile.php' : `/user/profile.php?id=${idDaEva}`);
    return (await perfil.valorOuVazio('Cargo')) !== '';
  } finally {
    await contexto.close();
  }
}

// Sem `serial`: com 1 worker os testes já rodam em ordem, e uma falha não pula o resto. Depois de uma falha
// o Playwright roda o afterAll (restaura) e o beforeAll lê de novo a configuração — já restaurada
test.describe(
  'CENÁRIO 1: Ativação do Reset de Senha Personalizado — configuração dos campos',
  { tag: ['@dt-redefinicao-personalizada', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Altera configurações da plataforma inteira: rode com npm run test:redefinicao-config');
    test.use({ storageState: '.auth/administrador.json' });
    test.setTimeout(180_000);

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(600_000);
      await comoAdministrador(browser, async (pagina) => {
        const campos = new CamposPerfilPage(pagina);
        for (const campo of camposAlterados) configuracaoInicial[campo] = await campos.lerConfiguracao(campo);
        const config = new ConfiguracaoRedefinicaoPage(pagina);
        await config.acessar();
        redefinicaoInicial = {
          primario: (await config.selecionado(config.campoPrimario).innerText()).trim(),
          secundario: (await config.selecionado(config.campoSecundario).innerText()).trim(),
        };
      });
    });

    // Restaura primeiro a redefinição — o campo selecionado nela precisa continuar elegível — e depois os campos.
    // O Cargo volta para os valores de 22/10/2026; os demais, para os lidos no início da rodada
    test.afterAll(async ({ browser }) => {
      test.setTimeout(600_000);
      await comoAdministrador(browser, async (pagina) => {
        const config = new ConfiguracaoRedefinicaoPage(pagina);
        await config.acessar();
        if (redefinicaoInicial.secundario) await config.definir(config.campoSecundario, redefinicaoInicial.secundario);
        if (redefinicaoInicial.primario) await config.definir(config.campoPrimario, redefinicaoInicial.primario);
        const campos = new CamposPerfilPage(pagina);
        for (const [campo, configuracao] of Object.entries(configuracaoInicial)) await campos.configurar(campo, configuracao);
        await campos.configurar('Cargo', cargoEm22Out);
      });
    });

    test('RC01 - Com "Este campo é obrigatório?" = "Sim", o "Cargo" é obrigatório na "Nova conta"', async ({ browser, camposPerfil }) => {
      await test.step('Quando alterei "Este campo é obrigatório?" do "Cargo" para "Sim"', () =>
        camposPerfil.configurar('Cargo', { obrigatorio: 'Sim' }));
      await test.step('Então o campo "Cargo" foi marcado como obrigatório na "Nova conta"', async () => {
        const contexto = await browser.newContext({ storageState: semSessao });
        const criarConta = new CriarContaPage(await contexto.newPage());
        await criarConta.acessarPeloLogin();
        await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
        await expect(criarConta.campoCargo.getByTitle('Obrigatório', { exact: true }).first()).toBeVisible();
        await contexto.close();
      });
    });

    test('RC02 - Com "Este campo é obrigatório?" = "Não", o "Cargo" NÃO é obrigatório na "Nova conta"', async ({
      browser,
      camposPerfil,
    }) => {
      await test.step('Quando alterei "Este campo é obrigatório?" do "Cargo" para "Não"', () =>
        camposPerfil.configurar('Cargo', { obrigatorio: 'Não' }));
      await test.step('Então o campo "Cargo" NÃO foi marcado como obrigatório na "Nova conta"', async () => {
        const contexto = await browser.newContext({ storageState: semSessao });
        const criarConta = new CriarContaPage(await contexto.newPage());
        await criarConta.acessarPeloLogin();
        await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
        await expect(criarConta.campoCargo.getByTitle('Obrigatório', { exact: true })).toHaveCount(0);
        await contexto.close();
      });
    });

    // Quem vê o "Cargo" no perfil da Estudante, conforme a ajuda de "Quem pode ver este campo?".
    // O Adm Cliente só é verificado em "Visível para todos": nas demais opções depende de ele ser "gerente"
    const quemVe = [
      { id: 'RC03', visibilidade: visibilidades.naoVisivel, estudante: false, cliente: undefined },
      { id: 'RC04', visibilidade: visibilidades.usuario, estudante: true, cliente: undefined },
      { id: 'RC05', visibilidade: visibilidades.usuarioProfessoresAdmins, estudante: true, cliente: undefined },
      { id: 'RC06', visibilidade: visibilidades.todos, estudante: true, cliente: true },
    ];
    for (const { id, visibilidade, estudante, cliente } of quemVe) {
      test(`${id} - "Quem pode ver este campo?" = "${visibilidade}": quem vê o "Cargo" no perfil`, async ({ browser, camposPerfil }) => {
        const idDaEva = await comoAdministrador(browser, async (pagina) => {
          const gerenciar = new GerenciarUsuariosPage(pagina);
          await gerenciar.acessarPelaAdministracao();
          await gerenciar.pesquisar(evaSouza.nome);
          return gerenciar.idDoUsuario(evaSouza.nome);
        });
        await test.step(`Quando alterei "Quem pode ver este campo?" do "Cargo" para "${visibilidade}"`, () =>
          camposPerfil.configurar('Cargo', { visibilidade }));
        await test.step(`Então a Estudante ${estudante ? '' : 'NÃO '}viu o "Cargo" na própria "Minha página"`, async () =>
          expect(await cargoVisivel(browser, '.auth/estudante.json', idDaEva)).toBe(estudante));
        await test.step('E o Administrador viu o "Cargo" no perfil da Estudante', async () =>
          expect(await cargoVisivel(browser, '.auth/administrador.json', idDaEva)).toBe(true));
        if (cliente !== undefined)
          await test.step('E o Adm Cliente viu o "Cargo" no perfil da Estudante', async () =>
            expect(await cargoVisivel(browser, '.auth/cliente.json', idDaEva)).toBe(cliente));
      });
    }

    // Matriz: Obrigatório × visibilidade para cada campo → aparece ou não no "Campo secundário"
    let numero = 7;
    for (const { campo } of camposSecundarios) {
      for (const obrigatorio of ['Sim', 'Não'] as const) {
        for (const visibilidade of Object.values(visibilidades)) {
          const aparece = apareceNoSecundario(obrigatorio, visibilidade);
          const id = `RC${String(numero++).padStart(2, '0')}`;
          test(`${id} - "${campo}" com Obrigatório "${obrigatorio}" e "${visibilidade}" ${aparece ? '' : 'NÃO '}aparece no "Campo secundário"`, async ({
            camposPerfil,
            configuracaoRedefinicao: config,
          }) => {
            await test.step(`Quando configurei "${campo}" com Obrigatório "${obrigatorio}" e "${visibilidade}"`, () =>
              camposPerfil.configurar(campo, { obrigatorio, visibilidade }));
            await test.step(`Então "${campo}" ${aparece ? 'foi' : 'NÃO foi'} exibido no "Campo secundário"`, async () => {
              await config.acessar();
              const opcoes = await config.opcoes(config.campoSecundario);
              if (aparece) expect(opcoes).toContain(campo);
              else expect(opcoes).not.toContain(campo);
            });
          });
        }
      }
    }

    // Redefinição usando cada campo como "Campo secundário"
    for (const { campo, chave } of camposSecundarios) {
      const base = numero;
      numero += campo === 'Cargo' ? 4 : 3;
      const id = (n: number) => `RC${String(base + n).padStart(2, '0')}`;

      test(`${id(0)} - Com "${campo}" no "Campo secundário", "Perdeu a senha?" exibe "CPF" e "${campo}"`, async ({
        browser,
        camposPerfil,
        configuracaoRedefinicao: config,
        perdeuSenha,
      }) => {
        await test.step(`Quando configurei "${campo}" com Obrigatório "Sim" e "${visibilidades.usuario}"`, () =>
          camposPerfil.configurar(campo, { obrigatorio: 'Sim', visibilidade: visibilidades.usuario }));
        await test.step(`E selecionei "${campo}" no "Campo secundário" e salvei`, async () => {
          await config.acessar();
          await config.definir(config.campoSecundario, campo);
        });
        await test.step(`Então "Perdeu a senha?" exibiu os campos "CPF" e "${campo}"`, async () => {
          const contexto = await browser.newContext({ storageState: semSessao });
          const pagina = await contexto.newPage();
          await pagina.goto('/login/forgot_password.php');
          await expect(pagina.locator('#fitem_id_firstfield label').first()).toHaveText('CPF');
          await expect(pagina.locator('#fitem_id_secondfield label').first()).toHaveText(campo);
          await contexto.close();
        });
        void perdeuSenha;
      });

      test(`${id(1)} - "${evaSouza.identificacao}" com "${campo}" do cadastro é redirecionada para "${paginas.redefinir}"`, async ({
        browser,
        perdeuSenha,
      }) => {
        const dados = await test.step(`Dado que consultei "${campo}" no cadastro da usuária`, () =>
          lerDadosDoUsuario(browser, evaSouza.nome));
        await test.step(`Quando preenchi "${evaSouza.identificacao}" e "${campo}" correto e cliquei em "Enviar"`, async () => {
          await perdeuSenha.acessar();
          await perdeuSenha.redefinir(evaSouza.identificacao, dados[chave]);
        });
        await test.step(`Então fui redirecionada para a página "${paginas.redefinir}"`, () =>
          expect(perdeuSenha.tituloRedefinir).toBeVisible());
      });

      test(`${id(2)} - "${evaSouza.identificacao}" com "${campo}" errado NÃO altera a senha`, async ({ browser, perdeuSenha }) => {
        const dados = await test.step(`Dado que consultei "${campo}" no cadastro da usuária`, () =>
          lerDadosDoUsuario(browser, evaSouza.nome));
        await test.step(`Quando preenchi "${evaSouza.identificacao}" e "${campo}" errado e cliquei em "Enviar"`, async () => {
          await perdeuSenha.acessar();
          const opcoes = await perdeuSenha.blocoSecundario.locator('option').allInnerTexts();
          const errado = Factories.redefinicao.opcaoDiferente(opcoes, dados[chave]) || `${dados[chave]} QA`;
          await perdeuSenha.redefinir(evaSouza.identificacao, errado);
        });
        await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
          await expect(perdeuSenha.mensagemErro).toBeVisible();
          await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
        });
      });

      if (campo === 'Cargo')
        test(`${id(3)} - "${rayssaLima.identificacao}" sem "Cargo" cadastrado NÃO altera a senha`, async ({ browser, perdeuSenha }) => {
          await test.step('Dado que o usuário NÃO tem "Cargo" cadastrado', async () =>
            expect((await lerDadosDoUsuario(browser, rayssaLima.nome)).position ?? '').toBe(''));
          await test.step(`Quando preenchi "${rayssaLima.identificacao}" e um "Cargo" e cliquei em "Enviar"`, async () => {
            await perdeuSenha.acessar();
            const opcoes = await perdeuSenha.blocoSecundario.locator('option').allInnerTexts();
            await perdeuSenha.redefinir(rayssaLima.identificacao, Factories.redefinicao.opcaoDiferente(opcoes, ''));
          });
          await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
            await expect(perdeuSenha.mensagemErro).toBeVisible();
            await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
          });
        });
    }

    // "Campo primário": obrigatório + único + visível para o usuário, professores e administradores
    for (const { campo } of camposPrimarios) {
      const base = numero;
      numero += 3;
      const id = (n: number) => `RC${String(base + n).padStart(2, '0')}`;

      test(`${id(0)} - "${campo}" configurado como obrigatório, único e visível para o usuário`, async ({ camposPerfil }) => {
        await test.step(`Quando configurei "${campo}" com Obrigatório "Sim", Única "Sim" e "${configuracaoPrimario.visibilidade}"`, () =>
          camposPerfil.configurar(campo, configuracaoPrimario));
        await test.step('Então a configuração do campo ficou gravada', async () =>
          expect(await camposPerfil.lerConfiguracao(campo)).toEqual(configuracaoPrimario));
      });

      test(`${id(1)} - "${campo}" exibido para seleção no "Campo primário"`, async ({ configuracaoRedefinicao: config }) => {
        await test.step('Quando acessei "Configurações - Redefinição de senha personalizada"', () => config.acessar());
        await test.step(`Então a opção "${campo}" foi exibida no "Campo primário"`, async () =>
          expect(await config.opcoes(config.campoPrimario)).toContain(campo));
      });

      test(`${id(2)} - Com "A informação deve ser única?" = "Não", "${campo}" NÃO aparece no "Campo primário"`, async ({
        camposPerfil,
        configuracaoRedefinicao: config,
      }) => {
        await test.step(`Quando alterei "A informação deve ser única?" de "${campo}" para "Não"`, () =>
          camposPerfil.configurar(campo, { unica: 'Não' }));
        await test.step(`Então a opção "${campo}" NÃO foi exibida no "Campo primário"`, async () => {
          await config.acessar();
          expect(await config.opcoes(config.campoPrimario)).not.toContain(campo);
        });
      });
    }

    // RP08 do DTI/EVTI: a data de nascimento não pode ser apagada pela tela, então o "sem dado cadastrado"
    // usa a "Cidade de Nascimento" — decisão da QA
    test(`RP08 - "${rayssaLima.identificacao}" sem "Cidade de Nascimento" cadastrada NÃO altera a senha`, async ({
      browser,
      camposPerfil,
      configuracaoRedefinicao: config,
      perdeuSenha,
    }) => {
      await test.step('Dado que o usuário NÃO tem "Cidade de Nascimento" cadastrada', async () =>
        expect((await lerDadosDoUsuario(browser, rayssaLima.nome)).city ?? '').toBe(''));
      await test.step(`E configurei "Cidade de Nascimento" com Obrigatório "Sim" e "${visibilidades.usuario}" no "Campo secundário"`, async () => {
        await camposPerfil.configurar('Cidade de Nascimento', { obrigatorio: 'Sim', visibilidade: visibilidades.usuario });
        await config.acessar();
        await config.definir(config.campoSecundario, 'Cidade de Nascimento');
      });
      await test.step(`Quando preenchi "${rayssaLima.identificacao}" e uma "Cidade de Nascimento" e cliquei em "Enviar"`, async () => {
        await perdeuSenha.acessar();
        await perdeuSenha.redefinir(rayssaLima.identificacao, Factories.redefinicao.cidade());
      });
      await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
        await expect(perdeuSenha.mensagemErro).toBeVisible();
        await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
      });
    });
  },
);
