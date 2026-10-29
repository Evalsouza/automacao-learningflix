export const paginas = {
  verificacao: 'Verificação de idade e localização',
  novaConta: 'Nova conta',
};

export const cargos = {
  analistaDeQualidade: 'Analista de Qualidade',
  gestorDaEstudante: 'Supervisor de Qualidade',
};

export const pais = 'Brasil';

// Verificação de idade — a QA confirmou: 10 e 15 anos são bloqueados na página "Menor digital"; 17 anos segue para a "Nova conta"
export const menorDigital = { titulo: 'Menor digital', mensagem: 'Você é muito jovem para criar uma conta neste site.' };
export const verificacoesDeIdade = [
  { id: 'IDA01', idade: '10', bloqueado: true },
  { id: 'IDA02', idade: '15', bloqueado: true },
  { id: 'IDA03', idade: '17', bloqueado: false },
];

// Campos obrigatórios: bloco do formulário e mensagem exibida quando o campo fica vazio — copiadas da tela
export const obrigatoriosVerificacao = [
  { id: 'OBR01', campo: 'Qual é a sua idade?', bloco: 'fitem_id_age', mensagem: '- Inserir um valor.' },
  { id: 'OBR02', campo: 'Em qual país você vive?', bloco: 'fitem_id_country', mensagem: '- Inserir um valor.' },
];

export const obrigatoriosNovaConta = [
  { id: 'OBR03', campo: 'CPF', bloco: 'fitem_id_username', mensagem: '- Campo obrigatório. Por favor, insira a identificação de usuário.' },
  { id: 'OBR04', campo: 'Senha', bloco: 'fitem_password', mensagem: '- Campo obrigatório. Por favor, insira a senha.' },
  { id: 'OBR05', campo: 'Confirme a senha.', bloco: 'fitem_passwordconfirm', mensagem: '- Campo obrigatório. Por favor, insira a senha.' },
  { id: 'OBR06', campo: 'Endereço de e-mail', bloco: 'fitem_id_email', mensagem: '- Campo obrigatório. Por favor, insira o e-mail.' },
  {
    id: 'OBR07',
    campo: 'Confirmar endereço de e-mail',
    bloco: 'fitem_id_email2',
    mensagem: '- Campo obrigatório. Por favor, insira o e-mail.',
  },
  { id: 'OBR08', campo: 'Nome', bloco: 'fitem_id_firstname', mensagem: '- Campo obrigatório. Por favor, insira o nome' },
  { id: 'OBR09', campo: 'Sobrenome', bloco: 'fitem_id_lastname', mensagem: '- Campo obrigatório. Por favor, insira o sobrenome' },
];

// Marcado como obrigatório, mas sem mensagem: dia, mês e ano já vêm com valor padrão
export const dataNascimento = { id: 'OBR10', campo: 'Data de Nascimento', bloco: 'fitem_id_profile_field_dtanasc' };
