import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import type { Obrigatoriedade } from '../../fixtures/meuscursos';

export type FiltrosVerTodos = {
  pagina?: number;
  status?: string;
  ordenar?: string;
  modalidade?: string;
  obrigatoriedade?: Obrigatoriedade | 'all';
  busca?: string;
};

export type Card = { id: string; titulo: string; obrigatoriedade: string; modalidade: string };

// Bloco "Meus Cursos" da Página inicial e a página "Ver todos" (/blocks/mycourses/index.php). Os demais blocos
// (Novidades, Em Alta, Cursos Livres...) têm o mesmo "Ver todos": passe o nome do bloco — OB15, 19/11
export class MeusCursosPage extends PaginaBase {
  readonly bloco: Locator;
  readonly tituloDoBloco: Locator;
  readonly verTodos: Locator;
  readonly cardsDoBloco: Locator;
  readonly tituloDaPagina: Locator;
  readonly cardsDaPagina: Locator;
  readonly carregando: Locator;
  readonly paginacao: Locator;
  readonly semCursos: Locator;
  readonly filtroStatus: Locator;
  readonly filtroModalidade: Locator;
  readonly filtroObrigatoriedade: Locator;
  readonly ordenarPor: Locator;
  readonly busca: Locator;

  constructor(
    page: Page,
    readonly nomeDoBloco = 'mycourses',
  ) {
    super(page);
    this.bloco = page.locator(`section.block_${nomeDoBloco}`);
    this.tituloDoBloco = this.bloco.getByRole('heading', { name: 'Meus Cursos', exact: true });
    this.verTodos = this.bloco.getByRole('link', { name: 'Ver todos os Meus Cursos' });
    this.cardsDoBloco = this.bloco.locator('.card[data-courseid]');
    this.tituloDaPagina = page.getByRole('heading', { name: 'Meus Cursos', exact: true }).first();
    this.cardsDaPagina = page.locator('[role=main] .card[data-courseid]');
    this.carregando = page.locator('.loader:visible');
    this.paginacao = page.locator('.pagination').first();
    this.semCursos = page.getByText('Nenhum curso', { exact: true }).first();
    this.filtroStatus = page.locator('#status');
    this.filtroModalidade = page.locator('#modality');
    this.filtroObrigatoriedade = page.locator('#courserequirement');
    this.ordenarPor = page.locator('#sort');
    this.busca = page
      .getByRole('textbox', { name: /buscar/i })
      .or(page.locator('input[name=search]'))
      .first();
  }

  async acessarHome() {
    await this.abrir('/my/');
    // O título "Meus Cursos" só existe no próprio bloco; nos demais, espera a seção do bloco
    await (this.nomeDoBloco === 'mycourses' ? this.tituloDoBloco : this.bloco).waitFor();
  }

  botaoObrigatoriedade(opcao: Obrigatoriedade): Locator {
    return this.bloco.locator(`button.block-requirement-option[data-requirement="${opcao}"]`);
  }

  // Os cards do bloco são recarregados ao trocar a classificação
  async selecionarObrigatoriedade(opcao: Obrigatoriedade) {
    await this.botaoObrigatoriedade(opcao).click();
    await this.aguardarCards();
  }

  // Os cards chegam depois da página: espera o carregador sumir
  async aguardarCards() {
    await this.page.waitForLoadState('load');
    await this.carregando
      .first()
      .waitFor({ state: 'hidden' })
      .catch(() => {});
  }

  // Dados de cada card: id do curso, título, tag de obrigatoriedade (vazia em "Nenhuma") e modalidade
  async lerCards(cards: Locator): Promise<Card[]> {
    return cards.evaluateAll((lista) =>
      lista.map((card) => {
        const texto = (seletor: string) => (card.querySelector(seletor)?.textContent ?? '').replace(/\s+/g, ' ').trim();
        return {
          id: card.getAttribute('data-courseid') ?? '',
          // Cards com imagem trazem o título só no texto alternativo da imagem
          titulo: texto('.card-title') || (card.querySelector('.card-img-top')?.getAttribute('alt') ?? '').trim(),
          obrigatoriedade: texto('.card-course-requirement'),
          modalidade: texto('.card-course-modality'),
        };
      }),
    );
  }

