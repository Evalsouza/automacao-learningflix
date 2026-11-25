// DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 2 (altera saldo e configuração) — rastreabilidade em RASTREABILIDADE.md
// C043 e C044 adicionam 1 crédito cada, de forma permanente: o histórico não se apaga. C045 só altera o saldo se o
// sistema aceitar um valor inválido (em 18/11 o "1.5" foi aceito e somou 2 créditos). C053 desmarca "Habilitado"
// (os créditos continuam acessíveis) e marca de novo. Desligada por padrão: rode com `npm run test:skill-link-creditos` e só com o "ok" da QA
import { test, expect } from '../../../support/e2e';
import { sessoes, comSessao } from '../../../support/sessoes';
import { CreditosSkillLinkPage } from '../../../support/skilllink_commands/CreditosSkillLinkPage';
import { ConfiguracaoCompetenciasPage } from '../../../support/skilllink_commands/ConfiguracaoCompetenciasPage';
import type { ModificarCreditosPage } from '../../../support/skilllink_commands/ModificarCreditosPage';
import { creditosSkillLink } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CREDITOS_SKILL_LINK === 'sim';

// Clica em "Ajustar créditos" e aceita a confirmação, se houver (diálogo do navegador ou janela). Devolve se pediu
async function adicionarConfirmando(modificar: ModificarCreditosPage, valor: string) {
  let confirmou = false;
  modificar.page.once('dialog', (dialogo) => {
    confirmou = true;
    void dialogo.accept();
  });
  await modificar.preencherEAjustar(valor);
  const janela = modificar.page.locator('.modal.show, [role="dialog"]').filter({ visible: true }).first();
  if (
    await janela.waitFor({ timeout: 5_000 }).then(
      () => true,
      () => false,
    )
  ) {
    confirmou = true;
    await janela
      .getByRole('button', { name: /Confirmar|Sim|Adicionar/ })
      .last()
      .click();
  }
  await modificar.aguardarCarregar();
  return confirmou;
}

test.describe(
  'CENÁRIO 2: Gerar e Gerenciar as competências com "Adm Cliente" | Perfil Administrador Revvo',
  { tag: ['@dt-skill-link-gestao', '@altera-saldo'] },
  () => {
    test.skip(!executar, 'Adiciona créditos de forma permanente: rode com npm run test:skill-link-creditos (só com o "ok" da QA)');
    test.use({ storageState: sessoes.administrador });
    test.setTimeout(240_000);

    test(
      `C043 - Um número inteiro positivo em "Quantidade de créditos" atualiza o saldo e registra a movimentação`,
      { tag: prioridade('SkillLink', 'C043') },
      async ({ modificarCreditos }) => {
        await modificarCreditos.acessar();
        const [restantes, total] = [await modificarCreditos.restantes(), await modificarCreditos.total()];
        await test.step(`Quando informei "${creditosSkillLink.quantidadeValida}" e cliquei em "Ajustar créditos"`, () =>
          adicionarConfirmando(modificarCreditos, creditosSkillLink.quantidadeValida));
        await test.step('Então o saldo do cliente foi atualizado e a movimentação foi registrada no histórico', async () => {
          await modificarCreditos.acessar();
          expect(await modificarCreditos.restantes()).toBe(restantes + Number(creditosSkillLink.quantidadeValida));
          expect(await modificarCreditos.total()).toBe(total + 1);
          await expect(modificarCreditos.linhas.first()).toContainText(`+${creditosSkillLink.quantidadeValida}`);
        });
      },
    );

    test(
      'C044 - "Ajustar créditos" solicita a confirmação e efetiva saldo e histórico juntos',
      { tag: prioridade('SkillLink', 'C044') },
      async ({ modificarCreditos }) => {
        await modificarCreditos.acessar();
        const [restantes, total] = [await modificarCreditos.restantes(), await modificarCreditos.total()];
        const confirmou = await test.step('Quando cliquei em "Ajustar créditos"', () =>
          adicionarConfirmando(modificarCreditos, creditosSkillLink.quantidadeValida));
        await test.step('Então o sistema solicitou a confirmação', () =>
          expect(confirmou, 'Nenhuma confirmação antes de adicionar').toBe(true));
        await test.step('E efetivou o saldo e o histórico simultaneamente', async () => {
          await modificarCreditos.acessar();
          expect(await modificarCreditos.restantes()).toBe(restantes + Number(creditosSkillLink.quantidadeValida));
          expect(await modificarCreditos.total()).toBe(total + 1);
        });
      },
    );

    for (const { id, valor, tipo } of creditosSkillLink.quantidadesInvalidas) {
      test(
        `${id} - "Quantidade de créditos" ${tipo} ("${valor}") NÃO é aceito e exibe a mensagem de bloqueio`,
        { tag: prioridade('SkillLink', id) },
        async ({ modificarCreditos }) => {
          // Desde 24/11 a página diz "Adicione ou desconte créditos": o "-10" pode ser aceito e descontar 10 créditos de
          // verdade. Fica pendente até a QA definir a regra nova do desconto (25/11)
          test.fixme(id === 'C045.2', 'A página passou a permitir descontar créditos (24/11): aguarda a regra da QA para valor negativo');
          const antes = await modificarCreditos.estado();
          await test.step(`Quando informei "${valor}" e cliquei em "Ajustar créditos"`, async () => {
            await modificarCreditos.preencherEAjustar(valor);
            await modificarCreditos.aguardarCarregar();
          });
          await test.step('Então a mensagem de bloqueio foi exibida', () => expect(modificarCreditos.erroDoCampo).toBeVisible());
          await test.step('E o saldo e o histórico NÃO foram alterados', async () =>
            expect(await modificarCreditos.estado()).toEqual(antes));
        },
      );
    }
  },
);

