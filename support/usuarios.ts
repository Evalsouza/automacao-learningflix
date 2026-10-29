// Usuários fixos dos testes — identificação e senha vêm do .env
export const usuarios = {
  administrador: {
    nome: 'Admin Revvo',
    identificacao: process.env.ADMINISTRADOR_USUARIO ?? '',
    senha: process.env.ADMINISTRADOR_SENHA ?? '',
  },
  cliente: {
    nome: 'Adm Cliente',
    identificacao: process.env.CLIENTE_USUARIO ?? '',
    senha: process.env.CLIENTE_SENHA ?? '',
  },
  estudante: {
    nome: 'Eva Souza',
    identificacao: process.env.ESTUDANTE_USUARIO ?? '',
    senha: process.env.ESTUDANTE_SENHA ?? '',
  },
};

// Usuários do DTI/EVTI - Redefinição de Senha Personalizada. Cargo e data de nascimento são lidos
// do cadastro na hora da execução, porque podem ser atualizados a qualquer momento
export const usuariosRedefinicao = {
  evaSouza: { nome: 'Eva Souza', identificacao: 'eva.souza' },
  meridaValente: { nome: 'Merida Valente', identificacao: 'qa.aluno5' },
  anyaForger: { nome: 'Anya Forger', identificacao: 'qa.anya' },
  qaAluno21: { nome: 'Maria Fernanda Silva', identificacao: 'qa.aluno21' },
  // Massa limpa pela QA em 26/10: sem "Cargo" e sem "Cidade de Nascimento". Sobrenome marcado como AUTOMTIZADO
  rayssaLima: { nome: 'Rayssa Lima AUTOMTIZADO', identificacao: 'qa.aluno102' },
};

// Usuários que a suíte de cadastro real cria e exclui ao final — DTI/EVTI Criar uma conta.
// Ficam fora do login dos perfis: as contas só existem durante essa suíte. Senha em NOVO_CADASTRO_SENHA no .env.
// Os dois têm o nome "QA AUTOMAÇÃO" — decisão da QA: a suíte encontra cada um pelo e-mail, que é único
export const novoCadastro = {
  nome: 'QA',
  sobrenome: 'AUTOMAÇÃO',
  identificacao: 'qa.auto1',
  email: 'qa.auto1@yopmail.com',
  senha: process.env.NOVO_CADASTRO_SENHA ?? '',
};

// Mesmo cadastro, com o Cargo preenchido — cobertura com e sem Cargo, decisão da QA
export const novoCadastroComCargo = {
  nome: 'QA',
  sobrenome: 'AUTOMAÇÃO',
  identificacao: 'qa.auto2',
  email: 'qa.auto2@yopmail.com',
  senha: process.env.NOVO_CADASTRO_SENHA ?? '',
};
