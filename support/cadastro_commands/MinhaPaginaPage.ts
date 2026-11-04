import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Sidebar → Minha página
export class MinhaPaginaPage extends PaginaBase {
  readonly titulo: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page
      .getByRole('heading', { name: 'Minha Página' })
      .or(page.getByText('Minha Página', { exact: true }))
      .first();
  }

  // Sem id, abre o perfil do próprio usuário
  async acessar(idDoUsuario?: string) {
    await this.abrir(idDoUsuario ? `/user/profile.php?id=${idDoUsuario}` : '/user/profile.php');
  }

  async cargoVisivel(idDoUsuario?: string): Promise<boolean> {
    await this.acessar(idDoUsuario);
    return (await this.valorOuVazio('Cargo')) !== '';
  }

  // A área principal é um elemento com papel "main", não a tag <main>
  private rotulo(texto: string): Locator {
    return this.page
      .getByRole('main')
      .getByRole('paragraph')
      .filter({ hasText: new RegExp(`^${texto}$`) })
      .last();
  }

  // Na página, cada campo é um parágrafo com o rótulo seguido de um parágrafo com o valor
  valorDoCampo(rotulo: string): Locator {
    return this.rotulo(rotulo).locator('xpath=following::p[1]');
  }

  // Campo sem valor pode não ser exibido na página; nesse caso devolve vazio
  async valorOuVazio(rotulo: string): Promise<string> {
    await this.rotulo('Dados Pessoais').waitFor();
    if ((await this.rotulo(rotulo).count()) === 0) return '';
    return (await this.valorDoCampo(rotulo).innerText()).trim();
  }
}
