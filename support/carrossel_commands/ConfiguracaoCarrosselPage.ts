import { Page, Locator } from '@playwright/test';

type Arquivo = string | { name: string; mimeType: string; buffer: Buffer };

// Administração do site → Aparência → Temas → Tema (smart_4) → aba "Carrossel da Página Inicial" (plugin local_carousel)
export class ConfiguracaoCarrosselPage {
  readonly page: Page;
  readonly aba: Locator;
  readonly painel: Locator;
  readonly habilitar: Locator;
  readonly intervalo: Locator;
  readonly botaoAdicionarSlide: Locator;
  readonly botoesRemoverSlide: Locator;
  readonly botaoSalvar: Locator;
  readonly botaoContinuar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aba = page.getByRole('tab', { name: 'Carrossel da Página Inicial' });
    this.painel = page.locator('#theme_smart_frontpagecarousel');
    this.habilitar = this.painel.locator('input[type=checkbox][name="s_local_carousel_carouselenable"]');
    this.intervalo = this.painel.locator('[name="s_local_carousel_carouselinterval"]');
    this.botaoAdicionarSlide = this.painel.locator('a, button').filter({ hasText: /^\s*Adicionar um novo slide\s*$/ });
    this.botoesRemoverSlide = this.painel.locator('a, button').filter({ hasText: /^\s*Remover o slide \d+\s*$/ });
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
    this.botaoContinuar = page
      .getByRole('button', { name: 'Continuar' })
      .or(page.getByRole('link', { name: 'Continuar' }))
      .first();
  }

  async acessar() {
    await this.page.goto('/admin/settings.php?section=themesettingsmart', { waitUntil: 'domcontentloaded' });
    await this.aba.click();
    await this.painel.waitFor();
  }

  mensagem(texto: string): Locator {
    return this.page.getByText(texto, { exact: false }).first();
  }

  // Campo do slide pelo nome interno: title, titlecolor, text, lang, url, image
  campo(slide: number, chave: string): Locator {
    return this.painel.locator(`[name="s_local_carousel_carouselslide_${slide}_${chave}"]`);
  }

  // Bloco do campo na página — rótulo, nome interno ("local_carousel | carouselslide_N_chave") e o campo
  bloco(slide: number, chave: string): Locator {
    return this.painel
      .locator('.form-item')
      .filter({ hasText: new RegExp(`carouselslide_${slide}_${chave}(\\s|$)`) })
      .first();
  }

  // Rótulo do campo pelo texto exato — os campos de texto usam <label>; o de imagem, <p>
  rotulo(slide: number, campo: string): Locator {
    return this.painel.locator('.form-label').getByText(`${campo} Slides ${slide}`, { exact: true });
  }

  async quantidadeDeSlides(): Promise<number> {
    return this.botoesRemoverSlide.count();
  }

  async adicionarSlide() {
    await this.botaoAdicionarSlide.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Abre "Remover o slide N"; a confirmação aparece na página seguinte, com o botão "Continuar"
  async abrirRemocao(slide: number) {
    await this.painel
      .locator('a, button')
      .filter({ hasText: new RegExp(`^\\s*Remover o slide ${slide}\\s*$`) })
      .click();
  }

  // "Adicionar..." no campo de imagem → "Enviar um arquivo" → "Enviar este arquivo"
  async enviarArquivo(slide: number, arquivo: Arquivo) {
    const bloco = this.bloco(slide, 'image');
    await bloco
      .getByRole('button', { name: 'Adicionar...' })
      .or(bloco.getByRole('link', { name: 'Adicionar...' }))
      .first()
      .click();
    const janela = this.page.locator('.moodle-dialogue-base:visible, .file-picker:visible').last();
    await janela.getByText('Enviar um arquivo', { exact: true }).first().click();
    await janela.locator('input[type=file][name="repo_upload_file"]').setInputFiles(arquivo);
    await janela.getByRole('button', { name: 'Enviar este arquivo' }).click();
    await janela.waitFor({ state: 'hidden' });
  }

  arquivosDoSlide(slide: number): Locator {
    return this.bloco(slide, 'image').locator('.fp-file .fp-filename, .fp-filename-icon .fp-filename');
  }

  // Clicar no arquivo abre a janela com "Excluir"; a confirmação pede "OK"
  async excluirArquivo(slide: number) {
    await this.arquivosDoSlide(slide).first().click();
    const janela = this.page.locator('.moodle-dialogue-base:visible').last();
    await janela.getByRole('button', { name: 'Excluir' }).click();
    await this.page
      .getByRole('button', { name: /^(OK|Sim)$/ })
      .last()
      .click();
  }

  async salvar() {
    await this.botaoSalvar.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
