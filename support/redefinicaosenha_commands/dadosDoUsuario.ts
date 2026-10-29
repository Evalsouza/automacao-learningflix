import type { Browser } from '@playwright/test';
import { GerenciarUsuariosPage } from '../cadastro_commands/GerenciarUsuariosPage';

// Lê, como Administrador, os campos de perfil do usuário no "Editar usuário" — sem salvar nada
export async function lerDadosDoUsuario(browser: Browser, nome: string): Promise<Record<string, string>> {
  const contexto = await browser.newContext({ storageState: '.auth/administrador.json' });
  try {
    const gerenciar = new GerenciarUsuariosPage(await contexto.newPage());
    await gerenciar.acessarPelaAdministracao();
    return await gerenciar.dadosDoUsuario(nome);
  } finally {
    await contexto.close();
  }
}
