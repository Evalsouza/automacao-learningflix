import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Administração → Aparência → Tema smart → aba da assistente de IA (Judy): campo "Tema da assistente"
export class ConfiguracaoAssistentePage extends PaginaBase {
  readonly aba: Locator;
  readonly temaDaAssistente: Locator;
  readonly botaoSalvar: Locator;

  constructor(page: Page) {
    super(page);
    this.aba = page.locator('a[href="#theme_smart_ai"]').first();
    this.temaDaAssistente = page.getByLabel('Tema da assistente', { exact: true });
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
  }

  async acessar() {
    await this.abrir('/admin/settings.php?section=themesettingsmart#theme_smart_ai');
    if (await this.aba.isVisible()) await this.aba.click();
    await this.temaDaAssistente.waitFor();
  }

  // Texto da opção selecionada, ex.: "Chat centralizado" ou "Botão Flutuante"
  async temaAtual(): Promise<string> {
    await this.acessar();
    return (await this.temaDaAssistente.locator('option:checked').innerText()).trim();
  }

  async definirTema(opcao: string) {
    await this.acessar();
    await this.temaDaAssistente.selectOption({ label: opcao });
    await this.botaoSalvar.click();
    await this.aguardarCarregar();
  }
}
