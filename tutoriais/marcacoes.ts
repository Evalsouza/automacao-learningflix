import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'fs';
import path from 'path';

// Padrão visual dos tutoriais: azul #1E40AF, contorno de 3px, seta fina e número em círculo
// quando há mais de uma ação na mesma imagem.
export const AZUL = '#1E40AF';
const ID_CAMADA = 'tutorial-marcacoes';

// De onde a seta vem: 'esquerda' = seta à esquerda do elemento, apontando para ele
export type Lado = 'esquerda' | 'direita' | 'cima' | 'baixo';
// Sem seta, o número fica colado ao contorno, à esquerda ou à direita (ladoNumero)
export type Alvo = { elemento: Locator; numero?: number; seta?: Lado | false; ladoNumero?: 'esquerda' | 'direita' };
type Caixa = { x: number; y: number; width: number; height: number };

// Esconde a barra "Pergunte para a Judy" e o botão flutuante do VLibras em toda página carregada
// no contexto (antes de qualquer captura)
export async function ocultarJudy(contexto: BrowserContext) {
  await contexto.addInitScript(() => {
    const css = '#judy-root,#vlibras-access-wrapper,div[vw]{display:none !important;visibility:hidden !important}';
    const aplicar = () => {
      const estilo = document.createElement('style');
      estilo.textContent = css;
      (document.head ?? document.documentElement).appendChild(estilo);
    };
    if (document.documentElement) aplicar();
    else document.addEventListener('DOMContentLoaded', aplicar);
  });
}

// Borra o texto de campos com valor sensível (URL, chave, token) — só na tela, o valor salvo não muda
export async function borrar(elementos: Locator) {
  for (const el of await elementos.all()) {
    await el.evaluate((n: HTMLElement) => {
      n.style.filter = 'blur(7px)';
    });
  }
}

// Borra só parte do campo (padrão: os 65% da direita), deixando o começo do valor visível
export async function borrarParcial(elementos: Locator, fracaoVisivel = 0.35) {
  for (const el of await elementos.all()) {
    await el.evaluate((n: HTMLElement, fracao: number) => {
      const r = n.getBoundingClientRect();
      const capa = document.createElement('div');
      capa.className = 'tutorial-borrado-parcial';
      const esquerda = r.left + window.scrollX + r.width * fracao;
      capa.style.cssText = `position:absolute;left:${esquerda}px;top:${r.top + window.scrollY + 2}px;width:${r.width * (1 - fracao) - 4}px;height:${r.height - 4}px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);background:rgba(40,44,52,.25);border-radius:4px;z-index:2147483646;pointer-events:none`;
      document.body.appendChild(capa);
    }, fracaoVisivel);
  }
}

// Caixa do elemento em coordenadas do documento (não da janela). Se o Locator achar vários elementos,
// devolve uma caixa só ao redor de todos — é assim que um grupo de campos recebe um único contorno
async function caixaNoDocumento(page: Page, el: Locator): Promise<Caixa> {
  const caixas: Caixa[] = [];
  for (const item of await el.all()) {
    const caixa = await item.boundingBox();
    if (caixa) caixas.push(caixa);
  }
  if (!caixas.length) throw new Error(`Elemento sem área visível: ${el}`);
  const c = uniao(caixas);
  const rolagem = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  return { x: c.x + rolagem.x, y: c.y + rolagem.y, width: c.width, height: c.height };
}

