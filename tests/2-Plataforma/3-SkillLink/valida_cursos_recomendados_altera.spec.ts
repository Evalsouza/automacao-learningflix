// DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 3 (altera curso, cargo e atividade) — rastreabilidade em RASTREABILIDADE.md
// Cada teste desfaz o que alterou no `finally`, e o afterAll confere o estado de referência de 18/11: autoinscrição
// do 212 ativa, "Controle de Qualidade" no cargo 163 e fora do curso 284 e do vídeo 3017. O cargo vale para todos os
// usuários dele. Desligada por padrão: rode com `npm run test:skill-link-recomendados` e só com o "ok" da QA
import { test, expect } from '../../../support/e2e';
import { sessoes, comSessao } from '../../../support/sessoes';
import { CursosRecomendadosPage } from '../../../support/skilllink_commands/CursosRecomendadosPage';
import { CompetenciasSkillLinkPage, emComum, mesmaCompetencia } from '../../../support/skilllink_commands/CompetenciasSkillLinkPage';
import { recomendados } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';
import type { Browser } from '@playwright/test';

const executar = process.env.EXECUTAR_RECOMENDADOS_SKILL_LINK === 'sim';
const { competencia, cargoId, cursoSemAutoinscricao, videoC067, cursoAtividades, cursoC070 } = recomendados;
const CURSO_C070 = `/course/edit.php?id=${recomendados.cursoC070}`;

// Cursos recomendados à Eva Souza: no bloco da Página inicial ou na página do "Ver todos"
const recomendadosDaUsuaria = (browser: Browser, onde: 'bloco' | 'página') =>
  comSessao(browser, sessoes.estudante, async (pagina) => {
    const usuaria = new CursosRecomendadosPage(pagina);
    if (onde === 'bloco') {
      await usuaria.acessarHome();
      return usuaria.idsDoBloco();
    }
    await usuaria.acessarPagina();
    return usuaria.idsDaPagina();
  });

