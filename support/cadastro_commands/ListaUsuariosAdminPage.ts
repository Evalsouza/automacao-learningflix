import { Page, Locator } from '@playwright/test';

// Administração do site → Usuários → Lista de usuários. Usada só pela suíte de cadastro real
export class ListaUsuariosAdminPage {
  readonly page: Page;
  readonly filtroNome: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filtroNome = page.getByRole('textbox', { name: 'realname' }).or(page.locator('input[name=realname]')).first();
  }

  async acessar() {
    await this.page.goto('/admin/user.php');
  }

  async filtrarPorNome(nomeCompleto: string) {
    await this.filtroNome.fill(nomeCompleto);
    await this.page.getByRole('button', { name: 'Adicionar filtro' }).click();
  }

  // Linha pelo texto exibido nela — nome ou e-mail
  linha(texto: string): Locator {
    return this.page.getByRole('row').filter({ hasText: texto });
  }

  // Os ícones da linha não têm texto: o link é identificado pela ação na URL
  async confirmarConta(texto: string) {
    await this.linha(texto).locator('a[href*="confirmuser="]').click();
  }

  async excluir(texto: string) {
    await this.linha(texto).locator('a[href*="delete="]').click();
    await this.page.getByRole('button', { name: 'Excluir' }).click();
  }
}
