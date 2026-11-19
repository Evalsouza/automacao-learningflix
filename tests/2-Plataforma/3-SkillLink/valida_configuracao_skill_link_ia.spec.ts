// DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 1 (altera a configuração) — rastreabilidade em RASTREABILIDADE.md
// Mexe em "Configurações de competências", que vale para a plataforma inteira: cada teste parte de tudo marcado com
// as URLs e os créditos originais, e o afterAll devolve a configuração lida no início. Formulários de cargo, curso e
// atividade NUNCA são salvos. Desligada por padrão: rode com `npm run test:skill-link-config`
import { test, expect } from '../../../support/e2e';
import { sessoes, comSessao } from '../../../support/sessoes';
import {
  ConfiguracaoCompetenciasPage,
  tudoMarcado,
  type EstadoSkillLink,
} from '../../../support/skilllink_commands/ConfiguracaoCompetenciasPage';
import { configuracaoSkillLink, telasDaIA } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CONFIG_SKILL_LINK === 'sim';
let original: EstadoSkillLink;
// Ponto de partida de cada teste — a QA confirmou em 13/11 que o original é "tudo marcado"
const referencia = () => ({ opcoes: tudoMarcado, prisma: original.prisma, lizza: original.lizza, creditos: original.creditos });
const iaDesmarcada = Object.fromEntries(telasDaIA.map((t) => [t.opcao, false]));
const [telaCargos, telaCursos] = telasDaIA;

