import { Page, Locator } from '@playwright/test';
import { PaginaBase } from '../PaginaBase';

// Administração do site → Usuários → Lista de usuários. Usada só pela suíte de cadastro real
export class ListaUsuariosAdminPage extends PaginaBase {
  readonly filtroNome: Locator;

  constructor(page: Page) {
    super(page);
    this.filtroNome = page.getByRole('textbox', { name: 'realname' }).or(page.locator('input[name=realname]')).first();
  }

  async acessar() {
    await this.abrir('/admin/user.php');
  }

  // Os filtros ficam guardados na sessão do Administrador e se somam entre execuções: limpa antes de filtrar (17/11).
  // Com filtros antigos somados, a limpeza não encontrava o qa.auto1 e a conta ficava na plataforma
  async filtrarPorNome(nomeCompleto: string) {
    const removerTodos = this.page.getByRole('button', { name: 'Remover todos os filtros' });
    if (await removerTodos.count()) {
      await removerTodos.click();
      await this.page.waitForLoadState('load');
    }
    await this.filtroNome.fill(nomeCompleto);
    await this.page.getByRole('button', { name: 'Adicionar filtro' }).click();
    // A página recarrega com o filtro: espera a lista ou o aviso de lista vazia antes de procurar a linha
    await this.page.waitForLoadState('load');
    await this.page
      .getByRole('row')
      .filter({ hasText: nomeCompleto })
      .first()
      .or(this.page.getByText('Nenhum usuário encontrado'))
      .first()
      .waitFor();
  }

  // Linha pelo texto exibido nela — nome ou e-mail
  linha(texto: string): Locator {
    return this.page.getByRole('row').filter({ hasText: texto });
  }

  // Os ícones da linha não têm texto: o link é identificado pela ação na URL
  async confirmarConta(texto: string) {
    await this.linha(texto).locator('a[href*="confirmuser="]').click();
  }

  async excluir(texto: string) {
    await this.linha(texto).locator('a[href*="delete="]').click();
    await this.page.getByRole('button', { name: 'Excluir' }).click();
    await this.page.waitForLoadState('load');
  }

  // Exclui a conta pelo e-mail, que é único — nunca outro usuário com o mesmo nome
  async excluirSeExistir(nomeCompleto: string, email: string) {
    await this.acessar();
    await this.filtrarPorNome(nomeCompleto);
    if (await this.linha(email).count()) await this.excluir(email);
  }
}
