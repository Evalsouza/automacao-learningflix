// DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 3 (só leitura) — rastreabilidade em RASTREABILIDADE.md
// Competências do cargo e dos cursos são lidas na hora pelo Administrador (só leitura): podem mudar a qualquer momento
import { test, expect } from '../../../support/e2e';
import { sessoes, comSessao, semSessao } from '../../../support/sessoes';
import { usuariosSkillLink } from '../../../support/usuarios';
import { CursosRecomendadosPage } from '../../../support/skilllink_commands/CursosRecomendadosPage';
import { CompetenciasSkillLinkPage, emComum } from '../../../support/skilllink_commands/CompetenciasSkillLinkPage';
import { caminhosSkillLink, recomendados } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

test.describe('CENÁRIO 3: Cursos recomendados para o seu cargo | Usuária Eva Souza', { tag: '@dt-skill-link-gestao' }, () => {
  test.use({ storageState: sessoes.estudante });
  test.setTimeout(180_000);

  test(
    `C054 - Com o cargo "${recomendados.cargo}", a "Página inicial" exibe o bloco "Cursos recomendados para o seu cargo"`,
    { tag: prioridade('SkillLink', 'C054') },
    async ({ cursosRecomendados }) => {
      await test.step(`Dado que a usuária tem o cargo "${recomendados.cargo}"`, async () => {
        await cursosRecomendados.acessarPerfil();
        await expect(cursosRecomendados.cargoNoPerfil(recomendados.cargo)).toBeVisible();
      });
      await test.step('Quando acessei a "Página inicial"', () => cursosRecomendados.acessarHome());
      await test.step('Então o bloco "Cursos recomendados para o seu cargo" foi exibido com cursos', async () => {
        await expect(cursosRecomendados.tituloDoBloco).toBeVisible();
        expect((await cursosRecomendados.idsDoBloco()).length).toBeGreaterThan(0);
      });
    },
  );

  test(
    'C056 - "Ver todos" do bloco redireciona à página "Cursos recomendados para o seu cargo"',
    { tag: prioridade('SkillLink', 'C056') },
    async ({ page, cursosRecomendados }) => {
      await test.step('Quando cliquei em "Ver todos" no bloco', async () => {
        await cursosRecomendados.acessarHome();
        await cursosRecomendados.verTodos.click();
      });
      await test.step('Então fui redirecionada à página "Cursos recomendados para o seu cargo"', async () => {
        await expect(page).toHaveURL(new RegExp(caminhosSkillLink.recomendados));
        await expect(cursosRecomendados.tituloDaPagina).toBeVisible();
      });
    },
  );

  test(
    'C058 - Os cursos do bloco também são exibidos na página "Cursos recomendados para o seu cargo"',
    { tag: prioridade('SkillLink', 'C058') },
    async ({ cursosRecomendados }) => {
      const doBloco = await test.step('Dado que li os cursos do bloco', async () => {
        await cursosRecomendados.acessarHome();
        return cursosRecomendados.idsDoBloco();
      });
      await test.step('Quando acessei a página "Cursos recomendados para o seu cargo"', () => cursosRecomendados.acessarPagina());
      await test.step('Então todos os cursos do bloco foram exibidos na página', async () => {
        const daPagina = await cursosRecomendados.idsDaPagina();
        expect(doBloco.filter((id) => !daPagina.includes(id))).toEqual([]);
      });
    },
  );

  test.describe('Página "Cursos recomendados para o seu cargo"', () => {
    test.beforeEach(({ cursosRecomendados }) => cursosRecomendados.acessarPagina());

    test(
      'C059 - Os filtros "Cursos", "Modalidades", "Obrigatoriedade", "Ordenar por" e "Buscar" são exibidos',
      { tag: prioridade('SkillLink', 'C059') },
      async ({ cursosRecomendados }) => {
        await test.step(`Então os filtros ${recomendados.filtros.join(', ')} foram exibidos`, async () => {
          for (const filtro of recomendados.filtros) await expect(cursosRecomendados.filtro(filtro), filtro).toBeVisible();
        });
      },
    );

    test(
      `C060 - "Buscar" ("${recomendados.termoBusca}") localiza os cursos correspondentes`,
      { tag: prioridade('SkillLink', 'C060') },
      async ({ cursosRecomendados }) => {
        const encontrados = await test.step(`Quando informei "${recomendados.termoBusca}" no campo "Buscar"`, () =>
          cursosRecomendados.buscar(recomendados.termoBusca));
        // A busca procura em campos da configuração do curso (nome, competências…), não só no nome: os outros cursos
        // exibidos também estão certos (QA, 19/11). Basta mostrar que localizou
        await test.step(`Então o curso ${recomendados.cursoComTermo}, com "${recomendados.termoBusca}" no nome, foi localizado`, () =>
          expect(encontrados).toContain(recomendados.cursoComTermo));
      },
    );

    test(
      `C061 - O filtro "Modalidades" ("${recomendados.modalidade}") exibe os cursos conforme o filtro`,
      { tag: prioridade('SkillLink', 'C061') },
      async ({ cursosRecomendados }) => {
        const ids = await test.step(`Quando selecionei "${recomendados.modalidade}" em "Modalidades"`, () =>
          cursosRecomendados.filtrarModalidade(recomendados.modalidade));
        await test.step(`Então só cursos "${recomendados.modalidade}" foram exibidos`, async () => {
          expect(ids.length).toBeGreaterThan(0);
          const outros = (await cursosRecomendados.textosDosCards()).filter((t) => /ONLINE/i.test(t) && !/Presencial/i.test(t));
          expect(outros).toEqual([]);
        });
      },
    );

    recomendados.obrigatoriedades.forEach((opcao, i) => {
      const id = `C061.${i + 1}`;
      test(
        `${id} - O filtro "Obrigatoriedade" ("${opcao}") exibe só os cursos "${opcao}"`,
        { tag: prioridade('SkillLink', id) },
        async ({ cursosRecomendados }) => {
          const todos = await test.step('Dado que li os cursos com "Obrigatoriedade" em "Todos"', () => cursosRecomendados.idsDaPagina());
          const ids = await test.step(`Quando selecionei "${opcao}" em "Obrigatoriedade"`, () =>
            cursosRecomendados.filtrarObrigatoriedade(opcao));
          await test.step(`Então só cursos "${opcao}", entre os de "Todos", foram exibidos`, async () => {
            expect(ids.filter((id) => !todos.includes(id))).toEqual([]);
            for (const id of ids) expect(await cursosRecomendados.textoDoCard(id), `curso ${id}`).toContain(opcao);
          });
        },
      );
    });
  });

  test(
    `C063 - O curso "Qa1" (${recomendados.cursoSemCompetencia}), com "Autoinscrição" e sem competência em comum, NÃO é exibido`,
    { tag: prioridade('SkillLink', 'C063') },
    async ({ browser, cursosRecomendados }) => {
      await test.step(`Dado que o curso ${recomendados.cursoSemCompetencia} tem "Autoinscrição" ativa e nenhuma competência do cargo`, () =>
        comSessao(browser, sessoes.administrador, async (pagina) => {
          const admin = new CompetenciasSkillLinkPage(pagina);
          const doCargo = await admin.competenciasDoCargo(recomendados.cargoId);
          expect(emComum(await admin.competenciasDoCurso(recomendados.cursoSemCompetencia), doCargo)).toEqual([]);
          expect(await admin.autoinscricaoAtiva(recomendados.cursoSemCompetencia)).toBe(true);
        }));
      await test.step('Então o curso NÃO foi exibido no bloco nem na página de recomendados', async () => {
        await cursosRecomendados.acessarHome();
        expect(await cursosRecomendados.idsDoBloco()).not.toContain(recomendados.cursoSemCompetencia);
        await cursosRecomendados.acessarPagina();
        expect(await cursosRecomendados.idsDaPagina()).not.toContain(recomendados.cursoSemCompetencia);
      });
    },
  );

  test(
    `C064 - O curso oculto (${recomendados.cursoOculto}), com competência em comum, NÃO é exibido`,
    { tag: prioridade('SkillLink', 'C064') },
    async ({ browser, cursosRecomendados }) => {
      await test.step(`Dado que o curso ${recomendados.cursoOculto} está com a visibilidade "Ocultar"`, () =>
        comSessao(browser, sessoes.administrador, async (pagina) =>
          expect(await new CompetenciasSkillLinkPage(pagina).visibilidadeDoCurso(recomendados.cursoOculto)).toBe('Ocultar'),
        ));
      await test.step('Então o curso NÃO foi exibido no bloco nem na página de recomendados', async () => {
        await cursosRecomendados.acessarHome();
        expect(await cursosRecomendados.idsDoBloco()).not.toContain(recomendados.cursoOculto);
        await cursosRecomendados.acessarPagina();
        expect(await cursosRecomendados.idsDaPagina()).not.toContain(recomendados.cursoOculto);
      });
    },
  );

  test(
    'C068 - As funcionalidades do Skill Link (gerar competências em cargo, curso e atividades) NÃO são disponibilizadas',
    { tag: prioridade('SkillLink', 'C068') },
    async ({ cursosRecomendados }) => {
      for (const tela of recomendados.telasSemPermissao)
        await test.step(`Quando acessei ${tela}, então o acesso foi negado`, async () => {
          await cursosRecomendados.acessarTela(tela);
          await expect(cursosRecomendados.semPermissao).toBeVisible();
        });
    },
  );

  test(
    'C069 - Os cursos em que estou inscrita, exibidos em "Meus cursos", são exibidos no bloco de recomendados',
    { tag: prioridade('SkillLink', 'C069') },
    async ({ meusCursos, cursosRecomendados }) => {
      const inscrita = await test.step('Dado que li os cursos de "Meus cursos"', () => meusCursos.todosOsIds());
      await test.step('Quando acessei a "Página inicial"', () => cursosRecomendados.acessarHome());
      await test.step('Então cursos em que estou inscrita foram exibidos no bloco de recomendados', async () =>
        expect((await cursosRecomendados.idsDoBloco()).filter((id) => inscrita.includes(id)).length).toBeGreaterThan(0));
    },
  );
});

