// DTI/EVTI - Redefinição de Senha Personalizada — configuração dos campos — rastreabilidade em RASTREABILIDADE.md
// Altera campos de perfil e a redefinição personalizada, que valem para a plataforma inteira.
// Ao final restaura tudo, mesmo se falhar. Desligada por padrão: rode com `npm run test:redefinicao-config`
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../../support/sessoes';
import { PerdeuSenhaPage } from '../../../support/redefinicaosenha_commands/PerdeuSenhaPage';
import type { Browser, Page } from '@playwright/test';
import { CamposPerfilPage, ConfiguracaoCampo } from '../../../support/cadastro_commands/CamposPerfilPage';
import {
  ConfiguracaoRedefinicaoPage,
  garantirRedefinicaoPersonalizada,
} from '../../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { lerDadosDoUsuario } from '../../../support/redefinicaosenha_commands/dadosDoUsuario';
import { GerenciarUsuariosPage } from '../../../support/cadastro_commands/GerenciarUsuariosPage';
import { usuariosRedefinicao } from '../../../support/usuarios';
import {
  mensagens,
  paginas,
  visibilidades,
  apareceNoSecundario,
  camposSecundarios,
  camposPrimarios,
  configuracaoPrimario,
  cargoEm22Out,
} from '../../../fixtures/redefinicaosenha';
import { Factories } from '../../../Factories';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CONFIG_REDEFINICAO === 'sim';
const { evaSouza, rayssaLima } = usuariosRedefinicao;
const camposAlterados = [...new Set([...camposSecundarios, ...camposPrimarios].map((c) => c.campo))];

const configuracaoInicial: Record<string, Required<ConfiguracaoCampo>> = {};
let redefinicaoInicial = { primario: '', secundario: '' };

const comoAdministrador = <T>(browser: Browser, acao: (pagina: Page) => Promise<T>) => comSessao(browser, sessoes.administrador, acao);
// "Perdeu a senha?" só exibe o formulário sem sessão: logado, redireciona para "/my/" ("Você já se identificou") — 23/11
const semLogin = <T>(browser: Browser, acao: (perdeuSenha: PerdeuSenhaPage) => Promise<T>) =>
  comSessao(browser, semSessao, (pagina) => acao(new PerdeuSenhaPage(pagina)));

