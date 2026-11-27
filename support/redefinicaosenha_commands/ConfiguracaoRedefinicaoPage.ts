import { Page, Locator, Browser } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';
import { sessoes, comSessao } from '../sessoes';
import { configuracaoAtual } from '../../fixtures/redefinicaosenha';

// Cada suíte deixa a redefinição como precisa antes de começar — decisão da QA (10/11):
// a padrão (C08 e RS) desabilita a personalizada; as da personalizada habilitam no início e desabilitam no final
export function garantirRedefinicaoPersonalizada(browser: Browser, ativa: boolean): Promise<boolean> {
  return comSessao(browser, sessoes.administrador, (pagina) => new ConfiguracaoRedefinicaoPage(pagina).definirAtiva(ativa));
}

// Habilita a personalizada e define "CPF" no "Campo primário" e "Data de Nascimento" no "Campo secundário" (configuração
// de referência). Em 26/11 o secundário estava em "Telefone" e RP02 a RP04 falharam: em vez de só ler, as suítes
// deixam a configuração como os testes esperam — decisão da QA (26/11); só regrava o que já era o padrão
export function prepararRedefinicaoPersonalizada(browser: Browser): Promise<void> {
  return comSessao(browser, sessoes.administrador, async (pagina) => {
    const config = new ConfiguracaoRedefinicaoPage(pagina);
    await config.definirAtiva(true);
    await config.definirCampos(configuracaoAtual.primario, configuracaoAtual.secundario);
  });
}

// Administração → "Configurações - Redefinição de senha personalizada"
export class ConfiguracaoRedefinicaoPage extends PaginaBase {
  readonly titulo: Locator;
  readonly ativar: Locator;
  readonly campoPrimario: Locator;
  readonly campoSecundario: Locator;
  readonly botaoSalvar: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Configurações - Redefinição de senha personalizada' });
    this.ativar = page.locator('input[type=checkbox][name=enabled]');
    this.campoPrimario = page.locator('select[name=firstfield]');
    this.campoSecundario = page.locator('select[name=secondfield]');
    this.botaoSalvar = page.getByRole('button', { name: 'Salvar mudanças' });
  }

  async acessar() {
    await this.abrir('/admin/tool/custom_forgotpassword/index.php');
    await this.titulo.waitFor();
  }

  async opcoes(lista: Locator): Promise<string[]> {
    return (await lista.locator('option').allInnerTexts()).map((o) => o.trim());
  }

  selecionado(lista: Locator): Locator {
    return lista.locator('option:checked');
  }

  // Habilita ou desabilita a redefinição personalizada e salva; devolve se estava habilitada antes
  async definirAtiva(ativa: boolean): Promise<boolean> {
    await this.acessar();
    const estava = await this.ativar.isChecked();
    if (estava !== ativa) {
      await this.ativar.setChecked(ativa);
      await this.botaoSalvar.click();
      await this.titulo.waitFor();
    }
    return estava;
  }

  // Seleciona os dois campos e salva de uma vez
  async definirCampos(primario: string, secundario: string) {
    await this.acessar();
    await this.campoPrimario.selectOption({ label: primario });
    await this.campoSecundario.selectOption({ label: secundario });
    await this.botaoSalvar.click();
    await this.titulo.waitFor();
  }

  async definir(lista: Locator, opcao: string) {
    await lista.selectOption({ label: opcao });
    await this.botaoSalvar.click();
    await this.titulo.waitFor();
  }
}
