// Falhas já conhecidas — possíveis defeitos e defeitos registrados no RASTREABILIDADE.md de cada módulo.
// Critério de saída da Estratégia de Automação (seção 10), aprovado pela QA em 16/11/2026: estas falhas aparecem
// no relatório como "conhecidas", mas não entram na meta de aprovação. Se uma delas passar, o relatório avisa
// para revisar esta lista. Ao registrar ou fechar um possível defeito, atualize aqui e no RASTREABILIDADE.md.
// Quando a skill de bugs estiver pronta, o campo `jira` liga cada falha ao bug aberto.
import type { Modulo } from './prioridades';

export type FalhaConhecida = { modulo: Modulo; id: string; motivo: string; desde: string; jira?: string };

export const falhasConhecidas: FalhaConhecida[] = [
  {
    modulo: 'Login',
    id: 'C03.1',
    motivo: 'Sem "Lembrar-me", o usuário continua salvo após "Sair" (cookie MOODLEID1_)',
    desde: '27/10/2026',
  },
  {
    modulo: 'Cadastro',
    id: 'C007',
    motivo: 'Cargos de gestão exibidos no campo "Cargo" da "Nova conta"',
    desde: '28/10/2026',
  },
  ...['C008', 'C008.1', 'C009.1', 'C010.1', 'C009.2', 'C010.2'].map((id) => ({
    modulo: 'Cadastro' as const,
    id,
    motivo: 'Defeito confirmado pela QA: "Criar minha conta" com dados válidos não cria a conta',
    desde: '28/10/2026',
  })),
  {
    modulo: 'Cadastro',
    id: 'RC03',
    motivo: '"Não visível" no "Cargo" não esconde o campo da Estudante',
    desde: '26/10/2026',
  },
  ...['OBR01', 'OBR02', 'OBR03'].map((id) => ({
    modulo: 'Visitante' as const,
    id,
    motivo: 'Ajuda do visitante: campo com marca de obrigatório não exibe mensagem ao enviar vazio',
    desde: '28/10/2026',
  })),
  {
    modulo: 'Visitante',
    id: 'CAN01',
    motivo: '"Cancelar" da Ajuda não limpa o formulário',
    desde: '28/10/2026',
  },
  ...['MC11', 'MC13'].map((id) => ({
    modulo: 'MeusCursos' as const,
    id,
    motivo:
      'Defeito confirmado pela QA (17/11): "Número de cards na página" abaixo do mínimo de 8 é salvo ("Mudanças gravadas" com 3 e com 7)',
    desde: '17/11/2026',
  })),
];

// Critério de saída — Estratégia de Automação, seção 10
export const metaDeAprovacao = { criticos: 100, geral: 95 };
