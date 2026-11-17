# Rastreabilidade — Módulo MeusCursos

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução.

| Tag | Significado |
|---|---|
| `@dt-meus-cursos` | DT/EVT - Página inicial: Bloco "Meus Cursos" |
| `@dt-obrigatoriedade` | DT/EVT - Obrigatoriedade do Curso — Como Administrador e Como Usuário Final (LFXP-6914) |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@altera-configuracao` | Altera configuração da plataforma — rodada semanal |
| `@cria-usuario` | Cria um usuário real e o exclui ao final — rodada semanal |

| Script | O que roda |
|---|---|
| `npm run test:meus-cursos` | Todo o módulo, menos as suítes de configuração e de usuário novo |
| `npm run test:meus-cursos-config` | Só a suíte de configuração (`EXECUTAR_CONFIG_MEUS_CURSOS=sim`) — também roda na rodada semanal |
| `npm run test:meus-cursos-novo` | Só a suíte do usuário novo (`EXECUTAR_MEUS_CURSOS_NOVO=sim`) — também roda na rodada semanal |

---

## Documentos e versões (05/11/2026)

| Documento | Versão |
|---|---|
| [DT / EVT - Página inicial: Bloco "Meus Cursos"](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3422916282) | v1 (15/08/2023), ambiente smart4-qa |
| Requisito [CBTD - Pagina Inicial: Bloco: Meus Cursos](https://epicbrasil.atlassian.net/wiki/spaces/SLMS/pages/3330637825) — SLMS-932 | **v8** (23/05/2023) |
| [DT / EVT - Bloco Página Genérica: Meus Cursos](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3422918980) | v1 — só o botão "Ver todos", decisão da QA |
| [Lógica dos Blocos da Home](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/4763418678) | 2025 — regra atual de ordenação |
| [Capa - Obrigatoriedade do Curso](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5822119943) — LFXP-6914 | v8 (03/11/2026) |
| [DT/EVT - Obrigatoriedade do Curso - Como Administrador](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5816614965) | v26 (03/11/2026) |
| [DT/EVT - Obrigatoriedade do Curso - Como Usuário Final](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5823234061) | v18 (03/11/2026) |

## Requisito × DT/EVT

- **Como era × como está:** o DT/EVT do bloco copia uma versão antiga do requisito, em que "8 por paginação" era limite **máximo**. Na v8 do requisito, 8 é o **mínimo e o padrão** (RF003, RNF002), e o administrador pode configurar mais. Os casos do DT/EVT (3 não salva, 9 salva) já seguem a v8.
- **Ordenação da Página inicial:** o requisito (RF002) e o DT/EVT pedem os 4 cursos **mais acessados**; a Lógica dos Blocos (2025), a Capa de Obrigatoriedade e a tela (`data-sort="last_access"`) usam os **últimos acessados**. **Decisão da QA (05/11): últimos acessados.**
- **Regras do requisito sem caso no DT/EVT:** RNF001 (cards por dispositivo, sempre até 4 na Página inicial) — coberto pela responsividade; RF002 "Ver todos independente da quantidade de cursos" — coberto por MC20 com o usuário novo.
- **Casos do DT/EVT fora do requisito:** nenhum.
- **Obrigatoriedade** (LFXP-6914, posterior ao requisito do bloco): o bloco ganhou os botões "Necessário" e "Opcional" e o "Ver todos" o filtro "Obrigatoriedade". Coberto pelos cenários do bloco e do "Ver todos" dos dois DT/EVT.

---

## DT/EVT - Página inicial: Bloco "Meus Cursos" — `valida_meus_cursos.spec.ts` (só leitura)

| Caso do DT/EVT | Teste |
|---|---|
| CT 01 — Administrador vê "4 Cards" na Página inicial | MC01 — até 4 cards e o botão "Ver todos" |
| CT 02 — Usuário vê o bloco com "4 Cards" | MC02 (Estudante) e MC03 — os cards são de cursos inscritos |
| CT 01 e 02 — cursos "em ordem adequada" na Página inicial | MC04 — mesma ordem do "Ver todos" por "Últimos acessados", em cada obrigatoriedade |
| CT 01 e 02 — "Ver todos" redireciona para a página "Meus Cursos" | MC05 — título, 8 cards por página e paginação |
| CT 01 e 02 — "Ver todos" em ordem de inscrição (mais nova → mais antiga) | MC06 — "Ordenar por" padrão "Data de início da inscrição" |

**Configuração — `valida_configuracao_meus_cursos.spec.ts`** (`@altera-configuracao`; restaura o valor inicial ao final)

| Caso do DT/EVT | Teste |
|---|---|
| CT 01 — "Número de cards na página" disponível em Plugins → Blocos → Meus Cursos | MC10 — campo com "Padrão: 8" |
| CT 01 — limite "3" não é salvo | MC11 |
| CT 01 — limite "9" → "Mudanças gravadas" e 9 cards no "Ver todos" | MC12 |
| Requisito v8 (RF003, RNF002) — 8 é o mínimo: "7" não é salvo e "8" é salvo, com 8 cards no "Ver todos" | MC13 e MC14 — valor-limite, pedido da QA (17/11), lacuna (d) da Estratégia |

## DT/EVT - Obrigatoriedade do Curso — `valida_meus_cursos.spec.ts` (só leitura, Estudante)

| Condição | Teste |
|---|---|
| Admin 031, Usuário 003 — "Necessário" e "Opcional", com "Opcional" por padrão | OB01 |
| Admin 032, Usuário 004 a 006 — cada opção mostra só a sua classificação; ao alternar não sobram cursos | OB02 |
| Admin 033, Usuário 007 — ordenação mantida | OB03 (e MC04) |
| Usuário 009 e 010 — filtro "Obrigatoriedade" no "Ver todos" | OB04 |
| Usuário 011 — filtro combinado com busca, Modalidade e status | OB05 |
| Usuário 012 — ordenação com o filtro aplicado | OB06 |
| Usuário 013 e 014 — paginação mantém os filtros; troca numa página posterior | OB07 |
| Usuário 015 — combinação sem correspondência | OB08 |
| Usuário 016 — voltar para "Todos" preserva busca e filtros | OB09 |
| Usuário 001 (card do "Meus Cursos" e "i") e 021 — mesma classificação no card e na página do curso | OB10 — "Necessário" e "Opcional" |
| Usuário 026 a 028 — curso "Nenhuma" só em "Todos" | OB11 — `fixme` se a Estudante não tiver curso "Nenhuma" inscrito |

**Usuário novo — `valida_meus_cursos_usuario_novo.spec.ts`** (`@cria-usuario`; cria `qa.auto3` pelo "Criar uma conta" e o exclui ao final)

| Condição | Teste |
|---|---|
| Requisito RF002 — "Ver todos" independente da quantidade de cursos | MC20 — bloco sem cards e com "Ver todos" |
| DT Página Genérica — página do bloco sem cursos | MC21 — "Nenhum curso" |
| Usuário 008 — classificação sem cursos apresenta o estado vazio | MC22 |

**Responsividade — `validacao_responsividade_meus_cursos.spec.ts`:** bloco, "Ver todos", opções de obrigatoriedade e cards dentro da tela nas 4 resoluções; até 4 cards na Página inicial (RNF001).

---

**Decisões tomadas com a QA (05/11)**

- A Página inicial ordena pelos **últimos acessados**.
- Os testes validam a **regra**, sem nomes de cursos: a massa do DT/EVT (Curso Teste 1 a 9, qa.aluno5 e qa.aluno6 com acessos de 2023, smart4-qa) não vale para o QA atual.
- Da Página Genérica entra só a exibição do botão "Ver todos"; os filtros dela entram pela Obrigatoriedade.
- Da Obrigatoriedade entram só o bloco e o "Ver todos". Ficam de fora: Administrador 001 a 030 e 034 a 044 (campo personalizado, criação e edição de curso, CSV, duplicação, backup, permissões, migração) e Usuário cenários 1 (demais blocos e Catálogo), 4 (demais blocos) e 6 (alteração da classificação).
- **Usuário novo:** criado pelo "Criar uma conta"; os cenários ficam prontos e passam a valer quando o defeito do cadastro (28/10) for corrigido. Agora só o caso sem cursos; a matrícula entra com a automação do vínculo de usuário.
- OB10 abre o primeiro curso de cada opção, que já é o último acessado: a ordem do bloco não muda.

**Defeitos confirmados**

| Caso | Esperado — requisito v8 (RF003, RNF002) e DT/EVT | Obtido |
|---|---|---|
| MC11 e MC13 | "Número de cards na página" abaixo de 8 **NÃO** é salvo — o DT/EVT usa "3"; o valor-limite, "7" | "Mudanças gravadas" e o campo ficou com 3 e com 7 — visto em 17/11 na suíte de configuração; o 8 (MC14) e o 9 (MC12) são salvos. Ao final a suíte restaurou o valor inicial (8). **Defeito confirmado pela QA em 17/11** — requisito RF003: "sendo o padrão a quantidade mínima '8' (oito) para paginação". Abrir no Jira com a skill de bugs |

**Divergências entre documentos e sistema**

- A configuração "Número de cards na página" (`block_mycourses | per_page`) é aberta pela página do bloco, `/admin/settings.php?section=blocksettingmycourses`. Até 13/11 o teste usava a busca da administração (`query=block_mycourses`), que deixou de listar esse campo — MC10 a MC12 falharam na semanal de 13/11 por isso; não era defeito da plataforma (16/11).
- Ambiente e massa do DT/EVT: `smart4-qa.leobr.net` e `smart4-homolog.leobr.net`; os testes rodam em `qa.learningflix.net`.
- O DT/EVT chama a configuração de "aba"; na tela é o campo "Número de cards na página" (`block_mycourses | per_page`).
- O DT/EVT diz "08(nove) Cards" no caso da paginação — erro de digitação.
- O DT/EVT da Página Genérica mostra o filtro "Ordenar por" com 2 opções no requisito riscado; a tela tem 5: "Nome do curso", "Data de criação do curso", "Últimos acessados", "Mais assistidos" e "Data de início da inscrição".
- Os cards do "Ver todos" carregam depois da página: os testes esperam o carregador antes de ler os cursos.
- A busca do "Ver todos" também encontra cursos pela descrição, não só pelo nome: OB05 e OB09 conferem que o curso buscado está no resultado.
- A paginação do "Ver todos" troca a lista sem recarregar a página (botões, sem a página na URL).
- Cards com imagem trazem o nome do curso só no texto alternativo da imagem.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
