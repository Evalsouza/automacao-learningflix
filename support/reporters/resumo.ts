import type { FullConfig, FullResult, Reporter, Suite, TestCase } from '@playwright/test/reporter';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, sep } from 'node:path';

// Resumo da rodada no terminal: testes por módulo, falhas com o motivo e totais.
// Também salvo, sem cores, em test-results/resumo.txt — a skill de fechamento do dia pode ler.

const ARQUIVO_RESUMO = 'test-results/resumo.txt';

const cor = process.stdout.isTTY
  ? { verde: '\x1b[32m', vermelho: '\x1b[31m', amarelo: '\x1b[33m', cinza: '\x1b[90m', negrito: '\x1b[1m', fim: '\x1b[0m' }
  : { verde: '', vermelho: '', amarelo: '', cinza: '', negrito: '', fim: '' };

type Situacao = 'passou' | 'falhou' | 'instavel' | 'pulado' | 'pendente' | 'nao-executado';

const ROTULO: Record<Situacao, { icone: string; texto: string; cor: string }> = {
  passou: { icone: '✅', texto: 'Passou', cor: cor.verde },
  falhou: { icone: '❌', texto: 'Falhou', cor: cor.vermelho },
  instavel: { icone: '⚠️', texto: 'Instável', cor: cor.amarelo },
  pulado: { icone: '⏸', texto: 'Pulado', cor: cor.cinza },
  pendente: { icone: '⏸', texto: 'Pendente', cor: cor.cinza },
  'nao-executado': { icone: '⏹', texto: 'Não executado', cor: cor.cinza },
};

