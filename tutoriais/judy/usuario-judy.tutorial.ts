import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { SESSAO_TUTORIAL_USUARIO, PASTA_PRINTS_JUDY as pasta } from '../caminhos';
import { capturar } from '../marcacoes';

// Tutorial competências com a Judy — uso pelo usuário final (eva.souza): print-05.png … print-15.png
// Conversa com a Judy (envia perguntas) e apaga a conversa entre as perguntas prontas, como no uso real.
// Não altera cadastro nem configuração.

const ESPERA_RESPOSTA = 3 * 60_000;

const judy = (page: Page) => page.locator('#judy-root');
const janela = (page: Page) => judy(page).locator('.floating-chat');
// Só as mensagens visíveis: depois de "Apagar conversa" as antigas continuam escondidas na página
const mensagens = (page: Page) => janela(page).locator('.cs-message').filter({ visible: true });

// Espera a Judy responder: a última mensagem passa a ser uma resposta nova da Judy (diferente da de antes)
// e o texto para de mudar por 5 s. Depois de "Apagar conversa" as mensagens são substituídas, não somadas.
async function esperarResposta(page: Page, ultimaAntes: string) {
  const ultima = async () =>
    (
      await mensagens(page)
        .last()
        .innerText()
        .catch(() => '')
    ).trim();
  await expect
    .poll(
      async () => {
        const t = await ultima();
        return t !== ultimaAntes && /^Judy/.test(t);
      },
      { timeout: ESPERA_RESPOSTA, intervals: [1500] },
    )
    .toBe(true);
  let anterior = '';
  let estavel = 0;
  const limite = Date.now() + ESPERA_RESPOSTA;
  while (estavel < 5 && Date.now() < limite) {
    await page.waitForTimeout(1000);
    const atual = await ultima();
    const digitando = await janela(page).locator('.cs-typing-indicator').filter({ visible: true }).count();
    estavel = atual && atual === anterior && !digitando ? estavel + 1 : 0;
    anterior = atual;
  }
  console.log(`>> Resposta: ${anterior.replace(/\s+/g, ' ').slice(0, 400)}`);
  return mensagens(page).last();
}

const ultimaMensagem = async (page: Page) =>
  (
    await mensagens(page)
      .last()
      .innerText()
      .catch(() => '')
  ).trim();

// Menu (…) > Apagar conversa > Sim — volta a tela de boas-vindas com as perguntas prontas
async function apagarConversa(page: Page, prints?: { menu: string; confirmar: string }) {
  await janela(page).locator('a.menu-button').click();
  const apagar = judy(page).getByText('Apagar conversa').filter({ visible: true }).first();
  await expect(apagar).toBeVisible();
  if (prints)
    await capturar(page, { pasta, arquivo: prints.menu, area: 'tela', alvos: [{ elemento: apagar, seta: 'esquerda' }], comJudy: true });
  await apagar.click();
  const sim = judy(page).getByRole('button', { name: 'Sim' }).filter({ visible: true }).first();
  await expect(sim).toBeVisible();
  if (prints)
    await capturar(page, { pasta, arquivo: prints.confirmar, area: 'tela', alvos: [{ elemento: sim, seta: 'direita' }], comJudy: true });
  await sim.click();
  await expect(janela(page).getByText('Cursos e Competências')).toBeVisible({ timeout: 60_000 });
}

