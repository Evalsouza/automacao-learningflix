import { Page, Locator } from '@playwright/test';

// Carrossel do topo da "Página inicial" (my) — Glide. Mostra só os slides do idioma do usuário
export class CarrosselPage {
  readonly page: Page;
  readonly carrossel: Locator;
  readonly slides: Locator;
  readonly primeiroBloco: Locator;

  constructor(page: Page) {
    this.page = page;
    this.carrossel = page
      .locator('.glide')
      .filter({ has: page.getByRole('button', { name: 'Próximo slide' }) })
      .first();
    // O Glide clona slides para o efeito infinito: só os originais contam
    this.slides = this.carrossel.locator('.glide__slide:not(.glide__slide--clone)');
    this.primeiroBloco = page.getByRole('heading', { name: 'Meus Cursos', exact: true }).first();
  }

  async acessar() {
    await this.page.goto('/my/', { waitUntil: 'domcontentloaded' });
  }

  // O carrossel só aparece depois que o Glide inicia — com vídeos nos slides, o QA pode levar mais de 30 s
  async aguardar() {
    await this.carrossel.waitFor({ timeout: 90_000 });
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
