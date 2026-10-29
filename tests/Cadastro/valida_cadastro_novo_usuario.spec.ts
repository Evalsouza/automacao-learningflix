// DTI/EVTI - Página Criar uma conta — cadastro real — rastreabilidade em RASTREABILIDADE.md
// Cria as contas qa.auto1 (sem Cargo) e qa.auto2 (com Cargo), as duas "QA AUTOMAÇÃO", e as exclui ao final.
// Cada conta é encontrada pelo e-mail: nunca exclui outro usuário com o mesmo nome
// Desligada por padrão: rode com `npm run test:cadastro-real`
import { test, expect } from '../../support/e2e';
import { CriarContaPage } from '../../support/cadastro_commands/CriarContaPage';
import { ListaUsuariosAdminPage } from '../../support/cadastro_commands/ListaUsuariosAdminPage';
import { GerenciarUsuariosPage } from '../../support/cadastro_commands/GerenciarUsuariosPage';
import { novoCadastro, novoCadastroComCargo } from '../../support/usuarios';
import { cargos, pais } from '../../fixtures/cadastro';
import { Factories } from '../../Factories';
import type { Browser } from '@playwright/test';

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

async function comoAdministrador<T>(browser: Browser, acao: (lista: ListaUsuariosAdminPage) => Promise<T>) {
  const contexto = await browser.newContext({ storageState: '.auth/administrador.json' });
  const lista = new ListaUsuariosAdminPage(await contexto.newPage());
  try {
    await lista.acessar();
    return await acao(lista);
  } finally {
    await contexto.close();
  }
}

async function excluirSeExistir(browser: Browser) {
  for (const { usuario } of cadastros)
    await comoAdministrador(browser, async (lista) => {
      await lista.filtrarPorNome(nomeCompleto(usuario));
      if (await lista.linha(usuario.email).count()) await lista.excluir(usuario.email);
    });
}

// Cargo lido em "Gerenciar usuários" → "Editar usuário", fechando com "Cancelar"; sem Cargo, devolve ''
async function cargoEmEditarUsuario(browser: Browser, sessao: string, email: string) {
  const contexto = await browser.newContext({ storageState: sessao });
  try {
    const gerenciar = new GerenciarUsuariosPage(await contexto.newPage());
    await gerenciar.acessarPelaAdministracao();
    return (await gerenciar.dadosDoUsuario(email)).position ?? '';
  } finally {
    await contexto.close();
  }
}

test.describe('CENÁRIO 1: Cadastro de usuário com Cargo "Comum" — cadastro real', { tag: ['@dt-criar-conta', '@cria-usuario'] }, () => {
  test.skip(!executar, 'Cria usuários reais no ambiente: rode com npm run test:cadastro-real');
  test.use({ storageState: { cookies: [], origins: [] } });

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

      test(`${ids.cadastro} - Cadastro ${cargo ? `com "Cargo" ${cargoEsperado}` : 'sem "Cargo"'} exibe o campo "Cargo" ${cargoEsperado} na "Minha página"`, async ({
        browser,
        page,
        login,
        minhaPagina,
      }) => {
        await test.step(`Quando realizei o cadastro do usuário "${usuario.identificacao}" ${cargo ? `com o "Cargo" ${cargoEsperado}` : 'sem preencher o campo "Cargo"'}`, async () => {
          const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
          const criarConta = new CriarContaPage(await contexto.newPage());
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
          await contexto.close();
        });
        await test.step('E a conta foi confirmada pelo Administrador', () =>
          comoAdministrador(browser, async (lista) => {
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
      });

      for (const { id, perfil, sessao } of [
        { id: ids.cliente, perfil: 'Adm Cliente', sessao: '.auth/cliente.json' },
        { id: ids.administrador, perfil: 'Administrador', sessao: '.auth/administrador.json' },
      ]) {
        test(`${id} - "${perfil}" consulta o Cargo de "${usuario.identificacao}" em "Gerenciar usuários"`, async ({ browser }) => {
          const lido =
            await test.step(`Quando acessei com o "${perfil}" "Gerenciar usuários", pesquisei "${usuario.email}" e abri "Editar usuário"`, () =>
              cargoEmEditarUsuario(browser, sessao, usuario.email));
          await test.step(`Então o campo "Cargo" exibiu ${cargoEsperado}, e fechei sem salvar`, () => expect(lido).toBe(cargo));
        });
      }
    });
  }

  test('C005 - E-mail de confirmação do cadastro exibe o link de confirmação', async () => {
    test.fixme(true, 'Depende da caixa de entrada do yopmail: site externo, fora do ambiente de QA');
  });
});
