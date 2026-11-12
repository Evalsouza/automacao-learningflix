// Responsividade - DT/EVT - Plugin Carrossel Infinito no Layout da Página inicial — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import { sessoes } from '../../support/sessoes';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { prioridade } from '../../fixtures/prioridades';

// O módulo Carrossel valida os slides: os vídeos são carregados
test.use({ bloquearVideos: false });

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  test.describe(`Carrossel - ${tipo}`, { tag: ['@responsivo', '@dt-carrossel'] }, () => {
    test.use({ ...dispositivo, storageState: sessoes.estudante });

    test(`Carrossel - ${tipo} ${resolucao}`, { tag: prioridade('Carrossel') }, async ({ page, carrossel }) => {
      await test.step('Quando acessei a "Página inicial" com a Estudante', () => carrossel.acessar());
      await test.step('Então o carrossel ficou dentro da tela, com os botões "Slide anterior" e "Próximo slide"', async () => {
        await carrossel.aguardar();
        await expect(carrossel.carrossel).toBeInViewport();
        await expect(carrossel.carrossel.getByRole('button', { name: 'Próximo slide' })).toBeVisible();
        await expect(carrossel.carrossel.getByRole('button', { name: 'Slide anterior' })).toBeVisible();
      });
      await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
    });
  });
}
