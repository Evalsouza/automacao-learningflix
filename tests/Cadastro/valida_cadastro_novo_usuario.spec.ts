// DTI/EVTI - Página Criar uma conta — cadastro real — rastreabilidade em RASTREABILIDADE.md
// Cria as contas qa.auto1 (sem Cargo) e qa.auto2 (com Cargo), as duas "QA AUTOMAÇÃO", e as exclui ao final.
// Cada conta é encontrada pelo e-mail: nunca exclui outro usuário com o mesmo nome
// Desligada por padrão: rode com `npm run test:cadastro-real`
import { test, expect } from '../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../support/sessoes';
import { CriarContaPage } from '../../support/cadastro_commands/CriarContaPage';
import { ListaUsuariosAdminPage } from '../../support/cadastro_commands/ListaUsuariosAdminPage';
import { GerenciarUsuariosPage } from '../../support/cadastro_commands/GerenciarUsuariosPage';
import { GerenciadorHierarquiaPage } from '../../support/cadastro_commands/GerenciadorHierarquiaPage';
import { novoCadastro, novoCadastroComCargo } from '../../support/usuarios';
import { cargos, pais } from '../../fixtures/cadastro';
import { Factories } from '../../Factories';
import type { Browser } from '@playwright/test';
import { prioridade } from '../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CADASTRO_REAL === 'sim';
const nomeCompleto = (usuario: { nome: string; sobrenome: string }) => `${usuario.nome} ${usuario.sobrenome}`;

// Cobertura com e sem Cargo — decisão da QA. Os mesmos casos rodam para cada usuário
const cadastros = [
  { usuario: novoCadastro, cargo: '', ids: { cadastro: 'C008', cliente: 'C009.1', administrador: 'C010.1' } },
  {
    usuario: novoCadastroComCargo,
    cargo: cargos.analistaDeQualidade,
    ids: { cadastro: 'C008.1', cliente: 'C009.2', administrador: 'C010.2' },
  },
];

async function excluirSeExistir(browser: Browser) {
  for (const { usuario } of cadastros)
    await comSessao(browser, sessoes.administrador, (pagina) =>
      new ListaUsuariosAdminPage(pagina).excluirSeExistir(nomeCompleto(usuario), usuario.email),
    );
}

test.describe('CENÁRIO 1: Cadastro de usuário com Cargo "Comum" — cadastro real', { tag: ['@dt-criar-conta', '@cria-usuario'] }, () => {
  test.skip(!executar, 'Cria usuários reais no ambiente: rode com npm run test:cadastro-real');
  test.use({ storageState: semSessao });

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(600_000);
    await excluirSeExistir(browser);
  });
  test.afterAll(async ({ browser }) => {
    test.setTimeout(600_000);
    await excluirSeExistir(browser);
  });

  for (const { usuario, cargo, ids } of cadastros) {
    const nome = nomeCompleto(usuario);
    const cargoEsperado = cargo ? `"${cargo}"` : 'sem preenchimento';

    // Os testes de cada usuário dependem do cadastro feito no primeiro
    test.describe.serial(`Usuário "${usuario.identificacao}" ${cargo ? 'com' : 'sem'} "Cargo"`, () => {
      test.setTimeout(300_000);

      test(
        `${ids.cadastro} - Cadastro ${cargo ? `com "Cargo" ${cargoEsperado}` : 'sem "Cargo"'} exibe o campo "Cargo" ${cargoEsperado} na "Minha página"`,
        { tag: prioridade('Cadastro', ids.cadastro) },
        async ({ browser, page, login, minhaPagina }) => {
          // Cargo comum, sem ser gestor — decisão da QA (09/11)
          if (cargo)
            await test.step(`Dado que "${cargo}" está com "Cargo Gestor" = "Não" no "Gerenciador de Hierarquia"`, () =>
              comSessao(browser, sessoes.administrador, async (pagina) => {
                const hierarquia = new GerenciadorHierarquiaPage(pagina);
                await hierarquia.acessarCargos();
                expect(await hierarquia.cargosGestores(), 'cargos de gestão').not.toContain(cargo);
              }));
          await test.step(`Quando realizei o cadastro do usuário "${usuario.identificacao}" ${cargo ? `com o "Cargo" ${cargoEsperado}` : 'sem preencher o campo "Cargo"'}`, () =>
            comSessao(browser, semSessao, async (pagina) => {
              const criarConta = new CriarContaPage(pagina);
              await criarConta.acessarPeloLogin();
              await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
              await criarConta.preencherNovaConta({ ...usuario, dataNascimento: Factories.cadastro.dataNascimentoAdulta() });
              if (cargo) await criarConta.selecionarCargo(cargo);
              await criarConta.botaoCriarMinhaConta.click();
              // Se o formulário não avançar, a falha mostra as mensagens dos campos
              await expect(criarConta.botaoCriarMinhaConta)
                .toBeHidden()
                .catch(async (erro) => {
                  const mensagens = await criarConta.page.locator('.form-control-feedback:visible').allInnerTexts();
                  throw new Error(`"Nova conta" não foi criada. Mensagens do formulário: ${JSON.stringify(mensagens.filter(Boolean))}
${erro}`);
                });
            }));
          await test.step('E a conta foi confirmada pelo Administrador', () =>
            comSessao(browser, sessoes.administrador, async (pagina) => {
              const lista = new ListaUsuariosAdminPage(pagina);
              await lista.acessar();
              await lista.filtrarPorNome(nome);
              await lista.confirmarConta(usuario.email);
            }));
          await test.step(`E entrei com o novo usuário "${usuario.identificacao}" e a senha cadastrada`, async () => {
            await login.acessar();
            await login.entrar(usuario);
            await expect(page).not.toHaveURL(/\/login\//);
          });
          await test.step(`Então na "Minha página" o campo "Cargo" foi exibido ${cargoEsperado}`, async () => {
            await minhaPagina.acessar();
            if (cargo) expect(await minhaPagina.valorOuVazio('Cargo')).toBe(cargo);
            else expect(await minhaPagina.valorOuVazio('Cargo')).toMatch(/^(Nenhum cargo selecionado)?$/);
          });
        },
      );

      for (const { id, perfil, sessao } of [
        { id: ids.cliente, perfil: 'Adm Cliente', sessao: sessoes.cliente },
        { id: ids.administrador, perfil: 'Administrador', sessao: sessoes.administrador },
      ]) {
        test(
          `${id} - "${perfil}" consulta o Cargo de "${usuario.identificacao}" em "Gerenciar usuários"`,
          { tag: prioridade('Cadastro', id) },
          async ({ browser }) => {
            const lido =
              await test.step(`Quando acessei com o "${perfil}" "Gerenciar usuários", pesquisei "${usuario.email}" e abri "Editar usuário"`, () =>
                comSessao(browser, sessao, (pagina) => new GerenciarUsuariosPage(pagina).cargoDoUsuario(usuario.email)));
            await test.step(`Então o campo "Cargo" exibiu ${cargoEsperado}, e fechei sem salvar`, () => expect(lido).toBe(cargo));
          },
        );
      }
    });
  }

  test('C005 - E-mail de confirmação do cadastro exibe o link de confirmação', { tag: prioridade('Cadastro', 'C005') }, async () => {
    test.fixme(true, 'Depende da caixa de entrada do yopmail: site externo, fora do ambiente de QA');
  });
});
