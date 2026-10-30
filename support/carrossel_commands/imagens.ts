import { deflateSync } from 'zlib';
import { randomBytes } from 'crypto';

// Gera imagens PNG em memória para o upload do carrossel — sem arquivos no repositório.
// "cor" gera uma imagem de cor única (arquivo pequeno); "ruido" gera pixels aleatórios, que não comprimem,
// para chegar a um arquivo grande (ex.: acima de 5 MB)

const tabelaCrc = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(dados: Buffer): number {
  let c = 0xffffffff;
  for (const byte of dados) c = tabelaCrc[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloco(tipo: string, dados: Buffer): Buffer {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const tipoEDados = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoEDados));
  return Buffer.concat([tamanho, tipoEDados, crc]);
}

export function gerarPng(largura: number, altura: number, preenchimento: 'cor' | 'ruido' = 'cor'): Buffer {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(largura, 0);
  cabecalho.writeUInt32BE(altura, 4);
  cabecalho[8] = 8; // 8 bits por canal
  cabecalho[9] = 2; // RGB
  const linha = largura * 3 + 1;
  const pixels = preenchimento === 'ruido' ? randomBytes(linha * altura) : Buffer.alloc(linha * altura, 0x46);
  for (let y = 0; y < altura; y++) pixels[y * linha] = 0; // filtro "nenhum" no início de cada linha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', cabecalho),
    bloco('IDAT', deflateSync(pixels, { level: preenchimento === 'ruido' ? 0 : 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

export function arquivoPng(nome: string, largura: number, altura: number, preenchimento: 'cor' | 'ruido' = 'cor') {
  return { name: nome, mimeType: 'image/png', buffer: gerarPng(largura, altura, preenchimento) };
}
