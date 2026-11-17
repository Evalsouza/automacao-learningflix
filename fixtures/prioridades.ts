// Prioridade por risco de cada teste — Estratégia de Automação, seção 9 (aprovada pela QA em 12/11/2026).
// Risco = impacto no usuário × probabilidade de falha. Cada teste recebe uma tag: `{ tag: prioridade('Login', 'C01') }`.
// Para mudar a prioridade de um teste, altere só esta tabela.
//
//   @critico — bloqueia o acesso ou o uso principal da plataforma
//   @alto    — regra de negócio ou segurança: dado errado, acesso indevido
//   @medio   — funcionalidade secundária, configuração, campos obrigatórios
//   @baixo   — usabilidade e apresentação: "Cancelar", "Olho" da senha, responsividade

export type Prioridade = '@critico' | '@alto' | '@medio' | '@baixo';

export type Modulo = 'Login' | 'Cadastro' | 'RedefinicaoSenha' | 'Visitante' | 'Rodape' | 'Carrossel' | 'MeusCursos';

type Regras = Partial<Record<Prioridade, RegExp>>;

// Em cada módulo vale a primeira regra que casar com o ID, na ordem crítico → alto → médio → baixo
const regras: Record<Modulo, Regras> = {
  Login: {
    '@critico': /^(C01|C02|C02\.1|C08|P0[12]|P0[12]\.1)$/,
    '@alto': /^C0[4-7]$/,
    '@medio': /^(C03|C03\.1|LG01)$/,
    '@baixo': /^CT001\.\d$/,
  },
  Cadastro: {
    '@critico': /^(C002|C003|C008|C008\.1)$/,
    '@alto': /^(IDA\d+(\.\d)?|C00[15-7]|C009(\.\d)?|C010(\.\d)?|PRV\d+|RC0[1-6])$/,
    '@medio': /^(C003\.\d|C004|OBR\d+|CD\d+)$/,
    '@baixo': /^CAN\d+(\.\d)?$/,
  },
  RedefinicaoSenha: {
    '@critico': /^(RP0[3-5]|RS0[1-4])$/,
    '@alto': /^(RP0[6-8]|RP12|RS0[5-7]|RC39|RC4\d|RC5[01])$/,
    '@medio': /^(RP0[129]|RP1[01]|OBR\d+|RC[0-3]\d|RC5[2-9]|RC6\d)$/,
    '@baixo': /^CAN\d+(\.\d)?$/,
  },
  Visitante: {
    '@critico': /^V0[235]$/,
    '@alto': /^(V0[148]|V1[01])$/,
    '@medio': /^(V0[679]|V1[2-9]|V2\d|OBR\d+)$/,
    '@baixo': /^CAN\d+$/,
  },
  Rodape: {
    '@medio': /^RD\d+$/,
  },
  Carrossel: {
    '@medio': /^CR\d+$/,
  },
  MeusCursos: {
    '@critico': /^MC0[1-3]$/,
    '@alto': /^(MC04|OB\d+)$/,
    '@medio': /^(MC0[56]|MC1\d|MC2\d)$/,
  },
};

const ORDEM: Prioridade[] = ['@critico', '@alto', '@medio', '@baixo'];

// Testes sem ID do DT/EVT no título são os de responsividade: prioridade baixa.
// ID que não está na tabela falha na listagem dos testes, para não ficar sem prioridade por engano
export function prioridade(modulo: Modulo, id = ''): Prioridade {
  if (!id) return '@baixo';
  const encontrada = ORDEM.find((nivel) => regras[modulo][nivel]?.test(id));
  if (!encontrada) throw new Error(`Teste "${id}" do módulo ${modulo} sem prioridade em fixtures/prioridades.ts`);
  return encontrada;
}
