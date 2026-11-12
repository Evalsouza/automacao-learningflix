// DT/EVT - Plugin Carrossel Infinito no Layout da Página inicial — rastreabilidade em RASTREABILIDADE.md
// Só leitura: confere a configuração e o carrossel atuais, sem alterar os slides
import { test, expect } from '../../support/e2e';
import { sessoes, comSessao } from '../../support/sessoes';
import { ConfiguracaoCarrosselPage } from '../../support/carrossel_commands/ConfiguracaoCarrosselPage';
import { camposDoSlide } from '../../fixtures/carrossel';
import { prioridade } from '../../fixtures/prioridades';

// O módulo Carrossel valida os slides: os vídeos são carregados
test.use({ bloquearVideos: false });

test.describe('CASOS DE TESTE 01: configuração do Carrossel', { tag: '@dt-carrossel' }, () => {
  test.use({ storageState: sessoes.administrador });

  test(
    'CR01 - "Carrossel da Página Inicial" exibe os campos de cada slide e NÃO exibe "Alinhamento"',
    { tag: prioridade('Carrossel', 'CR01') },
    async ({ configuracaoCarrossel: config }) => {
      await test.step('Quando acessei "Administração do site → Aparência → Temas → Tema" e a aba "Carrossel da Página Inicial"', () =>
        config.acessar());
      await test.step('Então "Habilita o Carrossel" estava marcado', () => expect(config.habilitar).toBeChecked());
      for (const campo of camposDoSlide)
        await test.step(`E o campo "${campo} Slides 1" foi exibido`, () => expect(config.rotulo(1, campo)).toBeVisible());
      await test.step('E a opção "Alinhamento" NÃO foi exibida nas configurações dos slides', () =>
        expect(config.painel.getByText(/Alinhamento/)).toHaveCount(0));
    },
  );
});

test.describe('Carrossel na Página inicial', { tag: '@dt-carrossel' }, () => {
  for (const { id, perfil, sessao } of [
    { id: 'CR02', perfil: 'Estudante', sessao: sessoes.estudante },
    { id: 'CR03', perfil: 'Administrador', sessao: sessoes.administrador },
  ]) {
    test.describe(perfil, () => {
      test.use({ storageState: sessao });

      test(
        `${id} - "${perfil}" vê o carrossel do Header até o início do 1º bloco da Página inicial`,
        { tag: prioridade('Carrossel', id) },
        async ({ carrossel }) => {
          await test.step('Quando acessei a "Página inicial"', () => carrossel.acessar());
          await test.step('Então o carrossel foi exibido com ao menos um slide', async () => {
            await carrossel.aguardar();
            await expect(carrossel.carrossel).toBeVisible();
            expect(await carrossel.slides.count()).toBeGreaterThan(0);
          });
          await test.step('E a imagem foi apresentada a partir do Header até o início do 1º bloco', async () => {
            const caixa = await carrossel.carrossel.boundingBox();
            const bloco = await carrossel.primeiroBloco.boundingBox();
            expect(caixa?.y ?? 999).toBeLessThan(150);
            expect((caixa?.y ?? 0) + (caixa?.height ?? 0)).toBeLessThanOrEqual((bloco?.y ?? 0) + 5);
          });
        },
      );
    });
  }

  test.describe('Estudante', () => {
    test.use({ storageState: sessoes.estudante });

    test(
      'CR04 - Os slides do carrossel trocam dentro do intervalo configurado',
      { tag: prioridade('Carrossel', 'CR04') },
      async ({ browser, carrossel }) => {
        const intervalo = await test.step('Dado que consultei o "Intervalo (em segundos)" configurado', () =>
          comSessao(browser, sessoes.administrador, (page) => new ConfiguracaoCarrosselPage(page).intervaloAtual()));
        test.setTimeout((intervalo + 120) * 1000);
        let antes = -1;
        await test.step('Quando acessei a "Página inicial" e visualizei o carrossel', async () => {
          await carrossel.acessar();
          await carrossel.aguardar();
          antes = await carrossel.posicaoDoSlideAtivo();
        });
        await test.step(`Então o carrossel trocou de slide em até ${intervalo} segundos`, () =>
          expect.poll(() => carrossel.posicaoDoSlideAtivo(), { timeout: (intervalo + 10) * 1000, intervals: [1000] }).not.toBe(antes));
      },
    );
  });
});
