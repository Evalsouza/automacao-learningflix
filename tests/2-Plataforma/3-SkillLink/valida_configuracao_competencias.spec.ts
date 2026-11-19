// DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 1 (só leitura) — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import { configuracaoSkillLink } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

test.use({ storageState: sessoes.administrador });

test.describe('CENÁRIO 1: Configurações de competências | Perfil Administrador Revvo', { tag: '@dt-skill-link-gestao' }, () => {
  test.beforeEach(({ configuracaoCompetencias }) => configuracaoCompetencias.acessar());

  test(
    'C001 - "Configurações de competências" exibe os campos com descrições e valores padrão',
    { tag: prioridade('SkillLink', 'C001') },
    async ({ configuracaoCompetencias }) => {
      await test.step(`Então a página "${configuracaoSkillLink.titulo}" foi exibida`, () =>
        expect(configuracaoCompetencias.titulo).toBeVisible());
      for (const rotulo of configuracaoSkillLink.campos)
        await test.step(`E o campo "${rotulo}" foi exibido com a descrição e o "Padrão"`, async () => {
          await expect(configuracaoCompetencias.linha(rotulo)).toHaveCount(1);
          await expect(configuracaoCompetencias.linha(rotulo).locator('.form-description, .form-defaultinfo').first()).toBeVisible();
        });
    },
  );

  configuracaoSkillLink.campos.forEach((rotulo, i) => {
    const id = `C00${i + 2}`;
    test(`${id} - O campo "${rotulo}" é exibido preenchido`, { tag: prioridade('SkillLink', id) }, async ({ configuracaoCompetencias }) => {
      // Só confere que há valor: nunca imprime chave, token ou URL
      await test.step(`Então o campo "${rotulo}" foi exibido preenchido`, async () =>
        expect(await configuracaoCompetencias.valorDoCampo(rotulo), `"${rotulo}" vazio`).not.toBe(''));
    });
  });

  test(
    `C019 - O campo "Créditos iniciais" exibe o padrão "${configuracaoSkillLink.creditosPadrao}"`,
    { tag: prioridade('SkillLink', 'C019') },
    async ({ configuracaoCompetencias }) => {
      await test.step(`Então o campo de créditos foi exibido com "Padrão: ${configuracaoSkillLink.creditosPadrao}"`, async () => {
        await expect(configuracaoCompetencias.campoCreditos).toBeVisible();
        await expect(configuracaoCompetencias.linhaCreditos.locator('.form-defaultinfo')).toContainText(
          configuracaoSkillLink.creditosPadrao,
        );
      });
    },
  );
});
