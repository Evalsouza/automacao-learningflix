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
  // Valor-limite do mínimo (requisito v8: 8 é o mínimo e o padrão) — lacuna (d) da Estratégia, 17/11
  logoAbaixoDoMinimo: 7,
  minimo: 8,
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

// Campo personalizado de curso "Obrigatoriedade" (Administração → Cursos → Campos personalizados de curso) — mapeado em
// 19/11. DT/EVT Obrigatoriedade - Como Administrador, casos 001 a 005. Só leitura: o modal é aberto e cancelado
export const campoObrigatoriedade = {
  categoria: 'Informações do curso para os blocos',
  nome: 'Obrigatoriedade',
  nomeBreve: 'courserequirement',
  tipo: 'Menu suspenso',
  tituloDoModal: 'Atualizando Obrigatoriedade',
  // Campos do modal pelo atributo name: texto (valor digitado) e lista (opção marcada)
  texto: {
    'configdata[options]': 'Necessário\nOpcional',
    'configdata[defaultvalue]': 'Opcional',
  },
  lista: {
    'configdata[required]': 'Não',
    'configdata[uniquevalues]': 'Não',
    'configdata[locked]': 'Não',
    'configdata[visibility]': 'Todos',
  },
};

// Opções do campo nas Configurações do curso — "Nenhuma" deixa o curso sem classificação (Capa, Observações)
export const opcoesNoCurso = ['Nenhuma', 'Necessário', 'Opcional'];
// Catálogo: a página inicial lista só as categorias; os cursos aparecem ao abrir uma categoria — mapeado em 19/11
export const categoriaDoCatalogo = { id: 16, nome: 'Qualidade e Testes de Software' };

// Curso usado só para ler as Configurações (OB13), sem salvar
export const cursoDeReferencia = 120;

// Curso com "Obrigatoriedade" = "Nenhuma" exibido no bloco "Em Alta" — informado pela QA em 19/11
export const cursoSemClassificacao = { id: '125', bloco: 'popularcourses', tituloDoBloco: 'Em Alta' };

// Demais blocos da Página inicial com "Ver todos" e filtro "Obrigatoriedade" — DT/EVT Usuário Final 001 e 017 a 020
export const blocosComObrigatoriedade = [
  { bloco: 'newsforyou', titulo: 'Novidades para você' },
  { bloco: 'popularcourses', titulo: 'Em Alta' },
  { bloco: 'freecourses', titulo: 'Cursos Livres' },
  { bloco: 'recommendedcourses', titulo: 'Recomendados para você' },
  { bloco: 'skillcourses', titulo: 'Cursos recomendados para seu cargo' },
];
