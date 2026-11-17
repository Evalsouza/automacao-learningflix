// DT/EVT - Página inicial: Bloco "Meus Cursos" — configuração — rastreabilidade em RASTREABILIDADE.md
// Altera "Número de cards na página" do bloco, que vale para a plataforma inteira, e restaura o valor inicial ao final.
// Desligada por padrão: rode com `npm run test:meus-cursos-config` (também roda na rodada semanal)
import { test, expect } from '../../../support/e2e';
import { sessoes, comSessao } from '../../../support/sessoes';
import { ConfiguracaoMeusCursosPage } from '../../../support/meuscursos_commands/ConfiguracaoMeusCursosPage';
import { MeusCursosPage } from '../../../support/meuscursos_commands/MeusCursosPage';
import { textosMeusCursos, limitesMeusCursos } from '../../../fixtures/meuscursos';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CONFIG_MEUS_CURSOS === 'sim';
let valorInicial = '';

test.describe('CASOS DE TESTE 01: configuração do bloco "Meus Cursos"', { tag: ['@dt-meus-cursos', '@altera-configuracao'] }, () => {
  test.skip(!executar, 'Altera uma configuração da plataforma inteira: rode com npm run test:meus-cursos-config');
  test.use({ storageState: sessoes.administrador });
  test.setTimeout(240_000);

  // Sem `serial`: com 1 worker os testes já rodam em ordem; depois de uma falha o afterAll restaura e o beforeAll relê
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(300_000);
    valorInicial = await comSessao(browser, sessoes.administrador, (pagina) => new ConfiguracaoMeusCursosPage(pagina).valorAtual());
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(300_000);
    await comSessao(browser, sessoes.administrador, async (pagina) => {
      const config = new ConfiguracaoMeusCursosPage(pagina);
      await config.acessar();
      if ((await config.cardsPorPagina.inputValue()) !== valorInicial) await config.definir(valorInicial);
    });
  });

  test(
    `MC10 - "Número de cards na página" do bloco é exibido com o padrão ${limitesMeusCursos.cardsPorPaginaPadrao}`,
    { tag: prioridade('MeusCursos', 'MC10') },
    async ({ configuracaoMeusCursos }) => {
      await test.step('Quando acessei a configuração do bloco "Meus Cursos" em "Plugins → Blocos"', () => configuracaoMeusCursos.acessar());
      await test.step(`Então o campo "Número de cards na página" foi exibido com "Padrão: ${limitesMeusCursos.cardsPorPaginaPadrao}"`, async () => {
        await expect(configuracaoMeusCursos.cardsPorPagina).toBeVisible();
        await expect(configuracaoMeusCursos.blocoDoCampo).toContainText(`Padrão: ${limitesMeusCursos.cardsPorPaginaPadrao}`);
      });
    },
  );

  test(
    `MC11 - "Número de cards na página" abaixo de ${limitesMeusCursos.cardsPorPaginaPadrao} NÃO é salvo`,
    { tag: prioridade('MeusCursos', 'MC11') },
    async ({ configuracaoMeusCursos }) => {
      await test.step(`Quando informei "${limitesMeusCursos.abaixoDoMinimo}" e cliquei em "Salvar mudanças"`, async () => {
        await configuracaoMeusCursos.acessar();
        await configuracaoMeusCursos.definir(limitesMeusCursos.abaixoDoMinimo);
      });
      await test.step(`Então o valor NÃO foi gravado: a configuração continuou com "${valorInicial}"`, async () => {
        await expect(configuracaoMeusCursos.page.getByText(textosMeusCursos.gravadas)).toBeHidden();
        expect(await configuracaoMeusCursos.valorAtual()).toBe(valorInicial);
      });
    },
  );

  test(
    `MC12 - Com "Número de cards na página" = ${limitesMeusCursos.cardsPorPaginaDeTeste}, o "Ver todos" apresenta ${limitesMeusCursos.cardsPorPaginaDeTeste} cards por página`,
    { tag: prioridade('MeusCursos', 'MC12') },
    async ({ browser, configuracaoMeusCursos }) => {
      await test.step(`Quando informei "${limitesMeusCursos.cardsPorPaginaDeTeste}" e cliquei em "Salvar mudanças"`, async () => {
        await configuracaoMeusCursos.acessar();
        await configuracaoMeusCursos.definir(limitesMeusCursos.cardsPorPaginaDeTeste);
      });
      await test.step(`Então a mensagem "${textosMeusCursos.gravadas}" foi exibida`, () =>
        expect(configuracaoMeusCursos.page.getByText(textosMeusCursos.gravadas).first()).toBeVisible());
      await test.step(`E o "Ver todos" da Estudante apresentou ${limitesMeusCursos.cardsPorPaginaDeTeste} cards na página 1`, () =>
        comSessao(browser, sessoes.estudante, async (pagina) => {
          const meusCursos = new MeusCursosPage(pagina);
          await meusCursos.acessarHome();
          await meusCursos.verTodos.click();
          await pagina.waitForURL(/\/blocks\/mycourses\/index\.php/);
          await meusCursos.aguardarCards();
          await expect(meusCursos.cardsDaPagina).toHaveCount(limitesMeusCursos.cardsPorPaginaDeTeste);
        }));
    },
  );

  // Valor-limite do mínimo: 7 recusado e 8 aceito — lacuna (d) da Estratégia, pedido da QA (17/11).
  // Rodam depois do MC12, com o campo diferente de 8, para que o 8 seja de fato uma mudança
  test(
    `MC13 - "Número de cards na página" = ${limitesMeusCursos.logoAbaixoDoMinimo}, logo abaixo do mínimo, NÃO é salvo`,
    { tag: prioridade('MeusCursos', 'MC13') },
    async ({ configuracaoMeusCursos }) => {
      const anterior = await test.step('Dado que li o valor atual de "Número de cards na página"', () =>
        configuracaoMeusCursos.valorAtual());
      await test.step(`Quando informei "${limitesMeusCursos.logoAbaixoDoMinimo}" e cliquei em "Salvar mudanças"`, async () => {
        await configuracaoMeusCursos.acessar();
        await configuracaoMeusCursos.definir(limitesMeusCursos.logoAbaixoDoMinimo);
      });
      await test.step(`Então o valor NÃO foi gravado: a configuração continuou com "${anterior}"`, async () => {
        await expect(configuracaoMeusCursos.page.getByText(textosMeusCursos.gravadas)).toBeHidden();
        expect(await configuracaoMeusCursos.valorAtual()).toBe(anterior);
      });
    },
  );

  test(
    `MC14 - Com "Número de cards na página" = ${limitesMeusCursos.minimo}, o mínimo, o valor é salvo e o "Ver todos" apresenta ${limitesMeusCursos.minimo} cards`,
    { tag: prioridade('MeusCursos', 'MC14') },
    async ({ browser, configuracaoMeusCursos }) => {
      await test.step(`Quando informei "${limitesMeusCursos.minimo}" e cliquei em "Salvar mudanças"`, async () => {
        await configuracaoMeusCursos.acessar();
        await configuracaoMeusCursos.definir(limitesMeusCursos.minimo);
      });
      await test.step(`Então a configuração ficou com "${limitesMeusCursos.minimo}"`, async () =>
        expect(await configuracaoMeusCursos.valorAtual()).toBe(String(limitesMeusCursos.minimo)));
      await test.step(`E o "Ver todos" da Estudante apresentou ${limitesMeusCursos.minimo} cards na página 1`, () =>
        comSessao(browser, sessoes.estudante, async (pagina) => {
          const meusCursos = new MeusCursosPage(pagina);
          await meusCursos.acessarHome();
          await meusCursos.verTodos.click();
          await pagina.waitForURL(/\/blocks\/mycourses\/index\.php/);
          await meusCursos.aguardarCards();
          await expect(meusCursos.cardsDaPagina).toHaveCount(limitesMeusCursos.minimo);
        }));
    },
  );
});