test.describe(
  'CENÁRIO 2: Gerar e Gerenciar as competências com "Adm Cliente" | Skill Link desabilitado',
  { tag: ['@dt-skill-link-gestao', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Desmarca "Habilitado" do Skill Link: rode com npm run test:skill-link-creditos (só com o "ok" da QA)');
    test.use({ storageState: sessoes.administrador });
    test.setTimeout(300_000);

    test.afterAll(async ({ browser }) => {
      test.setTimeout(300_000);
      await comSessao(browser, sessoes.administrador, async (pagina) => {
        const config = new ConfiguracaoCompetenciasPage(pagina);
        await config.definir({ opcoes: { enabled: true } });
        expect((await config.lerEstado()).opcoes.enabled, '"Habilitado" não foi marcado de novo').toBe(true);
      });
    });

    test(
      `C053 - Com o Skill Link desabilitado, o Adm Cliente continua acessando "${creditosSkillLink.link}"`,
      { tag: prioridade('SkillLink', 'C053') },
      async ({ browser, configuracaoCompetencias }) => {
        await test.step('Dado que "Habilitado" estava marcado', async () =>
          expect((await configuracaoCompetencias.lerEstado()).opcoes.enabled, 'Confirme com a QA o estado original').toBe(true));
        await test.step('Quando desmarquei "Habilitado" em "Configurações de competências" e salvei', () =>
          configuracaoCompetencias.definir({ opcoes: { enabled: false } }));
        // A configuração dos créditos continua normal com o Skill Link desabilitado (QA, 19/11)
        await test.step(`Então a "Administração" do Adm Cliente continuou exibindo "${creditosSkillLink.link}", que abre a página`, () =>
          comSessao(browser, sessoes.cliente, async (pagina) => {
            const administracao = new CreditosSkillLinkPage(pagina);
            await administracao.acessarAdministracaoCliente();
            await expect(administracao.linkCreditos.first()).toBeVisible();
            await administracao.linkCreditos.first().click();
            await expect(administracao.titulo).toBeVisible();
            await expect(administracao.cards).toBeVisible();
          }));
      },
    );
  },
);