  // "Ver todos" com os filtros na URL, como a própria tela monta
  async acessarVerTodos(filtros: FiltrosVerTodos = {}) {
    const parametros = new URLSearchParams({
      page: String(filtros.pagina ?? 1),
      status: filtros.status ?? 'all',
      modality: filtros.modalidade ?? 'all',
      courserequirement: filtros.obrigatoriedade ?? 'all',
      search: filtros.busca ?? '',
    });
    // Cada bloco tem a sua ordenação padrão; "enrollment_start" só existe no "Meus Cursos"
    const ordenar = filtros.ordenar ?? (this.nomeDoBloco === 'mycourses' ? 'enrollment_start' : undefined);
    if (ordenar) parametros.set('sort', ordenar);
    await this.abrir(`/blocks/${this.nomeDoBloco}/index.php?${parametros}`);
    await this.aguardarCards();
  }

  // Abre o "Ver todos" sem parâmetros, como o link do bloco
  async acessarVerTodosPadrao() {
    await this.abrir(`/blocks/${this.nomeDoBloco}/index.php`);
    await this.aguardarCards();
  }

  // Troca um filtro pela tela: a página recarrega com o filtro na URL
  async filtrar(filtro: Locator, valor: string) {
    const parametro = (await filtro.getAttribute('name')) ?? '';
    await filtro.selectOption(valor);
    await this.page.waitForURL((url) => url.searchParams.get(parametro) === valor);
    await this.aguardarCards();
  }

  async buscar(termo: string) {
    await this.busca.fill(termo);
    await this.busca.press('Enter');
    await this.page.waitForURL((url) => (url.searchParams.get('search') ?? '') === termo);
    await this.aguardarCards();
  }

  // Os números da paginação são botões: a lista troca sem recarregar a página
  async irParaPagina(numero: number) {
    await this.paginacao.locator(`li[data-page-number="${numero}"] button.page-link`).click();
    await this.paginacao.locator(`li.active[data-page-number="${numero}"]`).waitFor();
    await this.aguardarCards();
  }

  parametro(nome: string): string {
    return new URL(this.page.url()).searchParams.get(nome) ?? '';
  }

  // Número da última página da paginação; 1 quando não há paginação
  async ultimaPagina(): Promise<number> {
    const numeros = (
      await this.paginacao.locator('button.page-link[data-page]').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-page')))
    )
      .map(Number)
      .filter(Boolean);
    return numeros.length ? Math.max(...numeros) : 1;
  }

  // Ids de todos os cursos do "Ver todos", percorrendo a paginação
  async todosOsIds(filtros: FiltrosVerTodos = {}): Promise<string[]> {
    await this.acessarVerTodos(filtros);
    const ids = (await this.lerCards(this.cardsDaPagina)).map((c) => c.id);
    const ultima = await this.ultimaPagina();
    for (let pagina = 2; pagina <= ultima; pagina++) {
      await this.acessarVerTodos({ ...filtros, pagina });
      ids.push(...(await this.lerCards(this.cardsDaPagina)).map((c) => c.id));
    }
    return ids;
  }

  // Percorre o "Ver todos" até a página que exibe o curso e devolve o card dele
  async acharCurso(id: string, filtros: FiltrosVerTodos = {}): Promise<Locator> {
    await this.acessarVerTodos(filtros);
    const ultima = await this.ultimaPagina();
    for (let pagina = 1; pagina <= ultima; pagina++) {
      if (pagina > 1) await this.acessarVerTodos({ ...filtros, pagina });
      if ((await this.lerCards(this.cardsDaPagina)).some((c) => c.id === id))
        return this.cardsDaPagina.and(this.page.locator(`[data-courseid="${id}"]`));
    }
    throw new Error(`Curso ${id} não foi exibido no "Ver todos" de ${this.nomeDoBloco}`);
  }

  // Janela do "i" do card: mostra a classificação do curso
  async abrirInfo(card: Locator): Promise<Locator> {
    await card.hover();
    await card.locator('.btn-open-modal-info').click();
    const janela = this.page.getByRole('dialog').filter({ visible: true }).first();
    await janela.waitFor();
    return janela;
  }

  // Fecha a janela do "i" e espera sumir. Só o Escape deixava a janela aberta por cima do card (OB10, 18 e 19/11)
  async fecharInfo(janela: Locator) {
    const fechar = janela.locator('[data-bs-dismiss="modal"], [data-dismiss="modal"], .btn-close, .close').first();
    if (await fechar.isVisible()) await fechar.click();
    else await this.page.keyboard.press('Escape');
    await janela.waitFor({ state: 'hidden' });
  }

  // Tag de obrigatoriedade na página inicial do curso
  tagNoCurso(opcao: string): Locator {
    return this.page
      .locator('[role=main] .badge')
      .filter({ hasText: new RegExp(`^\\s*${opcao}\\s*$`) })
      .first();
  }
}
