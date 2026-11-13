// DTI/EVTI - Página Criar uma conta — configuração da plataforma — rastreabilidade em RASTREABILIDADE.md
// Altera a verificação de idade (privacidade) e o campo de perfil "Cargo", que valem para a plataforma inteira.
// Ao final restaura tudo, mesmo se falhar. Desligada por padrão: rode com `npm run test:cadastro-config`
// RC01 a RC06 vieram da suíte de configuração da Redefinição de Senha — decisão da QA (09/11)
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../../support/sessoes';
import type { Browser, Page } from '@playwright/test';
import { CamposPerfilPage } from '../../../support/cadastro_commands/CamposPerfilPage';
import { CriarContaPage } from '../../../support/cadastro_commands/CriarContaPage';
import { MinhaPaginaPage } from '../../../support/cadastro_commands/MinhaPaginaPage';
import { GerenciarUsuariosPage } from '../../../support/cadastro_commands/GerenciarUsuariosPage';
import { ConfiguracaoPrivacidadePage } from '../../../support/cadastro_commands/ConfiguracaoPrivacidadePage';
import { usuariosRedefinicao } from '../../../support/usuarios';
import { visibilidades, cargoEm22Out } from '../../../fixtures/redefinicaosenha';
import { paginas, pais } from '../../../fixtures/cadastro';
import { Factories } from '../../../Factories';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CONFIG_CADASTRO === 'sim';
const { evaSouza } = usuariosRedefinicao;

let verificacaoInicial = true;

const comoAdministrador = <T>(browser: Browser, acao: (pagina: Page) => Promise<T>) => comSessao(browser, sessoes.administrador, acao);

// Abre a "Nova conta" num navegador sem login e executa a verificação pedida
const naNovaConta = (browser: Browser, verificar: (criarConta: CriarContaPage) => Promise<void>) =>
  comSessao(browser, semSessao, async (pagina) => {
    const criarConta = new CriarContaPage(pagina);
    // Depois do PRV02 a verificação de idade fica desligada até o final: passa por ela só se for exibida
    await criarConta.clicarCriarContaNoLogin();
    await criarConta.avancarParaNovaConta(Factories.cadastro.idadeAdulta(), pais);
    await verificar(criarConta);
  });

// A Estudante vê o próprio perfil; os demais perfis abrem o perfil da Eva pelo id
const cargoVisivel = (browser: Browser, sessao: string, idDaEva: string) =>
  comSessao(browser, sessao, (pagina) => new MinhaPaginaPage(pagina).cargoVisivel(sessao === sessoes.estudante ? undefined : idDaEva));

