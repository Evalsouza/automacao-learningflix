// Responsividade - DT/EVT - "Acessar como visitante" — CASOS DE TESTE 003 e 004 — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../../support/responsividade';
import { paginas, blocos } from '../../../fixtures/acessovisitante';
import { prioridade } from '../../../fixtures/prioridades';

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Acessar como visitante - ${tipo}`, { tag: ['@responsivo', '@dt-acessar-como-visitante'] }, () => {
    test.use({ ...dispositivo, storageState: { cookies: [], origins: [] } });

    test(`Acessar como visitante - ${tipo} ${resolucao}`, { tag: prioridade('Visitante') }, async ({ page, login, visitante }) => {
      await login.acessar();

      await test.step('Então "Acessar como visitante" ficou dentro da tela da página de login', async () => {
        await visitante.botaoAcessarComoVisitante.scrollIntoViewIfNeeded();
        await expect(visitante.botaoAcessarComoVisitante).toBeInViewport();
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step('Quando cliquei em "Acessar como visitante"', () => visitante.botaoAcessarComoVisitante.click());
      await test.step(`Então o "${paginas.politica}" e os botões "Sim" e "Não" ficaram dentro da tela`, async () => {
        for (const elemento of [visitante.tituloPolitica, visitante.botaoSim, visitante.botaoNao]) {
          await elemento.scrollIntoViewIfNeeded();
          await expect(elemento).toBeInViewport();
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));

      await test.step('Quando cliquei em "Sim"', () => visitante.botaoSim.click());
      await test.step('Então os blocos da Página Inicial ficaram dentro da tela', async () => {
        await expect(page).toHaveTitle(paginas.inicialDoVisitante);
        // Os blocos carregam aos poucos e empurram a página depois da rolagem (17/11): rola e confere de novo até o bloco ficar na tela
        for (const bloco of blocos) {
          await expect(async () => {
            await visitante.bloco(bloco).scrollIntoViewIfNeeded();
            await expect(visitante.bloco(bloco)).toBeInViewport({ timeout: 2_000 });
          }).toPass({ timeout: 30_000 });
        }
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
    });
  });
}
