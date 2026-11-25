import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Administração → Gerenciar Hierarquia → aba Cargos
export class GerenciadorHierarquiaPage extends PaginaBase {
  readonly titulo: Locator;
  readonly proximaPagina: Locator;
  readonly filtroCargosDeGestao: Locator;
  readonly botaoFiltrar: Locator;
  readonly totalEncontrado: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Gerenciador de Hierarquia' });
    this.proximaPagina = page.getByRole('listitem', { name: 'Próxima página' }).getByRole('button');
    this.filtroCargosDeGestao = page.getByLabel('Cargos de Gestão');
    this.botaoFiltrar = page.getByRole('button', { name: 'Filtrar' });
    this.totalEncontrado = page.getByText(/\d+ cargos? encontrados?/);
  }

  async acessarCargos() {
    await this.abrir('/local/hierarchy/index.php/positions');
    await this.page.getByRole('heading', { name: 'Gerenciar cargos' }).waitFor();
  }

  // "Cargo Gestor" de um cargo, pela busca da aba (combobox): uma linha só, sem percorrer as páginas — C008.1, 18/11.
  // Ler todos os gestores levava mais de 5 minutos no QA
  async cargoGestor(cargo: string): Promise<string> {
    const busca = this.page.locator('input.vs__search').first();
    await busca.click();
    await busca.fill(cargo);
    const opcao = this.page.getByRole('option', { name: cargo, exact: true });
    // O cargo TEM que aparecer na busca: antes filtrava mesmo sem ele e lia o que viesse (QA, 25/11)
    await opcao.click({ timeout: 15_000 });
    await this.botaoFiltrar.click();
    await this.aguardarCarregar();
    const linha = this.page.locator('table tbody tr').filter({ has: this.page.getByRole('cell', { name: cargo, exact: true }) });
    await linha.first().waitFor();
    return (await linha.first().locator('td').nth(3).innerText()).trim();
  }

  // Filtra pelos "Cargos de Gestão" e percorre as páginas da tabela, devolvendo os cargos com "Cargo Gestor" = Sim.
  // Sem o filtro eram 29 páginas de 5 cargos (144 em 09/11) e o teste estourava o tempo
  async cargosGestores(): Promise<string[]> {
    const gestores: string[] = [];
    const totalAntes = await this.totalEncontrado.innerText();
    await this.filtroCargosDeGestao.check();
    await this.botaoFiltrar.click();
    await this.aguardarCarregar();
    await this.page.waitForFunction((antes) => !document.body.innerText.includes(antes), totalAntes);
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
