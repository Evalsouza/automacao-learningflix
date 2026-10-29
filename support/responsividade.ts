import { devices, Page } from '@playwright/test';

// defaultBrowserType não pode ser trocado dentro de um describe; todos rodam no Chromium
const semNavegador = ({ defaultBrowserType, ...dispositivo }: (typeof devices)[string]) => dispositivo;

// Resoluções padrão da equipe — usadas em todo responsividade.spec.ts
export const resolucoes = [
  { tipo: 'Celular', dispositivo: semNavegador(devices['Pixel 7']) },
  { tipo: 'Celular rotacionado', dispositivo: semNavegador(devices['Pixel 7 landscape']) },
  { tipo: 'Tablet', dispositivo: semNavegador(devices['iPad (gen 7)']) },
  { tipo: 'Monitor', dispositivo: { viewport: { width: 1920, height: 1080 } } },
].map(({ tipo, dispositivo }) => ({
  tipo,
  dispositivo,
  resolucao: `${dispositivo.viewport.width}x${dispositivo.viewport.height}`,
}));

export async function temRolagemHorizontal(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}
