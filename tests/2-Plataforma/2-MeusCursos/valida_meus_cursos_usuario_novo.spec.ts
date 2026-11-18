// DT/EVT - Página inicial: Bloco "Meus Cursos" e DT/EVT - Obrigatoriedade do Curso — usuário novo, sem cursos
// Rastreabilidade em RASTREABILIDADE.md. Cria a conta qa.auto3 pelo "Criar uma conta", valida o bloco e o "Ver todos"
// sem cursos e a exclui ao final — encontrada pelo e-mail. Bloqueada enquanto existir o defeito do cadastro (28/10).
// Desligada por padrão: rode com `npm run test:meus-cursos-novo` (também roda na rodada semanal)
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../../support/sessoes';
import { CriarContaPage } from '../../../support/cadastro_commands/CriarContaPage';
import { ListaUsuariosAdminPage } from '../../../support/cadastro_commands/ListaUsuariosAdminPage';
import { novoCadastroMeusCursos as usuario } from '../../../support/usuarios';
import { textosMeusCursos, obrigatoriedades } from '../../../fixtures/meuscursos';
import { pais } from '../../../fixtures/cadastro';
import { Factories } from '../../../Factories';
import type { Browser } from '@playwright/test';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_MEUS_CURSOS_NOVO === 'sim';
const nomeCompleto = `${usuario.nome} ${usuario.sobrenome}`;

const excluirSeExistir = (browser: Browser) =>
  comSessao(browser, sessoes.administrador, (pagina) => new ListaUsuariosAdminPage(pagina).excluirSeExistir(nomeCompleto, usuario.email));

test.describe('Bloco "Meus Cursos" de um usuário sem cursos', { tag: ['@dt-meus-cursos', '@dt-obrigatoriedade', '@cria-usuario'] }, () => {
  test.skip(!executar, 'Cria um usuário real no ambiente: rode com npm run test:meus-cursos-novo');
  test.use({ storageState: semSessao });
  test.setTimeout(300_000);

  // Cria a conta antes dos testes; se existir de uma execução anterior, exclui antes
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(600_000);
    await excluirSeExistir(browser);
    await comSessao(browser, semSessao, async (pagina) => {
      const criarConta = new CriarContaPage(pagina);
      await criarConta.acessarPeloLogin();
      await criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais);
      await criarConta.preencherNovaConta({
        ...usuario,
        dataNascimento: Factories.cadastro.dataNascimentoAdulta(),
        telefone: Factories.cadastro.telefoneUnico(),
      });
      await criarConta.botaoCriarMinhaConta.click();
      // Se o formulário não avançar, a falha mostra as mensagens dos campos — defeito do cadastro confirmado em 28/10
      await expect(criarConta.botaoCriarMinhaConta)
        .toBeHidden()
        .catch(async (erro) => {
          const mensagens = await criarConta.page.locator('.form-control-feedback:visible').allInnerTexts();
          throw new Error(`"Nova conta" não foi criada (defeito do cadastro, 28/10). Mensagens do formulário: ${JSON.stringify(mensagens.filter(Boolean))}
${erro}`);
        });
    });
    await comSessao(browser, sessoes.administrador, async (pagina) => {
      const lista = new ListaUsuariosAdminPage(pagina);
      await lista.acessar();
      await lista.filtrarPorNome(nomeCompleto);
      await lista.confirmarConta(usuario.email);
    });
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(300_000);
    await excluirSeExistir(browser);
  });

  test.beforeEach(async ({ login }) => {
    await login.acessar();
    await login.entrar(usuario);
    await login.aceitarPoliticaSeExibida();
    await expect(login.page).not.toHaveURL(/\/login\//);
  });

  test(
    'MC20 - Sem cursos, o bloco "Meus Cursos" é exibido sem cards e com o botão "Ver todos"',
    { tag: prioridade('MeusCursos', 'MC20') },
    async ({ meusCursos }) => {
      await test.step(`Quando acessei a "Página inicial" com o novo usuário "${usuario.identificacao}"`, () => meusCursos.acessarHome());
      await test.step(`Então o bloco "${textosMeusCursos.titulo}" foi exibido com o botão "${textosMeusCursos.verTodos}"`, async () => {
        await expect(meusCursos.tituloDoBloco).toBeVisible();
        await expect(meusCursos.verTodos).toBeVisible();
      });
      await test.step('E nenhum card de curso foi exibido', async () => {
        await meusCursos.aguardarCards();
        await expect(meusCursos.cardsDoBloco).toHaveCount(0);
      });
    },
  );

  test(
    `MC21 - Sem cursos, o "Ver todos" apresenta "${textosMeusCursos.semCursos}"`,
    { tag: prioridade('MeusCursos', 'MC21') },
    async ({ page, meusCursos }) => {
      await test.step('Quando cliquei em "Ver todos" no bloco "Meus Cursos"', async () => {
        await meusCursos.acessarHome();
        await meusCursos.verTodos.click();
        await page.waitForURL(/\/blocks\/mycourses\/index\.php/);
        await meusCursos.aguardarCards();
      });
      await test.step(`Então a página "${textosMeusCursos.titulo}" apresentou "${textosMeusCursos.semCursos}", sem cards`, async () => {
        await expect(meusCursos.tituloDaPagina).toBeVisible();
        await expect(meusCursos.semCursos).toBeVisible();
        await expect(meusCursos.cardsDaPagina).toHaveCount(0);
      });
    },
  );

  test(
    'MC22 - Sem cursos, "Necessário" e "Opcional" do bloco apresentam o estado sem cursos',
    { tag: prioridade('MeusCursos', 'MC22') },
    async ({ meusCursos }) => {
      await test.step('Dado que acessei a "Página inicial"', () => meusCursos.acessarHome());
      for (const opcao of obrigatoriedades)
        await test.step(`Quando selecionei "${opcao}", então nenhum curso foi exibido no lugar`, async () => {
          await meusCursos.selecionarObrigatoriedade(opcao);
          await expect(meusCursos.cardsDoBloco).toHaveCount(0);
        });
    },
  );
});
