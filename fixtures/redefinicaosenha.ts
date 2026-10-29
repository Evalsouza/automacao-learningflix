export const mensagens = {
  dadosIncorretos: 'Algo deu errado ao alterar a senha. Por favor, tente novamente!',
  campoObrigatorio: '- Campo obrigatório',
};

export const paginas = {
  perdeuSenha: 'Perdeu a senha?',
  redefinir: 'Redefinir senha',
};

// Configuração atual da redefinição personalizada
export const configuracaoAtual = { primario: 'CPF', secundario: 'Data de Nascimento' };

export const visibilidades = {
  naoVisivel: 'Não visível',
  usuario: 'Visível para o usuário',
  usuarioProfessoresAdmins: 'Visivel para o usuário, professores e administradores',
  todos: 'Visível para todos',
};

// Regra confirmada pela QA: o campo só aparece no "Campo secundário" com Obrigatório = Sim
// e uma visibilidade que inclua o usuário, sem ser "Visível para todos"
export const apareceNoSecundario = (obrigatorio: string, visibilidade: string) =>
  obrigatorio === 'Sim' && [visibilidades.usuario, visibilidades.usuarioProfessoresAdmins].includes(visibilidade);

// Campos de perfil: rótulo na tela e nome interno no cadastro do usuário
export const camposSecundarios = [
  { campo: 'Cargo', chave: 'position' },
  { campo: 'Unidade', chave: 'structure' },
  { campo: 'Regional', chave: 'regional' },
  { campo: 'Setor', chave: 'sector' },
];

export const camposPrimarios = [
  { campo: 'Telefone', chave: 'testphone' },
  { campo: 'Cargo', chave: 'position' },
  { campo: 'Cidade de Nascimento', chave: 'city' },
];

// Configuração do campo para entrar no "Campo primário", conforme a QA
export const configuracaoPrimario = { obrigatorio: 'Sim', unica: 'Sim', visibilidade: visibilidades.usuarioProfessoresAdmins } as const;

// Ao final da suíte de configuração, o Cargo volta para os valores de 22/10/2026 — decisão da QA
export const cargoEm22Out = { obrigatorio: 'Não', unica: 'Não', visibilidade: visibilidades.todos } as const;
