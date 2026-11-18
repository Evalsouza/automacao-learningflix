import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

type Credenciais = { identificacao?: string; senha?: string };

export class LoginPage extends PaginaBase {
  readonly titulo: Locator;
  readonly campoUsuario: Locator;
  readonly campoSenha: Locator;
  readonly botaoAcessar: Locator;
  readonly checkLembrarMe: Locator;
  readonly linkEsqueciSenha: Locator;
  readonly linkCriarConta: Locator;
  readonly botaoVisitante: Locator;
  readonly iconeOlho: Locator;
  readonly iconeOlhoExibir: Locator;
  readonly iconeOlhoEsconder: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Acesso', level: 1 });
    this.campoUsuario = page.getByRole('textbox', { name: 'CPF' });
    this.campoSenha = page.getByRole('textbox', { name: 'Senha', exact: true });
    // exact: existe também o botão "Acessar como visitante"
    this.botaoAcessar = page.getByRole('button', { name: 'Acessar', exact: true });
    this.checkLembrarMe = page.getByRole('checkbox', { name: 'Lembrar-me' });
    this.linkEsqueciSenha = page.getByRole('link', { name: 'Esqueci a senha' });
    this.linkCriarConta = page.getByRole('link', { name: 'Criar uma conta' });
    this.botaoVisitante = page.getByRole('button', { name: 'Acessar como visitante' });
    this.iconeOlhoExibir = page.getByRole('button', { name: 'Exibir a senha', exact: true });
    this.iconeOlhoEsconder = page.getByRole('button', { name: 'Esconder a senha', exact: true });
    this.iconeOlho = this.iconeOlhoExibir.or(this.iconeOlhoEsconder);
  }

  async acessar() {
    await this.abrir('/login/index.php');
  }

  // Campos não informados ficam vazios — usado nos casos negativos
  async entrar({ identificacao, senha }: Credenciais, opcoes: { lembrarMe?: boolean } = {}) {
    if (identificacao) await this.campoUsuario.fill(identificacao);
    if (senha) await this.campoSenha.fill(senha);
    if (opcoes.lembrarMe) await this.checkLembrarMe.check();
    await this.botaoAcessar.click();
  }

  // Usuário novo: no primeiro acesso a plataforma pede o "Acordo de política do site" (Administração → Segurança →
  // Políticas, "sitepolicy") e não abre outra página até aceitar. Aceita com "Sim" se aparecer — C008, 18/11
  async aceitarPoliticaSeExibida() {
    const titulo = this.page.getByRole('heading', { name: 'Acordo de política do site' });
    if (!(await titulo.waitFor({ timeout: 15_000 }).then(() => true, () => false))) return;
    await this.page.getByRole('button', { name: 'Sim', exact: true }).click();
    await this.page.waitForLoadState('load');
  }

  async digitarSenha(senha: string) {
    await this.campoSenha.fill(senha);
  }

  async clicarNoOlho() {
    await this.iconeOlho.click();
  }

  // A plataforma exibe a mensagem de erro duas vezes na tela; no login o texto precisa ser exato
  override mensagem(texto: string): Locator {
    return this.page.getByText(texto, { exact: true }).first();
  }
}
