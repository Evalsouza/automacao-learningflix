// DT/EVT - "Acessar como visitante" — CASOS DE TESTE 001, troca da configuração — rastreabilidade em RASTREABILIDADE.md
// Altera "Botão de entrada como visitante", que vale para a plataforma inteira, e restaura "Mostrar" ao final.
// Desligada por padrão: rode com `npm run test:visitante-config`
import { test, expect } from '../../support/e2e';
import { GerenciarAutenticacaoPage } from '../../support/acessovisitante_commands/GerenciarAutenticacaoPage';
import type { Browser } from '@playwright/test';

const executar = process.env.EXECUTAR_CONFIG_VISITANTE === 'sim';

async function restaurarMostrar(browser: Browser) {
  const contexto = await browser.newContext({ storageState: '.auth/administrador.json' });
  const gerenciar = new GerenciarAutenticacaoPage(await contexto.newPage());
  try {
    await gerenciar.acessar();
    if ((await gerenciar.valorEntradaVisitante().innerText()).trim() !== 'Mostrar') await gerenciar.definirEntradaVisitante('Mostrar');
  } finally {
    await contexto.close();
  }
}

test.describe.serial(
  'CASOS DE TESTE 001: Habilitar a visualização do botão "Acessar como visitante" — troca da configuração',
  { tag: ['@dt-acessar-como-visitante', '@altera-configuracao'] },
  () => {
    test.skip(!executar, 'Altera uma configuração da plataforma inteira: rode com npm run test:visitante-config');
    test.use({ storageState: '.auth/administrador.json' });

    test.afterAll(async ({ browser }) => restaurarMostrar(browser));

    test('V18 - Com "Ocultar", "Acessar como visitante" NÃO é exibido na página de login', async ({ browser, gerenciarAutenticacao }) => {
      await test.step('Quando acessei "Gerenciar autenticação", selecionei "Ocultar" e cliquei em "Salvar mudanças"', async () => {
        await gerenciarAutenticacao.acessarPelaAdministracao();
        await gerenciarAutenticacao.definirEntradaVisitante('Ocultar');
      });
      await test.step('Então a mensagem "Mudanças gravadas" foi exibida', () =>
        expect(gerenciarAutenticacao.mensagemGravadas).toBeVisible());
      await test.step('Quando acessei a página de login sem sessão', async () => {
        const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const pagina = await contexto.newPage();
        await pagina.goto('/login/index.php');
        await test.step('Então a opção "Acessar como visitante" NÃO foi exibida', () =>
          expect(pagina.getByRole('button', { name: 'Acessar como visitante' })).toHaveCount(0));
        await contexto.close();
      });
    });

    test('V19 - Com "Mostrar", "Acessar como visitante" volta a ser exibido na página de login', async ({
      browser,
      gerenciarAutenticacao,
    }) => {
      await test.step('Quando acessei "Gerenciar autenticação", selecionei "Mostrar" e cliquei em "Salvar mudanças"', async () => {
        await gerenciarAutenticacao.acessarPelaAdministracao();
        await gerenciarAutenticacao.definirEntradaVisitante('Mostrar');
      });
      await test.step('Então a mensagem "Mudanças gravadas" foi exibida', () =>
        expect(gerenciarAutenticacao.mensagemGravadas).toBeVisible());
      await test.step('Quando acessei a página de login sem sessão', async () => {
        const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const pagina = await contexto.newPage();
        await pagina.goto('/login/index.php');
        await test.step('Então a opção "Acessar como visitante" foi exibida', () =>
          expect(pagina.getByRole('button', { name: 'Acessar como visitante' })).toBeVisible());
        await contexto.close();
      });
    });
  },
);
