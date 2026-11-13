// DT/EVT - "Acessar como visitante" — CASOS DE TESTE 001, troca da configuração — rastreabilidade em RASTREABILIDADE.md
// Altera "Botão de entrada como visitante", que vale para a plataforma inteira, e restaura "Mostrar" ao final.
// Desligada por padrão: rode com `npm run test:visitante-config`
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao, comSessao } from '../../../support/sessoes';
import { GerenciarAutenticacaoPage } from '../../../support/acessovisitante_commands/GerenciarAutenticacaoPage';
import { VisitantePage } from '../../../support/acessovisitante_commands/VisitantePage';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_CONFIG_VISITANTE === 'sim';

test.describe.serial(
  'CASOS DE TESTE 001: Habilitar a visualização do botão "Acessar como visitante" — troca da configuração',
  { tag: ['@dt-acessar-como-visitante', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Altera uma configuração da plataforma inteira: rode com npm run test:visitante-config');
    test.use({ storageState: sessoes.administrador });

    test.afterAll(async ({ browser }) =>
      comSessao(browser, sessoes.administrador, (pagina) => new GerenciarAutenticacaoPage(pagina).restaurarMostrar()),
    );

    test(
      'V18 - Com "Ocultar", "Acessar como visitante" NÃO é exibido na página de login',
      { tag: prioridade('Visitante', 'V18') },
      async ({ browser, gerenciarAutenticacao }) => {
        await test.step('Quando acessei "Gerenciar autenticação", selecionei "Ocultar" e cliquei em "Salvar mudanças"', async () => {
          await gerenciarAutenticacao.acessarPelaAdministracao();
          await gerenciarAutenticacao.definirEntradaVisitante('Ocultar');
        });
        await test.step('Então a mensagem "Mudanças gravadas" foi exibida', () =>
          expect(gerenciarAutenticacao.mensagemGravadas).toBeVisible());
        await test.step('Quando acessei a página de login sem sessão', () =>
          comSessao(browser, semSessao, async (pagina) => {
            const visitante = new VisitantePage(pagina);
            await visitante.acessarLogin();
            await test.step('Então a opção "Acessar como visitante" NÃO foi exibida', () =>
              expect(visitante.botaoAcessarComoVisitante).toHaveCount(0));
          }));
      },
    );

    test(
      'V19 - Com "Mostrar", "Acessar como visitante" volta a ser exibido na página de login',
      { tag: prioridade('Visitante', 'V19') },
      async ({ browser, gerenciarAutenticacao }) => {
        await test.step('Quando acessei "Gerenciar autenticação", selecionei "Mostrar" e cliquei em "Salvar mudanças"', async () => {
          await gerenciarAutenticacao.acessarPelaAdministracao();
          await gerenciarAutenticacao.definirEntradaVisitante('Mostrar');
        });
        await test.step('Então a mensagem "Mudanças gravadas" foi exibida', () =>
          expect(gerenciarAutenticacao.mensagemGravadas).toBeVisible());
        await test.step('Quando acessei a página de login sem sessão', () =>
          comSessao(browser, semSessao, async (pagina) => {
            const visitante = new VisitantePage(pagina);
            await visitante.acessarLogin();
            await test.step('Então a opção "Acessar como visitante" foi exibida', () =>
              expect(visitante.botaoAcessarComoVisitante).toBeVisible());
          }));
      },
    );
  },
);
