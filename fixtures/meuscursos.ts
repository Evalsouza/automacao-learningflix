// DT/EVT - Página inicial: Bloco "Meus Cursos" e DT/EVT - Obrigatoriedade do Curso (LFXP-6914)

export const textosMeusCursos = {
  titulo: 'Meus Cursos',
  verTodos: 'Ver todos',
  semCursos: 'Nenhum curso',
  gravadas: 'Mudanças gravadas',
  erroGeral: 'Algumas configurações não mudaram devido a um erro.',
};

// Classificações do campo "Obrigatoriedade" — "Opcional" é a selecionada por padrão no bloco
export const obrigatoriedades = ['Necessário', 'Opcional'] as const;
export type Obrigatoriedade = (typeof obrigatoriedades)[number];
export const obrigatoriedadePadrao: Obrigatoriedade = 'Opcional';

// Requisito CBTD v8 (RF002, RF003, RNF001 e RNF002)
export const limitesMeusCursos = {
  cardsNaHome: 4,
  cardsPorPaginaPadrao: 8,
  // Abaixo do mínimo de 8 — o DT/EVT usa 3 (Página inicial) e 6 (Página Genérica)
  abaixoDoMinimo: 3,
  // Acima do padrão — CASOS DE TESTE 01 do DT/EVT
  cardsPorPaginaDeTeste: 9,
};

// Opções do "Ordenar por" no "Ver todos": valor da URL → texto da tela
export const ordenacoes = {
  nome: { valor: 'course_name', texto: 'Nome do curso' },
  criacao: { valor: 'course_created', texto: 'Data de criação do curso' },
  ultimosAcessados: { valor: 'last_access', texto: 'Últimos acessados' },
  maisAssistidos: { valor: 'most_visited', texto: 'Mais assistidos' },
  inicioDaInscricao: { valor: 'enrollment_start', texto: 'Data de início da inscrição' },
};

// Opções do filtro "Cursos" (status)
export const statusDoCurso = {
  todos: { valor: 'all', texto: 'Todos' },
  emAndamento: { valor: 'in_progress', texto: 'Em andamento' },
  naoIniciados: { valor: 'not_started', texto: 'Não iniciados' },
};
