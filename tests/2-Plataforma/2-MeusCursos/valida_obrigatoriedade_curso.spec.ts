// DT/EVT - Obrigatoriedade do Curso — Como Administrador e Como Usuário Final (LFXP-6914): campo personalizado,
// Configurações do curso, Catálogo e demais blocos. Rastreabilidade em RASTREABILIDADE.md. Só leitura — 19/11
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import { MeusCursosPage } from '../../../support/meuscursos_commands/MeusCursosPage';
import { CampoObrigatoriedadePage } from '../../../support/meuscursos_commands/CampoObrigatoriedadePage';
import {
  textosMeusCursos,
  obrigatoriedades,
  campoObrigatoriedade,
  opcoesNoCurso,
  cursoDeReferencia,
  blocosComObrigatoriedade,
  categoriaDoCatalogo,
  cursoSemClassificacao,
} from '../../../fixtures/meuscursos';
import { prioridade } from '../../../fixtures/prioridades';

const classificacoes = ['Necessário', 'Opcional', ''];

test.describe('Obrigatoriedade do Curso — campo personalizado e Configurações do curso', { tag: '@dt-obrigatoriedade' }, () => {
  test.use({ storageState: sessoes.administrador });

  test(
    'OB12 - Campo "Obrigatoriedade" configurado com "Necessário" e "Opcional" e "Opcional" como padrão',
    { tag: prioridade('MeusCursos', 'OB12') },
    async ({ page }) => {
      const campo = new CampoObrigatoriedadePage(page);
      await test.step('Quando acessei "Administração → Cursos → Campos personalizados de curso"', () => campo.acessar());
      await test.step(`Então "${campoObrigatoriedade.nome}" foi exibido em "${campoObrigatoriedade.categoria}" como "${campoObrigatoriedade.tipo}"`, async () => {
        await expect(campo.linhaDoCampo).toContainText(campoObrigatoriedade.nome);
        await expect(campo.linhaDoCampo).toContainText(campoObrigatoriedade.tipo);
        await expect(campo.categoriaDoCampo).not.toContainText('Conteúdos adicionais');
      });
      await test.step('Quando abri a edição do campo', () => campo.abrirEdicao());
      await test.step('Então o "Nome breve" foi exibido bloqueado', async () => {
        await expect(campo.janela).toContainText(campoObrigatoriedade.tituloDoModal);
        await expect(campo.campoDaJanela('shortname')).toHaveValue(campoObrigatoriedade.nomeBreve);
        await expect(campo.campoDaJanela('shortname')).not.toBeEditable();
      });
      for (const [nome, valor] of Object.entries(campoObrigatoriedade.texto))
        await test.step(`E "${nome}" estava com "${valor.replace('\n', ' / ')}"`, () =>
          expect(campo.campoDaJanela(nome)).toHaveValue(valor));
      for (const [nome, valor] of Object.entries(campoObrigatoriedade.lista))
        await test.step(`E "${nome}" estava com "${valor}"`, () => expect(campo.opcaoMarcada(nome)).toHaveText(valor));
      await test.step('Quando cliquei em "Cancelar", a janela fechou sem salvar', () => campo.cancelar());
    },
  );

  test(
    'OB13 - Configurações do curso exibem "Obrigatoriedade" com "Nenhuma", "Necessário" e "Opcional"',
    { tag: prioridade('MeusCursos', 'OB13') },
    async ({ page }) => {
      const campo = new CampoObrigatoriedadePage(page);
      await test.step(`Quando acessei as Configurações do curso ${cursoDeReferencia}, sem salvar`, () =>
        campo.acessarConfiguracoesDoCurso(cursoDeReferencia));
      await test.step(`Então "${campoObrigatoriedade.nome}" ofereceu ${opcoesNoCurso.join(', ')}`, async () => {
        await expect(campo.campoNoCurso.locator('option')).toHaveText(opcoesNoCurso);
        await expect(campo.campoNoCurso.locator('option:checked')).toHaveText(new RegExp(`^(${opcoesNoCurso.join('|')})$`));
      });
    },
  );
});

