import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Administração → Usuários → Privacidade e políticas → Configurações de privacidade
export class ConfiguracaoPrivacidadePage extends PaginaBase {
  // "Verificação da idade de consentimento digital": exibe a "Verificação de idade e localização" no "Criar uma conta"
  readonly verificacaoDeIdade: Locator;
  readonly botaoSalvar: Locator;
  readonly mensagemGravadas: Locator;

  constructor(page: Page) {
    super(page);
    this.verificacaoDeIdade = page.locator('[name="s__agedigitalconsentverification"]:not([type=hidden])');
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
    this.mensagemGravadas = page.getByText('Mudanças gravadas');
  }

  async acessar() {
    await this.abrir('/admin/settings.php?section=privacysettings');
  }

  // Lista Sim/Não ou caixa de seleção, conforme o tema: devolve true quando está ativa
  async lerVerificacaoDeIdade(): Promise<boolean> {
    await this.acessar();
    return this.verificacaoDeIdade.evaluate((campo) =>
      campo instanceof HTMLSelectElement ? campo.value === '1' : (campo as HTMLInputElement).checked,
    );
  }

  async definirVerificacaoDeIdade(ativa: boolean) {
    await this.acessar();
    const lista = await this.verificacaoDeIdade.evaluate((campo) => campo instanceof HTMLSelectElement);
    if (lista) await this.verificacaoDeIdade.selectOption(ativa ? '1' : '0');
    else await this.verificacaoDeIdade.setChecked(ativa);
    await this.botaoSalvar.click();
    await this.mensagemGravadas.waitFor();
  }
}
