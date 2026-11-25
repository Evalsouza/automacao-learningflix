import type { Browser, BrowserContext, Page } from '@playwright/test';

// Sessões salvas pelo login dos perfis (support/auth.setup.ts)
export const sessoes = {
  administrador: '.auth/administrador.json',
  cliente: '.auth/cliente.json',
  estudante: '.auth/estudante.json',
};

// Visitante da página de login, sem nenhuma sessão
export const semSessao = { cookies: [], origins: [] };

export type Sessao = string | typeof semSessao;

// Os vídeos do carrossel da Página inicial deixavam cada teste 40 s mais lento; só o módulo Carrossel os carrega
export async function bloquearVideos(contexto: BrowserContext) {
  await contexto.route(/\.(mp4|m4v|webm|f4v|mov|ogv)(\?|$)/i, (rota) => rota.abort());
}

// Microsoft Clarity e Google Analytics/Tag Manager: os testes não usam, e em 24 e 25/11 chamadas do Clarity que nunca
// terminavam deixavam a página sem concluir o carregamento ("load") até o teste estourar o tempo — decisão da QA (25/11).
// Bloqueados em todos os testes, inclusive no Carrossel
export async function bloquearRastreadores(contexto: BrowserContext) {
  await contexto.route(/^https:\/\/([a-z0-9-]+\.)*(clarity\.ms|google-analytics\.com|googletagmanager\.com)\//i, (rota) => rota.abort());
}

// Barra "Pergunte para a Judy" (chat de IA, desde 09/11): fica fixa no rodapé das páginas com login e cobre
// botões como "Cancelar" e "Salvar mudanças" das janelas. Sempre que aparece, clica na seta para recolhê-la —
// decisão da QA (10/11). O Playwright verifica a barra antes de cada ação e de cada expect.
// A seta ("Minimizar") chega desabilitada e com animação: em 12 e 13/11 o clique esperava por ela até o teste
// estourar o tempo. Agora espera no máximo 5 s; se a barra continuar na tela, ela é escondida só nesta página
export async function recolherJudy(page: Page) {
  const barra = page.locator('#judy-root .floating-chat-center-input');
  const seta = barra.locator('button[title="Minimizar"]').or(barra.locator('button').last()).first();
  await page.addLocatorHandler(
    barra,
    async () => {
      await seta.click({ timeout: 5_000 }).catch(() => {});
      if (await barra.isVisible().catch(() => false))
        await page.evaluate(() => document.getElementById('judy-root')?.style.setProperty('display', 'none')).catch(() => {});
    },
    { noWaitAfter: true },
  );
}

// Abre uma sessão separada — outro perfil ou visitante —, executa a ação e fecha a sessão, mesmo se falhar
export async function comSessao<T>(
  browser: Browser,
  sessao: Sessao,
  acao: (page: Page) => Promise<T>,
  { videos = false } = {},
): Promise<T> {
  const contexto = await browser.newContext({ storageState: sessao });
  try {
    await bloquearRastreadores(contexto);
    if (!videos) await bloquearVideos(contexto);
    const pagina = await contexto.newPage();
    await recolherJudy(pagina);
    return await acao(pagina);
  } finally {
    await contexto.close();
  }
}
