// DT/EVT - Página inicial: Bloco "Meus Cursos" e DT/EVT - Obrigatoriedade do Curso (Administrador e Usuário Final)
// Rastreabilidade em RASTREABILIDADE.md. Só leitura: confere a regra do bloco e do "Ver todos", sem depender
// de nomes de cursos — decisão da QA (05/11)
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import {
  textosMeusCursos,
  obrigatoriedades,
  obrigatoriedadePadrao,
  limitesMeusCursos,
  ordenacoes,
  statusDoCurso,
} from '../../../fixtures/meuscursos';
import { prioridade } from '../../../fixtures/prioridades';

const ordemAlfabetica = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

test.describe('CASOS DE TESTE 01 e 02: Visualização do bloco "Meus Cursos"', { tag: '@dt-meus-cursos' }, () => {
  for (const { id, perfil, sessao } of [
    { id: 'MC01', perfil: 'Administrador', sessao: sessoes.administrador },
    { id: 'MC02', perfil: 'Estudante', sessao: sessoes.estudante },
  ]) {
    test.describe(perfil, () => {
      test.use({ storageState: sessao });

      test(
        `${id} - "${perfil}" vê o bloco "Meus Cursos" com até ${limitesMeusCursos.cardsNaHome} cards e o botão "Ver todos"`,
        { tag: prioridade('MeusCursos', id) },
        async ({ meusCursos }) => {
          await test.step('Quando acessei a "Página inicial"', () => meusCursos.acessarHome());
          await test.step(`Então o bloco "${textosMeusCursos.titulo}" foi exibido com o botão "${textosMeusCursos.verTodos}"`, async () => {
            await expect(meusCursos.tituloDoBloco).toBeVisible();
            await expect(meusCursos.verTodos).toBeVisible();
          });
          await test.step(`E foram exibidos de 1 a ${limitesMeusCursos.cardsNaHome} cards de cursos`, async () => {
            await meusCursos.aguardarCards();
            const quantidade = await meusCursos.cardsDoBloco.count();
            expect(quantidade).toBeGreaterThan(0);
            expect(quantidade).toBeLessThanOrEqual(limitesMeusCursos.cardsNaHome);
          });
        },
      );
    });
  }

  test.describe('Estudante', () => {
    test.use({ storageState: sessoes.estudante });
    test.setTimeout(240_000);

    test(
      'MC03 - Os cards do bloco são de cursos em que a Estudante está inscrita',
      { tag: prioridade('MeusCursos', 'MC03') },
      async ({ meusCursos }) => {
        const inscritos = await test.step('Dado que li todos os cursos do "Ver todos"', () => meusCursos.todosOsIds());
        await test.step('Quando acessei a "Página inicial"', () => meusCursos.acessarHome());
        for (const opcao of obrigatoriedades)
          await test.step(`Então, em "${opcao}", cada card do bloco é de um curso do "Ver todos"`, async () => {
            await meusCursos.selecionarObrigatoriedade(opcao);
            for (const card of await meusCursos.lerCards(meusCursos.cardsDoBloco))
              expect(inscritos, `curso ${card.titulo}`).toContain(card.id);
          });
      },
    );

    test(
      'MC04 - O bloco apresenta os últimos cursos acessados primeiro',
      { tag: prioridade('MeusCursos', 'MC04') },
      async ({ meusCursos }) => {
        for (const opcao of obrigatoriedades) {
          const doBloco = await test.step(`Quando acessei a "Página inicial" e selecionei "${opcao}"`, async () => {
            await meusCursos.acessarHome();
            await meusCursos.selecionarObrigatoriedade(opcao);
            return (await meusCursos.lerCards(meusCursos.cardsDoBloco)).map((c) => c.id);
          });
          await test.step(`Então os cards seguiram a ordem do "Ver todos" por "${ordenacoes.ultimosAcessados.texto}" em "${opcao}"`, async () => {
            await meusCursos.acessarVerTodos({ ordenar: ordenacoes.ultimosAcessados.valor, obrigatoriedade: opcao });
            const doVerTodos = (await meusCursos.lerCards(meusCursos.cardsDaPagina)).map((c) => c.id);
            expect(doBloco).toEqual(doVerTodos.slice(0, doBloco.length));
          });
        }
      },
    );

    test(
      `MC05 - "Ver todos" abre a página "Meus Cursos" com ${limitesMeusCursos.cardsPorPaginaPadrao} cards por página e paginação`,
      { tag: prioridade('MeusCursos', 'MC05') },
      async ({ page, meusCursos }) => {
        await test.step('Quando cliquei em "Ver todos" no bloco "Meus Cursos"', async () => {
          await meusCursos.acessarHome();
          await meusCursos.verTodos.click();
          await page.waitForURL(/\/blocks\/mycourses\/index\.php/);
          await meusCursos.aguardarCards();
        });
        await test.step(`Então a página "${textosMeusCursos.titulo}" foi exibida`, () => expect(meusCursos.tituloDaPagina).toBeVisible());
        await test.step(`E foram exibidos ${limitesMeusCursos.cardsPorPaginaPadrao} cards com a paginação`, async () => {
          await expect(meusCursos.cardsDaPagina).toHaveCount(limitesMeusCursos.cardsPorPaginaPadrao);
          await expect(meusCursos.paginacao).toBeVisible();
        });
      },
    );

    test(
      `MC06 - "Ver todos" vem ordenado por "${ordenacoes.inicioDaInscricao.texto}"`,
      { tag: prioridade('MeusCursos', 'MC06') },
      async ({ meusCursos }) => {
        await test.step('Quando acessei o "Ver todos" do bloco "Meus Cursos"', () => meusCursos.acessarVerTodosPadrao());
        await test.step(`Então "Ordenar por" veio com "${ordenacoes.inicioDaInscricao.texto}" selecionado`, () =>
          expect(meusCursos.ordenarPor.locator('option:checked')).toHaveText(ordenacoes.inicioDaInscricao.texto));
      },
    );
  });
});

