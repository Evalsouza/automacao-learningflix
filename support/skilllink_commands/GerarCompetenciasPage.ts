import { Page, Locator, expect } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import type { TelaSkillLink } from '../../fixtures/skilllink';

type Tela = TelaSkillLink['telas'][number];

// Telas onde o Skill Link gera competências: janela de cargo (Hierarquia) e seção "Skill Link" da edição
// de curso e de atividade (SCORM, vídeo, arquivo). Os formulários NUNCA são salvos por estes testes.
export class GerarCompetenciasPage extends PaginaBase {
  readonly secaoSkillLink: Locator;
  readonly mensagemDeErro: Locator;

  constructor(page: Page) {
    super(page);
    this.secaoSkillLink = page.locator('fieldset').filter({ has: page.locator('legend', { hasText: /^\s*Skill Link\s*$/ }) });
    // C007 — o DR não define a mensagem ("a"); vale qualquer aviso de erro de comunicação
    this.mensagemDeErro = page
      .locator('.alert, [role="alert"], .modal.show, .toast, .notifications, .text-danger, .invalid-feedback')
      .filter({ hasText: /erro|falha|não foi possível|indispon|comunica|conex|timeout/i })
      .filter({ visible: true })
      .first();
    // Sair de um formulário alterado abre o aviso "sair da página?": aceita — nada é salvo
    page.on('dialog', (dialogo) => dialogo.accept().catch(() => undefined));
  }

  janelaCargo(titulo: string): Locator {
    return this.page.locator('.modal.show .modal-content').filter({ hasText: titulo }).last();
  }

  // Abre a tela e devolve o botão de gerar competências dela (pode não existir: os testes "NÃO exibido" contam 0)
  async abrirTela(tela: Pick<Tela, 'url' | 'janelaCargo'>): Promise<Locator> {
    await this.abrir(tela.url);
    if (tela.janelaCargo === 'Adicionar cargo') {
      await this.page
        .getByRole('button', { name: /Adicionar/ })
        .or(this.page.getByRole('link', { name: /Adicionar/ }))
        .filter({ visible: true })
        .last()
        .click();
    }
    if (tela.janelaCargo) {
      const janela = this.janelaCargo(tela.janelaCargo);
      await expect(janela).toBeVisible();
      // A lista de competências da janela carrega depois dela; só então o botão aparece (ou não)
      await expect(janela.getByText(/\d+ (competências )?selecionadas/).first()).toBeVisible();
      // Cargo: "Encontrar cargos similares no Skill Link" / "Gerar competências com IA"
      return janela.getByRole('button', { name: /Skill Link|competências com IA/i }).filter({ visible: true });
    }
    // Seção recolhida por padrão no formulário do Moodle
    await this.page.locator('form.mform').first().waitFor();
    const expandir = this.secaoSkillLink.locator('legend a[aria-expanded="false"]');
    if (await expandir.count()) await expandir.first().click();
    // Nome exato do botão: o título da seção ("Skill Link") também é um link/botão de recolher
    const nome = /Gerar competências com (o )?Skill Link/i;
    return this.page
      .getByRole('button', { name: nome })
      .or(this.page.getByRole('link', { name: nome }))
      .filter({ visible: true });
  }
}
