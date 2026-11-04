// DT/EVT - Plugin Carrossel Infinito no Layout da Página inicial — configuração — rastreabilidade em RASTREABILIDADE.md
// Cria UM slide de teste no fim do carrossel, usa e remove — os slides existentes nunca são alterados.
// Também troca "Habilita o Carrossel", o intervalo e a "Cor da Marca" do tema, e restaura os valores iniciais ao final.
// Desligada por padrão: rode com `npm run test:carrossel-config`
import { test, expect } from '../../support/e2e';
import { sessoes, comSessao, type Sessao } from '../../support/sessoes';
import type { Browser, Page } from '@playwright/test';
import { existsSync } from 'fs';
import { ConfiguracaoCarrosselPage } from '../../support/carrossel_commands/ConfiguracaoCarrosselPage';
import { CarrosselPage } from '../../support/carrossel_commands/CarrosselPage';
import { TemaPage } from '../../support/rodape_commands/TemaPage';
import { arquivoPng } from '../../support/carrossel_commands/imagens';
import { mensagensCarrossel, slideDeTeste, intervaloDeTeste, corDaMarcaDeTeste, videoDeTeste } from '../../fixtures/carrossel';

const executar = process.env.EXECUTAR_CONFIG_CARROSSEL === 'sim';
const inicial = { quantidade: 0, habilitado: true, intervalo: '', corDaMarca: '' };

// O módulo Carrossel valida os slides: os vídeos são carregados, também nas sessões separadas
test.use({ bloquearVideos: false });
const comVideos = <T>(browser: Browser, sessao: Sessao, acao: (page: Page) => Promise<T>) =>
  comSessao(browser, sessao, acao, { videos: true });

// O slide de teste é sempre o último e existe só se a quantidade passou da inicial
async function slideDeTesteAtual(config: ConfiguracaoCarrosselPage) {
  const n = await config.ultimoSlide();
  expect(n, 'O slide de teste não existe — o CR10 precisa rodar antes').toBeGreaterThan(inicial.quantidade);
  return n;
}

const slidesDaEstudante = (browser: Browser) => comVideos(browser, sessoes.estudante, (page) => new CarrosselPage(page).lerSlides());

