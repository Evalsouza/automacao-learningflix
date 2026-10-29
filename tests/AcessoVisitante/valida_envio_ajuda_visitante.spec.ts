// DT/EVT - "Acessar como visitante" — envio da Ajuda — rastreabilidade em RASTREABILIDADE.md
// Envia um e-mail de verdade para o suporte. Desligada por padrão: rode com `npm run test:ajuda-envio`
import { test, expect } from '../../support/e2e';
import { assuntoAjuda } from '../../fixtures/acessovisitante';

const executar = process.env.EXECUTAR_ENVIO_AJUDA === 'sim';

test.describe(
  'CASOS DE TESTE 002: Acessando a plataforma como visitante — envio da Ajuda',
  { tag: ['@dt-acessar-como-visitante', '@envia-email'] },
  () => {
    test.skip(!executar, 'Envia e-mail para o suporte: rode com npm run test:ajuda-envio');
    test.use({ storageState: { cookies: [], origins: [] } });

    test('V20 - Envio da "Ajuda" pelo visitante exibe "Enviado com sucesso"', async ({ visitante, ajuda }) => {
      await visitante.entrarComoVisitante();
      await test.step('Quando preenchi os campos da "Ajuda" — "Nome" e "Matrícula" já vêm preenchidos para o visitante', async () => {
        await ajuda.acessar();
        await ajuda.selectCurso.selectOption({ index: 1 });
        await ajuda.selectAssunto.selectOption({ label: assuntoAjuda });
        await ajuda.digitarMensagem('Teste automatizado do envio da Ajuda pelo visitante');
      });
      await test.step('E cliquei em "Enviar"', () => ajuda.botaoEnviar.click());
      await test.step('Então a mensagem "Enviado com sucesso" foi exibida', () => expect(ajuda.mensagemEnviado).toBeVisible());
    });

    test('V21 - Mensagem do visitante é recebida no e-mail de suporte', async () => {
      test.fixme(true, 'Depende da caixa de entrada do e-mail de suporte, fora do ambiente de QA');
    });
  },
);
