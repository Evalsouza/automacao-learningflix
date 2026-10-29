import { Page, Locator } from '@playwright/test';

// Rodapé das páginas: barra inferior com o idioma e o "© <ano> Desenvolvido por" + logo REVVO, e os links
// "Ajuda", "Privacidade" e "Termos", exibidos conforme as opções de footer do Tema.
// Depois do login a página tem o rodapé completo (logo, endereço, Mapa do Site) — layout atual, confirmado pela QA
export class RodapePage {
  readonly page: Page;
  readonly idioma: Locator;
  readonly direitos: Locator;

  constructor(page: Page) {
    this.page = page;
    // Seletor de idioma: link "dropdown" com title "Idioma" — o texto "Português - Brasil" vem com caracteres invisíveis
    this.idioma = page.locator('a.dropdown-toggle[title="Idioma"]:visible').last();
    // Em telas estreitas o tema esconde o rodapé: o texto existe na página, mas fica oculto
    this.direitos = page.getByText(new RegExp(`© ${new Date().getFullYear()} Desenvolvido por`)).last();
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