test.describe(
  'CENÁRIO 1: Configurações de competências | Perfil Administrador Revvo',
  { tag: ['@dt-skill-link-gestao', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Altera a configuração do Skill Link da plataforma inteira: rode com npm run test:skill-link-config');
    test.use({ storageState: sessoes.administrador });
    test.setTimeout(300_000);

    // Sem `serial`: com 1 worker os testes já rodam em ordem; depois de uma falha o afterAll restaura e o beforeAll relê
    test.beforeAll(async ({ browser }) => {
      test.setTimeout(300_000);
      original = await comSessao(browser, sessoes.administrador, (pagina) => new ConfiguracaoCompetenciasPage(pagina).lerEstado());
      expect(original.prisma && original.lizza, 'URLs Prisma/Lizza vazias: nada a restaurar com segurança').toBeTruthy();
      expect(original.creditos, 'Créditos vazios no início: nada a restaurar com segurança').not.toBe('');
    });

    test.beforeEach(({ configuracaoCompetencias }) => configuracaoCompetencias.definir(referencia()));

    test.afterAll(async ({ browser }) => {
      test.setTimeout(300_000);
      await comSessao(browser, sessoes.administrador, async (pagina) => {
        const config = new ConfiguracaoCompetenciasPage(pagina);
        await config.definir(original);
        expect(await config.lerEstado(), 'Configuração do Skill Link não foi restaurada').toEqual(original);
      });
    });

    test(
      'C006 - Com "Habilitado" desmarcado, o Skill Link NÃO é disponibilizado mesmo com a geração com IA marcada',
      { tag: prioridade('SkillLink', 'C006') },
      async ({ configuracaoCompetencias, gerarCompetencias }) => {
        await test.step('Quando desmarquei "Habilitado", mantendo as opções de IA marcadas, e salvei', () =>
          configuracaoCompetencias.definir({ opcoes: { ...tudoMarcado, enabled: false } }));
        for (const tela of [telaCursos.telas[1], telaCargos.telas[0]])
          await test.step(`Então a ${tela.nome} NÃO exibiu o botão do Skill Link`, async () =>
            expect(await gerarCompetencias.abrirTela(tela)).toHaveCount(0));
      },
    );

    test(
      'C007 - Com as URLs Prisma e Lizza inválidas, "Gerar competências com Skill Link" exibe erro de comunicação',
      { tag: prioridade('SkillLink', 'C007') },
      async ({ configuracaoCompetencias, gerarCompetencias }) => {
        test.setTimeout(480_000);
        await test.step('Quando alterei "URL da API Prisma" e "URL da Lizza" para endereços inexistentes e salvei', () =>
          configuracaoCompetencias.definir({
            prisma: configuracaoSkillLink.urlInvalidaPrisma,
            lizza: configuracaoSkillLink.urlInvalidaLizza,
          }));
        for (const [nome, url] of [
          ['curso 315', configuracaoSkillLink.cursoC007],
          ['atividade 3037', configuracaoSkillLink.atividadeC007],
        ] as const)
          await test.step(`E cliquei em "Gerar competências com Skill Link" no ${nome}, então a mensagem de erro foi exibida`, async () => {
            const botao = await gerarCompetencias.abrirTela({ url });
            await botao.first().click();
            await expect(gerarCompetencias.mensagemDeErro).toBeVisible({ timeout: 120_000 });
          });
      },
    );

    test(
      'C008 - Com "Habilitado" marcado e a geração com IA desmarcada, o Skill Link continua disponível sem o botão de gerar',
      { tag: prioridade('SkillLink', 'C008') },
      async ({ configuracaoCompetencias, gerarCompetencias }) => {
        await test.step('Quando desmarquei as 5 opções de geração com IA, mantendo "Habilitado", e salvei', () =>
          configuracaoCompetencias.definir({ opcoes: { ...tudoMarcado, ...iaDesmarcada } }));
        await test.step('Então a edição do curso 283 exibiu a seção "Skill Link" sem o botão de gerar', async () => {
          const botao = await gerarCompetencias.abrirTela({ url: configuracaoSkillLink.cursoC008 });
          await expect(gerarCompetencias.secaoSkillLink).toBeVisible();
          await expect(botao).toHaveCount(0);
        });
      },
    );

    for (const { opcao, rotulo, desmarcada, marcada, telas } of telasDaIA) {
      test(
        `${desmarcada} - Com "Habilitar geração de competências com IA para ${rotulo}" desmarcada, o botão NÃO é exibido`,
        { tag: prioridade('SkillLink', desmarcada) },
        async ({ configuracaoCompetencias, gerarCompetencias }) => {
          await test.step(`Quando desmarquei a geração com IA para ${rotulo} e salvei`, () =>
            configuracaoCompetencias.definir({ opcoes: { ...tudoMarcado, [opcao]: false } }));
          for (const tela of telas)
            await test.step(`Então a ${tela.nome} NÃO exibiu o botão de gerar competências com IA`, async () =>
              expect(await gerarCompetencias.abrirTela(tela)).toHaveCount(0));
        },
      );

      test(
        `${marcada} - Com "Habilitar geração de competências com IA para ${rotulo}" marcada, o botão é exibido`,
        { tag: prioridade('SkillLink', marcada) },
        async ({ gerarCompetencias }) => {
          // O beforeEach já deixou a opção marcada
          for (const tela of telas)
            await test.step(`Então a ${tela.nome} exibiu o botão de gerar competências com IA`, async () =>
              expect((await gerarCompetencias.abrirTela(tela)).first()).toBeVisible());
        },
      );
    }

    for (const { id, valor, tipo } of configuracaoSkillLink.creditosInvalidos) {
      test(
        `${id} - "Créditos iniciais" ${tipo} ("${valor}") NÃO é salvo`,
        { tag: prioridade('SkillLink', id) },
        async ({ configuracaoCompetencias }) => {
          await test.step(`Quando informei "${valor}" em "Créditos iniciais" e cliquei em "Salvar mudanças"`, () =>
            configuracaoCompetencias.tentarSalvarCreditos(valor));
          await test.step('Então a mensagem de bloqueio foi exibida e o valor NÃO foi gravado', async () => {
            await expect(configuracaoCompetencias.avisoGravado).toBeHidden();
            await expect(configuracaoCompetencias.erroCreditos).toBeVisible();
            expect((await configuracaoCompetencias.lerEstado()).creditos).toBe(original.creditos);
          });
        },
      );
    }

    test(
      'C020.4 - "Créditos iniciais" vazio é salvo como "0", sem bloqueio',
      { tag: prioridade('SkillLink', 'C020.4') },
      async ({ configuracaoCompetencias }) => {
        await test.step('Quando deixei "Créditos iniciais" vazio e cliquei em "Salvar mudanças"', () =>
          configuracaoCompetencias.tentarSalvarCreditos(''));
        await test.step(`Então "${configuracaoSkillLink.gravadas}" foi exibida, sem mensagem de bloqueio`, async () => {
          await expect(configuracaoCompetencias.avisoGravado).toBeVisible();
          await expect(configuracaoCompetencias.erroCreditos).toBeHidden();
        });
        await test.step(`E o campo ficou com "${configuracaoSkillLink.creditosZero}"`, async () =>
          expect((await configuracaoCompetencias.lerEstado()).creditos).toBe(configuracaoSkillLink.creditosZero));
      },
    );

    test(
      `C021 - "Créditos iniciais" com "${configuracaoSkillLink.creditosZero}" é salvo sem mensagem de bloqueio`,
      { tag: prioridade('SkillLink', 'C021') },
      async ({ configuracaoCompetencias }) => {
        await test.step(`Quando informei "${configuracaoSkillLink.creditosZero}" e cliquei em "Salvar mudanças"`, () =>
          configuracaoCompetencias.tentarSalvarCreditos(configuracaoSkillLink.creditosZero));
        await test.step(`Então "${configuracaoSkillLink.gravadas}" foi exibida, sem mensagem de bloqueio`, async () => {
          await expect(configuracaoCompetencias.avisoGravado).toBeVisible();
          await expect(configuracaoCompetencias.erroCreditos).toBeHidden();
        });
      },
    );

    test(
      'C022 - Com todas as opções habilitadas e o valor padrão, as configurações continuam após salvar e recarregar',
      { tag: prioridade('SkillLink', 'C022') },
      async ({ configuracaoCompetencias }) => {
        await test.step('Dado que desmarquei as opções de IA, para haver o que salvar', () =>
          configuracaoCompetencias.definir({ opcoes: { ...tudoMarcado, ...iaDesmarcada } }));
        await test.step(`Quando habilitei todas as opções, voltei os créditos para "${configuracaoSkillLink.creditosPadrao}" e salvei`, () =>
          configuracaoCompetencias.definir({ opcoes: tudoMarcado, creditos: configuracaoSkillLink.creditosPadrao }));
        await test.step('Então, ao recarregar a página, todas as configurações foram exibidas como salvas', async () => {
          const estado = await configuracaoCompetencias.lerEstado();
          expect(estado.opcoes).toEqual(tudoMarcado);
          expect(estado.creditos).toBe(configuracaoSkillLink.creditosPadrao);
        });
      },
    );
  },
);
