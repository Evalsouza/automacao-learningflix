import { Page, Locator } from '@playwright/test';

// Administração → "Configurações - Redefinição de senha personalizada"
export class ConfiguracaoRedefinicaoPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly ativar: Locator;
  readonly campoPrimario: Locator;
  readonly campoSecundario: Locator;
  readonly botaoSalvar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Configurações - Redefinição de senha personalizada' });
    this.ativar = page.locator('input[type=checkbox][name=enabled]');
    this.campoPrimario = page.locator('select[name=firstfield]');
    this.campoSecundario = page.locator('select[name=secondfield]');
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
  }

  async acessar() {
    await this.page.goto('/admin/tool/custom_forgotpassword/index.php');
    await this.titulo.waitFor();
  }

  async opcoes(lista: Locator): Promise<string[]> {
    return (await lista.locator('option').allInnerTexts()).map((o) => o.trim());
  }

  selecionado(lista: Locator): Locator {
    return lista.locator('option:checked');
  }

  async definir(lista: Locator, opcao: string) {
    await lista.selectOption({ label: opcao });
    await this.botaoSalvar.click();
    await this.titulo.waitFor();
  }
}
