import { Page } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

export type ConfiguracaoDoLogin = {
  // Valor do "Auto-cadastro" (registerauth): vazio quando desativado
  autoCadastro: string;
  // "Botão de entrada como visitante" (guestloginbutton): texto da opção, "Mostrar" ou "Ocultar"
  botaoVisitante: string;
  // "Lembrar nome de usuário" (rememberusername): 0 Não, 1 Sim, 2 Opcional — o "Lembrar-me" só aparece em 2
  lembrarUsuario: string;
  // "URL para 'Esqueci minha senha'" (forgottenpasswordurl): vazia usa a página da plataforma
  urlEsqueciSenha: string;
};

// Configurações que definem o que a página de login exibe — leitura como Administrador, sem salvar
export class ConfiguracaoLoginPage extends PaginaBase {
  constructor(page: Page) {
    super(page);
  }

  async ler(): Promise<ConfiguracaoDoLogin> {
    await this.abrir('/admin/settings.php?section=manageauths');
    const valor = (nome: string) => this.page.locator(`[name="${nome}"]`).first().inputValue();
    const textoSelecionado = (nome: string) => this.page.locator(`select[name="${nome}"] option:checked`).innerText();
    const autoCadastro = await valor('s__registerauth');
    const botaoVisitante = (await textoSelecionado('s__guestloginbutton')).trim();
    const urlEsqueciSenha = await valor('s__forgottenpasswordurl');
    // "Lembrar nome de usuário" fica em outra seção: a busca da administração mostra o campo
    await this.abrir('/admin/search.php?query=rememberusername');
    const lembrarUsuario = await valor('s__rememberusername');
    return { autoCadastro, botaoVisitante, lembrarUsuario, urlEsqueciSenha };
  }
}
