import { Page, Locator } from '@playwright/test';

type Credenciais = { identificacao?: string; senha?: string };

export class LoginPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly campoUsuario: Locator;
  readonly campoSenha: Locator;
  readonly botaoAcessar: Locator;
  readonly checkLembrarMe: Locator;
  readonly linkEsqueciSenha: Locator;
  readonly iconeOlho: Locator;
  readonly iconeOlhoExibir: Locator;
  readonly iconeOlhoEsconder: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Acesso', level: 1 });
    this.campoUsuario = page.getByRole('textbox', { name: 'CPF' });
    this.campoSenha = page.getByRole('textbox', { name: 'Senha', exact: true });
    // exact: existe também o botão "Acessar como visitante"
    this.botaoAcessar = page.getByRole('button', { name: 'Acessar', exact: true });
    this.checkLembrarMe = page.getByRole('checkbox', { name: 'Lembrar-me' });
    this.linkEsqueciSenha = page.getByRole('link', { name: 'Esqueci a senha' });
    this.iconeOlhoExibir = page.getByRole('button', { name: 'Exibir a senha', exact: true });
    this.iconeOlhoEsconder = page.getByRole('button', { name: 'Esconder a senha', exact: true });
    this.iconeOlho = this.iconeOlhoExibir.or(this.iconeOlhoEsconder);
  }

  async acessar() {
    await this.page.goto('/login/index.php');
  }

  // Campos não informados ficam vazios — usado nos casos negativos
  async entrar({ identificacao, senha }: Credenciais, opcoes: { lembrarMe?: boolean } = {}) {
    if (identificacao) await this.campoUsuario.fill(identificacao);
    if (senha) await this.campoSenha.fill(senha);
    if (opcoes.lembrarMe) await this.checkLembrarMe.check();
    await this.botaoAcessar.click();
  }

  async digitarSenha(senha: string) {
    await this.campoSenha.fill(senha);
  }

  async clicarNoOlho() {
    await this.iconeOlho.click();
  }

  // A plataforma exibe a mensagem de erro duas vezes na tela
  mensagem(texto: string): Locator {
    return this.page.getByText(texto, { exact: true }).first();
  }
}
