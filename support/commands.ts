import { Page, Locator } from '@playwright/test';

// Componente presente em todas as páginas após o login — não é uma tela, por isso não herda PaginaBase
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

  // O menu só responde ao clique depois que os scripts da página carregam
  async abrir() {
    await this.page.waitForLoadState('load');
    await this.botaoMenu.click();
  }

  async sair() {
    await this.abrir();
    await this.linkSair.click();
  }
}
