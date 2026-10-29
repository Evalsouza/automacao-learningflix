import { Page, Locator } from '@playwright/test';

// Sidebar → Administração → Gerenciar Usuários
export class GerenciarUsuariosPage {
  readonly page: Page;
  readonly campoPesquisa: Locator;
  readonly modalEditar: Locator;
  readonly cargoNoModal: Locator;
  readonly botaoCancelarModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.campoPesquisa = page.getByRole('textbox', { name: 'Pesquisa' });
    this.modalEditar = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Editar usuário' }) });
    this.cargoNoModal = this.modalEditar.locator('select[name=profile_field_position] option:checked');
    this.botaoCancelarModal = this.modalEditar.getByRole('button', { name: 'Cancelar' });
  }

  async acessarPelaAdministracao() {
    await this.page.goto('/my/');
    const administracao = this.page.getByRole('link', { name: 'Administração', exact: true });
    // O Administrador geral não tem "Administração" no sidebar, só "Administração do site": abre a mesma página direto
    if (await administracao.count()) await administracao.first().click();
    else await this.page.goto('/theme/smart/client_admin.php');
    await this.page.getByRole('link', { name: 'Gerenciar Usuários', exact: true }).click();
  }

  async pesquisar(nome: string) {
    await this.campoPesquisa.fill(nome);
    await this.campoPesquisa.press('Enter');
    await this.linha(nome).waitFor();
  }

  linha(nome: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(nome) });
  }

  // Clique pelo título exato: na mesma linha ficam "Suspender conta de usuário" e "Ativar conta de usuário"
  async abrirEdicao(nome: string) {
    await this.linha(nome).getByTitle('Editar usuário', { exact: true }).click();
    await this.botaoCancelarModal.waitFor();
  }

  async idDoUsuario(nome: string): Promise<string> {
    const href = await this.linha(nome).locator('a[href*="profile.php?id="]').first().getAttribute('href');
    return href?.match(/id=(\d+)/)?.[1] ?? '';
  }

  // Lê os campos de perfil do usuário no "Editar usuário" e fecha sem salvar.
  // Listas devolvem o texto da opção; datas, no formato d/m/Y; sem valor, devolve ''
  async dadosDoUsuario(nome: string): Promise<Record<string, string>> {
    await this.pesquisar(nome);
    await this.abrirEdicao(nome);
    await this.modalEditar.locator('[name^="profile_field_"]').first().waitFor({ state: 'attached' });
    const dados = await this.modalEditar.evaluate((modal) => {
      const valores: Record<string, string> = {};
      modal.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name^="profile_field_"]').forEach((campo) => {
        const nome = campo.name.replace('profile_field_', '');
        if (nome.includes('[')) return;
        if (campo instanceof HTMLSelectElement) {
          const texto = campo.options[campo.selectedIndex]?.text ?? '';
          valores[nome] = /^Nenhum|^Nenhuma/.test(texto) ? '' : texto;
        } else if (campo.type === 'text') valores[nome] = campo.value;
      });
      const data = (prefixo: string) => {
        const valor = (parte: string) => modal.querySelector<HTMLSelectElement>(`select[name="profile_field_${prefixo}[${parte}]"]`)?.value;
        const [d, m, a] = [valor('day'), valor('month'), valor('year')];
        return d && m && a ? `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${a}` : '';
      };
      valores.dtanasc = data('dtanasc');
      return valores;
    });
    await this.botaoCancelarModal.click();
    return dados;
  }
}