// Sem `serial`: com 1 worker os testes já rodam em ordem, e uma falha não pula o resto. Depois de uma falha
// o Playwright roda o afterAll (restaura) e o beforeAll lê de novo a configuração — já restaurada
test.describe(
  'CENÁRIO 1: Ativação do Reset de Senha Personalizado — configuração dos campos',
  { tag: ['@dt-redefinicao-personalizada', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Altera configurações da plataforma inteira: rode com npm run test:redefinicao-config');
    test.use({ storageState: sessoes.administrador });
    test.setTimeout(180_000);

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(600_000);
      // Habilita a personalizada antes, se estiver desabilitada — decisão da QA (10/11)
      await garantirRedefinicaoPersonalizada(browser, true);
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
      // E desabilita no final, como as demais suítes da personalizada
      await garantirRedefinicaoPersonalizada(browser, false);
    });

    // RC01 a RC06 foram para a suíte de configuração do Cadastro — decisão da QA (09/11)

    // Matriz: Obrigatório × visibilidade para cada campo → aparece ou não no "Campo secundário"
    let numero = 7;
    for (const { campo } of camposSecundarios) {
      for (const obrigatorio of ['Sim', 'Não'] as const) {
        for (const visibilidade of Object.values(visibilidades)) {
          const aparece = apareceNoSecundario(obrigatorio, visibilidade);
          const id = `RC${String(numero++).padStart(2, '0')}`;
          test(
            `${id} - "${campo}" com Obrigatório "${obrigatorio}" e "${visibilidade}" ${aparece ? '' : 'NÃO '}aparece no "Campo secundário"`,
            { tag: prioridade('RedefinicaoSenha', id) },
            async ({ camposPerfil, configuracaoRedefinicao: config }) => {
              await test.step(`Quando configurei "${campo}" com Obrigatório "${obrigatorio}" e "${visibilidade}"`, () =>
                camposPerfil.configurar(campo, { obrigatorio, visibilidade }));
              await test.step(`Então "${campo}" ${aparece ? 'foi' : 'NÃO foi'} exibido no "Campo secundário"`, async () => {
                await config.acessar();
                const opcoes = await config.opcoes(config.campoSecundario);
                if (aparece) expect(opcoes).toContain(campo);
                else expect(opcoes).not.toContain(campo);
              });
            },
          );
        }
      }
    }

    // Redefinição usando cada campo como "Campo secundário"
    for (const { campo, chave } of camposSecundarios) {
      const base = numero;
      numero += campo === 'Cargo' ? 4 : 3;
      const id = (n: number) => `RC${String(base + n).padStart(2, '0')}`;

      test(
        `${id(0)} - Com "${campo}" no "Campo secundário", "Perdeu a senha?" exibe "CPF" e "${campo}"`,
        { tag: prioridade('RedefinicaoSenha', id(0)) },
        async ({ browser, camposPerfil, configuracaoRedefinicao: config }) => {
          await test.step(`Quando configurei "${campo}" com Obrigatório "Sim" e "${visibilidades.usuario}"`, () =>
            camposPerfil.configurar(campo, { obrigatorio: 'Sim', visibilidade: visibilidades.usuario }));
          await test.step(`E selecionei "${campo}" no "Campo secundário" e salvei`, async () => {
            await config.acessar();
            await config.definir(config.campoSecundario, campo);
          });
          await test.step(`Então "Perdeu a senha?" exibiu os campos "CPF" e "${campo}"`, () =>
            semLogin(browser, async (perdeuSenha) => {
              await perdeuSenha.acessar();
              await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoPrimario)).toHaveText('CPF');
              await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoSecundario)).toHaveText(campo);
            }));
        },
      );

      test(
        `${id(1)} - "${evaSouza.identificacao}" com "${campo}" do cadastro é redirecionada para "${paginas.redefinir}"`,
        { tag: prioridade('RedefinicaoSenha', id(1)) },
        async ({ browser }) => {
          const dados = await test.step(`Dado que consultei "${campo}" no cadastro da usuária`, () =>
            lerDadosDoUsuario(browser, evaSouza.nome));
          await semLogin(browser, async (perdeuSenha) => {
            await test.step(`Quando preenchi "${evaSouza.identificacao}" e "${campo}" correto e cliquei em "Enviar"`, async () => {
              await perdeuSenha.acessar();
              await perdeuSenha.redefinir(evaSouza.identificacao, dados[chave]);
            });
            await test.step(`Então fui redirecionada para a página "${paginas.redefinir}"`, () =>
              expect(perdeuSenha.tituloRedefinir).toBeVisible());
          });
        },
      );

      test(
        `${id(2)} - "${evaSouza.identificacao}" com "${campo}" errado NÃO altera a senha`,
        { tag: prioridade('RedefinicaoSenha', id(2)) },
        async ({ browser }) => {
          const dados = await test.step(`Dado que consultei "${campo}" no cadastro da usuária`, () =>
            lerDadosDoUsuario(browser, evaSouza.nome));
          await semLogin(browser, async (perdeuSenha) => {
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
        },
      );

      if (campo === 'Cargo')
        test(
          `${id(3)} - "${rayssaLima.identificacao}" sem "Cargo" cadastrado NÃO altera a senha`,
          { tag: prioridade('RedefinicaoSenha', id(3)) },
          async ({ browser }) => {
            // Pedido da QA (23/11): o Adm Cliente confere o "Cargo" e, se estiver preenchido, apaga antes do teste
            await test.step('Dado que, como Adm Cliente, conferi que o usuário NÃO tem "Cargo" cadastrado (e apaguei, se tinha)', async () => {
              await comSessao(browser, sessoes.cliente, (pagina) => new GerenciarUsuariosPage(pagina).garantirSemCargo(rayssaLima.nome, 'cliente'));
              expect((await lerDadosDoUsuario(browser, rayssaLima.nome, sessoes.cliente)).position ?? '').toBe('');
            });
            await semLogin(browser, async (perdeuSenha) => {
              await test.step(`Quando preenchi "${rayssaLima.identificacao}" e um "Cargo" e cliquei em "Enviar"`, async () => {
                await perdeuSenha.acessar();
                const opcoes = await perdeuSenha.blocoSecundario.locator('option').allInnerTexts();
                // "Cargo" no "Perdeu a senha?" é campo de texto (sem opções) desde 23/11: usa um cargo qualquer
                const cargo = Factories.redefinicao.opcaoDiferente(opcoes, '') || 'Analista de Qualidade';
                await perdeuSenha.redefinir(rayssaLima.identificacao, cargo);
              });
              await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
                await expect(perdeuSenha.mensagemErro).toBeVisible();
                await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
              });
            });
          },
        );
    }

    // "Campo primário": obrigatório + único + visível para o usuário, professores e administradores
    for (const { campo } of camposPrimarios) {
      const base = numero;
      numero += 3;
      const id = (n: number) => `RC${String(base + n).padStart(2, '0')}`;

      test(
        `${id(0)} - "${campo}" configurado como obrigatório, único e visível para o usuário`,
        { tag: prioridade('RedefinicaoSenha', id(0)) },
        async ({ camposPerfil }) => {
          await test.step(`Quando configurei "${campo}" com Obrigatório "Sim", Única "Sim" e "${configuracaoPrimario.visibilidade}"`, () =>
            camposPerfil.configurar(campo, configuracaoPrimario));
          await test.step('Então a configuração do campo ficou gravada', async () =>
            expect(await camposPerfil.lerConfiguracao(campo)).toEqual(configuracaoPrimario));
        },
      );

      // Obrigatório "Sim" e visível ao usuário também valem para o "Campo secundário" (regra do RC07 a RC38) — pergunta da QA (09/11)
      test(
        `${id(1)} - "${campo}" exibido para seleção no "Campo primário" e no "Campo secundário"`,
        { tag: prioridade('RedefinicaoSenha', id(1)) },
        async ({ configuracaoRedefinicao: config }) => {
          await test.step('Quando acessei "Configurações - Redefinição de senha personalizada"', () => config.acessar());
          await test.step(`Então a opção "${campo}" foi exibida no "Campo primário"`, async () =>
            expect(await config.opcoes(config.campoPrimario)).toContain(campo));
          await test.step(`E a opção "${campo}" também foi exibida no "Campo secundário"`, async () =>
            expect(await config.opcoes(config.campoSecundario)).toContain(campo));
        },
      );

      test(
        `${id(2)} - Com "A informação deve ser única?" = "Não", "${campo}" NÃO aparece no "Campo primário"`,
        { tag: prioridade('RedefinicaoSenha', id(2)) },
        async ({ camposPerfil, configuracaoRedefinicao: config }) => {
          await test.step(`Quando alterei "A informação deve ser única?" de "${campo}" para "Não"`, () =>
            camposPerfil.configurar(campo, { unica: 'Não' }));
          await test.step(`Então a opção "${campo}" NÃO foi exibida no "Campo primário"`, async () => {
            await config.acessar();
            expect(await config.opcoes(config.campoPrimario)).not.toContain(campo);
          });
        },
      );
    }

    // "Campo primário" exige Obrigatório = "Sim": com Única "Sim" e Obrigatório "Não" o campo NÃO aparece — pedido da QA (09/11)
    for (const { campo } of camposPrimarios) {
      const id = `RC${String(numero++).padStart(2, '0')}`;
      test(
        `${id} - Com "A informação deve ser única?" = "Sim" e "Este campo é obrigatório?" = "Não", "${campo}" NÃO aparece no "Campo primário"`,
        { tag: prioridade('RedefinicaoSenha', id) },
        async ({ camposPerfil, configuracaoRedefinicao: config }) => {
          await test.step(`Quando configurei "${campo}" com Única "Sim", Obrigatório "Não" e "${configuracaoPrimario.visibilidade}"`, () =>
            camposPerfil.configurar(campo, { ...configuracaoPrimario, obrigatorio: 'Não' }));
          await test.step(`Então a opção "${campo}" NÃO foi exibida no "Campo primário"`, async () => {
            await config.acessar();
            expect(await config.opcoes(config.campoPrimario)).not.toContain(campo);
          });
        },
      );
    }

    // RP08 do DTI/EVTI: a data de nascimento não pode ser apagada pela tela, então o "sem dado cadastrado"
    // usa a "Cidade de Nascimento" — decisão da QA
    test(
      `RP08 - "${rayssaLima.identificacao}" sem "Cidade de Nascimento" cadastrada NÃO altera a senha`,
      { tag: prioridade('RedefinicaoSenha', 'RP08') },
      async ({ browser, camposPerfil, configuracaoRedefinicao: config }) => {
        await test.step('Dado que o usuário NÃO tem "Cidade de Nascimento" cadastrada', async () =>
          expect((await lerDadosDoUsuario(browser, rayssaLima.nome)).city ?? '').toBe(''));
        await test.step(`E configurei "Cidade de Nascimento" com Obrigatório "Sim" e "${visibilidades.usuario}" no "Campo secundário"`, async () => {
          await camposPerfil.configurar('Cidade de Nascimento', { obrigatorio: 'Sim', visibilidade: visibilidades.usuario });
          await config.acessar();
          await config.definir(config.campoSecundario, 'Cidade de Nascimento');
        });
        await semLogin(browser, async (perdeuSenha) => {
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

    // Completa a tabela de decisão do RP04 ao RP07 com os dois campos errados (16/11). Desde 23/11, a pedido da QA,
    // troca antes o "Campo secundário" para "Telefone": valida que dá para alterar o que já estava definido
    test(
      'RP12 - Com "Telefone" no "Campo secundário", identificação errada e telefone errado NÃO altera a senha',
      { tag: prioridade('RedefinicaoSenha', 'RP12') },
      async ({ browser, camposPerfil, configuracaoRedefinicao: config }) => {
        await test.step(`Dado que configurei "Telefone" com Obrigatório "Sim", Única "Sim" e "${configuracaoPrimario.visibilidade}"`, () =>
          camposPerfil.configurar('Telefone', configuracaoPrimario));
        await test.step('Quando troquei o "Campo secundário" para "Telefone" e salvei', async () => {
          await config.acessar();
          await config.definir(config.campoSecundario, 'Telefone');
        });
        await semLogin(browser, async (perdeuSenha) => {
          await test.step('Então "Perdeu a senha?" exibiu os campos "CPF" e "Telefone"', async () => {
            await perdeuSenha.acessar();
            await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoPrimario)).toHaveText('CPF');
            await expect(perdeuSenha.rotuloDoCampo(perdeuSenha.blocoSecundario)).toHaveText('Telefone');
          });
          await test.step('Quando preenchi uma identificação errada e um telefone errado e cliquei em "Enviar"', () =>
            perdeuSenha.redefinir(Factories.redefinicao.identificacaoInexistente(), Factories.redefinicao.telefone()));
          await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" foi exibida e a senha NÃO pôde ser alterada`, async () => {
            await expect(perdeuSenha.mensagemErro).toBeVisible();
            await expect(perdeuSenha.campoNovaSenha).toHaveCount(0);
          });
        });
      },
    );
  },
);
