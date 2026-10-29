import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './login_commands/LoginPage';
import { usuarios } from './usuarios';

// Faz login uma vez por perfil e salva a sessão em .auth/<perfil>.json
for (const [perfil, usuario] of Object.entries(usuarios)) {
  setup(`login ${perfil}`, async ({ page }) => {
    expect(
      usuario.identificacao && usuario.senha,
      `Preencha ${perfil.toUpperCase()}_USUARIO e ${perfil.toUpperCase()}_SENHA no .env`,
    ).toBeTruthy();

    const login = new LoginPage(page);
    await login.acessar();
    await login.entrar(usuario);
    await expect(page).not.toHaveURL(/\/login\/index\.php/);
    await page.context().storageState({ path: `.auth/${perfil}.json` });
  });
}
