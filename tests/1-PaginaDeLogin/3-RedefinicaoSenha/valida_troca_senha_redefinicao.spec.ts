// DTI/EVTI - Redefinição de Senha Personalizada — troca de senha de verdade (RP05). Rastreabilidade em RASTREABILIDADE.md
// Troca a senha da "qa.aluno5" para a senha padrão "Senha@123" e envia o e-mail "Senha Alterada!": só na rodada semanal
// (npm run test:redefinicao-troca). Pedido da QA no Confluence (23/11)
import { test, expect } from '../../../support/e2e';
import { semSessao } from '../../../support/sessoes';
import {
  garantirRedefinicaoPersonalizada,
  prepararRedefinicaoPersonalizada,
} from '../../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { usuariosRedefinicao } from '../../../support/usuarios';
import { lerDadosDoUsuario } from '../../../support/redefinicaosenha_commands/dadosDoUsuario';
import { paginas, mensagens } from '../../../fixtures/redefinicaosenha';
import { prioridade } from '../../../fixtures/prioridades';

const executar = process.env.EXECUTAR_TROCA_SENHA === 'sim';
const senhaPadrao = 'Senha@123';
const { meridaValente } = usuariosRedefinicao;

test.describe(
  'CENÁRIO 1: Ativação do Reset de Senha Personalizado — troca de senha',
  { tag: ['@dt-redefinicao-personalizada', '@envia-email'] },
  () => {
    test.skip(!executar, 'Troca a senha e envia e-mail: rode com npm run test:redefinicao-troca');
    test.use({ storageState: semSessao });
    test.setTimeout(180_000);

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(120_000);
      await prepararRedefinicaoPersonalizada(browser);
    });
    test.afterAll(async ({ browser }) => {
      test.setTimeout(120_000);
      await garantirRedefinicaoPersonalizada(browser, false);
    });

    test(
      `RP05 - "${meridaValente.identificacao}" com a data de nascimento do cadastro troca a senha para "${senhaPadrao}"`,
      { tag: prioridade('RedefinicaoSenha', 'RP05') },
      async ({ browser, perdeuSenha }) => {
        const dados = await test.step('Dado que consultei a data de nascimento no cadastro do usuário', () =>
          lerDadosDoUsuario(browser, meridaValente.nome));
        await test.step(`Quando preenchi "${meridaValente.identificacao}" e a data de nascimento correta e cliquei em "Enviar"`, async () => {
          await perdeuSenha.acessar();
          await perdeuSenha.redefinir(meridaValente.identificacao, dados.dtanasc);
        });
        await test.step(`Então fui redirecionada para a página "${paginas.redefinir}"`, () =>
          expect(perdeuSenha.campoNovaSenha).toHaveCount(1));
        await test.step(`Quando preenchi "Nova senha" e "Repetir nova senha" com "${senhaPadrao}" e cliquei em "Salvar mudanças"`, () =>
          perdeuSenha.salvarNovaSenha(senhaPadrao));
        // Visto na execução de 23/11: volta para a página de login com o aviso de e-mail enviado
        await test.step(`Então voltei para a página de login com o aviso "${mensagens.senhaAlterada}"`, async () => {
          await expect(perdeuSenha.aviso(mensagens.senhaAlterada)).toBeVisible();
          await expect(perdeuSenha.botaoAcessarLogin).toBeVisible();
          await expect(perdeuSenha.mensagemErro).toHaveCount(0);
        });
      },
    );
  },
);