test.describe(
  'CENÁRIO 3: Cursos recomendados para o seu cargo | Alterações do Administrador',
  { tag: ['@dt-skill-link-gestao', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Altera curso, cargo e atividade no QA: rode com npm run test:skill-link-recomendados (só com o "ok" da QA)');
    test.use({ storageState: sessoes.administrador });
    test.setTimeout(420_000);

    test.afterAll(async ({ browser }) => {
      test.setTimeout(420_000);
      await comSessao(browser, sessoes.administrador, async (pagina) => {
        const admin = new CompetenciasSkillLinkPage(pagina);
        await admin.definirAutoinscricao(cursoSemAutoinscricao, true);
        expect(await admin.competenciaNoCargo(cargoId, competencia, true), `"${competencia}" fora do cargo ${cargoId}`).toBe(true);
        expect(await admin.competenciaNoFormulario(CURSO_C070, competencia, false), `"${competencia}" ficou no curso ${cursoC070}`).toBe(
          true,
        );
        expect(await admin.competenciaNoFormulario(videoC067, competencia, false), `"${competencia}" ficou no vídeo 3017`).toBe(true);
        // CT122: a competência da atividade não pode ter ficado no curso 313
        const doCurso313 = await admin.competenciasDoCurso(recomendados.cursoSemCompetencia);
        expect(
          doCurso313.some((n) => mesmaCompetencia(n, competencia)),
          `"${competencia}" ficou no curso 313`,
        ).toBe(false);
      });
    });

    test(
      `C062 - O curso "Teste duplicar curso" (${cursoSemAutoinscricao}) sem "Autoinscrição" NÃO é exibido no bloco nem na página`,
      { tag: prioridade('SkillLink', 'C062') },
      async ({ browser, competencias }) => {
        await test.step(`Dado que o curso ${cursoSemAutoinscricao} tem competência em comum com o cargo da usuária logada`, async () => {
          const doCargo = await competencias.competenciasDoCargo(cargoId);
          expect(emComum(await competencias.competenciasDoCurso(cursoSemAutoinscricao), doCargo)).not.toEqual([]);
        });
        try {
          await test.step(`Quando desativei a "Autoinscrição" do curso ${cursoSemAutoinscricao}`, () =>
            competencias.definirAutoinscricao(cursoSemAutoinscricao, false));
          for (const onde of ['bloco', 'página'] as const)
            await test.step(`Então o curso NÃO foi exibido no ${onde} de recomendados`, async () =>
              expect(await recomendadosDaUsuaria(browser, onde)).not.toContain(cursoSemAutoinscricao));
        } finally {
          await competencias.definirAutoinscricao(cursoSemAutoinscricao, true);
        }
      },
    );

    test(
      `C070 - Após remover "${competencia}" do curso ${cursoC070}, ele deixa de ser exibido como recomendado`,
      { tag: prioridade('SkillLink', 'C070') },
      async ({ browser, competencias }) => {
        // O 299 não grava a remoção (18/11): a QA indicou o 284, com a competência posta e depois tirada (19/11)
        const autoinscricaoOriginal = await competencias.autoinscricaoAtiva(cursoC070);
        try {
          await test.step(`Dado que adicionei "${competencia}" ao curso ${cursoC070}, sem outra em comum, e ele foi recomendado`, async () => {
            const doCargo = await competencias.competenciasDoCargo(cargoId);
            expect(emComum(await competencias.competenciasDoCurso(cursoC070), doCargo), 'O curso já tinha competência em comum').toEqual(
              [],
            );
            await competencias.definirAutoinscricao(cursoC070, true);
            expect(await competencias.competenciaNoFormulario(CURSO_C070, competencia, true), 'A competência não foi gravada').toBe(true);
            expect(await recomendadosDaUsuaria(browser, 'página')).toContain(cursoC070);
          });
          await test.step(`Quando removi "${competencia}" do curso ${cursoC070} e salvei`, async () =>
            expect(await competencias.competenciaNoFormulario(CURSO_C070, competencia, false), 'A remoção não foi gravada').toBe(true));
          for (const onde of ['bloco', 'página'] as const)
            await test.step(`Então o curso ${cursoC070} NÃO foi exibido no ${onde} de recomendados`, async () =>
              expect(await recomendadosDaUsuaria(browser, onde)).not.toContain(cursoC070));
        } finally {
          await competencias.competenciaNoFormulario(CURSO_C070, competencia, false);
          await competencias.definirAutoinscricao(cursoC070, autoinscricaoOriginal);
        }
      },
    );

    test(
      `C071 - Após remover "${competencia}" do cargo, os cursos que só tinham ela em comum deixam de ser exibidos no bloco`,
      { tag: prioridade('SkillLink', 'C071') },
      async ({ browser, competencias }) => {
        try {
          await test.step(`Quando removi "${competencia}" do cargo "${recomendados.cargo}" na "Hierarquia"`, async () =>
            expect(await competencias.competenciaNoCargo(cargoId, competencia, false)).toBe(true));
          await test.step(`Então os cursos ${recomendados.cursosSoComACompetencia.join(' e ')} NÃO foram exibidos no bloco`, async () => {
            const noBloco = await recomendadosDaUsuaria(browser, 'bloco');
            for (const curso of recomendados.cursosSoComACompetencia) expect(noBloco).not.toContain(curso);
          });
        } finally {
          await competencias.competenciaNoCargo(cargoId, competencia, true);
        }
      },
    );

    test(
      `C072 - Após adicionar "${competencia}" ao cargo, os cursos com essa competência passam a ser recomendados`,
      { tag: prioridade('SkillLink', 'C072') },
      async ({ browser, competencias }) => {
        try {
          await test.step(`Dado que o cargo estava sem "${competencia}" e o curso 299 não era recomendado`, async () => {
            expect(await competencias.competenciaNoCargo(cargoId, competencia, false)).toBe(true);
            expect(await recomendadosDaUsuaria(browser, 'página')).not.toContain('299');
          });
          await test.step(`Quando adicionei "${competencia}" ao cargo na "Hierarquia"`, async () =>
            expect(await competencias.competenciaNoCargo(cargoId, competencia, true)).toBe(true));
          await test.step(`Então os cursos ${recomendados.cursosSoComACompetencia.join(' e ')} passaram a ser recomendados`, async () => {
            const naPagina = await recomendadosDaUsuaria(browser, 'página');
            for (const curso of recomendados.cursosSoComACompetencia) expect(naPagina).toContain(curso);
          });
        } finally {
          await competencias.competenciaNoCargo(cargoId, competencia, true);
        }
      },
    );

    test(
      `C067 - Um curso cuja atividade de "Vídeo (Streaming)" tem competência em comum com o cargo é recomendado`,
      { tag: prioridade('SkillLink', 'C067') },
      async ({ browser, competencias }) => {
        try {
          await test.step(`Quando adicionei "${competencia}" ao vídeo 3017 do curso 313 (sem competências próprias)`, async () =>
            expect(await competencias.competenciaNoFormulario(videoC067, competencia, true)).toBe(true));
          await test.step('Então o curso 313 foi exibido como recomendado', async () =>
            expect(await recomendadosDaUsuaria(browser, 'página')).toContain(recomendados.cursoSemCompetencia));
        } finally {
          await competencias.competenciaNoFormulario(videoC067, competencia, false);
        }
      },
    );

    test(
      'C073 - Após remover a competência da atividade, sem outra em comum, o curso deixa de ser recomendado',
      { tag: prioridade('SkillLink', 'C073') },
      async ({ browser, competencias }) => {
        try {
          await test.step(`Dado que o vídeo 3017 tinha "${competencia}" e o curso 313 era recomendado`, async () => {
            expect(await competencias.competenciaNoFormulario(videoC067, competencia, true)).toBe(true);
            expect(await recomendadosDaUsuaria(browser, 'página')).toContain(recomendados.cursoSemCompetencia);
          });
          await test.step(`Quando removi "${competencia}" do vídeo 3017`, async () =>
            expect(await competencias.competenciaNoFormulario(videoC067, competencia, false)).toBe(true));
          await test.step('Então o curso 313 deixou de ser recomendado', async () =>
            expect(await recomendadosDaUsuaria(browser, 'página')).not.toContain(recomendados.cursoSemCompetencia));
        } finally {
          await competencias.competenciaNoFormulario(videoC067, competencia, false);
        }
      },
    );

    for (const { id, tipo, nome } of [
      { id: 'C065', tipo: 'scorm', nome: 'SCORM' },
      { id: 'C066', tipo: 'resource', nome: 'Arquivo' },
    ] as const) {
      test(
        `${id} - Um curso cuja atividade "${nome}" tem competência em comum com o cargo é recomendado`,
        { tag: prioridade('SkillLink', id) },
        async ({ browser, competencias }) => {
          const atividade = await competencias.edicaoDaAtividade(cursoAtividades, tipo);
          test.fixme(!atividade, `O curso ${cursoAtividades} não tem atividade "${nome}": a QA precisa indicar outro curso`);
          const autoinscricaoOriginal = await competencias.autoinscricaoAtiva(cursoAtividades);
          try {
            await test.step(`Dado que o curso ${cursoAtividades} não tem competência própria em comum com o cargo e tem "Autoinscrição"`, async () => {
              const doCargo = await competencias.competenciasDoCargo(cargoId);
              expect(emComum(await competencias.competenciasDoCurso(cursoAtividades), doCargo), 'O curso já seria recomendado').toEqual([]);
              await competencias.definirAutoinscricao(cursoAtividades, true);
              expect(await recomendadosDaUsuaria(browser, 'página')).not.toContain(cursoAtividades);
            });
            await test.step(`Quando adicionei "${competencia}" à atividade "${nome}" do curso`, async () =>
              expect(await competencias.competenciaNoFormulario(atividade!, competencia, true)).toBe(true));
            await test.step(`Então o curso ${cursoAtividades} foi exibido como recomendado`, async () =>
              expect(await recomendadosDaUsuaria(browser, 'página')).toContain(cursoAtividades));
          } finally {
            if (atividade) await competencias.competenciaNoFormulario(atividade, competencia, false);
            await competencias.definirAutoinscricao(cursoAtividades, autoinscricaoOriginal);
          }
          // CT122: em 18/11, no curso 325, a competência continuou no curso depois de sair da atividade
          await test.step(`E, ao remover da atividade, "${competencia}" NÃO ficou no curso`, async () =>
            expect((await competencias.competenciasDoCurso(cursoAtividades)).some((n) => mesmaCompetencia(n, competencia))).toBe(false));
        },
      );
    }
  },
);
