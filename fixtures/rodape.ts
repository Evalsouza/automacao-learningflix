// LFXP-1941 — Validação das alterações realizadas (habilitar/desabilitar o footer) — História LFXP-1907

// Opções do Tema: rótulo na tela e nome interno da configuração (theme_smart | <chave>)
export const opcoesRodape = {
  usuario: { rotulo: 'Habilitar footer para usuário', chave: 'footerHiden' },
  administrador: { rotulo: 'Habilitar footer para administrador', chave: 'enable_mustaches_footer' },
  login: { rotulo: 'Habilitar footer para pagina de login', chave: 'enable_login_footer' },
};

export const padraoDasOpcoes = 'Padrão: Não';

// Links exibidos quando a opção está habilitada. O Jira escreve "Termo"; a História LFXP-1907, "Termos"
export const linksDoLogin = ['Ajuda', 'Privacidade', 'Termos'];
export const linksAposLogin = ['Privacidade', 'Termos'];

// Quem segue cada opção — Adm Cliente segue a opção de usuário, decisão da QA
export const perfisDoRodape = [
  { perfil: 'Estudante', sessao: '.auth/estudante.json', opcao: 'usuario' as const },
  { perfil: 'Adm Cliente', sessao: '.auth/cliente.json', opcao: 'usuario' as const },
  { perfil: 'Administrador', sessao: '.auth/administrador.json', opcao: 'administrador' as const },
];

// O tema esconde o rodapé em telas estreitas (classes "d-none d-md-flex" no login e "d-none d-lg-block" após o login)
export const larguraMinimaDoRodape = { login: 768, aposLogin: 992 };
