import { test } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { PASTA_PRINTS_JUDY, PASTA_PRINTS_LOTE, PASTA_PRINTS_SKILL_LINK } from '../caminhos';

// Troca cada marcador [PRINT-NN] do RASCUNHO da página "Tutorial Skill Link" pela imagem print-NN.png,
// enviada como anexo. Com SECAO=N, antes acrescenta ao fim do rascunho o texto de secoes/secao-N.xml
// (se o título dessa seção ainda não estiver lá). Nunca publica: a página é gravada com status "draft".
//
// Credenciais só por variável de ambiente (.env, que está no .gitignore):
//   CONFLUENCE_BASE_URL=https://epicbrasil.atlassian.net
//   CONFLUENCE_EMAIL=...         CONFLUENCE_API_TOKEN=...
// Ensaio sem gravar nada no Confluence: SECO=sim (npm run tutorial:skill-link:confluence:seco)

// TUTORIAL=judy envia o "Tutorial competências com a Judy"; sem TUTORIAL, o "Tutorial Skill Link"
const TUTORIAIS = {
  'skill-link': { pagina: '5945294849', pasta: path.join(__dirname), prints: PASTA_PRINTS_SKILL_LINK },
  judy: { pagina: '5949030403', pasta: path.join(__dirname, '..', 'judy'), prints: PASTA_PRINTS_JUDY },
  lote: { pagina: '5949063179', pasta: path.join(__dirname, '..', 'lote'), prints: PASTA_PRINTS_LOTE },
};
const TUTORIAL = TUTORIAIS[(process.env.TUTORIAL ?? 'skill-link') as keyof typeof TUTORIAIS];
if (!TUTORIAL) throw new Error(`TUTORIAL desconhecido: ${process.env.TUTORIAL}`);
const PAGINA = TUTORIAL.pagina;
const SECOES = process.env.SECOES ?? process.env.SECAO; // ex.: SECOES=2,3 acrescenta secoes/secao-2.xml e secao-3.xml
const SUBSTITUIR_DESDE = process.env.SUBSTITUIR_DESDE; // ex.: 2 — troca do título "2." até o fim
const INFO_ADMIN_GERAL = process.env.INFO_ADMIN_GERAL === 'sim';
const LARGURA_MAXIMA = 760; // largura de exibição no Confluence; prints menores ficam no tamanho real
const SECO = process.env.SECO === 'sim';
const PASTA_COPIAS = path.join(TUTORIAL.pasta, 'copias-rascunho'); // rascunho antes/depois, para conferência

function variavel(nome: string) {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Preencha ${nome} no .env`);
  return valor;
}

// A URL do site não é segredo: o .env só precisa dela para apontar para outro site
const base = () => (process.env.CONFLUENCE_BASE_URL || 'https://epicbrasil.atlassian.net').replace(/\/+$/, '');
const autorizacao = () => 'Basic ' + Buffer.from(`${variavel('CONFLUENCE_EMAIL')}:${variavel('CONFLUENCE_API_TOKEN')}`).toString('base64');

// Chamada à API; em erro mostra só status e corpo da resposta (nunca os cabeçalhos com o token)
async function api<T>(metodo: string, caminho: string, corpo?: BodyInit, cabecalhos: Record<string, string> = {}) {
  const resposta = await fetch(`${base()}${caminho}`, {
    method: metodo,
    headers: { Authorization: autorizacao(), Accept: 'application/json', ...cabecalhos },
    body: corpo,
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${texto.slice(0, 500)}`);
  return (texto ? JSON.parse(texto) : {}) as T;
}

type PaginaV2 = { id: string; status: string; title: string; version: { number: number }; body?: { storage?: { value: string } } };

// Versão publicada da página, ou "nunca publicada" (página criada só como rascunho)
async function versaoPublicada() {
  try {
    const p = await api<PaginaV2>('GET', `/wiki/api/v2/pages/${PAGINA}`);
    return p.status === 'current' ? `v${p.version.number}` : 'nunca publicada';
  } catch (erro) {
    if (/→ 404/.test(String(erro))) return 'nunca publicada';
    throw erro;
  }
}

const larguraDoPng = (arquivo: string) => readFileSync(arquivo).readUInt32BE(16); // cabeçalho IHDR

