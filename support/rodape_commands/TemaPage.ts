import { Page, Locator } from '@playwright/test';

// Administração do site → Aparência → Temas → Tema (smart_4) → aba "Configurações gerais"
export class TemaPage {
  readonly page: Page;
  readonly abaConfiguracoesGerais: Locator;
  readonly botaoSalvar: Locator;
  readonly mensagemGravada: Locator;

  constructor(page: Page) {
    this.page = page;
    this.abaConfiguracoesGerais = page.getByRole('tab', { name: 'Configurações gerais' });
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
    this.mensagemGravada = page.getByText('Mudanças gravadas').first();
  }

  async acessar() {
    await this.page.goto('/admin/settings.php?section=themesettingsmart');
    await this.abaConfiguracoesGerais.click();
  }

  // Cada opção é uma caixa de seleção identificada pelo nome interno da configuração
  opcao(chave: string): Locator {
    return this.page.locator(`input[type=checkbox][name="s_theme_smart_${chave}"]`);
  }

  // Bloco da opção na página: rótulo, nome interno e "Padrão: ..."
  blocoDaOpcao(chave: string): Locator {
    return this.page
      .locator('.form-item, .form-setting')
      .filter({ has: this.opcao(chave) })
      .first();
  }

  async definir(chave: string, habilitar: boolean) {
    await this.acessar();
    await this.opcao(chave).setChecked(habilitar);
    await this.botaoSalvar.click();
    await this.mensagemGravada.waitFor();
  }
}
