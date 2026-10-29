import { Page, Locator } from '@playwright/test';

export type ConfiguracaoCampo = {
  obrigatorio?: 'Sim' | 'Não';
  unica?: 'Sim' | 'Não';
  visibilidade?: string;
};

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Administração → Usuários → Contas → Campos de perfil do usuário
export class CamposPerfilPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly mostrarNaPaginaDeCadastro: Locator;
  readonly obrigatorio: Locator;
  readonly unica: Locator;
  readonly visibilidade: Locator;
  readonly botaoSalvar: Locator;
  readonly botaoCancelar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog');
    this.mostrarNaPaginaDeCadastro = this.modal.getByLabel('Mostrar na página de cadastro?');
    this.obrigatorio = this.modal.locator('select[name=required]');
    this.unica = this.modal.locator('select[name=forceunique]');
    this.visibilidade = this.modal.locator('select[name=visible]');
    this.botaoSalvar = this.modal.getByRole('button', { name: 'Salvar mudanças' });
    this.botaoCancelar = this.modal.getByRole('button', { name: 'Cancelar' });
  }

  async acessar() {
    await this.page.goto('/user/profile/index.php');
  }

  async editarCampo(campo: string) {
    await this.page
      .getByRole('row', { name: new RegExp(`^${escapar(campo)} Editar`) })
      .getByRole('link', { name: 'Editar' })
      .click();
    await this.botaoSalvar.waitFor();
  }

  async lerConfiguracao(campo: string): Promise<Required<ConfiguracaoCampo>> {
    await this.acessar();
    await this.editarCampo(campo);
    const texto = async (lista: Locator) => (await lista.locator('option:checked').innerText()).trim();
    const atual = {
      obrigatorio: (await texto(this.obrigatorio)) as 'Sim' | 'Não',
      unica: (await texto(this.unica)) as 'Sim' | 'Não',
      visibilidade: await texto(this.visibilidade),
    };
    await this.botaoCancelar.click();
    return atual;
  }

  // Altera só o que for informado e salva
  async configurar(campo: string, configuracao: ConfiguracaoCampo) {
    await this.acessar();
    await this.editarCampo(campo);
    if (configuracao.obrigatorio) await this.obrigatorio.selectOption({ label: configuracao.obrigatorio });
    if (configuracao.unica) await this.unica.selectOption({ label: configuracao.unica });
    if (configuracao.visibilidade) await this.visibilidade.selectOption({ label: configuracao.visibilidade });
    await this.botaoSalvar.click();
    await this.modal.waitFor({ state: 'hidden' });
  }
}
