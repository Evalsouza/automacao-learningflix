// DT/EVT - "Acessar como visitante" Inserir a funcionalidade na página de login — rastreabilidade em RASTREABILIDADE.md
import { test, expect } from '../../support/e2e';
import {
  paginas,
  blocos,
  menuLateral,
  abasDashboards,
  cursoRestrito,
  cursoVisitante,
  obrigatoriosAjuda,
  assuntoAjuda,
  dadosDoVisitanteNaAjuda,
} from '../../fixtures/acessovisitante';

const semSessao = { cookies: [], origins: [] };

test.describe(
  'CASOS DE TESTE 001: Habilitar a visualização do botão "Acessar como visitante"',
  { tag: '@dt-acessar-como-visitante' },
  () => {
    test.describe('Administrador', () => {
      test.use({ storageState: '.auth/administrador.json' });

      test('V01 - "Botão de entrada como visitante" está em "Mostrar" em "Gerenciar autenticação"', async ({ gerenciarAutenticacao }) => {
        await test.step('Quando acessei "Administração do site → Plugins → Gerenciar autenticação"', () =>
          gerenciarAutenticacao.acessarPelaAdministracao());
        await test.step('Então a opção "Botão de entrada como visitante" estava em "Mostrar"', () =>
          expect(gerenciarAutenticacao.valorEntradaVisitante()).toHaveText('Mostrar'));
      });
    });

    test.describe('Sem login', () => {
      test.use({ storageState: semSessao });

      test('V02 - "Acessar como visitante" é exibido no final da página de login', async ({ login, visitante }) => {
        await test.step('Quando acessei a página de login e naveguei até o final da página', async () => {
          await login.acessar();
          await visitante.botaoAcessarComoVisitante.scrollIntoViewIfNeeded();
        });
        await test.step('Então a opção "Acessar como visitante" foi exibida', () =>
          expect(visitante.botaoAcessarComoVisitante).toBeVisible());
      });
    });
  },
);

