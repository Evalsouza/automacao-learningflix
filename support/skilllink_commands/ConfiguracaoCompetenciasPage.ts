import { Page, Locator, expect } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { caminhosSkillLink, configuracaoSkillLink, telasDaIA } from '../../fixtures/skilllink';

export type EstadoSkillLink = {
  opcoes: Record<string, boolean>;
  prisma: string;
  lizza: string;
  creditos: string;
};

// Opção "Habilitado" + as 5 "Habilitar geração de competências com IA para …"
export const opcoesSkillLink = ['enabled', ...telasDaIA.map((t) => t.opcao)];
export const tudoMarcado = Object.fromEntries(opcoesSkillLink.map((o) => [o, true])) as Record<string, boolean>;

// Administração do site → Plugins → Plugins locais → "Configurações de competências" (local_skillbox).
// Os campos são localizados pelo id do Moodle: o rótulo "Créditos iniciais" do DR hoje aparece como
// "Franquia mensal de créditos" (divergência registrada no RASTREABILIDADE.md)
export class ConfiguracaoCompetenciasPage extends PaginaBase {
  readonly titulo: Locator;
  readonly campoPrisma: Locator;
  readonly campoLizza: Locator;
  readonly campoCreditos: Locator;
  readonly linhaCreditos: Locator;
  readonly salvarMudancas: Locator;
  readonly avisoGravado: Locator;
  readonly erroCreditos: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: configuracaoSkillLink.titulo }).first();
    this.campoPrisma = page.locator('#id_s_local_skillbox_prisma_apiendpoint');
    this.campoLizza = page.locator('#id_s_local_skillbox_lizza_url');
    this.campoCreditos = page.locator('#id_s_local_skillbox_initial_tokens');
    this.linhaCreditos = page.locator('.form-item').filter({ has: this.campoCreditos });
    this.salvarMudancas = page.getByRole('button', { name: 'Salvar mudanças' });
    this.avisoGravado = page.locator('.alert, [role="alert"]').filter({ hasText: configuracaoSkillLink.gravadas }).first();
    // Mensagem do campo de créditos ou aviso geral do formulário
    this.erroCreditos = this.linhaCreditos
      .locator('.invalid-feedback, .form-control-feedback, .error, .text-danger')
      .or(page.locator('.alert-danger, .alert-error'))
      .filter({ visible: true })
      .filter({ hasText: /\S/ })
      .first();
  }

  async acessar() {
    await this.abrir(caminhosSkillLink.configuracao);
    await this.titulo.waitFor();
  }

  // Linha da configuração (rótulo, campo, descrição e "Padrão: …") pelo texto do rótulo
  linha(rotulo: string): Locator {
    return this.page.locator('.form-item').filter({ has: this.page.locator('.form-label label', { hasText: rotulo }) });
  }

  // Campo visível da linha: texto, área de texto ou senha mascarada do Moodle
  campo(rotulo: string): Locator {
    return this.linha(rotulo)
      .locator('.form-setting input:not([type="hidden"]), .form-setting textarea, .form-setting [data-passwordunmask="displayvalue"]')
      .filter({ visible: true })
      .first();
  }

  async valorDoCampo(rotulo: string) {
    return (
      await this.campo(rotulo).evaluate((n) =>
        n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement ? n.value : (n.textContent ?? ''),
      )
    ).trim();
  }

  caixa(opcao: string): Locator {
    return this.page.locator(`#id_s_local_skillbox_${opcao}`);
  }

  async lerEstado(): Promise<EstadoSkillLink> {
    await this.acessar();
    const opcoes: Record<string, boolean> = {};
    for (const opcao of opcoesSkillLink) opcoes[opcao] = await this.caixa(opcao).isChecked();
    return {
      opcoes,
      prisma: await this.campoPrisma.inputValue(),
      lizza: await this.campoLizza.inputValue(),
      creditos: await this.campoCreditos.inputValue(),
    };
  }

  // Marca/desmarca as opções e preenche URLs e créditos; salva só se algo mudou (o Moodle não mostra
  // "Mudanças gravadas" sem alteração)
  async definir({ opcoes = {}, prisma, lizza, creditos }: Partial<EstadoSkillLink>) {
    await this.acessar();
    let mudou = false;
    for (const [opcao, marcado] of Object.entries(opcoes)) {
      if ((await this.caixa(opcao).isChecked()) !== marcado) {
        await this.caixa(opcao).setChecked(marcado);
        mudou = true;
      }
    }
    for (const [campo, valor] of [
      [this.campoPrisma, prisma],
      [this.campoLizza, lizza],
      [this.campoCreditos, creditos],
    ] as const) {
      if (valor !== undefined && (await campo.inputValue()) !== valor) {
        await campo.fill(valor);
        mudou = true;
      }
    }
    if (mudou) {
      await this.salvarMudancas.click();
      await expect(this.avisoGravado).toBeVisible();
    }
  }

  // C020/C021 — tenta salvar os créditos e espera o resultado: mensagem de bloqueio ou "Mudanças gravadas"
  async tentarSalvarCreditos(valor: string) {
    await this.acessar();
    await this.campoCreditos.fill(valor);
    await this.salvarMudancas.click();
    await this.aguardarCarregar();
    await expect(this.erroCreditos.or(this.avisoGravado).first()).toBeVisible();
  }
}
