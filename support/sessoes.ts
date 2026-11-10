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

// Barra "Pergunte para a Judy" (chat de IA, desde 09/11): fica fixa no rodapé das páginas com login e cobre
// botões como "Cancelar" e "Salvar mudanças" das janelas. Sempre que aparece, clica na seta para recolhê-la —
// decisão da QA (10/11). O Playwright verifica a barra antes de cada ação e de cada expect
export async function recolherJudy(page: Page) {
  const barra = page.locator('#judy-root .floating-chat-center-input');
  await page.addLocatorHandler(barra, () => barra.locator('button').last().click(), { noWaitAfter: true });
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
    if (!videos) await bloquearVideos(contexto);
    const pagina = await contexto.newPage();
    await recolherJudy(pagina);
    return await acao(pagina);
  } finally {
    await contexto.close();
  }
}