test.describe('CASOS DE TESTE 01: configuração do Carrossel', { tag: ['@dt-carrossel', '@altera-configuracao'] }, () => {
  test.skip(!executar, 'Altera o carrossel e o tema da plataforma inteira: rode com npm run test:carrossel-config');
  test.use({ storageState: sessoes.administrador });
  test.setTimeout(300_000);

  // Sem `serial`: com 1 worker os testes já rodam em ordem; depois de uma falha o afterAll restaura e o beforeAll relê
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(300_000);
    await comVideos(browser, sessoes.administrador, async (page) => {
      const config = new ConfiguracaoCarrosselPage(page);
      await config.acessar();
      inicial.quantidade = await config.quantidadeDeSlides();
      inicial.habilitado = await config.habilitar.isChecked();
      inicial.intervalo = await config.intervalo.inputValue();
      const tema = new TemaPage(page);
      await tema.acessar();
      inicial.corDaMarca = await tema.corDaMarca.inputValue();
    });
  });

  // Remove só os slides além da quantidade inicial — do último para o primeiro — e restaura o resto
  test.afterAll(async ({ browser }) => {
    test.setTimeout(600_000);
    await comVideos(browser, sessoes.administrador, async (page) => {
      const config = new ConfiguracaoCarrosselPage(page);
      await config.acessar();
      for (let n = await config.quantidadeDeSlides(); n > inicial.quantidade; n--) {
        await config.abrirRemocao(n);
        await config.botaoContinuar.click();
        await config.acessar();
      }
      await config.habilitar.setChecked(inicial.habilitado);
      await config.intervalo.fill(inicial.intervalo);
      await config.salvar();
      const tema = new TemaPage(page);
      await tema.acessar();
      await tema.corDaMarca.fill(inicial.corDaMarca);
      await tema.botaoSalvar.click();
      await tema.mensagemGravada.waitFor();
    });
  });

  test('CR10 - "Adicionar um novo slide" adiciona um slide ao carrossel, sem a opção "Alinhamento"', async ({
    configuracaoCarrossel: config,
  }) => {
    await test.step('Quando acessei a aba "Carrossel da Página Inicial" e cliquei em "Adicionar um novo slide"', async () => {
      await config.acessar();
      await config.adicionarSlide();
    });
    await test.step(`Então a mensagem "${mensagensCarrossel.novoSlide}" foi exibida`, () =>
      expect(config.mensagem(mensagensCarrossel.novoSlide)).toBeVisible());
    await test.step('E o novo slide foi exibido nas configurações, sem a opção "Alinhamento"', async () => {
      await config.acessar();
      expect(await config.quantidadeDeSlides()).toBe(inicial.quantidade + 1);
      await expect(config.painel.getByText(/Alinhamento/)).toHaveCount(0);
    });
  });

  test('CR11 - Slide com imagem 1280x720, título, cor, idioma e URL é exibido na Página inicial', async ({
    browser,
    configuracaoCarrossel: config,
  }) => {
    const n = await slideDeTesteAtual(config);
    await test.step(`Quando configurei o slide ${n} com "${slideDeTeste.titulo}", a imagem de 1280x720 pixels e cliquei em "Salvar mudanças"`, async () => {
      await config.campo(n, 'title').fill(slideDeTeste.titulo);
      await config.campo(n, 'titlecolor').fill(slideDeTeste.corDoTitulo);
      await config.campo(n, 'lang').selectOption(slideDeTeste.idioma);
      await config.campo(n, 'url').fill(slideDeTeste.url);
      await config.enviarArquivo(n, arquivoPng('carrossel-1280x720.png', 1280, 720));
      await config.salvar();
    });
    await test.step(`Então a mensagem "${mensagensCarrossel.gravadas}" foi exibida`, () =>
      expect(config.mensagem(mensagensCarrossel.gravadas)).toBeVisible());
    await test.step(`E a Estudante viu o slide "${slideDeTeste.titulo}" com o link "${slideDeTeste.url}" na Página inicial`, async () => {
      const { titulos, links } = await slidesDaEstudante(browser);
      expect(titulos.some((t) => t.includes(slideDeTeste.titulo))).toBe(true);
      expect(links).toContain(slideDeTeste.url);
    });
  });

  test('CR12 - Imagem de 940x627 pixels NÃO é adicionada ao slide', async ({ configuracaoCarrossel: config }) => {
    const n = await slideDeTesteAtual(config);
    await test.step(`Quando excluí a imagem do slide ${n}, confirmando "${mensagensCarrossel.confirmarExclusaoArquivo}"`, async () => {
      await expect(config.arquivosDoSlide(n)).not.toHaveCount(0);
      await config.excluirArquivo(n);
    });
    await test.step('E enviei uma imagem de 940x627 pixels e cliquei em "Salvar mudanças"', async () => {
      await config.enviarArquivo(n, arquivoPng('carrossel-940x627.png', 940, 627));
      await config.salvar();
    });
    await test.step(`Então a mensagem "${mensagensCarrossel.erroGeral}" foi exibida`, () =>
      expect(config.mensagem(mensagensCarrossel.erroGeral)).toBeVisible());
    await test.step(`E no campo "Imagem Slides ${n}" a mensagem "${mensagensCarrossel.erroDimensao}" foi exibida`, () =>
      expect(config.mensagem(mensagensCarrossel.erroDimensao)).toBeVisible());
  });

  test('CR13 - Imagem acima de 5 MB NÃO é adicionada ao slide', async ({ configuracaoCarrossel: config }) => {
    const n = await slideDeTesteAtual(config);
    // Pixels aleatórios não comprimem: 2400x1400 em RGB passa de 10 MB
    const grande = arquivoPng('carrossel-acima-5mb.png', 2400, 1400, 'ruido');
    expect(grande.buffer.length).toBeGreaterThan(5 * 1024 * 1024);
    await test.step('Quando enviei uma imagem acima de 5 MB e cliquei em "Salvar mudanças"', async () => {
      if (await config.arquivosDoSlide(n).count()) await config.excluirArquivo(n);
      await config.enviarArquivo(n, grande);
      await config.salvar();
    });
    await test.step(`Então a mensagem "${mensagensCarrossel.erroGeral}" foi exibida e a imagem NÃO foi adicionada`, async () => {
      await expect(config.mensagem(mensagensCarrossel.erroGeral)).toBeVisible();
      test.info().annotations.push({ type: 'mensagem do campo', description: await config.bloco(n, 'image').innerText() });
    });
  });

  test('CR14 - Slide com idioma "English" NÃO é exibido para a Estudante em português', async ({
    browser,
    configuracaoCarrossel: config,
  }) => {
    const n = await slideDeTesteAtual(config);
    await test.step(`Quando alterei o "Idioma Slides ${n}" para "English", com a imagem de 1280x720, e cliquei em "Salvar mudanças"`, async () => {
      if (await config.arquivosDoSlide(n).count()) await config.excluirArquivo(n);
      await config.enviarArquivo(n, arquivoPng('carrossel-1280x720.png', 1280, 720));
      await config.campo(n, 'lang').selectOption(slideDeTeste.idiomaDiferente);
      await config.salvar();
      await expect(config.mensagem(mensagensCarrossel.gravadas)).toBeVisible();
    });
    await test.step(`Então a Estudante NÃO viu o slide "${slideDeTeste.titulo}" na Página inicial`, async () => {
      const { titulos } = await slidesDaEstudante(browser);
      expect(titulos.some((t) => t.includes(slideDeTeste.titulo))).toBe(false);
    });
  });

  test('CR15 - Slide com vídeo (mp4) é exibido na Página inicial', async ({ browser, configuracaoCarrossel: config }) => {
    test.fixme(!existsSync(videoDeTeste), `Depende do vídeo de teste: coloque um mp4 pequeno em ${videoDeTeste}`);
    const n = await slideDeTesteAtual(config);
    await test.step(`Quando troquei a imagem do slide ${n} pelo vídeo, com o idioma "Português - Brasil", e cliquei em "Salvar mudanças"`, async () => {
      if (await config.arquivosDoSlide(n).count()) await config.excluirArquivo(n);
      await config.enviarArquivo(n, videoDeTeste);
      await config.campo(n, 'lang').selectOption(slideDeTeste.idioma);
      await config.salvar();
      await expect(config.mensagem(mensagensCarrossel.gravadas)).toBeVisible();
    });
    await test.step('Então a Estudante viu o vídeo no slide de teste da Página inicial', async () => {
      const { videos } = await slidesDaEstudante(browser);
      expect(videos.some((v) => v.endsWith('video.mp4'))).toBe(true);
    });
  });

  test(`CR16 - Com "Intervalo (em segundos)" = ${intervaloDeTeste}, os slides trocam em até ${intervaloDeTeste} segundos`, async ({
    browser,
    configuracaoCarrossel: config,
  }) => {
    await test.step(`Quando alterei o "Intervalo (em segundos)" para ${intervaloDeTeste} e cliquei em "Salvar mudanças"`, async () => {
      await config.acessar();
      await config.intervalo.fill(String(intervaloDeTeste));
      await config.salvar();
      await expect(config.mensagem(mensagensCarrossel.gravadas)).toBeVisible();
    });
    await test.step(`Então, na Página inicial da Estudante, o carrossel trocou de slide em até ${intervaloDeTeste} segundos`, () =>
      comVideos(browser, sessoes.estudante, async (page) => {
        const carrossel = new CarrosselPage(page);
        await carrossel.acessar();
        await carrossel.aguardar();
        const antes = await carrossel.posicaoDoSlideAtivo();
        await expect
          .poll(() => carrossel.posicaoDoSlideAtivo(), { timeout: (intervaloDeTeste + 5) * 1000, intervals: [500] })
          .not.toBe(antes);
      }));
  });

  test('CR17 - Com "Habilita o Carrossel" desmarcado, o carrossel NÃO é exibido na Página inicial', async ({
    browser,
    configuracaoCarrossel: config,
  }) => {
    await test.step('Quando desmarquei "Habilita o Carrossel" e cliquei em "Salvar mudanças"', async () => {
      await config.acessar();
      await config.habilitar.uncheck();
      await config.salvar();
      await expect(config.mensagem(mensagensCarrossel.gravadas)).toBeVisible();
    });
    for (const [perfil, sessao] of [
      ['Administrador', sessoes.administrador],
      ['Estudante', sessoes.estudante],
    ])
      await test.step(`Então o "${perfil}" NÃO viu o carrossel na Página inicial`, () =>
        comVideos(browser, sessao, async (page) => {
          const carrossel = new CarrosselPage(page);
          await carrossel.acessar();
          await expect(carrossel.primeiroBloco).toBeVisible();
          await expect(carrossel.carrossel).toHaveCount(0);
        }));
  });

  test(`CR18 - "Cor da Marca" ${corDaMarcaDeTeste} é aplicada ao tema`, async ({ browser, tema }) => {
    await test.step(`Quando alterei a "Cor da Marca" para ${corDaMarcaDeTeste} em "Configurações gerais" e cliquei em "Salvar mudanças"`, async () => {
      await tema.acessar();
      await tema.corDaMarca.fill(corDaMarcaDeTeste);
      await tema.botaoSalvar.click();
      await tema.mensagemGravada.waitFor();
    });
    await test.step(`Então o estilo da Página inicial da Estudante passou a usar a cor ${corDaMarcaDeTeste}`, () =>
      comVideos(browser, sessoes.estudante, async (page) => {
        await new CarrosselPage(page).acessar();
        const cor = corDaMarcaDeTeste.toLowerCase();
        const aplicada = await page.evaluate(async (procurada) => {
          const folhas = [...document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]')].map((l) => l.href);
          for (const href of folhas) {
            if (!href.startsWith(location.origin)) continue;
            if ((await (await fetch(href)).text()).toLowerCase().includes(procurada)) return true;
          }
          return false;
        }, cor);
        expect(aplicada).toBe(true);
      }));
  });

  test('CR19 - "Remover o slide" remove o slide de teste do carrossel', async ({ browser, configuracaoCarrossel: config }) => {
    const n = await slideDeTesteAtual(config);
    await test.step(`Quando cliquei em "Remover o slide ${n}"`, () => config.abrirRemocao(n));
    await test.step(`Então a mensagem "${mensagensCarrossel.confirmarRemocao(n)}" foi exibida`, () =>
      expect(config.mensagem(mensagensCarrossel.confirmarRemocao(n))).toBeVisible());
    await test.step('Quando cliquei em "Continuar"', () => config.botaoContinuar.click());
    await test.step(`Então a mensagem "${mensagensCarrossel.slideRemovido(n)}" foi exibida`, () =>
      expect(config.mensagem(mensagensCarrossel.slideRemovido(n))).toBeVisible());
    await test.step(`E o carrossel voltou a ter ${inicial.quantidade} slides nas configurações`, async () => {
      await config.acessar();
      expect(await config.quantidadeDeSlides()).toBe(inicial.quantidade);
    });
    await test.step(`E a Estudante NÃO viu o slide "${slideDeTeste.titulo}" na Página inicial`, async () => {
      await config.habilitar.check();
      await config.salvar();
      const { titulos } = await slidesDaEstudante(browser);
      expect(titulos.some((t) => t.includes(slideDeTeste.titulo))).toBe(false);
    });
  });
});
