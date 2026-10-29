import { Page, Locator } from '@playwright/test';

// Sidebar → Minha página
export class MinhaPaginaPage {
  readonly page: Page;
  readonly titulo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page
      .getByRole('heading', { name: 'Minha Página' })
      .or(page.getByText('Minha Página', { exact: true }))
      .first();
  }

  async acessar() {
    await this.page.goto('/user/profile.php');
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
