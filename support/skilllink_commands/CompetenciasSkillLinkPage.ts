import { Page, Locator, expect } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { caminhosSkillLink } from '../../fixtures/skilllink';
import { estavel } from './CreditosSkillLinkPage';

// Nomes comparados sem diferenciar maiúsculas: em 18/11 o cargo mostrava "Controle de Qualidade" e os cursos
// "Controle de qualidade" — o sistema trata como a mesma competência
export const mesmaCompetencia = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'accent' }) === 0;
export const emComum = (lista: string[], outra: string[]) => lista.filter((n) => outra.some((o) => mesmaCompetencia(n, o)));

// Competências do Skill Link vistas pelo Administrador: janela "Editar cargo" da Hierarquia e seção "Skill Link"
// da edição de curso e de atividade. Nas três telas a tabela lista primeiro as SELECIONADAS e o contador diz
// quantas são ("13 selecionadas"). Leitura não salva nada; marcar() só é usado nas suítes que alteram dados.
export class CompetenciasSkillLinkPage extends PaginaBase {
  readonly janelaCargo: Locator;
  readonly secaoSkillLink: Locator;
  readonly visibilidade: Locator;

  constructor(page: Page) {
    super(page);
    this.janelaCargo = page.locator('.modal.show, [role="dialog"]').filter({ hasText: 'Editar cargo' }).filter({ visible: true }).first();
    this.secaoSkillLink = page
      .locator('fieldset')
      .filter({ has: page.locator('legend', { hasText: /^\s*Skill Link\s*$/ }) })
      .filter({ visible: true })
      .first();
    this.visibilidade = page.locator('#id_visible');
    page.on('dialog', (dialogo) => dialogo.accept().catch(() => undefined));
  }

  contador(escopo: Locator): Locator {
    return escopo
      .getByText(/\d+ (competências )?selecionadas/)
      .filter({ visible: true })
      .first();
  }

  private linhas(escopo: Locator): Locator {
    return escopo.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  private async nomes(escopo: Locator) {
    return this.linhas(escopo).evaluateAll((rs) =>
      rs.map((r) => {
        const celulas = [...r.querySelectorAll('td, [role="cell"]')].map((c) => (c.textContent ?? '').trim());
        return celulas.find((t) => /\p{L}{2}/u.test(t)) ?? ''; // a 1ª célula pode ser a caixa de seleção
      }),
    );
  }

  // As linhas chegam aos poucos: lê depois que a lista estabiliza
  async selecionadas(escopo: Locator) {
    await expect(this.contador(escopo)).toBeVisible();
    await estavel(async () => String((await this.nomes(escopo)).filter(Boolean).length));
    const n = Number(/(\d+)/.exec(await this.contador(escopo).innerText())?.[1] ?? 0);
    return (await this.nomes(escopo)).slice(0, n);
  }

  async abrirCargo(id: string) {
    await this.abrir(`${caminhosSkillLink.cargos}/edit/${id}`);
    await expect(this.janelaCargo).toBeVisible();
    return this.janelaCargo;
  }

  async abrirFormulario(url: string) {
    await this.abrir(url);
    await expect(this.secaoSkillLink).toBeVisible();
    return this.secaoSkillLink;
  }

  async competenciasDoCargo(id: string) {
    return this.selecionadas(await this.abrirCargo(id));
  }

  async competenciasDoCurso(id: string) {
    return this.selecionadas(await this.abrirFormulario(`/course/edit.php?id=${id}`));
  }

  // Marca/desmarca uma competência pela caixa da linha. Devolve true se mudou
  async marcar(escopo: Locator, nome: string, marcado: boolean) {
    const atual = (await this.selecionadas(escopo)).some((n) => mesmaCompetencia(n, nome));
    if (atual === marcado) return false;
    const todos = await this.nomes(escopo);
    const i = todos.findIndex((n) => mesmaCompetencia(n, nome));
    if (i < 0) throw new Error(`Competência "${nome}" não encontrada na tabela`);
    const caixa = this.linhas(escopo).nth(i).locator('input[type="checkbox"]').first();
    await caixa.scrollIntoViewIfNeeded();
    await caixa.click();
    await expect(caixa).toBeChecked({ checked: marcado });
    return true;
  }

  // Altera a competência e confere reabrindo a tela. Devolve false se, depois de salvar, ela não ficou como pedido
  // (C070: em 18/11 desmarcar no curso e salvar não gravava)
  async competenciaNoCargo(cargo: string, nome: string, marcado: boolean) {
    const janela = await this.abrirCargo(cargo);
    if (await this.marcar(janela, nome, marcado)) {
      await janela.getByRole('button', { name: 'Salvar', exact: true }).click();
      await expect(janela).toBeHidden();
    }
    return (await this.competenciasDoCargo(cargo)).some((n) => mesmaCompetencia(n, nome)) === marcado;
  }

  async competenciaNoFormulario(url: string, nome: string, marcado: boolean) {
    const secao = await this.abrirFormulario(url);
    if (await this.marcar(secao, nome, marcado)) {
      await this.page.locator('#id_saveanddisplay, #id_submitbutton2, #id_submitbutton').filter({ visible: true }).first().click();
      await this.aguardarCarregar();
      await expect(this.page.locator('.alert-danger, .invalid-feedback').filter({ visible: true })).toHaveCount(0);
    }
    return (await this.selecionadas(await this.abrirFormulario(url))).some((n) => mesmaCompetencia(n, nome)) === marcado;
  }

  // Métodos de inscrição do curso → "Autoinscrição (Estudante)": o link disponível é o contrário do estado atual
  private linhaAutoinscricao(): Locator {
    return this.page.locator('table tbody tr').filter({ hasText: 'Autoinscrição (Estudante)' }).first();
  }

  async autoinscricaoAtiva(curso: string) {
    await this.abrir(`/enrol/instances.php?id=${curso}`);
    await this.linhaAutoinscricao().waitFor();
    return (await this.linhaAutoinscricao().locator('a[href*="action=disable"]').count()) > 0;
  }

  async definirAutoinscricao(curso: string, ativa: boolean) {
    if ((await this.autoinscricaoAtiva(curso)) === ativa) return;
    await this.linhaAutoinscricao()
      .locator(`a[href*="action=${ativa ? 'enable' : 'disable'}"]`)
      .first()
      .click();
    await this.aguardarCarregar();
    expect(await this.autoinscricaoAtiva(curso), `Autoinscrição do curso ${curso}`).toBe(ativa);
  }

  // Edição da 1ª atividade do tipo no curso, lida na página do curso: 'scorm' (SCORM) ou 'resource' (Arquivo)
  async edicaoDaAtividade(curso: string, tipo: 'scorm' | 'resource') {
    await this.abrir(`/course/view.php?id=${curso}`);
    const link = this.page.locator(`a[href*="/mod/${tipo}/view.php?id="]`).first();
    if (!(await link.count())) return undefined;
    const cmid = new URL((await link.getAttribute('href')) ?? '', 'https://x').searchParams.get('id');
    return `/course/modedit.php?update=${cmid}`;
  }

  async visibilidadeDoCurso(curso: string) {
    await this.abrir(`/course/edit.php?id=${curso}`);
    return this.visibilidade.evaluate((s: HTMLSelectElement) => s.options[s.selectedIndex]?.textContent?.trim() ?? '');
  }
}
