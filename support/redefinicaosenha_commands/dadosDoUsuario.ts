import type { Browser } from '@playwright/test';
import { GerenciarUsuariosPage } from '../cadastro_commands/GerenciarUsuariosPage';
import { sessoes, comSessao, Sessao } from '../sessoes';

// Lê, como Administrador (ou o perfil informado), os campos de perfil do usuário no "Editar usuário" — sem salvar nada
export function lerDadosDoUsuario(browser: Browser, nome: string, sessao: Sessao = sessoes.administrador): Promise<Record<string, string>> {
  return comSessao(browser, sessao, async (pagina) => {
    const gerenciar = new GerenciarUsuariosPage(pagina);
    await gerenciar.acessarPelaAdministracao();
    return gerenciar.dadosDoUsuario(nome);
  });
}
