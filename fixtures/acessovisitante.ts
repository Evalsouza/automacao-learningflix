export const paginas = {
  politica: 'Acordo de política do site',
  inicialDoVisitante: 'Painel (Visitante)',
  calendario: 'Calendário',
  ajuda: 'Ajuda',
  dashboards: 'Geral',
  chamados: 'Chamados',
};

// Blocos da Página Inicial do visitante: os 4 do DT/EVT e os 2 que a tela também exibe
export const blocos = [
  'Meus Cursos',
  'Cursos Livres',
  'Em Alta',
  'Recomendados para você',
  'Novidades para você',
  'Cursos recomendados para seu cargo',
];

// Opções do menu lateral do visitante. "Dashboards" e "Chamados" não estão no DT/EVT: incluídas a pedido da QA.
// O link "Teste" também aparece, mas não é validado — decisão da QA
export const menuLateral = ['Página inicial', 'Dashboards', 'Calendário', 'Ajuda', 'Chamados'];

// Abas exibidas ao visitante em "Dashboards"
export const abasDashboards = ['Geral', 'Usuários', 'Gamificação', 'Recertificação'];

// O DT/EVT usa "TESTE BOTÃO SCORM - Com restrição"; o teste abre o primeiro curso exibido no bloco — decisão da QA
export const cursoRestrito = {
  bloco: 'Cursos Livres',
  mensagem: 'Visitantes não podem acessar este curso. Por favor faça login.',
};

// Curso indicado pela QA, com o método "Acesso como visitante" configurado
export const cursoVisitante = {
  id: 319,
  nome: 'ACESSO COMO VISITANTE',
  metodo: 'Acesso como visitante',
  temporada: 'Temporada 1',
  atividade: 'Acesso como visitante',
  tipoAtividade: 'Tarefa',
};

export const obrigatoriosAjuda = [
  { id: 'OBR01', campo: 'Selecione o curso', bloco: 'fitem_id_course' },
  { id: 'OBR02', campo: 'Selecione o assunto', bloco: 'fitem_id_subject' },
  { id: 'OBR03', campo: 'Mensagem', bloco: 'fitem_id_messagetext' },
];

export const assuntoAjuda = 'Assunto 1';

// Para o visitante, "Nome" e "Matrícula" vêm preenchidos e bloqueados
export const dadosDoVisitanteNaAjuda = { nome: 'Usuário visitante', matricula: 'guest' };
