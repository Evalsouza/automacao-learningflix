import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Carrossel do topo da "Página inicial" (my) — Glide. Mostra só os slides do idioma do usuário
export class CarrosselPage extends PaginaBase {
  readonly carrossel: Locator;
  readonly slides: Locator;
  readonly primeiroBloco: Locator;

  constructor(page: Page) {
    super(page);
    this.carrossel = page
      .locator('.glide')
      .filter({ has: page.getByRole('button', { name: 'Próximo slide' }) })
      .first();
    // O Glide clona slides para o efeito infinito: só os originais contam
    this.slides = this.carrossel.locator('.glide__slide:not(.glide__slide--clone)');
    this.primeiroBloco = page.getByRole('heading', { name: 'Meus Cursos', exact: true }).first();
  }

  async acessar() {
    await this.abrir('/my/', 'domcontentloaded');
  }

  // Página inicial no idioma escolhido, como o seletor de idioma do rodapé (?lang=) — vale só para a sessão
  async acessarNoIdioma(idioma: string) {
    await this.abrir(`/my/index.php?lang=${idioma}`, 'domcontentloaded');
  }

  // Slides exibidos, sem depender dos botões: com 1 slide o Glide não mostra "Próximo slide",
  // e os nomes dos botões mudam com o idioma (17/11)
  get slidesExibidos(): Locator {
    return this.page.locator('#frontpage-carousel .glide__slide:not(.glide__slide--clone)');
  }

  // O carrossel só aparece depois que o Glide inicia — com vídeos nos slides, o QA pode levar mais de 30 s
  async aguardar() {
    await this.carrossel.waitFor({ timeout: 90_000 });
  }

  // Abre a Página inicial e lê os slides do carrossel: títulos, links e vídeos
  async lerSlides() {
    await this.acessar();
    await this.aguardar();
    return {
      titulos: (await this.slides.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()),
      links: await this.slides.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href'))),
      videos: await this.slides.locator('video source, video').evaluateAll((vs) => vs.map((v) => (v as HTMLVideoElement).src)),
    };
  }

  slideComTitulo(titulo: string): Locator {
    return this.slides.filter({ hasText: titulo });
  }

  async posicaoDoSlideAtivo(): Promise<number> {
    return this.carrossel
      .locator('.glide__slide--active')
      .first()
      .evaluate((slide) => [...(slide.parentElement?.children ?? [])].indexOf(slide));
  }
}
