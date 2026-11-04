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
    return await acao(await contexto.newPage());
  } finally {
    await contexto.close();
  }
}
