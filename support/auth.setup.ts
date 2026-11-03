import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './login_commands/LoginPage';
import { usuarios } from './usuarios';

// Faz login uma vez por perfil e salva a sessão em .auth/<perfil>.json
for (const [perfil, usuario] of Object.entries(usuarios)) {
  setup(`login ${perfil}`, async ({ page }) => {
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
    await page.context().storageState({ path: `.auth/${perfil}.json` });
  });
}
