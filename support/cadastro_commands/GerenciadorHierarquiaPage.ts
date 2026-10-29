import { Page, Locator } from '@playwright/test';

// Administração → Gerenciar Hierarquia → aba Cargos
export class GerenciadorHierarquiaPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly proximaPagina: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Gerenciador de Hierarquia' });
    this.proximaPagina = page.getByRole('listitem', { name: 'Próxima página' }).getByRole('button');
  }

  async acessarCargos() {
    await this.page.goto('/local/hierarchy/index.php/positions');
    await this.page.getByRole('heading', { name: 'Gerenciar cargos' }).waitFor();
  }

  // Percorre todas as páginas da tabela e devolve os cargos com "Cargo Gestor" = Sim
  async cargosGestores(): Promise<string[]> {
    const gestores: string[] = [];
    for (;;) {
      await this.page.locator('table tbody tr').first().waitFor();
      const linhas = await this.page
        .locator('table tbody tr')
        .evaluateAll((trs) =>
          trs.map((tr) => [(tr as HTMLTableRowElement).cells[1]?.innerText.trim(), (tr as HTMLTableRowElement).cells[3]?.innerText.trim()]),
        );
      for (const [cargo, gestor] of linhas) if (cargo && /Sim/.test(gestor ?? '')) gestores.push(cargo);
      if (await this.proximaPagina.isDisabled()) break;
      const primeiraAntes = await this.page.locator('table tbody tr').first().innerText();
      await this.proximaPagina.click();
      await this.page.waitForFunction(
        (antes) => document.querySelector('table tbody tr')?.textContent?.trim() !== antes.trim(),
        primeiraAntes,
      );
    }
    return gestores;
  }
}
