import { Page, Locator } from '@playwright/test';

// Administração do site → Plugins → Autenticação → Gerenciar autenticação
export class GerenciarAutenticacaoPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly botaoEntradaVisitante: Locator;
  readonly botaoSalvar: Locator;
  readonly mensagemGravadas: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Gerenciar autenticação' });
    this.botaoEntradaVisitante = page.locator('select[name="s__guestloginbutton"]');
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
    this.mensagemGravadas = page.getByText('Mudanças gravadas');
  }

  async acessarPelaAdministracao() {
    await this.page.goto('/my/');
    await this.page.getByRole('link', { name: 'Administração do site', exact: true }).first().click();
    await this.page.getByRole('tab', { name: 'Plugins' }).click();
    await this.page.getByRole('link', { name: 'Gerenciar autenticação', exact: true }).first().click();
    await this.titulo.waitFor();
  }

  async acessar() {
    await this.page.goto('/admin/settings.php?section=manageauths');
    await this.titulo.waitFor();
  }

  valorEntradaVisitante(): Locator {
    return this.botaoEntradaVisitante.locator('option:checked');
  }

  async definirEntradaVisitante(opcao: 'Mostrar' | 'Ocultar') {
    await this.botaoEntradaVisitante.selectOption({ label: opcao });
    await this.botaoSalvar.click();
  }
}
