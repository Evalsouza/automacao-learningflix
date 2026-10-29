import { Page, Locator } from '@playwright/test';

// "Acessar como visitante": página de login → Acordo de política do site → Página Inicial do visitante
export class VisitantePage {
  readonly page: Page;
  readonly botaoAcessarComoVisitante: Locator;
  readonly tituloPolitica: Locator;
  readonly botaoSim: Locator;
  readonly botaoNao: Locator;
  readonly menuLateral: Locator;
  readonly botaoAcessarDoMenu: Locator;
  readonly carrossel: Locator;
  readonly proximoSlide: Locator;
  readonly slideAnterior: Locator;
  readonly marcadores: Locator;
  readonly mensagemCursoRestrito: Locator;
  readonly botaoContinuar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.botaoAcessarComoVisitante = page.getByRole('button', { name: 'Acessar como visitante' });
    this.tituloPolitica = page.getByRole('heading', { name: 'Acordo de política do site' });
    this.botaoSim = page.getByRole('button', { name: 'Sim', exact: true });
    this.botaoNao = page.getByRole('button', { name: 'Não', exact: true });
    // O menu lateral é o bloco que contém "Página inicial" e "Calendário"
    this.menuLateral = page
      .locator('div')
      .filter({ has: page.getByRole('link', { name: 'Página inicial', exact: true }) })
      .filter({ has: page.getByRole('link', { name: 'Calendário', exact: true }) })
      .last();
    // O ícone "Acessar" do menu não tem nome acessível: é o link do bloco "login" do menu lateral
    this.botaoAcessarDoMenu = page.locator('.login > a.menu-item[href$="/login/index.php"]:visible').first();
    // Carrossel "Glide" do topo da Página Inicial ("my"). Os marcadores não têm nome acessível: ficam pela classe do Glide
    this.carrossel = page
      .locator('.glide')
      .filter({ has: page.getByRole('button', { name: 'Próximo slide' }) })
      .first();
    this.proximoSlide = this.carrossel.getByRole('button', { name: 'Próximo slide' });
    this.slideAnterior = this.carrossel.getByRole('button', { name: 'Slide anterior' });
    this.marcadores = this.carrossel.locator('.glide__bullet');
    this.mensagemCursoRestrito = page.getByText('Visitantes não podem acessar este curso. Por favor faça login.');
    this.botaoContinuar = page
      .getByRole('button', { name: 'Continuar' })
      .or(page.getByRole('link', { name: 'Continuar' }))
      .first();
  }

  async acessarPoliticaPeloLogin() {
    await this.page.goto('/login/index.php');
    await this.botaoAcessarComoVisitante.click();
    await this.tituloPolitica.waitFor();
  }

  async entrarComoVisitante() {
    await this.acessarPoliticaPeloLogin();
    await this.botaoSim.click();
    await this.page.waitForURL(/\/my\//);
  }

  bloco(titulo: string): Locator {
    return this.page.getByRole('heading', { name: titulo, exact: true });
  }

  linkDoMenu(nome: string): Locator {
    return this.menuLateral.getByRole('link', { name: nome, exact: true });
  }

  // Primeiro curso exibido no bloco: o primeiro link de curso cujo título de bloco mais próximo acima dele é o do bloco.
  // "Ver todos" também é um título, dentro do link do bloco, e é ignorado.
  // Os cursos do bloco mudam com as atualizações da página, então o teste não depende de um curso fixo
  primeiroCursoDoBloco(bloco: string): Locator {
    const titulo = '(self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6) and normalize-space(.)!="Ver todos"';
    return this.bloco(bloco)
      .locator(`xpath=following::a[contains(@href,"course/view.php")][preceding::*[${titulo}][1][normalize-space(.)="${bloco}"]]`)
      .first();
  }

  // A posição do slide ativo muda a cada navegação do carrossel
  async posicaoDoSlideAtivo(): Promise<number> {
    return this.carrossel
      .locator('.glide__slide--active')
      .first()
      .evaluate((slide) => [...(slide.parentElement?.children ?? [])].indexOf(slide));
  }

  marcadorAtivo(): Locator {
    return this.carrossel.locator('.glide__bullet--active');
  }
}
