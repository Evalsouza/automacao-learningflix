import { Page, Locator } from '@playwright/test';

// Sidebar → Ajuda
export class AjudaPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly campoNome: Locator;
  readonly campoMatricula: Locator;
  readonly selectCurso: Locator;
  readonly selectAssunto: Locator;
  readonly campoMensagem: Locator;
  readonly botaoEnviar: Locator;
  readonly botaoCancelar: Locator;
  readonly mensagemEnviado: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Ajuda', exact: true });
    this.campoNome = page.locator('#fitem_id_firstname input');
    this.campoMatricula = page.locator('#fitem_id_username input');
    this.selectCurso = page.locator('select[name=course]');
    this.selectAssunto = page.locator('select[name=subject]');
    // Mensagem é um editor de texto: digita na área editável, e não no textarea oculto
    this.campoMensagem = page.locator('#fitem_id_messagetext [contenteditable=true]').first();
    this.botaoEnviar = page.locator('input[type=submit][value="Enviar"]');
    this.botaoCancelar = page.locator('input[type=submit][value="Cancelar"]');
    this.mensagemEnviado = page.getByText('Enviado com sucesso');
  }

  async acessar() {
    await this.page.goto('/local/support/index.php');
    await this.titulo.waitFor();
  }

  async digitarMensagem(texto: string) {
    await this.campoMensagem.click();
    await this.campoMensagem.pressSequentially(texto);
  }

  marcaObrigatorio(bloco: string): Locator {
    return this.page.locator(`#${bloco}`).getByTitle('Obrigatório', { exact: true }).first();
  }

  mensagemDoCampo(bloco: string): Locator {
    return this.page.locator(`#${bloco} .form-control-feedback`).first();
  }
}
