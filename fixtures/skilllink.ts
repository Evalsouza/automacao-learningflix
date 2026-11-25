// Massa do DR/EVTR - Skill Link, Fluxo da Gestão (LP1 5824806913) — valores copiados das condições e
// ids de curso/atividade/cargo usados nas evidências de 13 e 18/11/2026 (branch evidencia/skill-link-fluxo-gestao)

export const caminhosSkillLink = {
  configuracao: '/admin/settings.php?section=local_skillbox',
  creditosCliente: '/local/skillbox/credits.php',
  creditosAdmin: '/local/skillbox/tokens.php',
  modificarCreditos: '/local/skillbox/change_tokens.php',
  administracaoCliente: '/theme/smart/client_admin.php',
  // Página "Skill Link" da Administração do Adm Cliente, com os atalhos de competências (desde 24/11; mapeada em 25/11)
  paginaSkillLink: '/theme/smart/client_admin.php?section=skilllink',
  administracaoDoSite: '/admin/search.php',
  cargos: '/local/hierarchy/index.php/positions',
  recomendados: '/blocks/skillcourses/index.php',
  perfil: '/user/profile.php',
  meusCursos: '/my/courses.php',
};

// Cenário 1 — opções "Habilitar geração de competências com IA para …" e a tela de cada uma
// (curso 283, SCORM 3076, vídeo 3078 e arquivo 3075: telas dos tutoriais aprovadas pela QA)
export type TelaSkillLink = {
  opcao: string;
  rotulo: string;
  desmarcada: string;
  marcada: string;
  telas: { nome: string; url: string; janelaCargo?: 'Adicionar cargo' | 'Editar cargo' }[];
};

export const telasDaIA: TelaSkillLink[] = [
  {
    opcao: 'ai_generation_enabled',
    rotulo: 'cargos',
    desmarcada: 'C009',
    marcada: 'C010',
    telas: [
      { nome: 'criação de cargo', url: caminhosSkillLink.cargos, janelaCargo: 'Adicionar cargo' },
      { nome: 'edição de cargo', url: `${caminhosSkillLink.cargos}/edit/163`, janelaCargo: 'Editar cargo' },
    ],
  },
  {
    opcao: 'ai_generation_enabled_course',
    rotulo: 'cursos',
    desmarcada: 'C011',
    marcada: 'C012',
    telas: [
      { nome: 'criação de curso', url: '/course/edit.php?category=1' },
      { nome: 'edição de curso', url: '/course/edit.php?id=283' },
    ],
  },
  {
    opcao: 'ai_generation_enabled_scorm',
    rotulo: 'atividades SCORM',
    desmarcada: 'C013',
    marcada: 'C014',
    telas: [{ nome: 'SCORM 3076', url: '/course/modedit.php?update=3076' }],
  },
  {
    opcao: 'ai_generation_enabled_streaming',
    rotulo: 'atividades de vídeo',
    desmarcada: 'C015',
    marcada: 'C016',
    telas: [{ nome: 'vídeo 3078', url: '/course/modedit.php?update=3078' }],
  },
  {
    opcao: 'ai_generation_enabled_resource',
    rotulo: 'atividades de arquivo',
    desmarcada: 'C017',
    marcada: 'C018',
    telas: [{ nome: 'arquivo 3075', url: '/course/modedit.php?update=3075' }],
  },
];

export const configuracaoSkillLink = {
  titulo: 'Configurações de competências',
  campos: ['URL da API Prisma', 'Chave de API Prisma', 'URL da Lizza', 'Token da Lizza'],
  creditosPadrao: '500',
  // C020 — "NÃO permitiu salvar"; o vazio é salvo como "0", sem bloqueio (QA, 19/11)
  creditosInvalidos: [
    { id: 'C020.1', valor: '5,50', tipo: 'com vírgula' },
    { id: 'C020.2', valor: '-500', tipo: 'negativo' },
    { id: 'C020.3', valor: 'abc', tipo: 'texto' },
  ],
  // C021 — "0" é salvo sem bloqueio
  creditosZero: '0',
  gravadas: 'Mudanças gravadas',
  // C007 — endereços que não resolvem; curso e atividade citados no DR
  urlInvalidaPrisma: 'https://prisma-invalido.qa.test',
  urlInvalidaLizza: 'https://lizza-invalido.qa.test',
  cursoC007: '/course/edit.php?id=315',
  atividadeC007: '/course/modedit.php?update=3037',
  cursoC008: '/course/edit.php?id=283',
};

