// DR/EVTR - Skill Link, Fluxo da Gestão — Cenário 2 (só leitura) — rastreabilidade em RASTREABILIDADE.md
// "Exportar" baixa o histórico para a pasta do teste; "Adicionar créditos" só é clicado com o campo vazio (C046)
import { readFile } from 'fs/promises';
import { test, expect } from '../../../support/e2e';
import { sessoes } from '../../../support/sessoes';
import { caminhosSkillLink, creditosSkillLink } from '../../../fixtures/skilllink';
import { prioridade } from '../../../fixtures/prioridades';

test.describe(
  'CENÁRIO 2: Gerar e Gerenciar as competências com "Adm Cliente" | Perfil Adm Cliente (papel Cliente)',
  { tag: '@dt-skill-link-gestao' },
  () => {
    test.use({ storageState: sessoes.cliente });
    // O filtro de período recarrega os cards: C026 a C028 passaram dos 90 s na rodada de 19/11
    test.setTimeout(180_000);

    test(
      'C023 - Sidebar Administração exibe "Créditos do Skill Link", que leva à página "Skill Link"',
      { tag: prioridade('SkillLink', 'C023') },
      async ({ page, creditosSkillLink: creditos }) => {
        await test.step('Quando acessei "Administração" pelo Sidebar', async () => {
          await creditos.acessarAdministracaoPeloSidebar();
        });
        const link = creditos.linkCreditos.first();
        await test.step(`Então a opção "${creditosSkillLink.link}" foi exibida`, () => expect(link).toBeVisible());
        await test.step(`E, ao clicar, fui redirecionada à página "${creditosSkillLink.titulo}"`, async () => {
          await link.click();
          await expect(page).toHaveURL(new RegExp(caminhosSkillLink.creditosCliente));
          await expect(creditos.titulo).toBeVisible();
        });
      },
    );

    test.describe('Página "Skill Link"', () => {
      test.beforeEach(({ creditosSkillLink: creditos }) => creditos.acessarComoCliente());

      test(
        'C024 - Os cards "Franquia mensal", "Créditos contratados", "Créditos consumidos" e "Créditos restantes" são exibidos no lugar e com o percentual',
        { tag: prioridade('SkillLink', 'C024') },
        async ({ creditosSkillLink: creditos }) => {
          await test.step(`Então os cards foram exibidos nesta ordem: ${creditosSkillLink.cards.join(', ')}`, async () =>
            expect(await creditos.titulosDosCards()).toEqual(creditosSkillLink.cards));
          await test.step('E "Franquia mensal" exibiu o saldo do mês com o percentual', async () =>
            expect(await creditos.percentual('Franquia mensal')).not.toBe(''));
          await test.step('E "Créditos contratados" exibiu o saldo (do mês anterior, se houver) com a barra do total utilizado', () =>
            expect(creditos.barraDeUso('Créditos contratados')).toBeVisible());
          await test.step('E "Créditos consumidos" exibiu os créditos já utilizados com o percentual', async () =>
            expect(await creditos.percentual('Créditos consumidos')).not.toBe(''));
          await test.step('E "Créditos restantes" exibiu os créditos restantes com o percentual', async () =>
            expect(await creditos.percentual('Créditos restantes')).not.toBe(''));
        },
      );

      test('C025 - A nomenclatura usada é "Créditos", sem o termo "Tokens"', { tag: prioridade('SkillLink', 'C025') }, async ({ page }) => {
        await test.step('Então o termo "Tokens" NÃO foi exibido na página', () =>
          expect(page.getByText(/\btokens?\b/i).filter({ visible: true })).toHaveCount(0));
      });

      test(
        'C026 - "Créditos restantes" corresponde ao total da franquia mais os créditos contratados, menos os consumidos',
        { tag: prioridade('SkillLink', 'C026') },
        async ({ creditosSkillLink: creditos }) => {
          // Regra da QA (19/11): total da franquia do mês ("usados de N") + contratados − consumidos, no período padrão da
          // página (com "Todo o período" o card "Créditos restantes" não é exibido)
          await test.step('Então restantes = total da franquia + créditos contratados − créditos consumidos', async () => {
            await expect(creditos.card('Créditos restantes'), 'Card "Créditos restantes" não exibido').toBeVisible();
            const franquia = await creditos.totalDaFranquia();
            const [contratados, consumidos, restantes] = await Promise.all(
              ['Créditos contratados', 'Créditos consumidos', 'Créditos restantes'].map((c) => creditos.valor(c)),
            );
            expect(restantes, `${franquia} + ${contratados} − ${consumidos}`).toBe(Math.max(0, franquia + contratados - consumidos));
          });
        },
      );

      test(
        `C027 - Com o filtro "${creditosSkillLink.periodoTodo}", os cards são atualizados e exibidos com o percentual`,
        { tag: prioridade('SkillLink', 'C027') },
        async ({ creditosSkillLink: creditos }) => {
          const doMes = await test.step(`Dado que selecionei "${creditosSkillLink.periodoMes}"`, async () => {
            await creditos.selecionarPeriodo(creditosSkillLink.periodoMes);
            return creditos.valor('Créditos consumidos');
          });
          await test.step(`Quando selecionei "${creditosSkillLink.periodoTodo}"`, () =>
            creditos.selecionarPeriodo(creditosSkillLink.periodoTodo));
          await test.step(`Então foram exibidos ${creditosSkillLink.cardsTodoPeriodo.join(', ')}`, async () =>
            expect(await creditos.titulosDosCards()).toEqual(creditosSkillLink.cardsTodoPeriodo));
          for (const nome of creditosSkillLink.cardsTodoPeriodo)
            await test.step(`E "${nome}" exibiu o percentual`, async () =>
              nome === 'Créditos contratados'
                ? expect(creditos.barraDeUso(nome), nome).toBeVisible()
                : expect(await creditos.percentual(nome), nome).not.toBe(''));
          await test.step('E os consumidos do período inteiro incluíram os do mês', async () =>
            expect(await creditos.valor('Créditos consumidos')).toBeGreaterThanOrEqual(doMes));
        },
      );

      test(
        `C028 - Com o filtro "${creditosSkillLink.periodoMes}", os cards são atualizados conforme o período`,
        { tag: prioridade('SkillLink', 'C028') },
        async ({ creditosSkillLink: creditos }) => {
          const total = await test.step(`Dado que selecionei "${creditosSkillLink.periodoTodo}"`, async () => {
            await creditos.selecionarPeriodo(creditosSkillLink.periodoTodo);
            return creditos.valor('Créditos consumidos');
          });
          await test.step(`Quando selecionei "${creditosSkillLink.periodoMes}"`, () =>
            creditos.selecionarPeriodo(creditosSkillLink.periodoMes));
          await test.step('Então os consumidos passaram a ser só os do mês, e os gráficos continuaram exibidos', async () => {
            expect(await creditos.valor('Créditos consumidos')).toBeLessThanOrEqual(total);
            for (const grafico of creditosSkillLink.graficos) await expect(creditos.graficos.filter({ hasText: grafico })).toHaveCount(1);
          });
        },
      );

      test(
        'C029 - Os atalhos "Cargos", "Cursos", "Vídeos" e "SCORM" são exibidos',
        { tag: prioridade('SkillLink', 'C029') },
        async ({ creditosSkillLink: creditos }) => {
          for (const nome of ['Cargos', 'Cursos', 'Vídeos', 'SCORM'])
            await test.step(`Então o atalho "${nome}" foi exibido`, () => expect(creditos.atalho(nome)).toBeVisible());
        },
      );

      for (const { id, nome, janela, destino, tela } of creditosSkillLink.atalhos) {
        test(
          `${id} - O atalho "${nome}" abre a janela "${janela}" e, após a seleção, leva à edição`,
          { tag: prioridade('SkillLink', id) },
          async ({ page, creditosSkillLink: creditos }) => {
            await test.step(`Quando cliquei no atalho "${nome}"`, () => creditos.abrirAtalho(nome));
            await test.step(`Então a janela "${janela}" foi exibida com a seleção de categoria e curso`, async () => {
              await expect(creditos.janela.getByRole('heading', { name: janela })).toBeVisible();
              await expect(creditos.janela.getByRole('combobox', { name: 'Categoria' })).toBeVisible();
            });
            const editar = await test.step(
              nome === 'Cursos' ? 'Quando selecionei a categoria e o curso' : 'Quando selecionei a categoria, o curso e a atividade',
              () => creditos.selecionarNaJanela({ comAtividade: nome !== 'Cursos' }),
            );
            await test.step('E cliquei em "Editar"', async () => {
              await editar.click();
              await creditos.aguardarCarregar();
            });
            await test.step('Então fui direcionada à edição do item selecionado', async () => {
              await expect(page).toHaveURL(destino);
              // Cursos: janela "Editar configurações do curso" no Gerenciamento de Cursos; atividades: página de edição
              await expect(
                page
                  .getByRole('document', { name: tela })
                  .or(page.getByRole('heading', { name: tela }))
                  .first(),
              ).toBeVisible();
            });
          },
        );
      }

      test(
        'C033 - O atalho "Cargos" leva à página "Cargos" do Gerenciador de Hierarquia',
        { tag: prioridade('SkillLink', 'C033') },
        async ({ page, creditosSkillLink: creditos }) => {
          await test.step('Quando cliquei no atalho "Cargos"', () => creditos.atalho('Cargos').click());
          await test.step('Então fui direcionada à página "Cargos" da Hierarquia', async () => {
            await expect(page).toHaveURL(/\/local\/hierarchy\//);
            await expect(page.getByRole('heading', { name: /cargos/i }).first()).toBeVisible();
          });
        },
      );

      test(
        'C034 - Os gráficos "Consumo de créditos por tipo" e "Distribuição do consumo" são exibidos',
        { tag: prioridade('SkillLink', 'C034') },
        async ({ creditosSkillLink: creditos }) => {
          for (const grafico of creditosSkillLink.graficos)
            await test.step(`Então o gráfico "${grafico}" foi exibido`, () =>
              expect(creditos.graficos.filter({ hasText: grafico })).toHaveCount(1));
        },
      );

      test(
        'C035 - A grade "Histórico de consumo" exibe as colunas do documento',
        { tag: prioridade('SkillLink', 'C035') },
        async ({ creditosSkillLink: creditos }) => {
          await test.step(`Então as colunas ${creditosSkillLink.colunasConsumo.join(', ')} foram exibidas`, async () =>
            expect(await creditos.colunas()).toEqual(creditosSkillLink.colunasConsumo));
        },
      );

      test(
        'C036 - "Buscar por recurso ou usuário" exibe somente os registros correspondentes',
        { tag: prioridade('SkillLink', 'C036') },
        async ({ creditosSkillLink: creditos }) => {
          // Termo: uma palavra do recurso da 1ª linha — o histórico muda todo dia
          const termo = await test.step('Dado que li o recurso do primeiro registro', async () => {
            const [recurso] = await creditos.coluna('Recurso');
            return recurso.split(/[^\p{L}\d]+/u).find((p) => p.length >= 5) ?? recurso;
          });
          await test.step(`Quando busquei por "${termo}"`, () => creditos.buscar(termo));
          await test.step(`Então todos os registros exibidos têm "${termo}" no recurso ou no usuário`, async () => {
            const recursos = await creditos.coluna('Recurso');
            const usuarios = await creditos.coluna('Usuário');
            expect(recursos.length).toBeGreaterThan(0);
            const fora = recursos.filter((r, i) => !`${r} ${usuarios[i]}`.toLowerCase().includes(termo.toLowerCase()));
            expect(fora).toEqual([]);
          });
        },
      );

      test(
        `C037 - O filtro "Todos os tipos" com "${creditosSkillLink.tipoFiltrado}" exibe somente os registros desse tipo`,
        { tag: prioridade('SkillLink', 'C037') },
        async ({ creditosSkillLink: creditos }) => {
          await test.step(`Quando selecionei "${creditosSkillLink.tipoFiltrado}" no filtro de tipos`, () =>
            creditos.filtrarTipo(creditosSkillLink.tipoFiltrado));
          await test.step(`Então só registros do tipo "${creditosSkillLink.tipoFiltrado}" foram exibidos`, async () => {
            const tipos = await creditos.coluna('Tipo');
            expect(tipos.length).toBeGreaterThan(0);
            expect([...new Set(tipos)]).toEqual([creditosSkillLink.tipoFiltrado]);
          });
        },
      );

      test(
        'C038 - "Ver detalhes" (ícone de olho) exibe os dados completos do registro',
        { tag: prioridade('SkillLink', 'C038') },
        async ({ creditosSkillLink: creditos }) => {
          const linha = creditos.linhas.first();
          const [recurso] = await creditos.coluna('Recurso');
          const [usuario] = await creditos.coluna('Usuário');
          await test.step('Quando cliquei em "Ver detalhes" no primeiro registro', () => creditos.verDetalhes(linha).click());
          await test.step('Então a janela exibiu o recurso e o usuário do registro', async () => {
            await expect(creditos.janela).toBeVisible();
            await expect(creditos.janela).toContainText(recurso);
            // A coluna traz as iniciais do avatar antes do nome ("AR Admin Revvo")
            await expect(creditos.janela).toContainText(usuario.replace(/^[A-Z]{1,3}\s+/, ''));
          });
        },
      );

      test(
        'C039 - "Exportar" baixa o histórico com os registros exibidos',
        { tag: prioridade('SkillLink', 'C039') },
        async ({ page, creditosSkillLink: creditos }) => {
          const [recurso] = await creditos.coluna('Recurso');
          const arquivo = await test.step('Quando cliquei em "Exportar"', async () => {
            const [download] = await Promise.all([page.waitForEvent('download'), creditos.exportar.click()]);
            const destino = test.info().outputPath(download.suggestedFilename());
            await download.saveAs(destino);
            return destino;
          });
          await test.step('Então o arquivo baixado contém o primeiro registro exibido', async () =>
            expect(await readFile(arquivo, 'utf-8')).toContain(recurso));
        },
      );

      test(
        `C040 - Com o papel "Cliente", o botão "${creditosSkillLink.modificar}" NÃO é apresentado`,
        { tag: prioridade('SkillLink', 'C040') },
        async ({ creditosSkillLink: creditos }) => {
          await test.step(`Então o botão "${creditosSkillLink.modificar}" NÃO foi apresentado`, async () => {
            await expect(creditos.cards).toBeVisible();
            await expect(creditos.modificar).toHaveCount(0);
          });
        },
      );
    });
  },
);

test.describe(
  'CENÁRIO 2: Gerar e Gerenciar as competências com "Adm Cliente" | Perfil Administrador Revvo',
  { tag: '@dt-skill-link-gestao' },
  () => {
    test.use({ storageState: sessoes.administrador });

    test(
      `C041 - Pelo caminho "Administração do site → Relatórios", a página exibe "${creditosSkillLink.modificar}" e valores em "US$"; a alteração é em créditos`,
      { tag: prioridade('SkillLink', 'C041') },
      async ({ page, creditosSkillLink: creditos, modificarCreditos }) => {
        await test.step(`Quando acessei "Administração do site → Relatórios → ${creditosSkillLink.link}"`, async () => {
          await creditos.acessarPorRelatorios();
          await expect(page).toHaveURL(new RegExp(caminhosSkillLink.creditosAdmin));
        });
        await test.step(`Então o botão "${creditosSkillLink.modificar}" e os valores em "US$" foram exibidos`, async () => {
          await expect(creditos.modificar.first()).toBeVisible();
          await expect(creditos.cards).toContainText('US$');
        });
        // A alteração é feita só em créditos; a grade de resultado mostra o valor em dólares (QA, 19/11)
        await test.step(`Quando abri "${creditosSkillLink.modificar}"`, () => modificarCreditos.acessar());
        await test.step('Então a alteração é informada em créditos e a grade exibe o valor em dólares', async () => {
          await expect(modificarCreditos.quantidade).toBeVisible();
          const dolares = await modificarCreditos.coluna('Valor em dólares (US$)');
          expect(dolares.length).toBeGreaterThan(0);
          for (const valor of dolares) expect(valor).toContain('US$');
          for (const creditos of await modificarCreditos.coluna('Créditos')) expect(creditos).not.toContain('US$');
        });
      },
    );

    test.describe('Página "Modificar créditos"', () => {
      test.beforeEach(({ modificarCreditos }) => modificarCreditos.acessar());

      test(
        'C042 - O subtítulo da página "Modificar créditos" é exibido no topo',
        { tag: prioridade('SkillLink', 'C042') },
        async ({ modificarCreditos }) => {
          await test.step(`Então o subtítulo "${creditosSkillLink.subtitulo}" foi exibido`, () =>
            expect(modificarCreditos.subtitulo).toHaveText(creditosSkillLink.subtitulo));
        },
      );

      test(
        'C046 - "Quantidade de créditos" vazio NÃO é aceito por ser campo obrigatório',
        { tag: prioridade('SkillLink', 'C046') },
        async ({ modificarCreditos }) => {
          const antes = await modificarCreditos.estado();
          await test.step('Quando deixei o campo vazio e cliquei em "Adicionar créditos"', async () => {
            await expect(modificarCreditos.quantidade).toHaveValue('');
            await modificarCreditos.adicionar.click();
          });
          await test.step(`Então a mensagem "${creditosSkillLink.campoObrigatorio}" foi exibida`, () =>
            expect(modificarCreditos.erroDoCampo).toContainText(creditosSkillLink.campoObrigatorio));
          await test.step('E o saldo e o histórico NÃO foram alterados', async () =>
            expect(await modificarCreditos.estado()).toEqual(antes));
        },
      );

      test(
        'C047 - "Cancelar" depois de preencher a quantidade aborta a operação sem alterar saldo e histórico',
        { tag: prioridade('SkillLink', 'C047') },
        async ({ modificarCreditos }) => {
          const antes = await modificarCreditos.estado();
          await test.step(`Quando preenchi "${creditosSkillLink.quantidadeValida}" e cliquei em "Cancelar"`, async () => {
            await modificarCreditos.quantidade.fill(creditosSkillLink.quantidadeValida);
            await modificarCreditos.cancelar.click();
            await modificarCreditos.aguardarCarregar();
          });
          await test.step('Então o saldo e o histórico NÃO foram alterados', async () =>
            expect(await modificarCreditos.estado()).toEqual(antes));
        },
      );

      test(
        'C048 - A grade "Histórico de alterações" exibe as colunas do documento',
        { tag: prioridade('SkillLink', 'C048') },
        async ({ modificarCreditos }) => {
          await test.step(`Então as colunas ${creditosSkillLink.colunasAlteracoes.join(', ')} foram exibidas`, async () => {
            await expect(modificarCreditos.tituloDaGrade).toBeVisible();
            expect(await modificarCreditos.colunas()).toEqual(creditosSkillLink.colunasAlteracoes);
          });
        },
      );

      test(
        'C049 - Os registros apresentam data e hora, tipo, usuário responsável e valor do crédito',
        { tag: prioridade('SkillLink', 'C049') },
        async ({ modificarCreditos }) => {
          await test.step('Então cada registro tem data e hora da ação', async () => {
            for (const data of await modificarCreditos.coluna('Data')) expect(data).toMatch(/\d{2}\/\d{2}\/\d{2,4}\s+\d{2}:\d{2}/);
          });
          await test.step('E o tipo, o usuário e o valor do crédito preenchidos', async () => {
            for (const coluna of ['Tipo', 'Usuário', 'Créditos']) expect(await modificarCreditos.coluna(coluna)).not.toContain('');
          });
        },
      );

      test(
        'C050 - O "Histórico de alterações" é ordenado do mais recente para o mais antigo',
        { tag: prioridade('SkillLink', 'C050') },
        async ({ modificarCreditos }) => {
          await test.step('Então a coluna "Data" ficou em ordem do mais recente para o mais antigo', async () => {
            // "18/11/26 16:31" → 2611181631, comparável como número
            const chave = (d: string) => {
              const [, dia, mes, ano, hora, minuto] = /(\d{2})\/(\d{2})\/(\d{2,4})\s+(\d{2}):(\d{2})/.exec(d) ?? [];
              return Number(`${ano.slice(-2)}${mes}${dia}${hora}${minuto}`);
            };
            const datas = (await modificarCreditos.coluna('Data')).map(chave);
            expect(datas.length).toBeGreaterThan(1);
            expect(
              datas.every((d, i) => i === 0 || datas[i - 1] >= d),
              datas.join(', '),
            ).toBe(true);
          });
        },
      );

      test(
        'C051 - Registros já efetivados no histórico NÃO podem ser alterados ou excluídos',
        { tag: prioridade('SkillLink', 'C051') },
        async ({ modificarCreditos }) => {
          await test.step('Então as linhas do histórico NÃO têm links, botões ou campos de edição', async () => {
            await expect(modificarCreditos.linhas.first()).toBeVisible();
            await expect(modificarCreditos.linhas.locator('a, button, input')).toHaveCount(0);
          });
        },
      );

      test(
        'C052 - Ao atingir o limite de registros por página, a paginação padrão permite navegar entre os dados',
        { tag: prioridade('SkillLink', 'C052') },
        async ({ modificarCreditos }) => {
          const primeira = (await modificarCreditos.linhas.allInnerTexts()).join('|');
          await test.step('Quando cliquei na página "2" da paginação', async () => {
            await modificarCreditos.paginacao.getByRole('link', { name: '2', exact: true }).first().click();
            await modificarCreditos.aguardarCarregar();
          });
          await test.step('Então outros registros foram exibidos', async () => {
            await expect(modificarCreditos.totalDeRegistros).toContainText(/Mostrando 11 /);
            expect((await modificarCreditos.linhas.allInnerTexts()).join('|')).not.toBe(primeira);
          });
        },
      );
    });
  },
);