// eslint-disable-next-line no-control-regex -- remove os códigos de cor ANSI
const semCores = (texto: string) => texto.replace(/\x1b\[[0-9;]*m/g, '');
const duracao = (ms: number) => {
  if (Math.round(ms / 100) < 600) return `${(ms / 1000).toFixed(1)}s`;
  const segundos = Math.round(ms / 1000);
  return `${Math.floor(segundos / 60)}m${String(segundos % 60).padStart(2, '0')}s`;
};
const corta = (texto: string, max: number) => (texto.length > max ? texto.slice(0, max - 1) + '…' : texto);

function situacao(teste: TestCase): Situacao {
  const ultimo = teste.results.at(-1);
  if (!ultimo) return 'nao-executado';
  if (teste.annotations.some((a) => a.type === 'fixme')) return 'pendente';
  switch (teste.outcome()) {
    case 'expected':
      return 'passou';
    case 'flaky':
      return 'instavel';
    case 'skipped':
      return 'pulado';
    default:
      return 'falhou';
  }
}

function modulo(teste: TestCase, raiz: string): string {
  if (teste.parent.project()?.name === 'setup') return 'Preparação — login dos perfis';
  const partes = relative(raiz, teste.location.file).split(sep);
  return partes.length > 1 ? partes[0] : 'Outros';
}

class ResumoReporter implements Reporter {
  private raiz = '';
  private suite?: Suite;

  onBegin(config: FullConfig, suite: Suite) {
    this.raiz = config.projects.find((p) => p.name === 'desktop')?.testDir ?? config.rootDir;
    this.suite = suite;
  }

  onEnd(resultado: FullResult) {
    if (!this.suite) return;
    const testes = this.suite.allTests();
    // Nada executado — ex.: `--list` — não há resultado para mostrar
    if (testes.every((t) => t.results.length === 0)) return;

    const linhas: string[] = [];
    const escreve = (texto = '') => linhas.push(texto);
    const largura = 100;

    escreve();
    escreve(`${cor.negrito}${'═'.repeat(largura)}${cor.fim}`);
    escreve(`${cor.negrito}  RESULTADO DA RODADA — ${new Date().toLocaleString('pt-BR')}${cor.fim}`);
    escreve(`${cor.negrito}${'═'.repeat(largura)}${cor.fim}`);

    const porModulo = new Map<string, TestCase[]>();
    for (const teste of testes) {
      const chave = modulo(teste, this.raiz);
      porModulo.set(chave, [...(porModulo.get(chave) ?? []), teste]);
    }

    for (const [nome, lista] of porModulo) {
      escreve();
      escreve(`${cor.negrito}▶ ${nome}${cor.fim}`);
      escreve(`${cor.cinza}  ${'Situação'.padEnd(16)}${'Teste'.padEnd(66)}Tempo${cor.fim}`);
      for (const teste of lista) {
        const s = ROTULO[situacao(teste)];
        const tempo = teste.results.reduce((total, r) => total + r.duration, 0);
        escreve(
          `  ${s.cor}${`${s.icone} ${s.texto}`.padEnd(15)}${cor.fim} ${corta(teste.title, 64).padEnd(66)}${cor.cinza}${duracao(tempo)}${cor.fim}`,
        );
      }
    }

    const falhas = testes.filter((t) => ['falhou', 'instavel'].includes(situacao(t)));
    if (falhas.length) {
      escreve();
      escreve(`${cor.negrito}${cor.vermelho}✖ DETALHE DAS FALHAS${cor.fim}`);
      falhas.forEach((teste, i) => {
        const ultimo = teste.results.find((r) => r.status !== 'passed') ?? teste.results.at(-1);
        const erro = semCores(ultimo?.error?.message ?? 'sem mensagem de erro')
          .split('\n')
          .map((l) => l.trimEnd())
          .filter(Boolean)
          .slice(0, 6);
        const passo = ultimo?.steps.find((p) => p.error)?.title;
        const evidencia = ultimo?.attachments.find((a) => a.name === 'screenshot')?.path;
        escreve();
        escreve(`  ${cor.negrito}${i + 1}. ${teste.title}${cor.fim}`);
        escreve(`     ${cor.cinza}Arquivo:${cor.fim} ${relative(process.cwd(), teste.location.file)}:${teste.location.line}`);
        if (passo) escreve(`     ${cor.cinza}Passo:${cor.fim}   ${passo}`);
        escreve(`     ${cor.cinza}Motivo:${cor.fim}  ${erro[0]}`);
        for (const linha of erro.slice(1)) escreve(`              ${linha}`);
        if (evidencia) escreve(`     ${cor.cinza}Print:${cor.fim}   ${relative(process.cwd(), evidencia)}`);
      });
    }

    const conta = (s: Situacao) => testes.filter((t) => situacao(t) === s).length;
    const executados = testes.length - conta('nao-executado') - conta('pulado') - conta('pendente');
    escreve();
    escreve(`${cor.negrito}${'─'.repeat(largura)}${cor.fim}`);
    escreve(
      `  ${cor.negrito}Total: ${testes.length}${cor.fim}   ` +
        `${cor.verde}✅ Passaram: ${conta('passou')}${cor.fim}   ` +
        `${cor.vermelho}❌ Falharam: ${conta('falhou')}${cor.fim}   ` +
        `${cor.amarelo}⚠️ Instáveis: ${conta('instavel')}${cor.fim}   ` +
        `${cor.cinza}⏸ Pulados/pendentes: ${conta('pulado') + conta('pendente')}${cor.fim}` +
        (conta('nao-executado') ? `   ${cor.cinza}⏹ Não executados: ${conta('nao-executado')}${cor.fim}` : ''),
    );
    const situacaoGeral =
      resultado.status === 'passed'
        ? `${cor.verde}APROVADA${cor.fim}`
        : resultado.status === 'failed'
          ? `${cor.vermelho}COM FALHAS${cor.fim}`
          : `${cor.amarelo}INTERROMPIDA${cor.fim}`;
    escreve(`  Rodada ${cor.negrito}${situacaoGeral}${cor.fim} — ${executados} executados em ${duracao(resultado.duration)}`);
    escreve(`  ${cor.cinza}Relatório completo, com prints e vídeos: npm run report${cor.fim}`);
    escreve(`${cor.negrito}${'═'.repeat(largura)}${cor.fim}`);
    escreve();

    const texto = linhas.join('\n');
    process.stdout.write(texto + '\n');
    mkdirSync(dirname(ARQUIVO_RESUMO), { recursive: true });
    writeFileSync(ARQUIVO_RESUMO, semCores(texto), 'utf8');
  }

  printsToStdio() {
    return true;
  }
}

export default ResumoReporter;
