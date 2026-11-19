// Responsividade - DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 1 — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import { resolucoes, temRolagemHorizontal } from '../../../support/responsividade';
import { configuracaoSkillLink } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Configurações de competências - ${tipo}`, { tag: ['@responsivo', '@dt-skill-link-gestao'] }, () => {
    test.use({ ...dispositivo, storageState: sessoes.administrador });

    test(
      `Configurações de competências - ${tipo} ${resolucao}`,
      { tag: prioridade('SkillLink') },
      async ({ page, configuracaoCompetencias }) => {
        await test.step('Quando acessei "Configurações de competências" com o Administrador Revvo', () =>
          configuracaoCompetencias.acessar());
        await test.step('Então os campos e o botão "Salvar mudanças" ficaram visíveis, sem rolagem horizontal', async () => {
          for (const rotulo of configuracaoSkillLink.campos) await expect(configuracaoCompetencias.campo(rotulo)).toBeVisible();
          await expect(configuracaoCompetencias.campoCreditos).toBeVisible();
          await configuracaoCompetencias.salvarMudancas.scrollIntoViewIfNeeded();
          await expect(configuracaoCompetencias.salvarMudancas).toBeInViewport();
          expect(await temRolagemHorizontal(page)).toBe(false);
        });
      },
    );
  });
}