// Sem `serial`: com 1 worker os testes já rodam em ordem, e uma falha não pula o resto
test.describe('Configuração do "Criar uma conta"', { tag: ['@dt-criar-conta', '@altera-configuracao'] }, () => {
  test.skip(!executar, 'Altera configurações da plataforma inteira: rode com npm run test:cadastro-config');
  test.use({ storageState: sessoes.administrador });
  test.setTimeout(180_000);

  test.beforeAll(async ({ browser }) => {
    verificacaoInicial = await comoAdministrador(browser, (pagina) => new ConfiguracaoPrivacidadePage(pagina).lerVerificacaoDeIdade());
  });

  // A verificação de idade volta para o valor lido no início; o Cargo, para os valores de 22/10/2026
  test.afterAll(async ({ browser }) => {
    test.setTimeout(300_000);
    await comoAdministrador(browser, async (pagina) => {
      await new ConfiguracaoPrivacidadePage(pagina).definirVerificacaoDeIdade(verificacaoInicial);
      await new CamposPerfilPage(pagina).configurar('Cargo', cargoEm22Out);
    });
  });

  test.describe('Configurações de privacidade', () => {
    const verificacoes = [
      { id: 'PRV01', ativa: true, valor: 'Sim' },
      { id: 'PRV02', ativa: false, valor: 'Não' },
    ];
    for (const { id, ativa, valor } of verificacoes) {
      test(
        `${id} - "Verificação da idade de consentimento digital" = "${valor}": "Criar uma conta" ${ativa ? 'exibe' : 'NÃO exibe'} a "${paginas.verificacao}"`,
        { tag: prioridade('Cadastro', id) },
        async ({ browser, configuracaoPrivacidade }) => {
          await test.step(`Quando alterei "Verificação da idade de consentimento digital" para "${valor}" e salvei`, () =>
            configuracaoPrivacidade.definirVerificacaoDeIdade(ativa));
          await test.step(`Então, sem login, "Criar uma conta" ${ativa ? `exibiu a "${paginas.verificacao}"` : `foi direto para a "${paginas.novaConta}"`}`, () =>
            comSessao(browser, semSessao, async (pagina) => {
              const criarConta = new CriarContaPage(pagina);
              await criarConta.clicarCriarContaNoLogin();
              await expect(criarConta.tituloVerificacao).toBeVisible({ visible: ativa });
              await expect(criarConta.tituloNovaConta).toBeVisible({ visible: !ativa });
            }));
        },
      );
    }
  });

  test.describe('Campo de perfil "Cargo"', () => {
    test(
      'RC01 - Com "Este campo é obrigatório?" = "Sim", o "Cargo" é obrigatório na "Nova conta"',
      { tag: prioridade('Cadastro', 'RC01') },
      async ({ browser, camposPerfil }) => {
        await test.step('Quando alterei "Este campo é obrigatório?" do "Cargo" para "Sim"', () =>
          camposPerfil.configurar('Cargo', { obrigatorio: 'Sim' }));
        await test.step('Então o campo "Cargo" foi marcado como obrigatório na "Nova conta"', () =>
          naNovaConta(browser, (criarConta) =>
            expect(criarConta.campoCargo.getByTitle('Obrigatório', { exact: true }).first()).toBeVisible(),
          ));
      },
    );

    test(
      'RC02 - Com "Este campo é obrigatório?" = "Não", o "Cargo" NÃO é obrigatório na "Nova conta"',
      { tag: prioridade('Cadastro', 'RC02') },
      async ({ browser, camposPerfil }) => {
        await test.step('Quando alterei "Este campo é obrigatório?" do "Cargo" para "Não"', () =>
          camposPerfil.configurar('Cargo', { obrigatorio: 'Não' }));
        await test.step('Então o campo "Cargo" NÃO foi marcado como obrigatório na "Nova conta"', () =>
          naNovaConta(browser, (criarConta) => expect(criarConta.campoCargo.getByTitle('Obrigatório', { exact: true })).toHaveCount(0)));
      },
    );

    // Quem vê o "Cargo" no perfil da Estudante, conforme a ajuda de "Quem pode ver este campo?".
    // O Adm Cliente só é verificado em "Visível para todos": nas demais opções depende de ele ser "gerente".
    // RC03 continua como possível defeito
    const quemVe = [
      { id: 'RC03', visibilidade: visibilidades.naoVisivel, estudante: false, cliente: undefined },
      { id: 'RC04', visibilidade: visibilidades.usuario, estudante: true, cliente: undefined },
      { id: 'RC05', visibilidade: visibilidades.usuarioProfessoresAdmins, estudante: true, cliente: undefined },
      { id: 'RC06', visibilidade: visibilidades.todos, estudante: true, cliente: true },
    ];
    for (const { id, visibilidade, estudante, cliente } of quemVe) {
      test(
        `${id} - "Quem pode ver este campo?" = "${visibilidade}": quem vê o "Cargo" no perfil`,
        { tag: prioridade('Cadastro', id) },
        async ({ browser, camposPerfil }) => {
          const idDaEva = await comoAdministrador(browser, async (pagina) => {
            const gerenciar = new GerenciarUsuariosPage(pagina);
            await gerenciar.acessarPelaAdministracao();
            await gerenciar.pesquisar(evaSouza.nome);
            return gerenciar.idDoUsuario(evaSouza.nome);
          });
          await test.step(`Quando alterei "Quem pode ver este campo?" do "Cargo" para "${visibilidade}"`, () =>
            camposPerfil.configurar('Cargo', { visibilidade }));
          await test.step(`Então a Estudante ${estudante ? '' : 'NÃO '}viu o "Cargo" na própria "Minha página"`, async () =>
            expect(await cargoVisivel(browser, sessoes.estudante, idDaEva)).toBe(estudante));
          await test.step('E o Administrador viu o "Cargo" no perfil da Estudante', async () =>
            expect(await cargoVisivel(browser, sessoes.administrador, idDaEva)).toBe(true));
          if (cliente !== undefined)
            await test.step('E o Adm Cliente viu o "Cargo" no perfil da Estudante', async () =>
              expect(await cargoVisivel(browser, sessoes.cliente, idDaEva)).toBe(cliente));
        },
      );
    }
  });
});