function uniao(caixas: Caixa[]): Caixa {
  const x1 = Math.min(...caixas.map((c) => c.x));
  const y1 = Math.min(...caixas.map((c) => c.y));
  const x2 = Math.max(...caixas.map((c) => c.x + c.width));
  const y2 = Math.max(...caixas.map((c) => c.y + c.height));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

// Desenha contorno, seta e número; devolve a área ocupada pelas marcações (para o recorte)
async function desenhar(page: Page, alvos: Alvo[]): Promise<Caixa[]> {
  const itens = [];
  for (const alvo of alvos) {
    const c = await caixaNoDocumento(page, alvo.elemento);
    itens.push({
      c,
      numero: alvo.numero ?? null,
      seta: alvo.seta === undefined ? 'esquerda' : alvo.seta,
      ladoNumero: alvo.ladoNumero ?? 'esquerda',
    });
  }
  return page.evaluate(
    ({ itens, cor, id }) => {
      const NS = 'http://www.w3.org/2000/svg';
      const FOLGA = 6; // espaço entre o elemento e o contorno
      const SETA = 56; // comprimento da seta
      const RAIO = 13; // raio do círculo do número
      const areas: { x: number; y: number; width: number; height: number }[] = [];

      document.getElementById(id)?.remove();
      const camada = document.createElement('div');
      camada.id = id;
      camada.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', '1');
      svg.setAttribute('height', '1');
      svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
      svg.innerHTML = `<defs><marker id="${id}-ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${cor}"/></marker></defs>`;
      camada.appendChild(svg);
      document.body.appendChild(camada);

      for (const { c, numero, seta, ladoNumero } of itens) {
        const L = c.x - FOLGA,
          T = c.y - FOLGA,
          R = c.x + c.width + FOLGA,
          B = c.y + c.height + FOLGA;
        const contorno = document.createElement('div');
        contorno.style.cssText = `position:absolute;left:${L}px;top:${T}px;width:${R - L}px;height:${B - T}px;border:3px solid ${cor};border-radius:6px;box-sizing:border-box`;
        camada.appendChild(contorno);
        areas.push({ x: L, y: T, width: R - L, height: B - T });
        if (!seta) {
          // Sem seta (ex.: lista numerada de opções): o número fica colado ao contorno
          if (numero !== null) {
            const nl = ladoNumero === 'direita' ? R + 6 : L - RAIO * 2 - 6;
            const nt = (T + B) / 2 - RAIO;
            const circulo = document.createElement('div');
            circulo.textContent = String(numero);
            circulo.style.cssText = `position:absolute;left:${nl}px;top:${nt}px;width:${RAIO * 2}px;height:${RAIO * 2}px;border-radius:50%;background:${cor};color:#fff;font:700 14px/26px Arial,sans-serif;text-align:center`;
            camada.appendChild(circulo);
            areas.push({ x: nl, y: nt, width: RAIO * 2, height: RAIO * 2 });
          }
          continue;
        }

        const cx = (L + R) / 2,
          cy = (T + B) / 2;
        // fim = ponta encostada no contorno; d = direção da seta
        const geo = {
          esquerda: { fx: L - 3, fy: cy, dx: 1, dy: 0 },
          direita: { fx: R + 3, fy: cy, dx: -1, dy: 0 },
          cima: { fx: cx, fy: T - 3, dx: 0, dy: 1 },
          baixo: { fx: cx, fy: B + 3, dx: 0, dy: -1 },
        }[seta as 'esquerda' | 'direita' | 'cima' | 'baixo'];
        const ix = geo.fx - geo.dx * SETA,
          iy = geo.fy - geo.dy * SETA;
        const linha = document.createElementNS(NS, 'line');
        linha.setAttribute('x1', String(ix));
        linha.setAttribute('y1', String(iy));
        linha.setAttribute('x2', String(geo.fx));
        linha.setAttribute('y2', String(geo.fy));
        linha.setAttribute('stroke', cor);
        linha.setAttribute('stroke-width', '2');
        linha.setAttribute('stroke-linecap', 'round');
        linha.setAttribute('marker-end', `url(#${id}-ponta)`);
        svg.appendChild(linha);
        areas.push({
          x: Math.min(ix, geo.fx) - 4,
          y: Math.min(iy, geo.fy) - 4,
          width: Math.abs(ix - geo.fx) + 8,
          height: Math.abs(iy - geo.fy) + 8,
        });

        if (numero !== null) {
          const nx = ix - geo.dx * (RAIO + 2),
            ny = iy - geo.dy * (RAIO + 2);
          const circulo = document.createElement('div');
          circulo.textContent = String(numero);
          circulo.style.cssText = `position:absolute;left:${nx - RAIO}px;top:${ny - RAIO}px;width:${RAIO * 2}px;height:${RAIO * 2}px;border-radius:50%;background:${cor};color:#fff;font:700 14px/26px Arial,sans-serif;text-align:center`;
          camada.appendChild(circulo);
          areas.push({ x: nx - RAIO, y: ny - RAIO, width: RAIO * 2, height: RAIO * 2 });
        }
      }
      return areas;
    },
    { itens, cor: AZUL, id: ID_CAMADA },
  );
}

export type Captura = {
  pasta: string;
  arquivo: string; // ex.: print-03.png
  alvos: Alvo[];
  // 'tela' = janela inteira; Locator = recorte nesse bloco (+ marcações); omitido = recorte só nas marcações
  area?: 'tela' | Locator;
  // Só com area 'tela': corta a imagem logo abaixo deste elemento (ex.: título da página)
  ate?: Locator;
  margem?: number;
  // Espera (ms) depois de rolar até o alvo — gráficos com animação de entrada
  espera?: number;
  // true quando o print mostra a própria Judy (não confere se a barra está oculta)
  comJudy?: boolean;
};

// Rola até o primeiro alvo, desenha as marcações, salva o PNG e remove as marcações
export async function capturar(page: Page, { pasta, arquivo, alvos, area, ate, margem = 12, espera = 0, comJudy = false }: Captura) {
  if (!comJudy) await expect(page.getByPlaceholder(/Pergunte para a Judy/), 'Barra da Judy visível no print').toBeHidden();
  // Um alvo pode ser um grupo (vários elementos sob um só contorno): confere cada um
  for (const alvo of alvos) {
    await expect(alvo.elemento.first(), `Alvo do ${arquivo}`).toBeVisible();
    for (const el of await alvo.elemento.all()) await expect(el, `Alvo do ${arquivo}`).toBeVisible();
  }

  if (area !== 'tela') {
    await alvos[0].elemento.first().evaluate((n) => n.scrollIntoView({ block: 'center', inline: 'nearest' }));
  }
  if (espera) await page.waitForTimeout(espera);
  const areasMarcacoes = await desenhar(page, alvos);
  mkdirSync(pasta, { recursive: true });
  const destino = path.join(pasta, arquivo);

  if (area === 'tela') {
    const janela = page.viewportSize()!;
    const fim = ate ? await ate.boundingBox() : null;
    const clip = { x: 0, y: 0, width: janela.width, height: fim ? Math.min(janela.height, fim.y + fim.height + margem) : janela.height };
    await page.screenshot({ path: destino, clip, animations: 'disabled', caret: 'hide' });
  } else {
    const blocos = area ? [...areasMarcacoes, await caixaNoDocumento(page, area)] : areasMarcacoes;
    const u = uniao(blocos);
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    const x = Math.max(0, u.x - margem);
    const y = Math.max(0, u.y - margem);
    const clip = { x, y, width: Math.min(largura - x, u.width + margem * 2), height: u.height + margem * 2 };
    // Se o recorte cabe na janela, captura sem fullPage: o fullPage redimensiona a página e reinicia
    // a animação dos gráficos
    const rolagem = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    const janela = page.viewportSize()!;
    const cabe = clip.y >= rolagem.y && clip.y + clip.height <= rolagem.y + janela.height;
    if (cabe) {
      await page.screenshot({
        path: destino,
        clip: { ...clip, x: clip.x - rolagem.x, y: clip.y - rolagem.y },
        animations: 'disabled',
        caret: 'hide',
      });
    } else {
      await page.screenshot({ path: destino, clip, fullPage: true, animations: 'disabled', caret: 'hide' });
    }
  }
  await page.evaluate((id) => document.getElementById(id)?.remove(), ID_CAMADA);
  console.log(`>> ${arquivo} salvo`);
}
