import { test as base, expect } from '@playwright/test';
import { LoginPage } from './login_commands/LoginPage';
import { MenuUsuario } from './commands';
import { CriarContaPage } from './cadastro_commands/CriarContaPage';
import { CamposPerfilPage } from './cadastro_commands/CamposPerfilPage';
import { GerenciadorHierarquiaPage } from './cadastro_commands/GerenciadorHierarquiaPage';
import { GerenciarUsuariosPage } from './cadastro_commands/GerenciarUsuariosPage';
import { MinhaPaginaPage } from './cadastro_commands/MinhaPaginaPage';
import { ListaUsuariosAdminPage } from './cadastro_commands/ListaUsuariosAdminPage';
import { VisitantePage } from './acessovisitante_commands/VisitantePage';
import { AjudaPage } from './acessovisitante_commands/AjudaPage';
import { GerenciarAutenticacaoPage } from './acessovisitante_commands/GerenciarAutenticacaoPage';
import { CursoPage } from './acessovisitante_commands/CursoPage';
import { PerdeuSenhaPage } from './redefinicaosenha_commands/PerdeuSenhaPage';
import { ConfiguracaoRedefinicaoPage } from './redefinicaosenha_commands/ConfiguracaoRedefinicaoPage';
import { RodapePage } from './rodape_commands/RodapePage';
import { TemaPage } from './rodape_commands/TemaPage';

type Telas = {
  login: LoginPage;
  menu: MenuUsuario;
  criarConta: CriarContaPage;
  camposPerfil: CamposPerfilPage;
  hierarquia: GerenciadorHierarquiaPage;
  gerenciarUsuarios: GerenciarUsuariosPage;
  minhaPagina: MinhaPaginaPage;
  listaUsuariosAdmin: ListaUsuariosAdminPage;
  visitante: VisitantePage;
  ajuda: AjudaPage;
  gerenciarAutenticacao: GerenciarAutenticacaoPage;
  curso: CursoPage;
  perdeuSenha: PerdeuSenhaPage;
  configuracaoRedefinicao: ConfiguracaoRedefinicaoPage;
  rodape: RodapePage;
  tema: TemaPage;
};

// Telas disponíveis em todos os testes: async ({ login, menu, criarConta }) => { ... }
export const test = base.extend<Telas>({
  login: async ({ page }, use) => use(new LoginPage(page)),
  menu: async ({ page }, use) => use(new MenuUsuario(page)),
  criarConta: async ({ page }, use) => use(new CriarContaPage(page)),
  camposPerfil: async ({ page }, use) => use(new CamposPerfilPage(page)),
  hierarquia: async ({ page }, use) => use(new GerenciadorHierarquiaPage(page)),
  gerenciarUsuarios: async ({ page }, use) => use(new GerenciarUsuariosPage(page)),
  minhaPagina: async ({ page }, use) => use(new MinhaPaginaPage(page)),
  listaUsuariosAdmin: async ({ page }, use) => use(new ListaUsuariosAdminPage(page)),
  visitante: async ({ page }, use) => use(new VisitantePage(page)),
  ajuda: async ({ page }, use) => use(new AjudaPage(page)),
  gerenciarAutenticacao: async ({ page }, use) => use(new GerenciarAutenticacaoPage(page)),
  curso: async ({ page }, use) => use(new CursoPage(page)),
  perdeuSenha: async ({ page }, use) => use(new PerdeuSenhaPage(page)),
  configuracaoRedefinicao: async ({ page }, use) => use(new ConfiguracaoRedefinicaoPage(page)),
  rodape: async ({ page }, use) => use(new RodapePage(page)),
  tema: async ({ page }, use) => use(new TemaPage(page)),
});

export { expect };
