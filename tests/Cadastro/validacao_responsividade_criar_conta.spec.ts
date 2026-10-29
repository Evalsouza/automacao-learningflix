// Responsividade - DTI/EVTI - Página Criar uma conta — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { cargos, pais, obrigatoriosNovaConta } from '../../fixtures/cadastro';
import { Factories } from '../../Factories';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Criar conta - ${tipo}`, { tag: ['@responsivo', '@dt-criar-conta'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Criar conta - ${tipo} ${resolucao}`, async ({ page, criarConta }) => {
      await criarConta.acessarPeloLogin();

      await test.step('Então os campos da "Verificação de idade e localização" e o botão "Continuar" ficaram dentro da tela', async () => {
        for (const elemento of [criarConta.campoIdade, criarConta.campoPaisVerificacao, criarConta.botaoContinuar]) {
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step('Quando preenchi idade e país e cliquei em "Continuar"', () =>
        criarConta.verificarIdadeELocalizacao(Factories.cadastro.idadeAdulta(), pais));
      await test.step('Então os campos "CPF", "Senha" e "Cargo" e o botão "Criar minha conta" da "Nova conta" ficaram dentro da tela', async () => {
        for (const elemento of [
          criarConta.campoIdentificacao,
          criarConta.campoSenha,
          criarConta.entradaCargo,
          criarConta.botaoCriarMinhaConta,
        ]) {
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step(`Quando selecionei o cargo "${cargos.analistaDeQualidade}"`, () =>
        criarConta.selecionarCargo(cargos.analistaDeQualidade));
      await test.step('Então o cargo ficou selecionado', () =>
        expect(criarConta.selectCargo.locator('option:checked')).toHaveText(cargos.analistaDeQualidade));

      await test.step('Quando cliquei em "Criar minha conta" sem preencher os campos obrigatórios', () =>
        criarConta.botaoCriarMinhaConta.click());
      await test.step('Então as mensagens dos campos obrigatórios foram exibidas dentro da tela', async () => {
        for (const { bloco, mensagem } of obrigatoriosNovaConta) {
          const aviso = criarConta.mensagemDoCampo(bloco);
          await aviso.scrollIntoViewIfNeeded();
          await expect(aviso).toHaveText(mensagem);
          await expect(aviso).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
    });
  });
}
