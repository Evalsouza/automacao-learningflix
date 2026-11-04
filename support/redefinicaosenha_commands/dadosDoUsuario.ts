import type { Browser } from '@playwright/test';
import { GerenciarUsuariosPage } from '../cadastro_commands/GerenciarUsuariosPage';
import { sessoes, comSessao } from '../sessoes';

// Lê, como Administrador, os campos de perfil do usuário no "Editar usuário" — sem salvar nada
export function lerDadosDoUsuario(browser: Browser, nome: string): Promise<Record<string, string>> {
  return comSessao(browser, sessoes.administrador, async (pagina) => {
    const gerenciar = new GerenciarUsuariosPage(pagina);
    await gerenciar.acessarPelaAdministracao();
    return gerenciar.dadosDoUsuario(nome);
  });
}