function imagem(arquivo: string, nome: string) {
  const largura = Math.min(larguraDoPng(arquivo), LARGURA_MAXIMA);
  return `<ac:image ac:align="center" ac:layout="center" ac:width="${largura}"><ri:attachment ri:filename="${nome}" /></ac:image>`;
}

// Troca o parágrafo que só tem o marcador pela imagem centralizada; se o marcador estiver no meio
// de um texto, troca só o marcador. A legenda "Print 0X — …" do rascunho não é tocada.
function trocarMarcador(corpo: string, numero: string, html: string) {
  const marcador = `\\[PRINT-${numero}\\]`;
  const paragrafo = new RegExp(`<p[^>]*>\\s*(?:<[^>/]+>\\s*)*${marcador}(?:\\s*</[^>]+>)*\\s*</p>`);
  if (paragrafo.test(corpo)) return corpo.replace(paragrafo, html);
  return corpo.replace(new RegExp(marcador), html);
}

test('Tutorial Skill Link — seção e prints no rascunho do Confluence', async () => {
  // 1. Lê o rascunho e a versão publicada (para provar no fim que a publicada não mudou)
  const rascunho = await api<PaginaV2>('GET', `/wiki/api/v2/pages/${PAGINA}?get-draft=true&body-format=storage`);
  if (rascunho.status !== 'draft') throw new Error(`Esperado um rascunho; a API devolveu status "${rascunho.status}". Nada foi alterado.`);
  const publicada = await versaoPublicada();
  const corpoOriginal = rascunho.body?.storage?.value ?? '';
  console.log(`>> "${rascunho.title}": rascunho v${rascunho.version.number}, publicada ${publicada}`);

  // 2. Monta o corpo: SUBSTITUIR_DESDE=N corta do título "N." até o fim (o trecho removido é salvo para
  //    conferência); SECOES=2,3 acrescenta secoes/secao-N.xml (uma vez só); INFO_ADMIN_GERAL=sim põe
  //    na seção 1 o painel "etapa do Administrador Geral". Confere marcadores e arquivos antes de enviar.
  let corpoBase = corpoOriginal;
  let removido = '';
  const tituloSecao = (n: string) => new RegExp(`<h2[^>]*>\\s*${n}\\.`);
  if (SUBSTITUIR_DESDE) {
    const m = tituloSecao(SUBSTITUIR_DESDE).exec(corpoBase);
    if (!m) throw new Error(`Título da seção ${SUBSTITUIR_DESDE} não encontrado no rascunho. Nada foi alterado.`);
    removido = corpoBase.slice(m.index);
    corpoBase = corpoBase.slice(0, m.index);
    console.log(`>> Removido do título "${SUBSTITUIR_DESDE}." até o fim: ${removido.length} caracteres (cópia em "-removido.xml")`);
  }
  for (const secao of (SECOES ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)) {
    const texto = readFileSync(path.join(TUTORIAL.pasta, 'secoes', `secao-${secao}.xml`), 'utf-8').trim();
    if (tituloSecao(secao).test(corpoBase)) {
      console.log(`>> A seção "${secao}." já está no rascunho: não foi acrescentada de novo`);
    } else {
      corpoBase += texto;
      console.log(`>> Seção ${secao} acrescentada ao fim do rascunho`);
    }
  }
  if (INFO_ADMIN_GERAL && !/realizada pelo Administrador Geral|realizada pelo <strong>Administrador Geral/.test(corpoBase)) {
    const m = tituloSecao('1').exec(corpoBase);
    const fimIntro = m ? corpoBase.indexOf('</p>', m.index) : -1;
    if (fimIntro < 0) throw new Error('Não achei o parágrafo de abertura da seção 1');
    const painel =
      '<ac:structured-macro ac:name="info" ac:schema-version="1"><ac:parameter ac:name="containerLevel">panel_c1</ac:parameter><ac:rich-text-body><p><strong>Quem faz esta etapa:</strong> a habilitação e a configuração do Skill Link são realizadas pelo <strong>Administrador Geral</strong> da plataforma. As próximas seções mostram a visão do administrador do cliente.</p></ac:rich-text-body></ac:structured-macro>';
    corpoBase = corpoBase.slice(0, fimIntro + 4) + painel + corpoBase.slice(fimIntro + 4);
    console.log('>> Painel "Administrador Geral" incluído na seção 1');
  }
  const PRINTS = [...new Set([...corpoBase.matchAll(/\[PRINT-(\d{2})\]/g)].map((m) => m[1]))];
  if (!PRINTS.length) throw new Error('Nenhum marcador [PRINT-NN] no rascunho: nada a fazer.');
  console.log(`>> Marcadores a trocar: ${PRINTS.join(', ')}`);
  const arquivos = PRINTS.map((n) => ({ n, nome: `print-${n}.png`, caminho: path.join(TUTORIAL.prints, `print-${n}.png`) }));
  const semArquivo = arquivos.filter((a) => !existsSync(a.caminho));
  if (semArquivo.length) throw new Error(`PNGs não encontrados: ${semArquivo.map((a) => a.nome).join(', ')} — rode os prints antes`);

  // 3. Monta o corpo novo e guarda cópias locais (antes e depois)
  let corpoNovo = corpoBase;
  for (const a of arquivos) corpoNovo = trocarMarcador(corpoNovo, a.n, imagem(a.caminho, a.nome));
  mkdirSync(PASTA_COPIAS, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(path.join(PASTA_COPIAS, `${carimbo}-antes.xml`), corpoOriginal);
  writeFileSync(path.join(PASTA_COPIAS, `${carimbo}-depois.xml`), corpoNovo);
  if (removido) writeFileSync(path.join(PASTA_COPIAS, `${carimbo}-removido.xml`), removido);
  console.log(`>> Cópias do rascunho em ${PASTA_COPIAS}`);
  if (SECO) {
    console.log('>> SECO=sim: nada foi enviado. Confira o arquivo "-depois.xml".');
    return;
  }

  // 4. Anexos: PUT cria o anexo ou adiciona uma versão nova se já existir com o mesmo nome
  for (const a of arquivos) {
    const formulario = new FormData();
    formulario.append('file', new Blob([readFileSync(a.caminho)], { type: 'image/png' }), a.nome);
    formulario.append('minorEdit', 'true');
    formulario.append('comment', `Tutorial Skill Link — seções ${(SECOES ?? '1').replace(/,/g, ' e ')}`);
    await api('PUT', `/wiki/rest/api/content/${PAGINA}/child/attachment`, formulario, { 'X-Atlassian-Token': 'no-check' });
    console.log(`>> Anexo ${a.nome} enviado`);
  }

  // 5. Grava o corpo novo no RASCUNHO (status "draft" — não publica)
  await api(
    'PUT',
    `/wiki/api/v2/pages/${PAGINA}`,
    JSON.stringify({
      id: PAGINA,
      status: 'draft',
      title: rascunho.title,
      body: { representation: 'storage', value: corpoNovo },
      version: { number: rascunho.version.number, message: `Seções ${SECOES ?? '1'} (Skill Link)` },
    }),
    { 'Content-Type': 'application/json' },
  );

  // 6. Confere: rascunho com as 8 imagens e nenhum marcador; versão publicada igual à de antes
  const depois = await api<PaginaV2>('GET', `/wiki/api/v2/pages/${PAGINA}?get-draft=true&body-format=storage`);
  const corpo = depois.body?.storage?.value ?? '';
  const semImagem = arquivos.filter((a) => !corpo.includes(`ri:filename="${a.nome}"`)).map((a) => a.nome);
  const marcadoresRestantes = PRINTS.filter((n) => corpo.includes(`[PRINT-${n}]`));
  const publicadaDepois = await versaoPublicada();
  if (semImagem.length || marcadoresRestantes.length) {
    throw new Error(
      `Rascunho incompleto — sem imagem: ${semImagem.join(', ') || '-'}; marcadores: ${marcadoresRestantes.join(', ') || '-'}`,
    );
  }
  if (depois.status !== 'draft') throw new Error(`Status inesperado após gravar: ${depois.status}`);
  if (publicadaDepois !== publicada) {
    throw new Error(`ATENÇÃO: a versão publicada mudou de ${publicada} para ${publicadaDepois}`);
  }
  console.log(`>> Rascunho atualizado com ${arquivos.length} imagens. Versão publicada intacta. Revise e publique pelo Confluence.`);
});
