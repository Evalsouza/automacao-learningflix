import { Page, Locator, expect } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { caminhosSkillLink, creditosSkillLink } from '../../fixtures/skilllink';

const limpo = (t: string | null) => (t ?? '').trim().replace(/\s+/g, ' ');

// Conteúdo que a página recarrega por script: espera duas leituras iguais seguidas. Uma leitura que falha
// no meio do recarregamento conta como "ainda mudando"
export async function estavel(ler: () => Promise<string>, timeout = 30_000) {
  let anterior: string | undefined;
  await expect
    .poll(
      async () => {
        const atual = await ler().catch(() => `recarregando ${Date.now()}`);
        const igual = atual === anterior;
        anterior = atual;
        return igual;
      },
      { timeout, intervals: [1000] },
    )
    .toBe(true);
  return anterior ?? '';
}

// Página "Skill Link" — "Créditos do Skill Link": Adm Cliente em /local/skillbox/credits.php e
// Administrador Revvo em /local/skillbox/tokens.php (mesma tela, com o botão "Modificar créditos")
export class CreditosSkillLinkPage extends PaginaBase {
  readonly titulo: Locator;
  readonly principal: Locator;
  readonly cards: Locator;
  readonly periodo: Locator;
  readonly graficos: Locator;
  readonly historico: Locator;
  readonly linhas: Locator;
  readonly busca: Locator;
  readonly filtroTipo: Locator;
  readonly exportar: Locator;
  readonly janela: Locator;
  readonly modificar: Locator;
  readonly linkCreditos: Locator;
  readonly tituloAdministracao: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: creditosSkillLink.titulo, exact: true }).filter({ visible: true }).first();
    this.principal = page.locator('#region-main, main').first();
    this.cards = page.locator('.sb-credits-kpis');
    this.periodo = page.locator('select.sb-credits-select').first();
    this.graficos = page.locator('section.sb-credits-panel:not(.sb-credits-history)').filter({ visible: true });
    this.historico = page.locator('section.sb-credits-history');
    this.linhas = this.historico.locator('tbody tr').filter({ visible: true });
    this.busca = this.historico.locator('input[type="text"], input[type="search"]').filter({ visible: true }).first();
    this.filtroTipo = this.historico.locator('select.sb-credits-select').first();
    this.exportar = this.historico.locator('a.sb-credits-export').filter({ visible: true }).first();
    this.janela = page.locator('.sb-credits-modal__dialog, .modal.show .modal-dialog, [role="dialog"]').filter({ visible: true }).first();
    this.linkCreditos = this.principal.getByRole('link', { name: creditosSkillLink.link }).filter({ visible: true });
    this.tituloAdministracao = page.getByRole('heading', { name: 'Administração', exact: true }).filter({ visible: true }).first();
    this.modificar = page.locator('a.sb-credits-change').filter({ visible: true }).filter({ hasText: creditosSkillLink.modificar });
  }

  async acessarComoCliente() {
    await this.abrir(caminhosSkillLink.creditosCliente);
    await this.titulo.waitFor();
  }

  async acessarComoAdministrador() {
    await this.abrir(caminhosSkillLink.creditosAdmin);
    await this.titulo.waitFor();
  }

  // Adm Cliente: Página inicial → Sidebar "Administração"
  async acessarAdministracaoPeloSidebar() {
    await this.abrir('/my/');
    await this.page.locator('section.d-lg-block a[href*="client_admin.php"]').filter({ visible: true }).first().click();
    await this.aguardarCarregar();
  }

  async acessarAdministracaoCliente() {
    await this.abrir(caminhosSkillLink.administracaoCliente);
    await this.tituloAdministracao.waitFor();
  }

  // Administrador Revvo: "Administração do site → Relatórios → Créditos do Skill Link"
  async acessarPorRelatorios() {
    await this.abrir(caminhosSkillLink.administracaoDoSite);
    await this.page.getByRole('tab', { name: 'Relatórios', exact: true }).filter({ visible: true }).first().click();
    await this.page.locator('.tab-pane.active').getByRole('link', { name: creditosSkillLink.link, exact: true }).click();
    await this.aguardarCarregar();
  }

  // Card pelo título exato: o texto "Créditos contratados" também aparece dentro de outro card (rodada de 19/11)
  card(nome: string): Locator {
    return this.page.locator('.sb-credits-kpis > *').filter({ has: this.page.getByText(nome, { exact: true }) });
  }

  // Número de créditos do card: primeiro número depois do nome ("1.513" vira 1513)
  // Total da franquia do período: o "N" de "318 usados de N" no card "Franquia mensal"
  async totalDaFranquia() {
    const texto = limpo(await this.card('Franquia mensal').first().innerText());
    const numero = /usados de ([\d.]+)/.exec(texto);
    return numero ? Number(numero[1].replace(/\./g, '')) : NaN;
  }

  async valor(nome: string) {
    const texto = limpo(await this.card(nome).first().innerText()).replace(nome, '');
    const numero = /^\D*?([\d.]+)/.exec(texto);
    return numero ? Number(numero[1].replace(/\./g, '')) : NaN;
  }

  // Títulos dos cards na ordem da tela (C024: informação no local correto)
  async titulosDosCards() {
    return (await this.page.locator('.sb-credits-kpis .sb-credits-card').filter({ visible: true }).allInnerTexts()).map((t) =>
      t.trim().split(/\r?\n/)[0].trim(),
    );
  }

  // Percentual do card: no texto ("66,7% do total") ou na barra de progresso ("100,0% da franquia utilizada")
  // Barra de uso do card: "Créditos contratados" mostra o total utilizado da quantidade contratada só pela barra,
  // sem o número do percentual (QA, 19/11)
  barraDeUso(nome: string): Locator {
    return this.card(nome)
      .first()
      .locator('[role="progressbar"], .progress, [class*="progress"], [class*="bar"]')
      .filter({ visible: true })
      .first();
  }

  async percentual(nome: string) {
    const card = this.card(nome).first();
    const rotulos = await card.getByRole('progressbar').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label') ?? ''));
    return /\d+(,\d+)?\s*%/.exec([limpo(await card.innerText()), ...rotulos].join(' '))?.[0] ?? '';
  }

  async selecionarPeriodo(rotulo: string) {
    await this.periodo.selectOption({ label: rotulo });
    await this.aguardarCarregar();
    await estavel(() => this.cards.innerText());
  }

  // Cursos, Vídeos e SCORM são botões [data-mode] que abrem janela; Cargos é link para a Hierarquia
  atalho(nome: string): Locator {
    return this.principal
      .locator('[data-mode]')
      .filter({ hasText: new RegExp(`^\\s*${nome}\\s*$`) })
      .or(this.principal.getByRole('link', { name: nome, exact: true }))
      .filter({ visible: true })
      .first();
  }

  // O clique pode chegar antes do script da página: repete até a janela abrir
  async abrirAtalho(nome: string) {
    await expect(async () => {
      await this.atalho(nome).click();
      await expect(this.janela).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
  }

  // Janela do atalho: escolhe a 1ª categoria, o 1º curso da lista e, em Vídeos e SCORM, a 1ª atividade; devolve o "Editar"
  async selecionarNaJanela({ comAtividade }: { comAtividade: boolean }) {
    await this.janela.getByRole('combobox', { name: 'Categoria' }).click();
    await this.page.locator('#sb-credits-category-options').getByRole('option').filter({ visible: true }).nth(1).click();
    const cursos = this.page.locator('#sb-credits-course-list');
    await expect(cursos.locator('option').first()).toBeAttached();
    await cursos.selectOption({ index: 0 });
    // Vídeos e SCORM: lista de atividades do curso, carregada depois de escolher o curso
    // A janela de Cursos também tem um 2º select (oculto): só Vídeos e SCORM escolhem atividade (rodada de 19/11)
    const atividades = this.janela.locator('select').nth(1);
    if (comAtividade) {
      await expect(atividades.locator('option[value]:not([value=""])').first()).toBeAttached();
      const [primeira] = await atividades
        .locator('option')
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      await atividades.selectOption(primeira);
    }
    return this.janela.getByRole('link', { name: 'Editar', exact: true });
  }

  async colunas() {
    return (await this.historico.locator('thead th').allInnerTexts()).map(limpo);
  }

  // Textos de uma coluna do histórico pelo cabeçalho
  async coluna(nome: string) {
    const i = (await this.colunas()).indexOf(nome);
    if (i < 0) throw new Error(`Coluna "${nome}" não encontrada no "Histórico de consumo"`);
    return (await this.linhas.locator(`td:nth-child(${i + 1})`).allInnerTexts()).map(limpo);
  }

  // A grade recarrega por script depois de busca e filtro
  async aguardarGrade() {
    await estavel(() => this.linhas.allInnerTexts().then((t) => t.join('|')));
  }

  async buscar(termo: string) {
    await this.busca.fill(termo);
    await this.busca.press('Enter');
    await this.aguardarCarregar();
    await this.aguardarGrade();
  }

  async filtrarTipo(tipo: string) {
    await this.filtroTipo.selectOption({ label: tipo });
    await this.aguardarCarregar();
    await this.aguardarGrade();
  }

  verDetalhes(linha: Locator): Locator {
    return linha.locator('button.sb-credits-eye, [title="Ver detalhes"], [aria-label="Ver detalhes"]').first();
  }
}