async function perguntaPronta(page: Page, texto: string, arquivo: string) {
  const antes = await ultimaMensagem(page);
  const botao = janela(page)
    .getByRole('button', { name: texto })
    .or(janela(page).getByText(texto, { exact: true }))
    .first();
  await botao.click();
  const resposta = await esperarResposta(page, antes);
  await mensagens(page)
    .nth(-2)
    .evaluate((n) => n.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(800);
  await capturar(page, { pasta, arquivo, area: 'tela', alvos: [{ elemento: resposta, seta: false }], comJudy: true });
}

async function perguntaDigitada(page: Page, texto: string, arquivo: string) {
  const antes = await ultimaMensagem(page);
  const campo = janela(page).locator('.cs-message-input__content-editor').first();
  await campo.click();
  await page.keyboard.type(texto, { delay: 25 });
  await page.keyboard.press('Enter');
  const resposta = await esperarResposta(page, antes);
  // Mostra a pergunta do usuário no alto da tela, seguida da resposta
  await mensagens(page)
    .nth(-2)
    .evaluate((n) => n.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(800);
  await capturar(page, { pasta, arquivo, area: 'tela', alvos: [{ elemento: resposta, seta: false }], comJudy: true });
}

test.beforeAll(() => {
  if (!existsSync(SESSAO_TUTORIAL_USUARIO)) throw new Error('Sem sessão da eva.souza: rode "npm run tutorial:login:usuario".');
});

test('Tutorial Judy — uso pelo usuário final', async ({ page, context }) => {
  // A Judy fica visível neste tutorial; só o botão do VLibras é escondido
  await context.addInitScript(() => {
    const aplicar = () => {
      const e = document.createElement('style');
      e.textContent = '#vlibras-access-wrapper,div[vw]{display:none !important}';
      (document.head ?? document.documentElement).appendChild(e);
    };
    if (document.documentElement) aplicar();
    else document.addEventListener('DOMContentLoaded', aplicar);
  });
  test.setTimeout(20 * 60_000);
  page.setDefaultTimeout(90_000);
  await page.goto('/my/', { waitUntil: 'domcontentloaded' });
  if (/\/login\//.test(new URL(page.url()).pathname))
    throw new Error('Sessão da eva.souza expirada: rode "npm run tutorial:login:usuario".');
  const barra = judy(page).locator('.floating-chat-center-input__textarea');
  await barra.waitFor();
  await page.waitForTimeout(3000);

  // SO_EXTRAS=sim: captura só os prints 14 e 15, sem refazer os prints 05 a 13; SO_EXTRAS=15 captura só o 15
  const extras = process.env.SO_EXTRAS;
  const soExtras = Boolean(extras);
  const capturaExtra = (n: string) => !extras || extras === 'sim' || extras.split(',').includes(n);

  if (!soExtras)
    await test.step('Print 05 — barra Pergunte para a Judy', async () => {
      await capturar(page, {
        pasta,
        arquivo: 'print-05.png',
        area: 'tela',
        alvos: [{ elemento: judy(page).locator('.floating-chat-center-input'), seta: 'cima' }],
        comJudy: true,
      });
    });

  // Abre a janela (a primeira mensagem abre a conversa), expande e apaga para mostrar as perguntas prontas
  await barra.fill('Olá');
  await barra.press('Enter');
  await expect(judy(page).locator('.floating-chat.show')).toBeVisible();
  await janela(page).locator('a.expand-button').click();
  await page.waitForTimeout(1500);
  await apagarConversa(page);

  if (!soExtras) await perguntasDoTutorial(page);

  if (capturaExtra('14'))
    await test.step('Print 14 — Como acesso a página meu curso?', async () => {
      await apagarConversa(page);
      await perguntaDigitada(page, 'Como acesso a página meu curso?', 'print-14.png');
    });

  if (capturaExtra('15'))
    await test.step('Print 15 — Como fazemos para abrir a minha página no app?', async () => {
      await apagarConversa(page);
      await perguntaDigitada(page, 'Como fazemos para abrir a minha página no app?', 'print-15.png');
    });
});

// Prints 06 a 13: perguntas prontas, Apagar conversa e perguntas sobre função e competência
async function perguntasDoTutorial(page: Page) {
  await test.step('Print 06 — Judy expandida com as perguntas prontas', async () => {
    const grupo = janela(page)
      .getByText('Cursos e Competências', { exact: true })
      .locator('xpath=ancestor::*[.//button or .//*[contains(normalize-space(),"Consultar minhas competências")]][1]');
    await capturar(page, {
      pasta,
      arquivo: 'print-06.png',
      area: 'tela',
      alvos: [
        { elemento: janela(page).locator('a.expand-button'), numero: 1, seta: 'baixo' },
        { elemento: grupo, numero: 2, seta: 'cima' },
      ],
      comJudy: true,
    });
  });

  await test.step('Print 07 — Cursos recomendados para meu cargo', async () => {
    await perguntaPronta(page, 'Cursos recomendados para meu cargo', 'print-07.png');
  });

  await test.step('Prints 08 e 09 — Apagar conversa', async () => {
    await apagarConversa(page, { menu: 'print-08.png', confirmar: 'print-09.png' });
  });

  await test.step('Print 10 — Cursos para uma competência', async () => {
    await perguntaPronta(page, 'Cursos para uma competência', 'print-10.png');
  });

  await test.step('Print 11 — Consultar minhas competências', async () => {
    await apagarConversa(page);
    await perguntaPronta(page, 'Consultar minhas competências', 'print-11.png');
  });

  await test.step('Print 12 — Qual é a minha função?', async () => {
    await apagarConversa(page);
    await perguntaDigitada(page, 'Qual é a minha função?', 'print-12.png');
  });

  await test.step('Print 13 — cursos para a competência Comunicação eficaz', async () => {
    await perguntaDigitada(page, 'Quais cursos são recomendados para a competência Comunicação eficaz?', 'print-13.png');
  });
}