test.describe('Obrigatoriedade do Curso — Catálogo e demais blocos', { tag: '@dt-obrigatoriedade' }, () => {
  test.use({ storageState: sessoes.estudante });

  test(
    'OB14 - Catálogo exibe as tags "Necessário" e "Opcional" e o "i" mostra a mesma classificação',
    { tag: prioridade('MeusCursos', 'OB14') },
    async ({ page }) => {
      const catalogo = new MeusCursosPage(page);
      const cards = await test.step(`Quando acessei o "Catálogo" na categoria "${categoriaDoCatalogo.nome}"`, async () => {
        await page.goto(`/local/catalog/index.php?categoryid=${categoriaDoCatalogo.id}`);
        await catalogo.aguardarCards();
        await catalogo.cardsDaPagina.first().waitFor();
        return catalogo.lerCards(catalogo.cardsDaPagina);
      });
      await test.step('Então cada card exibiu "Necessário", "Opcional" ou nenhuma tag', () =>
        expect(cards.filter((c) => !classificacoes.includes(c.obrigatoriedade)).map((c) => c.titulo)).toEqual([]));
      // Curso sem classificação ("Nenhuma"): a Estudante não vê nenhum no Catálogo em 19/11 — mesma falta de massa do OB11
      await test.step('E há cursos "Necessário" e "Opcional" na página', () =>
        expect(obrigatoriedades.map((t) => cards.some((c) => c.obrigatoriedade === t))).toEqual([true, true]));
      for (const tag of obrigatoriedades) {
        await test.step(`E o "i" de um curso "${tag}" exibiu a mesma classificação`, async () => {
          const indice = cards.findIndex((c) => c.obrigatoriedade === tag);
          const janela = await catalogo.abrirInfo(catalogo.cardsDaPagina.nth(indice));
          for (const opcao of obrigatoriedades) await expect(janela.getByText(opcao, { exact: true })).toHaveCount(opcao === tag ? 1 : 0);
          await catalogo.fecharInfo(janela);
        });
      }
    },
  );

  for (const { bloco, titulo } of blocosComObrigatoriedade)
    test(
      `OB15 - "${titulo}": filtro "Obrigatoriedade" no "Ver todos" e tags nos cards do bloco`,
      { tag: prioridade('MeusCursos', 'OB15') },
      async ({ page }) => {
        const pagina = new MeusCursosPage(page, bloco);
        await test.step(`Dado que acessei a "Página inicial", os cards de "${titulo}" exibiram "Necessário", "Opcional" ou nenhuma tag`, async () => {
          await pagina.acessarHome();
          await pagina.cardsDoBloco.first().waitFor();
          const cards = await pagina.lerCards(pagina.cardsDoBloco);
          expect(cards.filter((c) => !classificacoes.includes(c.obrigatoriedade)).map((c) => c.titulo)).toEqual([]);
        });
        await test.step('Quando abri o "Ver todos", o filtro "Obrigatoriedade" ofereceu "Todos", "Necessário" e "Opcional"', async () => {
          await pagina.acessarVerTodosPadrao();
          await expect(pagina.filtroObrigatoriedade.locator('option')).toHaveText(['Todos', ...obrigatoriedades]);
        });
        for (const opcao of obrigatoriedades) {
          await test.step(`E com "${opcao}", a página 1 apresentou só cursos "${opcao}" ou "${textosMeusCursos.semCursos}"`, async () => {
            await pagina.acessarVerTodos({ obrigatoriedade: opcao });
            const cards = await pagina.lerCards(pagina.cardsDaPagina);
            expect(cards.filter((c) => c.obrigatoriedade !== opcao).map((c) => c.titulo)).toEqual([]);
            expect(cards.length || (await pagina.semCursos.count())).toBeGreaterThan(0);
          });
        }
      },
    );

  test(
    `OB15.1 - "${cursoSemClassificacao.tituloDoBloco}": curso sem classificação ("Nenhuma") fica sem tag e fora dos filtros`,
    { tag: prioridade('MeusCursos', 'OB15.1') },
    async ({ page }) => {
      const pagina = new MeusCursosPage(page, cursoSemClassificacao.bloco);
      const { id } = cursoSemClassificacao;
      const card = await test.step(`Quando procurei o curso ${id} no "Ver todos" com "Obrigatoriedade" = "Todos"`, () =>
        pagina.acharCurso(id));
      await test.step('Então o card foi exibido sem tag de obrigatoriedade', async () => {
        const [lido] = await pagina.lerCards(card);
        expect(lido.obrigatoriedade).toBe('');
      });
      await test.step('E o "i" não exibiu "Necessário" nem "Opcional"', async () => {
        const janela = await pagina.abrirInfo(card);
        for (const opcao of obrigatoriedades) await expect(janela.getByText(opcao, { exact: true })).toHaveCount(0);
        await pagina.fecharInfo(janela);
      });
      for (const opcao of obrigatoriedades)
        await test.step(`E com "${opcao}", o curso não foi exibido em nenhuma página`, async () =>
          expect(await pagina.todosOsIds({ obrigatoriedade: opcao })).not.toContain(id));
    },
  );
});
