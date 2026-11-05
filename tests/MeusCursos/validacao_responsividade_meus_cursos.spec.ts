// Responsividade - DT/EVT - Página inicial: Bloco "Meus Cursos" e Obrigatoriedade do Curso — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { sessoes } from '../../support/sessoes';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { limitesMeusCursos, obrigatoriedades } from '../../fixtures/meuscursos';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Meus Cursos - ${tipo}`, { tag: ['@responsivo', '@dt-meus-cursos', '@dt-obrigatoriedade'] }, () => {
    test.use({ ...dispositivo, storageState: sessoes.estudante });

    test(`Meus Cursos - ${tipo} ${resolucao}`, async ({ page, meusCursos }) => {
      await test.step('Quando acessei a "Página inicial" com a Estudante', () => meusCursos.acessarHome());
      await test.step('Então o bloco "Meus Cursos", o botão "Ver todos" e as opções de obrigatoriedade ficaram dentro da tela', async () => {
        await meusCursos.tituloDoBloco.scrollIntoViewIfNeeded();
        await expect(meusCursos.tituloDoBloco).toBeInViewport();
        await expect(meusCursos.verTodos).toBeInViewport();
        for (const opcao of obrigatoriedades) await expect(meusCursos.botaoObrigatoriedade(opcao)).toBeVisible();
      });
      await test.step(`E foram exibidos no máximo ${limitesMeusCursos.cardsNaHome} cards, sem rolagem horizontal`, async () => {
        await meusCursos.aguardarCards();
        expect(await meusCursos.cardsDoBloco.count()).toBeLessThanOrEqual(limitesMeusCursos.cardsNaHome);
        expect(await temRolagemHorizontal(page)).toBe(false);
      });
      await test.step('Quando abri o "Ver todos", então os filtros e os cards ficaram dentro da tela, sem rolagem horizontal', async () => {
        await meusCursos.acessarVerTodosPadrao();
        await expect(meusCursos.filtroObrigatoriedade).toBeVisible();
        await expect(meusCursos.cardsDaPagina.first()).toBeVisible();
        expect(await temRolagemHorizontal(page)).toBe(false);
      });
    });
  });
}
