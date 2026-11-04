import { test as setup, expect } from '@playwright/test';
import { existsSync, statSync } from 'fs';
import { LoginPage } from './login_commands/LoginPage';
import { usuarios } from './usuarios';
import { sessoes } from './sessoes';

// Sessão salva há menos de 2 h é reaproveitada: o login dos 3 perfis leva ~1,7 min.
// `npm run login:perfis` (LOGIN_NOVO=sim) sempre faz o login de novo
const validadeDaSessao = 2 * 60 * 60 * 1000;
const sessaoRecente = (arquivo: string) =>
  process.env.LOGIN_NOVO !== 'sim' && existsSync(arquivo) && Date.now() - statSync(arquivo).mtimeMs < validadeDaSessao;

// Faz login uma vez por perfil e salva a sessão em .auth/<perfil>.json
for (const [perfil, usuario] of Object.entries(usuarios)) {
  const arquivo = sessoes[perfil as keyof typeof sessoes];
  setup(`login ${perfil}`, async ({ page }) => {
    setup.skip(sessaoRecente(arquivo), 'Sessão salva há menos de 2 h: reaproveitada');
    // A Página inicial tem vídeos no carrossel: esperar o carregamento completo passava dos 90 s
    setup.setTimeout(240_000);
    expect(
      usuario.identificacao && usuario.senha,
      `Preencha ${perfil.toUpperCase()}_USUARIO e ${perfil.toUpperCase()}_SENHA no .env`,
    ).toBeTruthy();

    const login = new LoginPage(page);
    await login.acessar();
    await login.entrar(usuario);
    // Basta sair da página de login: a sessão já existe, sem esperar a Página inicial carregar inteira
    await page.waitForURL((url) => !/\/login\/index\.php/.test(url.href), { waitUntil: 'commit', timeout: 180_000 });
    await page.context().storageState({ path: arquivo });
  });
}
