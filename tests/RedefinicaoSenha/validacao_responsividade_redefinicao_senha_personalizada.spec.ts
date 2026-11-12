// Responsividade - DTI/EVTI - Redefinição de Senha Personalizada — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { usuariosRedefinicao } from '../../support/usuarios';
import { mensagens } from '../../fixtures/redefinicaosenha';
import { Factories } from '../../Factories';
import { garantirRedefinicaoPersonalizada } from '../../support/redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { prioridade } from '../../fixtures/prioridades';

// Habilita a personalizada antes, se estiver desabilitada, e desabilita no final — decisão da QA (10/11)
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await garantirRedefinicaoPersonalizada(browser, true);
});
test.afterAll(async ({ browser }) => {
  test.setTimeout(120_000);
  await garantirRedefinicaoPersonalizada(browser, false);
});

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Redefinição personalizada - ${tipo}`, { tag: ['@responsivo', '@dt-redefinicao-personalizada'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Redefinição personalizada - ${tipo} ${resolucao}`, { tag: prioridade('RedefinicaoSenha') }, async ({ page, perdeuSenha }) => {
      await perdeuSenha.acessarPeloLogin();

      await test.step('Então os campos de "Perdeu a senha?" e o botão "Enviar" ficaram dentro da tela', async () => {
        for (const elemento of [perdeuSenha.titulo, perdeuSenha.blocoPrimario, perdeuSenha.blocoSecundario, perdeuSenha.botaoEnviar]) {
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step('Quando preenchi dados que não conferem e cliquei em "Enviar"', () =>
        perdeuSenha.redefinir(usuariosRedefinicao.anyaForger.identificacao, Factories.redefinicao.dataDiferente('')));
      await test.step(`Então a mensagem "${mensagens.dadosIncorretos}" ficou dentro da tela`, async () => {
        await perdeuSenha.mensagemErro.scrollIntoViewIfNeeded();
        await expect(perdeuSenha.mensagemErro).toBeInViewport();
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
    });
  });
}
