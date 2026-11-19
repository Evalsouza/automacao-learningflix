// Responsividade - DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 3 — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import { resolucoes, temRolagemHorizontal } from '../../../support/responsividade';
import { prioridade } from '../../../fixtures/prioridades';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Cursos recomendados - ${tipo}`, { tag: ['@responsivo', '@dt-skill-link-gestao'] }, () => {
    test.use({ ...dispositivo, storageState: sessoes.estudante });

    test(`Cursos recomendados - ${tipo} ${resolucao}`, { tag: prioridade('SkillLink') }, async ({ page, cursosRecomendados }) => {
      await test.step('Quando acessei a "Página inicial" com a Eva Souza', () => cursosRecomendados.acessarHome());
      await test.step('Então o bloco "Cursos recomendados para o seu cargo" e o "Ver todos" ficaram dentro da tela', async () => {
        expect((await cursosRecomendados.idsDoBloco()).length).toBeGreaterThan(0);
        await cursosRecomendados.verTodos.scrollIntoViewIfNeeded();
        await expect(cursosRecomendados.verTodos).toBeInViewport();
        expect(await temRolagemHorizontal(page)).toBe(false);
      });
      await test.step('Quando abri o "Ver todos", então a busca e os cursos ficaram visíveis, sem rolagem horizontal', async () => {
        await cursosRecomendados.acessarPagina();
        await expect(cursosRecomendados.busca).toBeVisible();
        expect((await cursosRecomendados.idsDaPagina()).length).toBeGreaterThan(0);
        expect(await temRolagemHorizontal(page)).toBe(false);
      });
    });
  });
}
