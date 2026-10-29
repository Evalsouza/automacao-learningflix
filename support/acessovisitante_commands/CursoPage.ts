import { Page, Locator } from '@playwright/test';

// Página do curso e "Métodos de inscrição" do curso
export class CursoPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async acessar(id: number) {
    await this.page.goto(`/course/view.php?id=${id}`);
  }

  async acessarMetodosDeInscricao(id: number) {
    await this.page.goto(`/enrol/instances.php?id=${id}`);
    await this.page.getByRole('heading', { name: 'Métodos de inscrição' }).first().waitFor();
  }

  titulo(nome: string): Locator {
    return this.page.getByRole('heading', { name: nome, exact: true }).first();
  }

  temporada(nome: string): Locator {
    return this.page
      .locator('li.section, [data-for=section]')
      .filter({ has: this.page.getByText(nome, { exact: true }) })
      .first();
  }

  // Método habilitado mostra a ação "Desabilitar"; desabilitado mostra "Habilitar"
  acaoDoMetodo(metodo: string, acao: 'Desabilitar' | 'Habilitar'): Locator {
    return this.page.getByRole('row').filter({ hasText: metodo }).first().getByTitle(acao, { exact: true }).first();
  }
}
