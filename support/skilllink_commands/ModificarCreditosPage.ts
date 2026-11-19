import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { caminhosSkillLink } from '../../fixtures/skilllink';

const limpo = (t: string | null) => (t ?? '').trim().replace(/\s+/g, ' ');

// "Modificar créditos" (/local/skillbox/change_tokens.php) — só o Administrador Geral (Admin Revvo)
export class ModificarCreditosPage extends PaginaBase {
  readonly principal: Locator;
  readonly subtitulo: Locator;
  readonly cards: Locator;
  readonly quantidade: Locator;
  readonly adicionar: Locator;
  readonly cancelar: Locator;
  readonly erroDoCampo: Locator;
  readonly tituloDaGrade: Locator;
  readonly grade: Locator;
  readonly linhas: Locator;
  readonly totalDeRegistros: Locator;
  readonly paginacao: Locator;

  constructor(page: Page) {
    super(page);
    this.principal = page.locator('#region-main, main, #page-content').first();
    this.subtitulo = this.principal.getByText(/Adicione créditos/).first();
    this.cards = page.locator('.sb-credits-kpis');
    this.quantidade = page.getByLabel('Quantidade de créditos');
    this.adicionar = page.getByRole('button', { name: 'Adicionar créditos' });
    this.cancelar = this.principal.getByRole('button', { name: 'Cancelar', exact: true }).filter({ visible: true }).first();
    // Erro DO CAMPO: o aviso geral "créditos esgotados" da página não conta
    this.erroDoCampo = this.quantidade
      .locator('xpath=ancestor::form[1]')
      .locator('.invalid-feedback, .form-control-feedback, [id^="id_error_"]')
      .filter({ visible: true })
      .first();
    this.tituloDaGrade = this.principal.getByText('Histórico de alterações', { exact: true }).first();
    this.grade = this.principal
      .locator('table')
      .filter({ has: page.locator('th', { hasText: 'Valor em dólares' }) })
      .first();
    this.linhas = this.grade.locator('tbody tr').filter({ visible: true });
    this.totalDeRegistros = this.principal.getByText(/Mostrando .* resultados/).first();
    this.paginacao = page.getByRole('navigation', { name: 'Paginação' }).filter({ visible: true }).first();
  }

  async acessar() {
    await this.abrir(caminhosSkillLink.modificarCreditos);
    await this.quantidade.waitFor();
  }

  // Saldo (cards) e histórico (total e 1ª linha) — para conferir se uma ação alterou alguma coisa
  async estado() {
    await this.acessar();
    return {
      saldo: limpo(await this.cards.innerText()),
      historico: `${limpo(await this.totalDeRegistros.innerText())} | ${limpo(await this.linhas.first().innerText())}`,
    };
  }

  async restantes() {
    const texto = limpo(
      await this.page
        .locator('.sb-credits-kpis > *')
        .filter({ has: this.page.getByText('Créditos restantes', { exact: true }) })
        .first()
        .innerText(),
    ).replace('Créditos restantes', '');
    return Number(/([\d.]+)/.exec(texto)?.[1].replace(/\./g, '') ?? NaN);
  }

  async total() {
    const texto = limpo(await this.totalDeRegistros.innerText());
    return Number(/de ([\d.]+) resultados/.exec(texto)?.[1].replace(/\./g, '') ?? NaN);
  }

  async preencherEAdicionar(valor: string) {
    await this.quantidade.fill(valor);
    await this.adicionar.click();
  }

  async colunas() {
    return (await this.grade.locator('thead th').allInnerTexts()).map(limpo);
  }

  async coluna(nome: string) {
    const i = (await this.colunas()).indexOf(nome);
    if (i < 0) throw new Error(`Coluna "${nome}" não encontrada no "Histórico de alterações"`);
    return (await this.linhas.locator(`td:nth-child(${i + 1})`).allInnerTexts()).map(limpo);
  }

  cabecalho(nome: string): Locator {
    return this.grade.locator('thead th').filter({ hasText: new RegExp(`^\\s*${nome}\\s*$`) });
  }
}

// "+US$ 0,0100" → 0.01; "1.513" → 1513
export const numero = (t: string) =>
  Number(
    t
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  );
