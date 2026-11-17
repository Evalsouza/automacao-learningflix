// Responsividade - Jira LFXP-1941 — rodapé — rastreabilidade em RASTREABILIDADE.md
// O tema esconde o rodapé em telas estreitas: na página de login abaixo de 768 px e depois do login abaixo de 992 px
import { test, expect } from '../../../support/e2e';
import { sessoes, semSessao } from '../../../support/sessoes';
import { resolucoes, temRolagemHorizontal } from '../../../support/responsividade';
import { larguraMinimaDoRodape } from '../../../fixtures/rodape';
import { prioridade } from '../../../fixtures/prioridades';

const paginas = [
  { nome: 'página de login', sessao: semSessao, url: '/login/index.php', larguraMinima: larguraMinimaDoRodape.login },
  { nome: '"Página inicial" da Estudante', sessao: sessoes.estudante, url: '/my/', larguraMinima: larguraMinimaDoRodape.aposLogin },
];

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  for (const { nome, sessao, url, larguraMinima } of paginas) {
    const exibido = dispositivo.viewport.width >= larguraMinima;

    test.describe(`Rodapé - ${tipo} - ${nome}`, { tag: ['@responsivo', '@dt-rodape'] }, () => {
      test.use({ ...dispositivo, storageState: sessao });

      test(`Rodapé - ${tipo} ${resolucao} - ${nome}`, { tag: prioridade('Rodape') }, async ({ page, rodape }) => {
        await test.step(`Quando acessei a ${nome}`, () => rodape.acessar(url));
        if (exibido)
          await test.step('Então, no fim da página, o idioma e "© Desenvolvido por" ficaram dentro da tela', async () => {
            await rodape.irParaOFim();
            await expect(rodape.idioma).toBeInViewport();
            await expect(rodape.direitos).toBeInViewport();
          });
        else
          await test.step(`Então o rodapé NÃO foi exibido — o tema o esconde abaixo de ${larguraMinima} px`, async () => {
            await expect(rodape.idioma).toBeHidden();
            await expect(rodape.direitos).toBeHidden();
          });
        await test.step('E a página não teve rolagem horizontal', async () => expect(await temRolagemHorizontal(page)).toBe(false));
      });
    });
  }
}

// Valor-limite das larguras em que o tema passa a exibir o rodapé — lacuna (c) da Estratégia, pedido da QA (17/11):
// 1 px abaixo do limite o rodapé fica escondido; no limite, é exibido
const limites = [
  { id: 'RD20', pagina: paginas[0], largura: larguraMinimaDoRodape.login - 1 },
  { id: 'RD21', pagina: paginas[0], largura: larguraMinimaDoRodape.login },
  { id: 'RD22', pagina: paginas[1], largura: larguraMinimaDoRodape.aposLogin - 1 },
  { id: 'RD23', pagina: paginas[1], largura: larguraMinimaDoRodape.aposLogin },
];

for (const { id, pagina, largura } of limites) {
  const exibido = largura >= pagina.larguraMinima;

  test.describe(`Rodapé - limite de ${pagina.larguraMinima} px - ${pagina.nome}`, { tag: ['@responsivo', '@dt-rodape'] }, () => {
    test.use({ viewport: { width: largura, height: 900 }, storageState: pagina.sessao });

    test(
      `${id} - Com ${largura} px, o rodapé ${exibido ? 'é' : 'NÃO é'} exibido na ${pagina.nome}`,
      { tag: prioridade('Rodape', id) },
      async ({ rodape }) => {
        await test.step(`Quando acessei a ${pagina.nome} com a tela de ${largura} px de largura`, () => rodape.acessar(pagina.url));
        // Ir até o fim espera o rodapé aparecer: só quando ele é exibido
        if (exibido)
          await test.step('Então, no fim da página, o idioma e "© Desenvolvido por" foram exibidos', async () => {
            await rodape.irParaOFim();
            await expect(rodape.idioma).toBeInViewport();
            await expect(rodape.direitos).toBeInViewport();
          });
        else
          await test.step(`Então o rodapé NÃO foi exibido — o tema o esconde abaixo de ${pagina.larguraMinima} px`, async () => {
            await expect(rodape.idioma).toBeHidden();
            await expect(rodape.direitos).toBeHidden();
          });
      },
    );
  });
}