test.describe('CASOS DE TESTE 002: Acessando a plataforma como visitante', { tag: '@dt-acessar-como-visitante' }, () => {
  test.describe('Acordo de política do site', () => {
    test.use({ storageState: semSessao });

    test('V03 - "Acessar como visitante" redireciona para o "Acordo de política do site"', async ({ visitante }) => {
      await test.step('Quando cliquei em "Acessar como visitante"', () => visitante.acessarPoliticaPeloLogin());
      await test.step(`Então fui redirecionada para a página "${paginas.politica}"`, () => expect(visitante.tituloPolitica).toBeVisible());
    });

    test('V04 - "Não" no acordo de política volta para a página de login', async ({ page, visitante }) => {
      await visitante.acessarPoliticaPeloLogin();
      await test.step('Quando cliquei em "Não"', () => visitante.botaoNao.click());
      await test.step('Então fui redirecionada para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
    });

    test('V05 - "Sim" no acordo de política redireciona para a Página Inicial', async ({ page, visitante }) => {
      await visitante.acessarPoliticaPeloLogin();
      await test.step('Quando cliquei em "Sim"', () => visitante.botaoSim.click());
      await test.step(`Então fui redirecionada para a Página Inicial "${paginas.inicialDoVisitante}"`, async () => {
        await expect(page).toHaveURL(/\/my\//);
        await expect(page).toHaveTitle(paginas.inicialDoVisitante);
      });
    });
  });

  test.describe('Visitante', () => {
    test.use({ storageState: semSessao });

    test.beforeEach(({ visitante }) => visitante.entrarComoVisitante());

    test('V06 - Página Inicial exibe os blocos do carrossel', async ({ visitante }) => {
      for (const bloco of blocos) {
        await test.step(`Então o bloco "${bloco}" foi exibido`, () => expect(visitante.bloco(bloco)).toBeVisible());
      }
    });

    test('V07 - Menu lateral exibe as opções do visitante', async ({ visitante }) => {
      for (const opcao of menuLateral) {
        await test.step(`Então a opção "${opcao}" foi exibida`, () => expect(visitante.linkDoMenu(opcao)).toBeVisible());
      }
      await test.step('E a opção "Acessar" foi exibida', () => expect(visitante.botaoAcessarDoMenu).toBeVisible());
    });

    test('V08 - "Catálogo" NÃO é exibido no menu lateral do visitante', async ({ visitante }) => {
      await test.step('Então a opção "Catálogo" NÃO foi exibida no menu lateral', () =>
        expect(visitante.menuLateral.getByRole('link', { name: /Cat[aá]logo/ })).toHaveCount(0));
    });

    test('V09 - Carrossel exibido na página "my" e "Próximo slide" mostra o próximo slide', async ({ page, visitante }) => {
      let antes = -1;
      await test.step('Então o carrossel foi exibido na página "my"', async () => {
        await expect(page).toHaveURL(/\/my\//);
        await expect(visitante.carrossel).toBeVisible();
        antes = await visitante.posicaoDoSlideAtivo();
      });
      await test.step('Quando cliquei em "Próximo slide"', () => visitante.proximoSlide.click());
      await test.step('Então o carrossel exibiu o próximo slide', () => expect.poll(() => visitante.posicaoDoSlideAtivo()).not.toBe(antes));
    });

    test('V24 - "Slide anterior" volta para o slide exibido antes', async ({ visitante }) => {
      let primeiro = -1;
      await test.step('Quando cliquei em "Próximo slide"', async () => {
        primeiro = await visitante.posicaoDoSlideAtivo();
        await visitante.proximoSlide.click();
        await expect.poll(() => visitante.posicaoDoSlideAtivo()).not.toBe(primeiro);
      });
      await test.step('E cliquei em "Slide anterior"', () => visitante.slideAnterior.click());
      await test.step('Então o carrossel voltou para o primeiro slide', () =>
        expect.poll(() => visitante.posicaoDoSlideAtivo()).toBe(primeiro));
    });

    test('V25 - Marcador do carrossel mostra o slide correspondente', async ({ visitante }) => {
      let antes = -1;
      await test.step('Quando cliquei no segundo marcador do carrossel', async () => {
        antes = await visitante.posicaoDoSlideAtivo();
        await visitante.marcadores.nth(1).click();
      });
      await test.step('Então o carrossel exibiu o segundo slide e o segundo marcador ficou ativo', async () => {
        await expect.poll(() => visitante.posicaoDoSlideAtivo()).not.toBe(antes);
        await expect(visitante.marcadores.nth(1)).toHaveClass(/glide__bullet--active/);
      });
    });

    test(`V10 - Primeiro curso do bloco "${cursoRestrito.bloco}" exibe a mensagem de acesso restrito ao visitante`, async ({
      visitante,
    }) => {
      await test.step(`Quando no bloco "${cursoRestrito.bloco}" acessei o primeiro curso exibido`, () =>
        visitante.primeiroCursoDoBloco(cursoRestrito.bloco).click());
      await test.step(`Então a mensagem "${cursoRestrito.mensagem}" foi exibida`, () =>
        expect(visitante.mensagemCursoRestrito).toBeVisible());
    });

    test('V11 - "Continuar" na mensagem de acesso restrito redireciona para a página de login', async ({ page, visitante }) => {
      await test.step(`Quando acessei o primeiro curso do bloco "${cursoRestrito.bloco}" e cliquei em "Continuar"`, async () => {
        await visitante.primeiroCursoDoBloco(cursoRestrito.bloco).click();
        await visitante.botaoContinuar.click();
      });
      await test.step('Então fui redirecionada para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
    });

    test(`V13 - Visitante acessa o curso "${cursoVisitante.nome}"`, async ({ page, curso }) => {
      await test.step(`Quando acessei o curso "${cursoVisitante.nome}"`, () => curso.acessar(cursoVisitante.id));
      await test.step('Então fui redirecionada para a página do curso', () => expect(page).toHaveTitle(`Curso: ${cursoVisitante.nome}`));
    });

    test(`V14 - Atividade "${cursoVisitante.tipoAtividade}" da "${cursoVisitante.temporada}" é exibida ao visitante`, async ({
      page,
      curso,
    }) => {
      await curso.acessar(cursoVisitante.id);
      await test.step(`Quando acessei a atividade "${cursoVisitante.atividade}" na "${cursoVisitante.temporada}"`, () =>
        curso.temporada(cursoVisitante.temporada).getByRole('link', { name: cursoVisitante.atividade }).first().click());
      await test.step('Então a atividade foi exibida', async () => {
        await expect(page).toHaveURL(/\/mod\/assign\/view\.php/);
        await expect(page.getByRole('heading', { name: cursoVisitante.atividade }).first()).toBeVisible();
      });
    });

    test('V15 - "Calendário" no menu lateral abre a página "Calendário"', async ({ page, visitante }) => {
      await test.step('Quando cliquei em "Calendário" no menu lateral', () => visitante.linkDoMenu('Calendário').click());
      await test.step(`Então fui redirecionada para a página "${paginas.calendario}"`, async () => {
        await expect(page).toHaveURL(/\/calendar\/view\.php/);
        await expect(page.getByRole('heading', { name: paginas.calendario, exact: true }).first()).toBeVisible();
      });
    });

    test('V16 - "Ajuda" abre a página e os campos aceitam o preenchimento', async ({ visitante, ajuda }) => {
      const mensagem = 'Mensagem de teste do visitante';
      await test.step('Quando cliquei em "Ajuda" no menu lateral', () => visitante.linkDoMenu('Ajuda').click());
      await test.step(`Então fui redirecionada para a página "${paginas.ajuda}"`, () => expect(ajuda.titulo).toBeVisible());
      await test.step('E "Nome" e "Matrícula" vieram preenchidos com os dados do visitante', async () => {
        await expect(ajuda.campoNome).toHaveValue(new RegExp(`^${dadosDoVisitanteNaAjuda.nome}\\s*$`));
        await expect(ajuda.campoMatricula).toHaveValue(dadosDoVisitanteNaAjuda.matricula);
      });
      await test.step('Quando preenchi os demais campos, sem enviar', async () => {
        await ajuda.selectCurso.selectOption({ index: 1 });
        await ajuda.selectAssunto.selectOption({ label: assuntoAjuda });
        await ajuda.digitarMensagem(mensagem);
      });
      await test.step('Então os campos aceitaram os valores preenchidos', async () => {
        await expect(ajuda.selectCurso).not.toHaveValue('choice');
        await expect(ajuda.selectAssunto.locator('option:checked')).toHaveText(assuntoAjuda);
        await expect(ajuda.campoMensagem).toContainText(mensagem);
      });
    });

    test('V22 - "Dashboards" no menu lateral abre a página "Geral" com as abas do painel', async ({ page, visitante }) => {
      await test.step('Quando cliquei em "Dashboards" no menu lateral', () => visitante.linkDoMenu('Dashboards').click());
      await test.step(`Então fui redirecionada para a página "${paginas.dashboards}"`, async () => {
        await expect(page).toHaveURL(/\/report\/dashboard\/index\.php/);
        await expect(page).toHaveTitle(paginas.dashboards);
      });
      for (const aba of abasDashboards) {
        await test.step(`E a aba "${aba}" foi exibida`, () =>
          expect(page.getByRole('link', { name: aba, exact: true }).first()).toBeVisible());
      }
    });

    test('V23 - "Chamados" no menu lateral abre a página "Chamados"', async ({ page, visitante }) => {
      await test.step('Quando cliquei em "Chamados" no menu lateral', () => visitante.linkDoMenu('Chamados').click());
      await test.step(`Então fui redirecionada para a página "${paginas.chamados}"`, async () => {
        await expect(page).toHaveURL(/\/local\/tickets\/index\.php/);
        await expect(page.getByRole('heading', { name: paginas.chamados, exact: true }).first()).toBeVisible();
      });
    });

    test('V17 - "Acessar" no menu lateral redireciona para a página de login', async ({ page, visitante }) => {
      await test.step('Quando cliquei em "Acessar" no menu lateral', () => visitante.botaoAcessarDoMenu.click());
      await test.step('Então fui redirecionada para a página de login', () => expect(page).toHaveURL(/\/login\/index\.php/));
    });
  });

  test.describe('Administrador', () => {
    test.use({ storageState: '.auth/administrador.json' });

    test(`V12 - Curso "${cursoVisitante.nome}" tem o método "${cursoVisitante.metodo}" ativo`, async ({ curso }) => {
      await test.step(`Quando acessei "Participantes → Métodos de inscrição" do curso "${cursoVisitante.nome}"`, () =>
        curso.acessarMetodosDeInscricao(cursoVisitante.id));
      await test.step(`Então o método "${cursoVisitante.metodo}" estava ativo`, () =>
        expect(curso.acaoDoMetodo(cursoVisitante.metodo, 'Desabilitar')).toBeVisible());
    });
  });
});

test.describe('Ajuda do visitante', { tag: '@dt-acessar-como-visitante' }, () => {
  test.use({ storageState: semSessao });

  test.beforeEach(async ({ visitante, ajuda }) => {
    await visitante.entrarComoVisitante();
    await ajuda.acessar();
  });

  for (const { id, campo, bloco } of obrigatoriosAjuda) {
    test(`${id} - "${campo}" é obrigatório na "Ajuda"`, async ({ ajuda }) => {
      await test.step(`Então o campo "${campo}" foi marcado como obrigatório`, () => expect(ajuda.marcaObrigatorio(bloco)).toBeVisible());
      await test.step('Quando cliquei em "Enviar" sem preencher os campos', () => ajuda.botaoEnviar.click());
      await test.step('Então a mensagem de campo obrigatório foi exibida', () => expect(ajuda.mensagemDoCampo(bloco)).toHaveText(/\S/));
    });
  }

  test('CAN01 - "Cancelar" na "Ajuda" descarta o que foi preenchido', async ({ page, ajuda }) => {
    await test.step(`Quando selecionei o assunto "${assuntoAjuda}" e cliquei em "Cancelar"`, async () => {
      await ajuda.selectAssunto.selectOption({ label: assuntoAjuda });
      await ajuda.botaoCancelar.click();
    });
    await test.step(`Então permaneci na página "${paginas.ajuda}" com o assunto sem seleção`, async () => {
      await expect(page).toHaveURL(/\/local\/support\/index\.php/);
      await expect(ajuda.selectAssunto).toHaveValue('choice');
    });
  });
});