test.describe('Obrigatoriedade do Curso no bloco "Meus Cursos"', { tag: '@dt-obrigatoriedade' }, () => {
  test.use({ storageState: sessoes.estudante });
  test.setTimeout(240_000);

  test(
    `OB01 - O bloco oferece "Necessário" e "Opcional", com "${obrigatoriedadePadrao}" selecionado por padrão`,
    { tag: prioridade('MeusCursos', 'OB01') },
    async ({ meusCursos }) => {
      await test.step('Quando acessei a "Página inicial"', () => meusCursos.acessarHome());
      for (const opcao of obrigatoriedades)
        await test.step(`Então a opção "${opcao}" foi exibida ${opcao === obrigatoriedadePadrao ? 'selecionada' : 'sem seleção'}`, async () => {
          await expect(meusCursos.botaoObrigatoriedade(opcao)).toBeVisible();
          await expect(meusCursos.botaoObrigatoriedade(opcao)).toHaveAttribute('aria-pressed', String(opcao === obrigatoriedadePadrao));
        });
    },
  );

  test(
    'OB02 - Cada opção do bloco apresenta somente os cursos da sua classificação',
    { tag: prioridade('MeusCursos', 'OB02') },
    async ({ meusCursos }) => {
      await test.step('Dado que acessei a "Página inicial"', () => meusCursos.acessarHome());
      // Duas voltas: ao alternar, nenhum curso da opção anterior pode permanecer
      for (const opcao of [...obrigatoriedades, ...obrigatoriedades])
        await test.step(`Quando selecionei "${opcao}", então todos os cards apresentaram a tag "${opcao}"`, async () => {
          await meusCursos.selecionarObrigatoriedade(opcao);
          await expect(meusCursos.botaoObrigatoriedade(opcao)).toHaveAttribute('aria-pressed', 'true');
          const cards = await meusCursos.lerCards(meusCursos.cardsDoBloco);
          expect(cards.length).toBeGreaterThan(0);
          for (const card of cards) expect(card.obrigatoriedade, `curso ${card.titulo}`).toBe(opcao);
        });
    },
  );

  test(
    'OB03 - Alternar entre "Necessário" e "Opcional" mantém a ordenação do bloco',
    { tag: prioridade('MeusCursos', 'OB03') },
    async ({ meusCursos }) => {
      await test.step('Dado que acessei a "Página inicial"', () => meusCursos.acessarHome());
      const primeira: Record<string, string[]> = {};
      for (const opcao of obrigatoriedades)
        await test.step(`Quando selecionei "${opcao}" pela primeira vez`, async () => {
          await meusCursos.selecionarObrigatoriedade(opcao);
          primeira[opcao] = (await meusCursos.lerCards(meusCursos.cardsDoBloco)).map((c) => c.id);
        });
      for (const opcao of obrigatoriedades)
        await test.step(`Então, ao voltar para "${opcao}", os cards vieram na mesma ordem`, async () => {
          await meusCursos.selecionarObrigatoriedade(opcao);
          expect((await meusCursos.lerCards(meusCursos.cardsDoBloco)).map((c) => c.id)).toEqual(primeira[opcao]);
        });
    },
  );

  test(
    'OB04 - O filtro "Obrigatoriedade" do "Ver todos" apresenta os cursos da opção selecionada',
    { tag: prioridade('MeusCursos', 'OB04') },
    async ({ meusCursos }) => {
      await test.step('Quando acessei o "Ver todos" do bloco "Meus Cursos"', () => meusCursos.acessarVerTodosPadrao());
      await test.step('Então o filtro "Obrigatoriedade" ofereceu "Todos", "Necessário" e "Opcional"', async () =>
        expect((await meusCursos.filtroObrigatoriedade.locator('option').allInnerTexts()).map((o) => o.trim())).toEqual([
          'Todos',
          ...obrigatoriedades,
        ]));
      for (const opcao of obrigatoriedades)
        await test.step(`Quando selecionei "${opcao}", então todos os cards apresentaram a tag "${opcao}"`, async () => {
          await meusCursos.filtrar(meusCursos.filtroObrigatoriedade, opcao);
          const cards = await meusCursos.lerCards(meusCursos.cardsDaPagina);
          expect(cards.length).toBeGreaterThan(0);
          for (const card of cards) expect(card.obrigatoriedade, `curso ${card.titulo}`).toBe(opcao);
        });
      await test.step('Quando selecionei "Todos", então a lista voltou sem restringir a obrigatoriedade', async () => {
        await meusCursos.filtrar(meusCursos.filtroObrigatoriedade, 'all');
        await expect(meusCursos.cardsDaPagina).toHaveCount(limitesMeusCursos.cardsPorPaginaPadrao);
      });
    },
  );

  test(
    'OB05 - O filtro "Obrigatoriedade" funciona combinado com a busca, a Modalidade e o status do curso',
    { tag: prioridade('MeusCursos', 'OB05') },
    async ({ meusCursos }) => {
      const opcao = obrigatoriedadePadrao;
      const referencia = await test.step(`Dado que acessei o "Ver todos" com "${opcao}"`, async () => {
        await meusCursos.acessarVerTodos({ obrigatoriedade: opcao });
        return (await meusCursos.lerCards(meusCursos.cardsDaPagina))[0];
      });
      // A busca também considera a descrição do curso: o curso buscado precisa estar no resultado
      const termo = referencia.titulo;
      await test.step(`Quando busquei "${termo}", então o curso foi encontrado e todos os resultados mantiveram "${opcao}"`, async () => {
        await meusCursos.buscar(termo);
        const cards = await meusCursos.lerCards(meusCursos.cardsDaPagina);
        expect(cards.map((c) => c.id)).toContain(referencia.id);
        for (const card of cards) expect(card.obrigatoriedade).toBe(opcao);
      });
      // Referência da Modalidade: o primeiro curso da página que tem Modalidade
      const comModalidade = await test.step(`E li o primeiro curso "${opcao}" com Modalidade`, async () => {
        await meusCursos.acessarVerTodos({ obrigatoriedade: opcao });
        const card = (await meusCursos.lerCards(meusCursos.cardsDaPagina)).find((c) => c.modalidade);
        expect(card, 'nenhum curso da página 1 tem Modalidade').toBeTruthy();
        return card!;
      });
      await test.step(`Quando selecionei a Modalidade "${comModalidade.modalidade}", então os cursos atenderam aos dois filtros`, async () => {
        const valor = await meusCursos.filtroModalidade
          .locator('option')
          .evaluateAll(
            (opcoes, modalidade) =>
              (opcoes as HTMLOptionElement[]).find((o) => o.text.trim().toLowerCase() === modalidade.toLowerCase())?.value ?? '',
            comModalidade.modalidade,
          );
        expect(valor, `opção "${comModalidade.modalidade}" no filtro Modalidade`).not.toBe('');
        await meusCursos.filtrar(meusCursos.filtroModalidade, valor);
        const cards = await meusCursos.lerCards(meusCursos.cardsDaPagina);
        expect(cards.map((c) => c.id)).toContain(comModalidade.id);
        for (const card of cards) {
          expect(card.modalidade.toLowerCase()).toBe(comModalidade.modalidade.toLowerCase());
          expect(card.obrigatoriedade).toBe(opcao);
        }
        expect(meusCursos.parametro('courserequirement')).toBe(opcao);
      });
      await test.step(`Quando selecionei "Cursos: ${statusDoCurso.emAndamento.texto}", então a obrigatoriedade foi mantida`, async () => {
        await meusCursos.acessarVerTodos({ obrigatoriedade: opcao });
        await meusCursos.filtrar(meusCursos.filtroStatus, statusDoCurso.emAndamento.valor);
        expect(meusCursos.parametro('courserequirement')).toBe(opcao);
        for (const card of await meusCursos.lerCards(meusCursos.cardsDaPagina)) expect(card.obrigatoriedade).toBe(opcao);
      });
    },
  );

  test('OB06 - A ordenação mantém a obrigatoriedade selecionada', { tag: prioridade('MeusCursos', 'OB06') }, async ({ meusCursos }) => {
    const opcao = obrigatoriedadePadrao;
    await test.step(`Dado que acessei o "Ver todos" com "${opcao}"`, () => meusCursos.acessarVerTodos({ obrigatoriedade: opcao }));
    await test.step(`Quando ordenei por "${ordenacoes.nome.texto}"`, () =>
      meusCursos.filtrar(meusCursos.ordenarPor, ordenacoes.nome.valor));
    await test.step(`Então os cursos mantiveram a tag "${opcao}" e vieram em ordem alfabética`, async () => {
      const cards = await meusCursos.lerCards(meusCursos.cardsDaPagina);
      for (const card of cards) expect(card.obrigatoriedade).toBe(opcao);
      const titulos = cards.map((c) => c.titulo);
      expect(titulos).toEqual([...titulos].sort(ordemAlfabetica));
    });
  });

  test(
    'OB07 - A paginação mantém os filtros e a troca de obrigatoriedade numa página posterior apresenta resultados válidos',
    { tag: prioridade('MeusCursos', 'OB07') },
    async ({ meusCursos }) => {
      const opcao = obrigatoriedadePadrao;
      await test.step(`Dado que acessei o "Ver todos" com "${opcao}"`, () => meusCursos.acessarVerTodos({ obrigatoriedade: opcao }));
      await test.step('Quando fui para a página 2', () => meusCursos.irParaPagina(2));
      await test.step(`Então a página 2 manteve "${opcao}" no filtro e nos cards`, async () => {
        await expect(meusCursos.filtroObrigatoriedade.locator('option:checked')).toHaveText(opcao);
        for (const card of await meusCursos.lerCards(meusCursos.cardsDaPagina)) expect(card.obrigatoriedade).toBe(opcao);
      });
      await test.step('Quando selecionei "Necessário" estando na página 2', () =>
        meusCursos.filtrar(meusCursos.filtroObrigatoriedade, 'Necessário'));
      await test.step('Então foram apresentados cursos "Necessário", sem indicar ausência de cursos', async () => {
        await expect(meusCursos.semCursos).toBeHidden();
        const cards = await meusCursos.lerCards(meusCursos.cardsDaPagina);
        expect(cards.length).toBeGreaterThan(0);
        for (const card of cards) expect(card.obrigatoriedade).toBe('Necessário');
      });
    },
  );

  test(
    `OB08 - Uma combinação sem correspondência apresenta "${textosMeusCursos.semCursos}" e mantém os filtros`,
    { tag: prioridade('MeusCursos', 'OB08') },
    async ({ meusCursos }) => {
      const termo = 'zz-sem-resultado-automacao';
      await test.step(`Quando busquei "${termo}" com "Necessário"`, async () => {
        await meusCursos.acessarVerTodos({ obrigatoriedade: 'Necessário' });
        await meusCursos.buscar(termo);
      });
      await test.step(`Então a mensagem "${textosMeusCursos.semCursos}" foi exibida, sem cards`, async () => {
        await expect(meusCursos.semCursos).toBeVisible();
        await expect(meusCursos.cardsDaPagina).toHaveCount(0);
      });
      await test.step('E os filtros continuaram disponíveis, com "Necessário" e a busca selecionados', async () => {
        await expect(meusCursos.filtroObrigatoriedade.locator('option:checked')).toHaveText('Necessário');
        await expect(meusCursos.busca).toHaveValue(termo);
      });
    },
  );

  test(
    'OB09 - Voltar a obrigatoriedade para "Todos" preserva a busca e os demais filtros',
    { tag: prioridade('MeusCursos', 'OB09') },
    async ({ meusCursos }) => {
      const opcao = obrigatoriedadePadrao;
      const referencia =
        await test.step(`Dado que busquei pelo primeiro curso "${opcao}" com "Cursos: ${statusDoCurso.todos.texto}"`, async () => {
          await meusCursos.acessarVerTodos({ obrigatoriedade: opcao });
          const referencia = (await meusCursos.lerCards(meusCursos.cardsDaPagina))[0];
          await meusCursos.buscar(referencia.titulo);
          return referencia;
        });
      const termo = referencia.titulo;
      await test.step('Quando voltei a "Obrigatoriedade" para "Todos"', () => meusCursos.filtrar(meusCursos.filtroObrigatoriedade, 'all'));
      await test.step('Então a busca e o status continuaram aplicados', async () => {
        await expect(meusCursos.busca).toHaveValue(termo);
        expect(meusCursos.parametro('search')).toBe(termo);
        expect(meusCursos.parametro('status')).toBe(statusDoCurso.todos.valor);
        expect((await meusCursos.lerCards(meusCursos.cardsDaPagina)).map((c) => c.id)).toContain(referencia.id);
      });
    },
  );

  // O primeiro card de cada opção é aberto: ele já é o último acessado, então a ordem do bloco não muda
  for (const opcao of obrigatoriedades)
    test(
      `OB10 - O "i" do card e a página do curso apresentam a classificação "${opcao}"`,
      { tag: prioridade('MeusCursos', 'OB10') },
      async ({ meusCursos }) => {
        const card = await test.step(`Dado que acessei a "Página inicial" e selecionei "${opcao}"`, async () => {
          await meusCursos.acessarHome();
          await meusCursos.selecionarObrigatoriedade(opcao);
          return meusCursos.cardsDoBloco.first();
        });
        await test.step(`Quando abri o "i" do primeiro card, então a classificação "${opcao}" foi exibida`, async () => {
          const janela = await meusCursos.abrirInfo(card);
          await expect(janela.getByText(opcao, { exact: true })).toBeVisible();
          await meusCursos.page.keyboard.press('Escape');
        });
        await test.step('Quando abri o curso pelo card', async () => {
          await card.locator('a.card-link').click();
          await meusCursos.page.waitForURL(/\/course\/view\.php/);
          await meusCursos.aguardarCarregar();
        });
        await test.step(`Então a página do curso apresentou a classificação "${opcao}"`, () =>
          expect(meusCursos.tagNoCurso(opcao)).toBeVisible());
      },
    );

  test(
    'OB11 - Curso com "Obrigatoriedade" "Nenhuma" aparece só em "Todos"',
    { tag: prioridade('MeusCursos', 'OB11') },
    async ({ meusCursos }) => {
      const semClassificacao = await test.step('Dado que li os cursos sem tag de obrigatoriedade no "Ver todos" com "Todos"', async () => {
        const ids: string[] = [];
        await meusCursos.acessarVerTodos();
        const ultima = await meusCursos.ultimaPagina();
        for (let pagina = 1; pagina <= ultima; pagina++) {
          if (pagina > 1) await meusCursos.acessarVerTodos({ pagina });
          ids.push(...(await meusCursos.lerCards(meusCursos.cardsDaPagina)).filter((c) => !c.obrigatoriedade).map((c) => c.id));
        }
        return ids;
      });
      test.fixme(semClassificacao.length === 0, 'A Estudante não está inscrita em curso com "Obrigatoriedade" "Nenhuma": falta massa');
      for (const opcao of obrigatoriedades)
        await test.step(`Então esses cursos NÃO apareceram no filtro "${opcao}" do "Ver todos"`, async () => {
          const ids = await meusCursos.todosOsIds({ obrigatoriedade: opcao });
          for (const id of semClassificacao) expect(ids).not.toContain(id);
        });
      await test.step('E NÃO apareceram em nenhuma opção do bloco', async () => {
        await meusCursos.acessarHome();
        for (const opcao of obrigatoriedades) {
          await meusCursos.selecionarObrigatoriedade(opcao);
          const ids = (await meusCursos.lerCards(meusCursos.cardsDoBloco)).map((c) => c.id);
          for (const id of semClassificacao) expect(ids).not.toContain(id);
        }
      });
    },
  );
});
