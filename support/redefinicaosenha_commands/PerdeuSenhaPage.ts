import { Page, Locator, expect } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Login → "Esqueci a senha" → "Perdeu a senha?"
// Redefinição personalizada: campo primário + campo secundário configurados em "Redefinição de senha personalizada".
// Redefinição padrão: busca pela identificação de usuário (CPF) ou pelo e-mail — só aparece com a personalizada desativada.
// Layout de 16/11/2026: o título virou parágrafo, o campo "Nome de usuário" virou "CPF" e as duas buscas ficam em grupos
// ("Buscar por identificação de usuário" e "Buscar pelo endereço de e-mail") do mesmo formulário
export class PerdeuSenhaPage extends PaginaBase {
  readonly titulo: Locator;
  readonly blocoPrimario: Locator;
  readonly blocoSecundario: Locator;
  readonly botaoEnviar: Locator;
  readonly botaoCancelar: Locator;
  readonly mensagemErro: Locator;
  readonly tituloRedefinir: Locator;
  readonly campoNovaSenha: Locator;
  readonly campoRepetirSenha: Locator;
  readonly campoIdentificacaoPadrao: Locator;
  readonly botaoBuscarIdentificacao: Locator;
  readonly campoEmailPadrao: Locator;
  readonly botaoBuscarEmail: Locator;
  readonly botaoContinuar: Locator;
  readonly voltarAoAcesso: Locator;
  readonly botaoAcessarLogin: Locator;

  constructor(page: Page) {
    super(page);
    // Cabeçalho na personalizada; parágrafo na padrão desde 16/11
    this.titulo = page
      .getByRole('heading', { name: 'Perdeu a senha?' })
      .or(page.getByRole('main').getByText('Perdeu a senha?', { exact: true }))
      .first();
    this.blocoPrimario = page.locator('#fitem_id_firstfield');
    this.blocoSecundario = page.locator('#fitem_id_secondfield');
    this.botaoEnviar = page.getByRole('button', { name: 'Enviar' });
    this.botaoCancelar = page.getByRole('button', { name: 'Cancelar' });
    this.mensagemErro = page.getByText('Algo deu errado ao alterar a senha. Por favor, tente novamente!');
    this.tituloRedefinir = page.locator(':text-is("Redefinir senha"):visible').first();
    this.campoNovaSenha = page.locator('input[name=password]');
    this.campoRepetirSenha = page.locator('input[name=password2]');
    const grupoIdentificacao = page.getByRole('group', { name: 'Buscar por identificação de usuário' });
    const grupoEmail = page.getByRole('group', { name: 'Buscar pelo endereço de e-mail' });
    this.campoIdentificacaoPadrao = grupoIdentificacao.getByRole('textbox');
    this.botaoBuscarIdentificacao = grupoIdentificacao.getByRole('button', { name: 'Buscar' });
    this.campoEmailPadrao = grupoEmail.getByRole('textbox');
    this.botaoBuscarEmail = grupoEmail.getByRole('button', { name: 'Buscar' });
    this.botaoContinuar = page
      .getByRole('button', { name: 'Continuar' })
      .or(page.getByRole('link', { name: 'Continuar' }))
      .first();
    this.botaoAcessarLogin = page.getByRole('button', { name: 'Acessar', exact: true });
    this.voltarAoAcesso = page
      .getByRole('button', { name: 'Voltar ao acesso' })
      .or(page.getByRole('link', { name: 'Voltar ao acesso' }))
      .first();
  }

  async acessarPeloLogin() {
    await this.abrir('/login/index.php');
    await this.page.getByRole('link', { name: 'Esqueci a senha' }).click();
  }

  async acessar() {
    await this.abrir('/login/forgot_password.php');
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

  async preencherCampos(primario: string, secundario: string) {
    if (primario) await this.preencher(this.blocoPrimario, primario);
    if (secundario) await this.preencher(this.blocoSecundario, secundario);
  }

  async redefinir(primario: string, secundario: string) {
    await this.preencherCampos(primario, secundario);
    await this.botaoEnviar.click();
  }

  // "Redefinir senha": cada campo fica escondido atrás do "Clique para inserir texto" (passwordunmask) — mapeado em 23/11
  // O clique só abre o campo depois que os scripts da página carregam: repete até o campo aparecer (23/11)
  async salvarNovaSenha(senha: string) {
    await this.aguardarCarregar();
    for (const campo of [this.campoNovaSenha, this.campoRepetirSenha]) {
      const id = await campo.getAttribute('id');
      const editar = this.page.locator(`[data-passwordunmaskid="${id}"] [data-passwordunmask="edit"]`);
      await expect(async () => {
        if (await editar.isVisible()) await editar.click();
        await expect(campo).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 20_000 });
      await campo.fill(senha);
      await campo.press('Tab');
    }
    await this.page.getByRole('button', { name: 'Salvar mudanças' }).click();
  }

  aviso(texto: string): Locator {
    // Sem `exact`: o aviso vem junto com o "×" de fechar
    return this.page.getByText(texto).first();
  }

  marcaObrigatorio(bloco: Locator): Locator {
    return bloco.getByTitle('Obrigatório', { exact: true }).first();
  }

  mensagemDoCampo(bloco: Locator): Locator {
    return bloco.locator('.form-control-feedback').first();
  }
}
