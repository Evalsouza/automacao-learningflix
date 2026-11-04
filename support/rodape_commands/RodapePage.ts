import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Rodapé das páginas: barra inferior com o idioma e o "© <ano> Desenvolvido por" + logo REVVO, e os links
// "Ajuda", "Privacidade" e "Termos", exibidos conforme as opções de footer do Tema.
// Depois do login a página tem o rodapé completo (logo, endereço, Mapa do Site) — layout atual, confirmado pela QA
export class RodapePage extends PaginaBase {
  readonly idioma: Locator;
  readonly direitos: Locator;

  constructor(page: Page) {
    super(page);
    // Seletor de idioma: link "dropdown" com title "Idioma" — o texto "Português - Brasil" vem com caracteres invisíveis
    this.idioma = page.locator('a.dropdown-toggle[title="Idioma"]:visible').last();
    // Em telas estreitas o tema esconde o rodapé: o texto existe na página, mas fica oculto
    this.direitos = page.getByText(new RegExp(`© ${new Date().getFullYear()} Desenvolvido por`)).last();
  }

  // Página de login ou "Página inicial" — o rodapé é o mesmo componente
  async acessar(caminho: string) {
    await this.abrir(caminho);
  }

  // Abre a página e devolve se cada link apareceu no rodapé
  async linksExibidos(caminho: string, links: string[]): Promise<Record<string, boolean>> {
    await this.acessar(caminho);
    await this.irParaOFim();
    await this.direitos.waitFor();
    const exibidos: Record<string, boolean> = {};
    for (const link of links) exibidos[link] = (await this.link(link).count()) > 0;
    return exibidos;
  }

  // "Ajuda" também está no menu e no "Mapa do Site": só é verificado na página de login, que não tem os dois
  link(nome: string): Locator {
    return this.page.getByRole('link', { name: nome, exact: true });
  }

  async irParaOFim() {
    await this.page.keyboard.press('End');
    await this.direitos.scrollIntoViewIfNeeded();
  }
}
