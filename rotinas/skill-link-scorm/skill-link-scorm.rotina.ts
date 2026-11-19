// Rotina: Skill Link nas atividades SCORM do QA que ainda não têm competências — pedido da QA em 16/11/2026.
// Para cada SCORM sem competências: abre a edição da atividade → "Gerar competências com o Skill Link" → espera a
// geração → "Salvar e voltar ao curso" → confere que as competências ficaram gravadas.
// SCORM que já tem competências não é alterado. Cada geração consome ≈ 1 crédito do Skill Link.
//
//   npm run rotina:skill-link-scorm:listar   só lista os SCORMs sem competências (não gera, não salva, não gasta crédito)
//   npm run rotina:skill-link-scorm          gera e salva
//
// Filtros (variáveis de ambiente): SKILL_LINK_CMID=3087,3088 · SKILL_LINK_CURSO=325 · SKILL_LINK_LIMITE=10
// O resultado de cada SCORM fica em test-results/rotinas/skill-link-scorm-<data>.csv
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { SkillLinkScormPage, AtividadeScorm } from '../../support/skilllink_commands/SkillLinkScormPage';
import { recolherJudy } from '../../support/sessoes';

const executar = process.env.EXECUTAR_SKILL_LINK === 'sim';
const lista = (nome: string) =>
  (process.env[nome] ?? '')
    .split(',')
    .map((v) => Number(v.trim()))
    .filter(Boolean);
const cmids = lista('SKILL_LINK_CMID');
const cursos = lista('SKILL_LINK_CURSO');
const limite = Number(process.env.SKILL_LINK_LIMITE) || Infinity;

type Linha = AtividadeScorm & { antes: number | null; situacao: string; competencias: number; detalhe: string };

const csv = (linhas: Linha[]) =>
  [
    'cmid;curso_id;curso;categoria;atividade;competencias_antes;situacao;competencias_depois;detalhe',
    ...linhas.map((l) =>
      [l.cmid, l.cursoId, l.curso, l.categoria, l.nome, l.antes ?? 'sem seção', l.situacao, l.competencias, l.detalhe]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';'),
    ),
  ].join('\n');

test(`Skill Link nas atividades SCORM sem competências${executar ? '' : ' — só listar'}`, async ({ page }) => {
  test.setTimeout(0); // centenas de SCORMs: o tempo depende da quantidade e do Skill Link
  await recolherJudy(page);
  const skillLink = new SkillLinkScormPage(page);
  const linhas: Linha[] = [];
  const arquivo = path.join(
    'test-results',
    'rotinas',
    `skill-link-scorm-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.csv`,
  );
  mkdirSync(path.dirname(arquivo), { recursive: true });
  const gravar = () => writeFileSync(arquivo, '﻿' + csv(linhas), 'utf8');

  const atividades = await test.step('Quando listei as atividades SCORM dos cursos do QA', async () => {
    await skillLink.abrirPlataforma();
    return (await skillLink.listarScorms()).filter(
      (a) => (!cmids.length || cmids.includes(a.cmid)) && (!cursos.length || cursos.includes(a.cursoId)),
    );
  });
  test.info().annotations.push({ type: 'SCORMs', description: `${atividades.length} atividades SCORM` });

  let processados = 0;
  for (const atividade of atividades) {
    const antes = await skillLink.competenciasSalvas(atividade.cmid);
    const linha: Linha = { ...atividade, antes, situacao: '', competencias: antes ?? 0, detalhe: '' };
    linhas.push(linha);
    if (antes === null) linha.situacao = 'sem a seção Skill Link';
    else if (antes > 0) linha.situacao = 'já tinha competências';
    else if (!executar) linha.situacao = 'pendente';
    else if (processados >= limite) linha.situacao = 'pendente (limite da execução)';
    else {
      processados++;
      await test.step(`E gerei as competências de "${atividade.nome}" (cmid ${atividade.cmid}, curso ${atividade.cursoId})`, async () => {
        try {
          await skillLink.abrirEdicao(atividade.cmid);
          const geracao = await skillLink.gerar();
          linha.detalhe = geracao.mensagem;
          if (geracao.quantidade <= 0) {
            // "Conteudo extraido do SCORM esta vazio": o pacote não tem texto para a IA ler (ex.: SCORM só de imagens).
            // É do conteúdo, não da rotina — e não consome crédito (3087 em 16/11/2026)
            linha.situacao = geracao.creditosEsgotados
              ? 'créditos esgotados'
              : /extra[ií]do do SCORM est[aá] vazio/i.test(geracao.mensagem)
                ? 'SCORM sem conteúdo para o Skill Link'
                : 'Skill Link não retornou competências';
            return;
          }
          const erro = await skillLink.salvar();
          if (erro) {
            linha.situacao = 'erro ao salvar';
            linha.detalhe = erro;
            return;
          }
          linha.competencias = (await skillLink.competenciasSalvas(atividade.cmid)) ?? 0;
          linha.situacao = linha.competencias > 0 ? 'gerada e salva' : 'gerada, mas não ficou salva';
        } catch (e) {
          linha.situacao = 'erro';
          linha.detalhe = (e as Error).message.split('\n')[0];
        }
      });
      if (linha.situacao === 'créditos esgotados') {
        test.info().annotations.push({ type: 'parou', description: 'Créditos do Skill Link esgotados' });
        break;
      }
    }
    gravar();
  }
  gravar();

  const contagem = linhas.reduce<Record<string, number>>((c, l) => ({ ...c, [l.situacao]: (c[l.situacao] ?? 0) + 1 }), {});
  for (const [situacao, n] of Object.entries(contagem)) test.info().annotations.push({ type: situacao, description: String(n) });
  test.info().annotations.push({ type: 'relatório', description: arquivo });
  console.log(
    `\nSkill Link SCORM — ${Object.entries(contagem)
      .map(([s, n]) => `${s}: ${n}`)
      .join(' · ')}\nRelatório: ${arquivo}`,
  );

  await test.step('Então todos os SCORMs processados ficaram com competências gravadas', () => {
    const falhas = linhas.filter((l) => /erro|não ficou|não retornou|esgotados/.test(l.situacao));
    expect(falhas.map((l) => `${l.cmid} ${l.nome}: ${l.situacao} ${l.detalhe}`)).toEqual([]);
  });
});
