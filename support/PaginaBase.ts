import { Page, Locator } from '@playwright/test';

// Base de todas as classes de tela
export class PaginaBase {
  constructor(readonly page: Page) {}

  // Espera os scripts da página carregarem: sem eles, botões como o "Olho" da senha e o menu do usuário não
  // respondem ao clique. Com os vídeos bloqueados, esperar o carregamento custa pouco.
  // `domcontentloaded` só onde os vídeos são carregados (Carrossel) e a validação espera o próprio elemento
  protected async abrir(caminho: string, espera: 'load' | 'domcontentloaded' = 'load') {
    await this.page.goto(caminho, { waitUntil: espera });
  }

  // Depois de navegar por um clique: sem os scripts carregados, o Moodle valida o formulário no servidor (mensagens
  // diferentes, sem o "- ") e botões como o lápis "Editar usuário" não abrem o modal
  async aguardarCarregar() {
    await this.page.waitForLoadState('load');
  }

  // Mensagem do sistema na tela — texto parcial
  mensagem(texto: string): Locator {
    return this.page.getByText(texto, { exact: false }).first();
  }
}