// Cenário 2 — "Créditos do Skill Link"
export const creditosSkillLink = {
  // Desde 24/11 a plataforma chama a página de "Consumo de IA no LearningFlix" (antes "Skill Link", com o link
  // "Créditos do Skill Link"). Sem requisito no LP1 sobre a mudança: confirmar com a QA (25/11)
  titulo: 'Consumo de IA no LearningFlix',
  link: 'Consumo de IA no LearningFlix',
  // C024 — nesta ordem, da esquerda para a direita (QA, 19/11). Com "Todo o período" o card "Créditos restantes" não
  // é exibido (C027)
  cards: ['Franquia mensal', 'Créditos contratados', 'Créditos consumidos', 'Créditos restantes'],
  cardsTodoPeriodo: ['Franquia mensal', 'Créditos contratados', 'Créditos consumidos'],
  periodoTodo: 'Todo o período',
  periodoMes: 'Novembro de 2026',
  atalhos: [
    // Janela: Categoria → Curso (→ Atividade) → "Editar". Destinos mapeados no QA em 19/11
    { id: 'C030', nome: 'Cursos', janela: 'Editar curso', destino: /coursemanagement/, tela: 'Editar configurações do curso' },
    { id: 'C031', nome: 'Vídeos', janela: 'Editar vídeo', destino: /course\/modedit\.php/, tela: /Atualizando um Streaming/ },
    { id: 'C032', nome: 'SCORM', janela: 'Editar SCORM', destino: /course\/modedit\.php/, tela: /Atualizando um Pacote SCORM/ },
  ],
  graficos: ['Consumo de créditos por tipo', 'Distribuição do consumo'],
  colunasConsumo: ['Data', 'Tipo', 'Recurso', 'Usuário', 'Créditos', 'Saldo após', 'Ações'],
  tipoFiltrado: 'Cargo',
  modificar: 'Modificar créditos',
  // Texto visto em 25/11 (antes: "Adicione créditos ao saldo do Skill Link...", da correção do LFXP-7126)
  subtitulo: 'Adicione ou desconte créditos do saldo do Skill Link e acompanhe o histórico completo de alterações.',
  // Botão de "Modificar créditos": era "Adicionar créditos" até 24/11
  ajustar: 'Ajustar créditos',
  colunasAlteracoes: ['Data', 'Tipo', 'Usuário', 'Valor em dólares (US$)', 'Créditos'],
  quantidadeValida: '1',
  quantidadesInvalidas: [
    { id: 'C045.1', valor: '0', tipo: 'zero' },
    { id: 'C045.2', valor: '-10', tipo: 'negativo' },
    { id: 'C045.3', valor: '1.5', tipo: 'decimal' },
    { id: 'C045.4', valor: 'abc', tipo: 'texto' },
  ],
  campoObrigatorio: 'Campo obrigatório',
};

// Cenário 3 — "Cursos recomendados para o seu cargo" com a Estudante (Eva Souza)
export const recomendados = {
  titulo: /Cursos recomendados para (o )?seu cargo/,
  cargo: 'Analista de Qualidade',
  cargoId: '163',
  filtros: ['Cursos', 'Modalidades', 'Obrigatoriedade', 'Ordenar por', 'Buscar'],
  termoBusca: 'Controle',
  // C060 — a busca procura em campos da configuração do curso (nome, competências…): basta localizar o curso com o termo no
  // nome (QA, 19/11)
  cursoComTermo: '315',
  modalidade: 'Presencial',
  // C062 — "Teste duplicar curso"; C063 — "Qa1"; C064 — curso oculto
  cursoSemAutoinscricao: '212',
  // C070 — o 299 não grava a remoção (18/11): a QA indicou o 284, com a competência posta e depois tirada (19/11)
  cursoC070: '284',
  obrigatoriedades: ['Necessário', 'Opcional'],
  cursoSemCompetencia: '313',
  cursoOculto: '227',
  // C071/C072 — competência retirada e devolvida ao cargo; cursos que só têm ela em comum (18/11)
  competencia: 'Controle de Qualidade',
  cursosSoComACompetencia: ['299', '227'],
  // C067/C073 — vídeo 3017 do curso 313 (sem competências próprias)
  videoC067: '/course/modedit.php?update=3017',
  // C065/C066 — curso indicado pela QA em 19/11 (o 325 ficou com resíduo em 18/11). As atividades SCORM e Arquivo
  // são lidas na página do curso a cada execução
  cursoAtividades: '230',
  semPermissao: /não tem permissão/i,
  telasSemPermissao: ['/local/hierarchy/index.php/positions', '/course/edit.php?category=1'],
};
