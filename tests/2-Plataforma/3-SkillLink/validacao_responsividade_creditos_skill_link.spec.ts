// Responsividade - DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 2 — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import { resolucoes, temRolagemHorizontal } from '../../../support/responsividade';
import { creditosSkillLink } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Créditos do Skill Link - ${tipo}`, { tag: ['@responsivo', '@dt-skill-link-gestao'] }, () => {
    test.use({ ...dispositivo, storageState: sessoes.cliente });

    test(
      `Créditos do Skill Link - ${tipo} ${resolucao}`,
      { tag: prioridade('SkillLink') },
      async ({ page, creditosSkillLink: creditos }) => {
        await test.step('Quando acessei a página "Skill Link" com o Adm Cliente', () => creditos.acessarComoCliente());
        await test.step('Então os cards de créditos ficaram visíveis, sem rolagem horizontal', async () => {
          for (const nome of creditosSkillLink.cards) await expect(creditos.card(nome)).toBeVisible();
          expect(await temRolagemHorizontal(page)).toBe(false);
        });
        await test.step('E o "Histórico de consumo" e o "Exportar" ficaram dentro da tela', async () => {
          await creditos.exportar.scrollIntoViewIfNeeded();
          await expect(creditos.exportar).toBeInViewport();
          await expect(creditos.linhas.first()).toBeVisible();
        });
      },
    );
  });
}
