import { Page, Locator } from '@playwright/test';

export class MenuUsuario {
  readonly page: Page;
  readonly botaoMenu: Locator;
  readonly linkSair: Locator;
  readonly nomeUsuario: Locator;

  constructor(page: Page) {
    this.page = page;
    // O tema renderiza o menu do usuário duas vezes, com o mesmo id; usa o que está visível
    this.botaoMenu = page.locator('#user-menu-toggle:visible').first();
    const menuAberto = page.locator('#user-action-menu:visible');
    this.linkSair = menuAberto.getByRole('menuitem', { name: 'Sair' }).first();
    this.nomeUsuario = menuAberto.getByRole('menuitem').first();
  }

  async abrir() {
    await this.botaoMenu.click();
  }

  async sair() {
    await this.abrir();
    await this.linkSair.click();
  }
}
