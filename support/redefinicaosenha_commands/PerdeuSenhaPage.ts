import { Page, Locator } from '@playwright/test';

// Login → "Esqueci a senha" → "Perdeu a senha?"
// Redefinição personalizada: campo primário + campo secundário configurados em "Redefinição de senha personalizada".
// Redefinição padrão: busca pelo nome de usuário ou pelo e-mail — só aparece com a personalizada desativada
export class PerdeuSenhaPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly blocoPrimario: Locator;
  readonly blocoSecundario: Locator;
  readonly botaoEnviar: Locator;
  readonly botaoCancelar: Locator;
  readonly mensagemErro: Locator;
  readonly tituloRedefinir: Locator;
  readonly campoNovaSenha: Locator;
  readonly campoRepetirSenha: Locator;
  readonly campoNomeDeUsuarioPadrao: Locator;
  readonly campoEmailPadrao: Locator;
  readonly botaoContinuar: Locator;
  readonly voltarAoAcesso: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Perdeu a senha?' });
    this.blocoPrimario = page.locator('#fitem_id_firstfield');
    this.blocoSecundario = page.locator('#fitem_id_secondfield');
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
    this.botaoCancelar = page.getByRole('button', { name: 'Cancelar' });
    this.mensagemErro = page.getByText('Algo deu errado ao alterar a senha. Por favor, tente novamente!');
    this.tituloRedefinir = page.locator(':text-is("Redefinir senha"):visible').first();
    this.campoNovaSenha = page.locator('input[name=password]');
    this.campoRepetirSenha = page.locator('input[name=password2]');
    this.campoNomeDeUsuarioPadrao = page.getByRole('textbox', { name: /nome de usuário/i });
    this.campoEmailPadrao = page.getByRole('textbox', { name: /e-?mail/i });
    this.botaoContinuar = page
      .getByRole('button', { name: 'Continuar' })
      .or(page.getByRole('link', { name: 'Continuar' }))
      .first();
    this.voltarAoAcesso = page
      .getByRole('button', { name: 'Voltar ao acesso' })
      .or(page.getByRole('link', { name: 'Voltar ao acesso' }))
      .first();
  }

  async acessarPeloLogin() {
    await this.page.goto('/login/index.php');
    await this.page.getByRole('link', { name: 'Esqueci a senha' }).click();
  }

  async acessar() {
    await this.page.goto('/login/forgot_password.php');
  }

  rotuloDoCampo(bloco: Locator): Locator {
    return bloco.locator('label').first();
  }

  // O campo pode ser texto, data (d/m/Y) ou lista, conforme o campo de perfil configurado
  private async preencher(bloco: Locator, valor: string) {
    const lista = bloco.locator('select:visible');
    if (await lista.count()) {
      await lista.first().selectOption({ label: valor });
      return;
    }
    const autocomplete = bloco.locator('input[role=combobox]');
    if (await autocomplete.count()) {
      await autocomplete.first().fill(valor);
      await this.page.getByRole('option', { name: valor, exact: true }).click();
      return;
    }
    await bloco.locator('input:visible').first().fill(valor);
  }

  async redefinir(primario: string, secundario: string) {
    if (primario) await this.preencher(this.blocoPrimario, primario);
    if (secundario) await this.preencher(this.blocoSecundario, secundario);
    await this.botaoEnviar.click();
  }

  marcaObrigatorio(bloco: Locator): Locator {
    return bloco.getByTitle('Obrigatório', { exact: true }).first();
  }

  mensagemDoCampo(bloco: Locator): Locator {
    return bloco.locator('.form-control-feedback').first();
  }
}
