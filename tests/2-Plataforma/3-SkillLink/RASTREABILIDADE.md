# Rastreabilidade — Módulo SkillLink

Regressivo gerado em 19/11/2026 a partir das evidências da branch `evidencia/skill-link-fluxo-gestao` (worktree `automacao-learningflix-evidencias`, pasta `evidencias/skill-link-gestao`). Seletores, ids de curso/atividade/cargo e resultados vêm dessas evidências (13 e 18/11). **Ainda não executado**: falta a primeira rodada.

| Tag | Significado |
|---|---|
| `@dt-skill-link-gestao` | DR/EVTR - Skill Link, Fluxo da Gestão |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@altera-configuracao` | Altera configuração, curso, cargo ou atividade e restaura ao final |
| `@altera-saldo` | Adiciona créditos de forma permanente (o histórico não se apaga) |

| Script | O que roda |
|---|---|
| `npm run test:skill-link` | Todo o módulo, menos as 3 suítes que alteram dados |
| `npm run test:skill-link-config` | Cenário 1 que altera "Configurações de competências" (`EXECUTAR_CONFIG_SKILL_LINK=sim`) |
| `npm run test:skill-link-creditos` | Cenário 2 que adiciona créditos e desabilita o Skill Link (`EXECUTAR_CREDITOS_SKILL_LINK=sim`) — **só com o "ok" da QA**: cada rodada soma ao menos 2 créditos (C043 e C044), mais 2 enquanto a C045.3 falhar |
| `npm run test:skill-link-recomendados` | Cenário 3 que altera curso, cargo e atividade (`EXECUTAR_RECOMENDADOS_SKILL_LINK=sim`) — **só com o "ok" da QA**: o cargo 163 vale para todos os usuários dele |

As 3 suítes que alteram dados **não** entraram no `test:semanal`: decisão a tomar com a QA.

---

## Documentos e versões

| Documento | Versão |
|---|---|
| [DR/EVTR - Skill Link, Fluxo da Gestão](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5824806913) | Rascunho de 18/11/2026 (publicada v8) |
| PRD "Gestão e Mensuração de Créditos do Skill Link" (LP1 5707956229) | v2.0 (25/08/2026) — base do Cenário 2 |
| DT/EVT "Gestão e Mensuração de Créditos do Skill Link" (LP1 5711495170) | Origem das condições 040 a 053 |
| DT/EVT "Bloco Cursos recomendados para o meu cargo" (LP1 5434703905) | CT118 a CT127 — origem do Cenário 3 |

**Escopo combinado com a QA (19/11):** Cenários 1, 2 e 3 (condições 001 a 074). Os Cenários 4 a 9 (075 a 116) ficam de fora: têm `[preencher]`, dependem do Lizza ou consomem créditos na geração.

**Cenário 7 — Conversor PPTX para SCORM (103 a 106): fora do regressivo (QA, 19/11).** Há bug em tratamento pelo DEV, [LFXP-6986](https://epicbrasil.atlassian.net/browse/LFXP-6986); o cenário não entra nesta entrega e será ajustado depois.

---

## Cenário 1 — Configurações de competências (Administrador Revvo)

**Só leitura — `valida_configuracao_competencias.spec.ts`**

| Condição | Teste |
|---|---|
| 001 | C001 — título, campos, descrições e "Padrão" |
| 002 a 005 | C002 a C005 — cada campo preenchido (o valor nunca é impresso) |
| 019 | C019 — "Padrão: 500" |

**Altera a configuração — `valida_configuracao_skill_link_ia.spec.ts`** (cada teste parte de tudo marcado com as URLs e créditos originais; o `afterAll` volta à configuração lida no início e confere)

| Condição | Teste |
|---|---|
| 006 | C006 — "Habilitado" desmarcado: sem botão no curso 283 e no "Adicionar cargo" |
| 007 | C007 — URLs inválidas: mensagem de erro no curso 315 e na atividade 3037 |
| 008 | C008 — IA desmarcada: curso 283 com a seção "Skill Link", sem o botão |
| 009 a 018 | C009 a C018 — um teste por opção desmarcada e por opção marcada |
| 020 | C020.1 a C020.3 — "5,50", "-500" e "abc" não são salvos; C020.4 — vazio é salvo como "0", sem bloqueio (QA, 19/11) |
| 021 | C021 — "0" é salvo sem bloqueio |
| 022 | C022 — tudo habilitado e "500": salva e confere ao recarregar |

## Cenário 2 — Créditos do Skill Link

**Só leitura — `valida_creditos_skill_link.spec.ts`**

| Condição | Perfil | Teste |
|---|---|---|
| 023 a 040 | Adm Cliente | C023 a C040 |
| 041, 042, 046 a 052 | Administrador Revvo | C041, C042, C046 a C052 (C046 clica em "Adicionar créditos" com o campo vazio; C047 preenche e cancela) |

**Altera saldo e configuração — `valida_creditos_skill_link_altera.spec.ts`**

| Condição | Teste |
|---|---|
| 043 | C043 — adiciona 1 crédito: restantes +1 e histórico +1 |
| 044 | C044 — confirmação antes de adicionar (adiciona mais 1 crédito) |
| 045 | C045.1 a C045.4 — zero, negativo, decimal e texto |
| 053 | C053 — "Habilitado" desmarcado: o Adm Cliente **continua** acessando "Créditos do Skill Link" — a configuração dos créditos segue normal (QA, 19/11); o `afterAll` marca de novo e confere |

## Cenário 3 — Cursos recomendados para o seu cargo (Eva Souza)

**Só leitura — `valida_cursos_recomendados.spec.ts`**

| Condição | Teste |
|---|---|
| 061.1, 061.2 | Filtro "Obrigatoriedade" — "Necessário" e "Opcional" exibem só cursos com essa classificação, entre os de "Todos" (incluído pela QA, 19/11) |
| 054, 056, 058 a 061, 063, 064, 068, 069 | Um teste por condição, com a Estudante. C063 e C064 conferem antes a pré-condição com o Administrador (só leitura) |
| 074 | C074 — login com a usuária sem cargo ("Atlas Shepherd", `SEM_CARGO_USUARIO`/`SEM_CARGO_SENHA` no `.env`); o bloco não exibe cursos. Fica `fixme` enquanto as variáveis estiverem vazias |
| 055, 057 | C055 e C057 — competências do cargo 163 e de cada curso, lidas na hora pelo Administrador |

**Altera dados — `valida_cursos_recomendados_altera.spec.ts`** (cada teste desfaz no `finally`; o `afterAll` confere a referência)

| Condição | Teste |
|---|---|
| 062 | C062 — confere antes que o 212 tem competência em comum com o cargo da usuária (QA, 19/11); autoinscrição desativada e reativada |
| 070 | C070 — **curso 284** (QA, 19/11: o 299 não grava a remoção): "Controle de Qualidade" posta, o curso aparece; tirada, o curso some do bloco e da página. Autoinscrição volta ao estado inicial |
| 071, 072 | C071 e C072 — "Controle de Qualidade" tirada do cargo 163 e devolvida |
| 067, 073 | C067 e C073 — "Controle de Qualidade" no vídeo 3017 do curso 313 e retirada |
| 065, 066 | C065 e C066 — "Controle de Qualidade" na 1ª atividade SCORM e na 1ª de Arquivo do **curso 230** (indicado pela QA em 19/11), lidas na página do curso a cada execução. Confere antes que o curso não tem competência própria em comum; liga a autoinscrição só durante o teste; no fim confere que a competência não ficou no curso (CT122, o que deixou resíduo no 325) |

## Não automatizados agora

| Condição | Motivo |
|---|---|

## Não cobertos pelo documento

- Responsividade (padrão da equipe), nas 4 resoluções: `validacao_responsividade_configuracao_competencias.spec.ts` (Administrador), `validacao_responsividade_creditos_skill_link.spec.ts` (Adm Cliente) e `validacao_responsividade_cursos_recomendados.spec.ts` (Estudante). As suítes que alteram dados não têm responsividade própria: as telas são as mesmas.

## Divergências DR × sistema e decisões a confirmar com a QA

1. **C007:** o DR diz curso "Qualidade e Segurança (id315)", mas o id 315 é "Controle de qualidade" (o 316 é "Qualidade e Segurança"). O teste usa o **id 315**. A mensagem esperada está como "a": o teste aceita qualquer aviso de erro de comunicação (em 13/11: "Erro na API: cURL error 6: Could not resolve host…").
2. **C010 e C012:** o DR fala em criação **e** edição. O teste confere as duas (cargo 163 e criação de cargo; curso 283 e criação de curso). Criação de curso e edição de cargo não foram evidenciadas: confirmar na primeira rodada.
3. **C019 a C022:** o campo "Créditos iniciais" agora se chama **"Franquia mensal de créditos"**. O teste localiza o campo pelo id. O botão é "Salvar mudanças" (o DR diz "Salvar alterações").
4. **C020 × C021:** a C020 diz que o vazio **não** pode ser salvo; a C021 aceita "0"; o sistema salva o vazio como "0". C020.4 está como falha conhecida até a QA decidir.
5. **C027 e C028:** o teste usa "Novembro de 2026", como no DR. Quando o mês sair do filtro, trocar `periodoMes` em `fixtures/skilllink.ts`.
6. **C037:** só o tipo "Cargo" foi evidenciado. Os outros tipos ("Curso", "Atividade (PDF)", "Atividade SCORM", "Atividade Vídeo") podem virar parâmetros depois da primeira rodada.
7. **C042:** o subtítulo perdeu o "(em dólares)" com a correção do LFXP-7126. O teste segue o texto do DR e falha: atualizar o DR ou reabrir o bug.
8. **C055/C057:** o teste exige competência em comum **no próprio curso**. Um curso recomendado só pela competência de uma atividade (HU004) faria o teste falhar: hoje nenhum está nesse caso.
9. **C069:** o DR (18/11) diz que os cursos inscritos **são** exibidos no bloco, ao contrário da HU003 ("deixem de ser exibidos"). O teste segue o DR: confere que há ao menos um curso inscrito no bloco.
10. **C070 e C071:** o DR fala em **bloco**; o bloco mostra no máximo 4 cursos. O 299 e o 227 estão no bloco hoje.

## Primeiras rodadas (19/11/2026)

- **12:41** — 13 falhas: 3 conhecidas (C042, C050, C064) e 10 de script (cards, bloco de recomendados, filtros, busca, iniciais do usuário em "Ver detalhes"). Corrigidas.
- **13:22** — 8 falhas em 58 executados: 4 conhecidas (C042, C050, C060, C064) e 4 de script, corrigidas:
  - **C026:** com "Todo o período" a página do Adm Cliente não exibe o card "Créditos restantes". O teste passou a usar o período padrão da página. ⚠️ **Para a QA:** a página agora tem o card "Franquia mensal" (0, "318 usados de 10") ao lado de "Créditos contratados" (2) e "Créditos consumidos" (956). A conta "restantes = contratados − consumidos" do DR pode não valer mais com a franquia. **Confirmado pela QA (19/11): o DR está desatualizado.** A C026 ficou `fixme` até o DR/PRD trazer a regra nova; o teste continua no arquivo para ser reativado.
  - **C061:** a página tem cards ocultos no DOM (cursos ONLINE que não aparecem na tela); a leitura passou a considerar só os visíveis.
  - **Responsividade Tablet e Celular rotacionado:** a lista era lida antes de carregar (duas leituras vazias seguidas); agora espera o primeiro curso.
- A C074 passou: a Atlas Shepherd não tem cursos no bloco.

## Ajustes pedidos pela QA (19/11/2026)

Mapeamento só de leitura no QA, no mesmo dia, com o Adm Cliente, o Admin e a Eva Souza.

| Condição | Ajuste |
|---|---|
| 020 | "5,50", "-500" e texto não são salvos; o vazio é salvo como "0" sem bloqueio (C020.4) |
| 024 | Cards na ordem Franquia mensal, Créditos contratados, Créditos consumidos e Créditos restantes, cada um com o percentual. ⚠️ Hoje o card "Créditos contratados" **não exibe percentual** (mostra "1 usados no mês"): o teste deve falhar nesse passo até o sistema ou a regra mudar |
| 026 | Reativada com a regra da QA (19/11): restantes = **total da franquia do mês** (o "N" de "usados de N") + créditos contratados − créditos consumidos, no período padrão da página (sem resultado negativo). ⚠️ Com os dados de 19/11 (franquia "318 usados de 0", contratados 2, consumidos 319, restantes 2) a conta dá 0 e a tela mostra 2: o teste deve falhar até a regra ou os dados mudarem |
| 027 | "Todo o período": exibe Franquia mensal, Créditos contratados e Créditos consumidos, com o percentual (o card "Créditos restantes" não aparece) |
| 030 a 032 | Janela: "Categoria" (1ª da lista) → "Curso" (1º da lista) → atividade (Vídeos e SCORM) → "Editar". Cursos: abre "Gerenciamento de Cursos" com a janela "Editar configurações do curso"; Vídeos: "Atualizando um Streaming"; SCORM: "Atualizando um Pacote SCORM". Nada é salvo |
| 041 | Além do botão e dos US$ nos cards: a alteração é informada em créditos ("Quantidade de créditos") e a grade mostra o valor em dólares |
| 042 | Subtítulo atual, sem "(em dólares)" — corrigido no sistema |
| 050 | O "Histórico de alterações" é ordenado do mais recente para o mais antigo (não há ordenação por coluna) |
| 053 | Com o Skill Link desabilitado, os créditos continuam acessíveis ao Adm Cliente |
| 060 | Regra da página: a busca traz os cursos com o termo no nome **ou em uma atividade do curso**. O teste abre a página do curso quando o termo não está no card |
| 061.1, 061.2 | Novo: filtro "Obrigatoriedade" (Todos, Necessário, Opcional) |
| 062 | Pré-condição: o 212 tem competência em comum com o cargo da usuária (lida na edição do curso pelo Admin) |
| 070 | Curso 284 no lugar do 299 |

Saíram das falhas conhecidas: C020.4, C042, C050, C060 e C070.

## Rodada das 16:09 (19/11/2026)

40 de 47 passaram. Falhas:
- **C024 e C027** — o card "Créditos contratados" não exibe o número do percentual. **QA (19/11): o card tem a barra com o total utilizado da quantidade contratada** — o teste passou a conferir a barra nesse card. Saiu das falhas conhecidas.
- **C030, C061.1 e C061.2** — script: a janela de Cursos tem um 2º select oculto e o texto do card era lido de um elemento interno sem texto. Corrigidos.
- **C060** — a busca "Controle" trouxe 316 e 227, além do 315. **QA (19/11): está correto** — a busca procura em campos da configuração do curso (nome, competências…). O teste passou a conferir só que o curso 315 foi localizado, sem abrir a página do curso.
- **C064** — conhecida (LFXP-6424).
- A C026 que rodou ainda era a versão anterior (franquia + contratados) e passou; a regra nova (total da franquia + contratados − consumidos) ainda não rodou.

## Pendências para a retomada (parado em 19/11/2026, 17:44)

Última rodada (só leitura): 40 passaram, 4 falharam, 3 pendentes. Nenhuma falha de script.

1. **C024 e C027** — o card "Créditos contratados" não tem barra nem percentual na tela (só "1 usados no mês"); a QA esperava a barra do total utilizado. Decidir: defeito ou ajustar o teste à tela.
2. **C026** — regra da QA (total da franquia + contratados − consumidos) dá 0; a tela mostra 2 ("Franquia restante + créditos contratados"). Decidir: defeito ou regra do card.
3. **Curso 284** — apareceu nos recomendados na rodada das 17:44. Conferir se ficou com "Controle de Qualidade" depois da C070 (resíduo).
4. **Suítes que alteram dados** — ainda não rodaram com as mudanças de 19/11: `test:skill-link-config` (C020.4 novo), `test:skill-link-creditos` (C053 novo) e `test:skill-link-recomendados` (C062, C065/C066 no curso 230, C070 no curso 284).
5. **Commit** — nada do módulo foi commitado; a `main` tem também alterações de outros trabalhos.

## Falhas conhecidas (`fixtures/falhas-conhecidas.ts`)

| Teste | Falha | Desde |
|---|---|---|
| C044 | Sem confirmação ao adicionar créditos | 13/11 |
| C045.3 | "1.5" aceito, soma 2 créditos | 18/11 |
| ~~C064~~ | Curso oculto exibido — LFXP-6424. **Passou em 24 e 25/11: saiu das falhas conhecidas (ok da QA, 25/11)** | 13/11 |

Prioridades em `fixtures/prioridades.ts` (módulo `SkillLink`) são uma proposta: críticos C001, C023, C024, C054 e C056.
