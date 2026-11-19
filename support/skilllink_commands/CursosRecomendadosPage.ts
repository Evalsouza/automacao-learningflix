import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { caminhosSkillLink, recomendados } from '../../fixtures/skilllink';
import { estavel } from './CreditosSkillLinkPage';

const limpo = (t: string | null) => (t ?? '').trim().replace(/\s+/g, ' ');

// Ids dos cursos (course/view.php?id=…) dentro do escopo, sem repetição
async function idsDe(escopo: Locator) {
  const hrefs = await escopo
    .locator('a[href*="course/view.php"]')
    .filter({ visible: true })
    .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  return [...new Set(hrefs.map((h) => new URL(h, 'https://x').searchParams.get('id') ?? '').filter(Boolean))];
}

// Bloco "Cursos recomendados para o seu cargo" da Página inicial e a página do "Ver todos"
// (/blocks/skillcourses/index.php) — usuária Eva Souza, cargo "Analista de Qualidade"
export class CursosRecomendadosPage extends PaginaBase {
  readonly tituloDoBloco: Locator;
  readonly bloco: Locator;
  readonly verTodos: Locator;
  readonly tituloDaPagina: Locator;
  readonly principal: Locator;
  readonly filtros: Locator;
  readonly modalidade: Locator;
  readonly busca: Locator;
  readonly cardsDaPagina: Locator;
  readonly semPermissao: Locator;

  constructor(page: Page) {
    super(page);
    this.tituloDoBloco = page.getByText(recomendados.titulo).first();
    // Menor ancestral do título que tem os links dos cursos
    // Bloco do Moodle "skillcourses" (mesma página do "Ver todos"). Antes era o menor ancestral do título com links de
    // curso, mas com o bloco vazio (C074, 19/11) ele subia até a página e pegava os cursos dos outros blocos
    this.bloco = page.locator('section.block_skillcourses').first();
    this.verTodos = this.bloco.getByRole('link', { name: /Ver todos/ }).first();
    this.tituloDaPagina = page.getByRole('heading', { name: recomendados.titulo }).first();
    this.principal = page.locator('#region-main, main').first();
    this.filtros = this.principal;
    this.modalidade = page.locator('select[name="modality"]');
    this.busca = this.filtros.locator('input[name="search"], input[type="text"], input[type="search"]').filter({ visible: true }).first();
    // Só os visíveis: a página tem cards ocultos no DOM (C061, rodada de 19/11)
    // Raiz do card (classe "card"): "card-icons", "card-link" etc. também têm o link do curso, sem o texto (rodada de 19/11)
    this.cardsDaPagina = this.principal
      .locator('.card')
      .filter({ has: page.locator('a[href*="course/view.php"]') })
      .filter({ visible: true });
    this.semPermissao = page.getByText(recomendados.semPermissao).filter({ visible: true }).first();
  }

  async acessarPerfil() {
    await this.abrir(caminhosSkillLink.perfil);
  }

  cargoNoPerfil(cargo: string): Locator {
    return this.principal.getByText(cargo, { exact: true }).first();
  }

  // Tela do Skill Link que a usuária final não pode abrir (C068)
  async acessarTela(caminho: string) {
    await this.abrir(caminho);
  }

  async acessarHome() {
    await this.abrir('/my/');
    await this.tituloDoBloco.waitFor();
  }

  async acessarPagina() {
    await this.abrir(caminhosSkillLink.recomendados);
    await this.tituloDaPagina.waitFor();
  }

  // Blocos da Página inicial carregam depois da página: rola até o bloco e espera a lista estabilizar
  async idsDoBloco() {
    await this.tituloDoBloco.scrollIntoViewIfNeeded();
    return (await estavel(async () => (await idsDe(this.bloco)).join(','))).split(',').filter(Boolean);
  }

  // Os filtros da página recarregam a lista por script
  // Espera o primeiro curso: duas leituras vazias seguidas, antes de a lista carregar, contavam como "estável"
  // (Tablet e Celular rotacionado, rodada de 19/11)
  // Com `podeFicarVazia` (filtros que podem não ter cursos), espera o primeiro curso por menos tempo e aceita a lista vazia
  async idsDaPagina({ podeFicarVazia = false } = {}) {
    const primeiro = this.principal.locator('a[href*="course/view.php"]').filter({ visible: true }).first();
    if (podeFicarVazia) {
      if (
        !(await primeiro.waitFor({ timeout: 15_000 }).then(
          () => true,
          () => false,
        ))
      )
        return [];
    } else await primeiro.waitFor({ timeout: 45_000 });
    return (await estavel(async () => (await idsDe(this.principal)).join(','), 45_000)).split(',').filter(Boolean);
  }

  // Filtro pelo nome: rótulo, texto ou placeholder (os filtros não têm <label> — rodada de 19/11)
  filtro(nome: string): Locator {
    return this.filtros
      .getByLabel(nome, { exact: true })
      .or(this.filtros.getByText(nome, { exact: true }))
      .or(this.filtros.getByPlaceholder(nome))
      .filter({ visible: true })
      .first();
  }

  // Texto do card do curso: o menor bloco "card" com o link do curso (o título não fica no texto do link)
  async textoDoCard(id: string) {
    return limpo(
      await this.cardsDaPagina
        .filter({ has: this.page.locator(`a[href*="course/view.php?id=${id}"]`) })
        .first()
        .innerText(),
    );
  }

  async textosDosCards() {
    return (await this.cardsDaPagina.allInnerTexts()).map(limpo);
  }

  async buscar(termo: string) {
    await this.busca.fill(termo);
    await this.busca.press('Enter');
    return this.idsDaPagina();
  }

  async filtrarObrigatoriedade(rotulo: string) {
    await this.page.locator('#courserequirement').selectOption({ label: rotulo });
    return this.idsDaPagina({ podeFicarVazia: true });
  }

  async filtrarModalidade(rotulo: string) {
    await this.modalidade.selectOption({ label: rotulo });
    return this.idsDaPagina();
  }
}
