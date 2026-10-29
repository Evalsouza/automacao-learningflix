// Responsividade - Jira LFXP-1941 — rodapé — rastreabilidade em RASTREABILIDADE.md
// O tema esconde o rodapé em telas estreitas: na página de login abaixo de 768 px e depois do login abaixo de 992 px
import { test, expect } from '../../support/e2e';
import { resolucoes, temRolagemHorizontal } from '../../support/responsividade';
import { larguraMinimaDoRodape } from '../../fixtures/rodape';

const paginas = [
  { nome: 'página de login', sessao: { cookies: [], origins: [] }, url: '/login/index.php', larguraMinima: larguraMinimaDoRodape.login },
  { nome: '"Página inicial" da Estudante', sessao: '.auth/estudante.json', url: '/my/', larguraMinima: larguraMinimaDoRodape.aposLogin },
];

for (const { tipo, dispositivo, resolucao } of resolucoes) {
  for (const { nome, sessao, url, larguraMinima } of paginas) {
    const exibido = dispositivo.viewport.width >= larguraMinima;

    test.describe(`Rodapé - ${tipo} - ${nome}`, { tag: ['@responsivo', '@dt-rodape'] }, () => {
      test.use({ ...dispositivo, storageState: sessao });

      test(`Rodapé - ${tipo} ${resolucao} - ${nome}`, async ({ page, rodape }) => {
        await test.step(`Quando acessei a ${nome}`, () => page.goto(url));
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
