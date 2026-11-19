import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { campoObrigatoriedade } from '../../fixtures/meuscursos';

// Campo personalizado de curso "Obrigatoriedade" (Administração → Cursos → Campos personalizados de curso) e o campo
// nas Configurações do curso. Só leitura: o modal é cancelado e o formulário do curso não é enviado — mapeado em 19/11
export class CampoObrigatoriedadePage extends PaginaBase {
  readonly linhaDoCampo: Locator;
  readonly categoriaDoCampo: Locator;
  readonly janela: Locator;
  readonly campoNoCurso: Locator;

  constructor(page: Page) {
    super(page);
    this.linhaDoCampo = page.locator('tr').filter({ hasText: campoObrigatoriedade.nomeBreve });
    // Bloco mais interno com o nome da categoria e a linha do campo
    this.categoriaDoCampo = page
      .locator('div, section')
      .filter({ has: page.getByText(campoObrigatoriedade.categoria, { exact: true }) })
      .filter({ has: this.linhaDoCampo })
      .last();
    this.janela = page.getByRole('dialog').filter({ visible: true }).first();
    this.campoNoCurso = page.locator(`select[name="customfield_${campoObrigatoriedade.nomeBreve}"]`);
  }

  async acessar() {
    await this.abrir('/course/customfield.php');
    await this.linhaDoCampo.waitFor();
  }

  // Engrenagem "Editar" da linha do campo
  async abrirEdicao() {
    await this.linhaDoCampo.locator('a[data-role="editfield"]').click();
    await this.janela.waitFor();
  }

  campoDaJanela(nome: string): Locator {
    return this.janela.locator(`[name="${nome}"]`);
  }

  // Texto da opção marcada num select da janela
  opcaoMarcada(nome: string): Locator {
    return this.campoDaJanela(nome).locator('option:checked');
  }

  // "Cancelar" fecha sem salvar
  async cancelar() {
    await this.janela.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await this.janela.waitFor({ state: 'hidden' });
  }

  // Configurações do curso: só abre, sem salvar
  async acessarConfiguracoesDoCurso(id: number) {
    await this.abrir(`/course/edit.php?id=${id}`);
    await this.campoNoCurso.waitFor({ state: 'attached' });
  }
}