test.describe('CENÁRIO 3: Cursos recomendados para o seu cargo | Usuária sem cargo', { tag: '@dt-skill-link-gestao' }, () => {
  const { semCargo } = usuariosSkillLink;
  // Login na hora, fora do auth.setup: sem as credenciais no .env só este teste fica pendente
  test.use({ storageState: semSessao });
  test.setTimeout(240_000);

  test(
    `C074 - Com a usuária "${semCargo.nome}" sem cargo vinculado, o bloco "Cursos recomendados para o seu cargo" NÃO exibe cursos`,
    { tag: prioridade('SkillLink', 'C074') },
    async ({ page, login, cursosRecomendados }) => {
      test.fixme(!semCargo.identificacao || !semCargo.senha, 'Massa de teste ausente: defina SEM_CARGO_USUARIO e SEM_CARGO_SENHA no .env');
      await test.step(`Quando acessei com a usuária "${semCargo.nome}"`, async () => {
        await login.acessar();
        await login.entrar(semCargo);
        await page.waitForURL(/\/my\//);
      });
      await test.step('Então o bloco "Cursos recomendados para o seu cargo" NÃO exibiu cursos', async () => {
        // Sem cargo o bloco pode nem aparecer; se aparecer, não pode ter cursos
        await page.waitForLoadState('load');
        if (await cursosRecomendados.tituloDoBloco.count()) expect(await cursosRecomendados.idsDoBloco()).toEqual([]);
      });
    },
  );
});

test.describe('CENÁRIO 3: Cursos recomendados para o seu cargo | Competências na Hierarquia', { tag: '@dt-skill-link-gestao' }, () => {
  test.use({ storageState: sessoes.administrador });
  test.setTimeout(300_000);

  for (const { id, onde } of [
    { id: 'C055', onde: 'bloco' },
    { id: 'C057', onde: 'página' },
  ] as const) {
    test(
      `${id} - Todos os cursos recomendados (${onde}) têm competência em comum com o cargo, na "Hierarquia"`,
      { tag: prioridade('SkillLink', id) },
      async ({ browser, competencias }) => {
        const cursos = await test.step(`Dado que li os cursos recomendados (${onde}) com a Eva Souza`, () =>
          comSessao(browser, sessoes.estudante, async (pagina) => {
            const usuaria = new CursosRecomendadosPage(pagina);
            if (onde === 'bloco') {
              await usuaria.acessarHome();
              return usuaria.idsDoBloco();
            }
            await usuaria.acessarPagina();
            return usuaria.idsDaPagina();
          }));
        const doCargo = await test.step(`E as competências do cargo "${recomendados.cargo}" na "Hierarquia"`, () =>
          competencias.competenciasDoCargo(recomendados.cargoId));
        for (const curso of cursos)
          await test.step(`Então o curso ${curso} tem ao menos uma competência do cargo`, async () =>
            expect(emComum(await competencias.competenciasDoCurso(curso), doCargo), `curso ${curso}`).not.toEqual([]));
      },
    );
  }
});
