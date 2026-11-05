import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Administração do site → Plugins → Blocos → Meus Cursos — "Número de cards na página" (block_mycourses | per_page)
export class ConfiguracaoMeusCursosPage extends PaginaBase {
  readonly cardsPorPagina: Locator;
  readonly blocoDoCampo: Locator;
  readonly botaoSalvar: Locator;

  constructor(page: Page) {
    super(page);
    this.cardsPorPagina = page.locator('[name="s_block_mycourses_per_page"]');
    this.blocoDoCampo = page.locator('.form-item').filter({ has: this.cardsPorPagina }).first();
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
  }

  // A configuração é aberta pela busca da administração, que mostra o campo do bloco com "Salvar mudanças"
  async acessar() {
    await this.abrir('/admin/search.php?query=block_mycourses');
    await this.cardsPorPagina.waitFor();
  }

  async valorAtual(): Promise<string> {
    await this.acessar();
    return this.cardsPorPagina.inputValue();
  }

  async definir(valor: number | string) {
    await this.cardsPorPagina.fill(String(valor));
    await this.botaoSalvar.click();
    await this.aguardarCarregar();
  }
}
