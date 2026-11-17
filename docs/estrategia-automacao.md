# Estratégia de Automação de Testes — LearningFlix

> **Versão 1.3 — 17/11/2026** (versão 1.0 aprovada pela QA em 12/11/2026). Itens marcados com **[QA]** ainda dependem de decisão da QA (seção 17).
> Documento principal da automação: as páginas "Condições Validadas", "Rastreabilidade" e "Execução Diária" detalham o que está resumido aqui. A cópia no projeto fica em `docs/estrategia-automacao.md`.

| Item | Valor |
|---|---|
| Projeto | `automacao-learningflix` — Playwright + TypeScript |
| Objeto de teste | LearningFlix (Moodle) — `https://qa.learningflix.net` |
| Responsável | Eva Souza (QA) |
| Apoio | Claude (criação e manutenção dos scripts, análise de cobertura) |
| Aprovação | Eva Souza — 12/11/2026 |

---

## 1. Objetivo

Automatizar a regressão funcional da plataforma LearningFlix a partir dos documentos de teste (DT/EVT) e dos requisitos do espaço LP1, com execução diária e semanal, rastreabilidade de cada teste ao caso e ao requisito, e relatório publicado para a equipe.

## 2. Referências

| Referência | Uso neste projeto |
|---|---|
| ISTQB CTAL-TAE — Test Automation Engineer | Arquitetura da automação (gTAA), critérios de seleção, métricas, manutenção |
| ISTQB CTFL — Foundation Level | Processo de teste, técnicas de projeto de teste, gestão de defeitos |
| ISO/IEC/IEEE 29119-2 | Processo de teste: planejamento, projeto, implementação, execução e encerramento |
| ISO/IEC/IEEE 29119-3 | Estrutura deste documento e dos relatórios (plano, condições, casos, status, encerramento) |
| ISO/IEC/IEEE 29119-4 | Técnicas de projeto de teste |
| ISO/IEC 25010 | Características de qualidade validadas: adequação funcional, usabilidade (responsividade), segurança (acesso por perfil) |
| Documentos do LP1 | Requisitos, DT/EVT e DT/EVTR de cada funcionalidade |

## 3. Escopo

### 3.1 Dentro do escopo

| Módulo | Base de teste | Testes (12/11) |
|---|---|---|
| Login | DT/EVT Página de Login; DT/EVT Tela de Login — ver a senha | 28 |
| Cadastro | DTI/EVTI Página Criar uma conta | 50 |
| Redefinição de Senha | DTI/EVTI Redefinição de Senha Personalizada; DT/EVT Página de Login (C09 a C14) | 87 |
| Visitante (acesso) | DT/EVT "Acessar como visitante" | 33 |
| Rodapé | Jira LFXP-1941 | 20 |
| Carrossel | DT/EVT Plugin Carrossel Infinito | 18 |
| Meus Cursos | DT/EVT Bloco "Meus Cursos"; DT/EVT Obrigatoriedade do Curso (LFXP-6914) | 28 |

Todos os módulos incluem responsividade em 4 resoluções (celular, celular rotacionado, tablet e monitor).

### 3.2 Fora do escopo

| Item | Motivo |
|---|---|
| Caixa de e-mail externa (yopmail) | Site de terceiros, fora do ambiente de QA — aguarda caixa de teste com API (Mailpit) |
| Avaliação visual (layout, cores, alinhamento fino) | Continua manual; a automação valida o que é mensurável (dentro da tela, sem rolagem horizontal) |
| Desempenho, carga e segurança | Exigem ferramentas e ambiente próprios **[QA]** |
| Ambientes de homologação e produção | A automação roda só em QA |
| Funcionalidades sem DT/EVT | Só entram com documento de teste enviado pela QA |

## 4. Critérios para automatizar

Um caso é automatizado quando atende à maioria dos critérios:

- faz parte da regressão — será executado de novo a cada entrega;
- o resultado esperado é objetivo e verificável na tela ou na configuração;
- o fluxo é estável e o ambiente permite repetir (dados disponíveis, sem dependência externa);
- tem risco alto ou médio (ver seção 9);
- o custo de manutenção é menor que o de executar manualmente.

Não é automatizado: avaliação visual subjetiva, testes exploratórios, casos que dependem de sistemas externos sem API de teste, e casos executados uma única vez.

## 5. Processo de teste (ISO/IEC/IEEE 29119-2)

| Etapa | Como é feito | Artefato |
|---|---|---|
| Análise da base de teste | O DT/EVT enviado pela QA é comparado com o requisito no LP1 (versões, como era e como está) e com o sistema | Análise de cobertura mostrada à QA; seção "Requisito × DT/EVT" do `RASTREABILIDADE.md` |
| Projeto | Condições de teste, incluindo as não cobertas pelo documento (obrigatórios, "Cancelar", responsividade, perfis) | Página "Condições Validadas na Automação" |
| Implementação | Testes em Playwright no padrão da seção 7; tela mapeada só com o "ok" da QA | Specs `valida_*` e `validacao_responsividade_*` |
| Execução | Rodadas diária e semanal agendadas; execução sob demanda só com o "sim" da QA | `relatorios/AAAA-MM-DD/` |
| Relatório | Resumo publicado às 13:00 no Confluence e por e-mail | Página "Execução Diária da Automação" |
| Encerramento do dia | Atualização da documentação com o que foi feito | Confluence + `RASTREABILIDADE.md` |

## 6. Técnicas de projeto de teste (ISO/IEC/IEEE 29119-4)

| Técnica | Exemplo no projeto |
|---|---|
| Partição de equivalência | Classes de entrada ou de perfil: cada perfil entrando (C02, P01, P02); campo obrigatório vazio (OBR); países que seguem para a "Nova conta" (C003.1 a C003.3); valor certo, errado ou ausente no cadastro (RC40 a RC42); cada resolução da responsividade |
| Valor-limite | Idade na verificação: 10 e 15 anos bloqueiam, 17 segue (IDA01 a IDA03); imagem no mínimo de 1280x720 aceita e 940x627 recusada (CR11, CR12); intervalo do carrossel (CR04, CR16); 8 cards por página e "Número de cards" 3 não salva, 9 salva (MC05, MC11, MC12); link de recuperação expira em 30 min (RS07) |
| Tabela de decisão | Obrigatório × visibilidade × campo → aparece ou não no "Campo secundário" (RC07 a RC38); Única × Obrigatório no "Campo primário" (RC52 a RC63); usuário × senha no login (C04 a C07); configuração × o que a tela exibe (LG01, CD01, RP11, PRV01/PRV02, V18/V19, rodapé RD10 a RD16) |
| Transição de estado | "Cancelar" e reentrada no fluxo (CAN01 a CAN03, IDA01.1); exibir e ocultar a senha (CT001.2 a CT001.5); "Sim" e "Não" no acordo do visitante (V03 a V05); sair pelo menu lateral (C02.1, P01.1, P02.1); alternar filtros e páginas (OB02, OB03, OB07) |
| Caso de uso | Fluxo do início ao fim ou navegação: criar conta (C002, C003), Cargo igual em todas as telas (C006, C009, C010), "Esqueci a senha" (RP03), menu do visitante (V14 a V17, V20 a V23), incluir e remover slide (CR10, CR19) |
| Checklist | Conferência dos elementos da tela ou da configuração lida: página de login (C01), configurações da redefinição (RP01, RP02), botão do visitante (V01), blocos e menu do visitante (V06, V07), aba do carrossel (CR01) |

Desde 16/11, cada condição da página "Condições Validadas" traz o rótulo da técnica, com a legenda no topo. As lacunas encontradas nessa classificação estão no item 8 da seção 17.

## 7. Arquitetura da automação (ISTQB gTAA)

| Camada da gTAA | No projeto |
|---|---|
| Definição dos testes | `tests/<n-Etapa>/<n-Módulo>/*.spec.ts` — etapas `1-PaginaDeLogin` e `2-Plataforma`, o número fixa a ordem da rodada; passos Dado/Quando/Então (`test.step`), IDs do DT/EVT no título, tags `@dt-*` e de prioridade |
| Adaptação (interface com o sistema) | Classes de tela em `support/*_commands/`, herdando `PaginaBase`; sessões em `support/sessoes.ts` |
| Dados de teste | `fixtures/` (textos e regras da tela), `support/usuarios.ts`, `Factories` (dados gerados) |
| Execução | Playwright, 1 worker, sem retry; projeto `setup` faz o login dos perfis e passa a Judy para "Botão flutuante"; projeto `limpeza` volta o tema original da Judy no fim da rodada, mesmo com falhas |
| Relatório | Resumo por módulo e métricas (`support/reporters/resumo.ts`), HTML com prints, vídeo e trace |

Padrões de código: specs não acessam a tela direto (vira método da classe); páginas abertas com `abrir()`, que espera o carregamento; outro perfil no mesmo teste por `comSessao()`; vídeos bloqueados (exceto Carrossel); barra da Judy recolhida automaticamente. Checagens a cada mudança: `tsc`, ESLint, Prettier e `--list`.

## 8. Ambiente e dados de teste

**Ambiente:** QA (`qa.learningflix.net`), compartilhado com testes manuais. Lento: limite de 90 s por teste e 30 s por verificação.

**Usuários de teste**

| Perfil / uso | Usuário | Regra |
|---|---|---|
| Administrador, Adm Cliente, Estudante | Definidos no `.env` | Senhas só no `.env`, nunca no código ou em documento |
| Redefinição de senha | eva.souza, qa.aluno5, qa.anya, qa.aluno21, qa.aluno102 | Dados lidos do cadastro na hora do teste |
| Criados pela automação | qa.auto1, qa.auto2, qa.auto3 ("QA AUTOMAÇÃO", `@yopmail.com`) | Criados e excluídos pela própria suíte |

- Cadastro de usuário de teste só é alterado com o "ok" da QA para aquele usuário; o sobrenome ganha " AUTOMTIZADO".
- Configurações da plataforma alteradas por uma suíte são restauradas ao final, mesmo se o teste falhar; a redefinição personalizada é ajustada por cada suíte antes de começar.

## 9. Prioridade por risco — aprovada pela QA em 12/11/2026

Risco = impacto no usuário × probabilidade de falha. Cada teste recebe uma tag de prioridade, usada para ordenar a execução e decidir o que roda primeiro quando o tempo é curto.

| Prioridade | Tag | Critério | Proposta de aplicação |
|---|---|---|---|
| Crítica | `@critico` | Bloqueia o acesso ou o uso principal da plataforma | Login válido e por perfil, "Sair", "Esqueci a senha"; redefinição com dados corretos (RP04, RP05); bloco "Meus Cursos" (MC01, MC02) |
| Alta | `@alto` | Regra de negócio ou segurança: dado errado, acesso indevido | Login inválido; redefinição com dado errado (RP06, RP07); verificação de idade; obrigatoriedade do curso; cargos de gestão (C007); visibilidade do Cargo |
| Média | `@medio` | Funcionalidade secundária, configuração, obrigatórios | Campos obrigatórios, campos conforme configuração (LG01, CD01, RP11), carrossel, rodapé, filtros do "Ver todos" |
| Baixa | `@baixo` | Usabilidade e apresentação | "Cancelar", "Olho" da senha, responsividade |

**Aplicação (12/11):** a regra de cada ID fica em `fixtures/prioridades.ts`, a única tabela a alterar. Distribuição: 25 críticos, 63 altos, 123 médios e 53 baixos (264 testes). Scripts: `npm run test:critico` e `npm run test:prioridade-alta` (crítico + alto).

| Módulo | Crítico | Alto | Médio | Baixo |
|---|---|---|---|---|
| Login | C01, C02, C02.1, C08, P01, P01.1, P02, P02.1 | C04 a C07 | C03, C03.1, LG01 | CT001.1 a CT001.5, responsividade |
| Cadastro | C002, C003, C008, C008.1 | IDA01 a IDA03, IDA01.1, C001, C005 a C007, C009/C010 e variações, PRV01, PRV02, RC01 a RC06 | C003.1 a C003.3, C004, OBR01 a OBR10, CD01 | CAN01 a CAN03 e variações, responsividade |
| Redefinição de Senha | RP03 a RP05, RS01 a RS04 | RP06 a RP08, RS05 a RS07, RC39 a RC51 | RP01, RP02, RP09 a RP11, OBR01, OBR02, RC07 a RC38, RC52 a RC63 | CAN01, CAN01.1, responsividade |
| Visitante | V02, V03, V05 | V01, V04, V08, V10, V11 | V06, V07, V09, V12 a V25, OBR01 a OBR03 | CAN01, responsividade |
| Meus Cursos | MC01 a MC03 | MC04, OB01 a OB11 | MC05, MC06, MC10 a MC12, MC20 a MC22 | Responsividade |
| Rodapé | — | — | RD01 a RD16 | Responsividade |
| Carrossel | — | — | CR01 a CR19 | Responsividade |

## 10. Execução

| Rodada | Quando | O que roda |
|---|---|---|
| Diária | Seg a qui, 09:03 | Suítes normais (`npm run test:diaria`) |
| Semanal | Sexta, 09:03 | Suítes que alteram configuração, criam usuário ou enviam e-mail (`@altera-configuracao`, `@cria-usuario`, `@envia-email`), mais os `@critico` |
| Relatório | 13:00 | Publicação no Confluence e e-mail |
| Sob demanda | Com o "sim" da QA | Só o arquivo ou módulo alterado |

Na sexta roda só a semanal, começando às 09:03: as duas rodadas no mesmo dia disputavam o ambiente, e a semanal altera configurações que a diária lê. Os testes críticos rodam todo dia útil — na diária de segunda a quinta e na semanal na sexta — decisão da QA (13/11/2026); a composição será revista conforme o mapeamento avançar.

Antes dos testes, a assistente Judy passa de "Chat centralizado" para "Botão flutuante" (o chat centralizado cobre botões das janelas) e volta ao tema original no fim da rodada, mesmo com falhas — decisão da QA (13/11/2026).

Os testes rodam um por vez, por etapa do fluxo: primeiro `tests/1-PaginaDeLogin/` (Login, Cadastro, Redefinição de Senha, Rodapé e Visitante), depois `tests/2-Plataforma/` (Carrossel e Meus Cursos). O número na frente de cada pasta fixa a ordem — decisão da QA (13/11). As etapas não dependem uma da outra: uma falha na página de login não pula os testes da plataforma.

**Critérios de entrada:** ambiente QA no ar; login dos 3 perfis concluído no `setup`.
**Critério de suspensão:** o `setup` falha → a rodada não executa os testes e o relatório registra a interrupção; rodada que passa do limite de tempo é encerrada.
**Critérios de saída (aprovados pela QA em 16/11/2026):** a rodada é **APROVADA** quando os testes `@critico` passam 100% e o total passa 95% ou mais. A conta usa os testes executados (sem pulados e pendentes) e deixa de fora as **falhas conhecidas** — possíveis defeitos e defeitos registrados em `fixtures/falhas-conhecidas.ts`; testes instáveis contam como falha. O relatório mostra o bloco "🎯 CRITÉRIO DE SAÍDA", marca cada falha como **NOVA** ou **conhecida** e avisa quando uma falha conhecida passa (revisar a lista). Rodada interrompida não é avaliada.

## 11. Gestão de defeitos

1. A falha é analisada pelo resumo, print, vídeo e trace — sem executar de novo para "ver o erro".
2. Falha de script (tela mudou, tempo, dado) → manutenção do teste.
3. Comportamento divergente do DT/EVT ou do requisito → registrado como **possível defeito** no `RASTREABILIDADE.md` e no Confluence; o teste continua falhando até a correção.
4. Confirmado pela QA em teste manual → **defeito**, aberto no Jira no formato da equipe (skill de abertura de bugs — **pendente**) e ligado ao teste.

## 12. Métricas (ISTQB CTAL-TAE)

| Métrica | Fonte |
|---|---|
| Executados, aprovados, falhos e instáveis por módulo | Resumo da rodada e `metricas.json` (desde 12/11) |
| Taxa de aprovação (aprovados ÷ executados) e critério de saída (críticos e geral, sem as falhas conhecidas) | Idem — bloco "🎯 CRITÉRIO DE SAÍDA" e `criterioDeSaida` no `metricas.json` (desde 16/11) |
| Tempo de execução por módulo e da rodada | Idem |
| Cobertura de casos do DT/EVT automatizados | Seção "Cobertura consolidada" da página Rastreabilidade da Automação, montada a partir do `RASTREABILIDADE.md` de cada módulo — em 17/11: 99 de 105 itens dos documentos automatizados (94%), 6 pendentes (e-mail e massa) |
| Defeitos encontrados pela automação | Seção "Possíveis defeitos" — passa ao Jira com a skill de bugs |
| Testes pendentes (`fixme`) e falhas esperadas | Resumo da rodada |

## 13. Gestão de configuração

- Repositório git único. A pasta `automacao-learningflix` fica sempre no `main` — é a usada pelas rodadas.
- Tutoriais são feitos na pasta `automacao-learningflix-tutoriais` (branch `tutoriais`) e juntados no `main` ao final.
- Evidências de documento de teste são feitas na pasta `automacao-learningflix-evidencias`, um branch `evidencia/<documento>` por documento; quando viram teste automatizado, são juntadas no `main`.
- Commit só com o "ok" da QA; o push é feito pela QA.
- **[QA]** Proposta: revisão das mudanças por pull request antes de entrar no `main`.

## 14. Papéis e responsabilidades

| Papel | Responsabilidades |
|---|---|
| QA (Eva Souza) | Envia o DT/EVT, decide escopo e prioridades, autoriza mapeamento de telas, execuções, alterações de usuários, commits e publicações; confirma defeitos manualmente; faz o push |
| Claude | Analisa requisito × DT/EVT × sistema, cria e mantém os scripts, analisa as falhas, atualiza a documentação com aprovação |
| Rodadas agendadas | Executam e publicam o relatório sem intervenção |

## 15. Riscos da automação

| Risco | Mitigação |
|---|---|
| Ambiente QA lento | Limites de tempo ajustados, 1 teste por vez, vídeos bloqueados |
| Mudanças na plataforma sem aviso (ex.: barra da Judy em 09/11) | Análise das falhas da rodada e manutenção no mesmo dia |
| Configuração alterada por testes manuais (ex.: botão do visitante em "Ocultar") | Testes leem a configuração na hora; suítes ajustam o que precisam antes de começar |
| Massa de dados alterada (cargos, datas, usuários) | Dados lidos do cadastro na hora do teste |
| Rodada passa do limite de tempo | **[QA]** Rever o limite e usar a prioridade por risco para ordenar |
| Testes dependem da execução em sequência | Mantido 1 worker; registrado nas suítes que dependem da ordem |
| Mudança no projeto durante uma rodada (ex.: pastas movidas em 13/11 durante a diária — "Cannot find module") | Não mexer na pasta principal entre 09:03 e o fim da rodada; trabalho novo em pastas separadas (tutoriais, evidências) |
| Correção que trava os testes (ex.: em 13/11 o clique na seta da Judy esperava um botão desabilitado e a semanal inteira estourou o tempo) | Esperas com limite curto e alternativa sem bloquear; preparação que nunca falha a rodada; análise do contexto de erro da rodada |

## 16. Documentos relacionados

- Confluence: [Condições Validadas na Automação](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5910954005), [Rastreabilidade da Automação](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5902991361), [Execução Diária da Automação](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5912526881).
- Projeto: `README.md`, `CLAUDE.md`, `tests/<n-Etapa>/<n-Módulo>/RASTREABILIDADE.md`.

## 17. Pontos em aberto **[QA]**

1. ~~Aprovar a prioridade por risco (seção 9)~~ — aprovada e aplicada em 12/11.
2. ~~Meta de aprovação da regressão (seção 10)~~ — críticos 100% e geral 95%, sem as falhas conhecidas (16/11).
3. ~~Incluir a técnica de teste nas condições do Confluence (seção 6)~~ — feito em 16/11: rótulo da técnica em cada uma das 178 condições, com a legenda no topo da página.
4. Revisão por pull request (seção 13).
5. Testes não funcionais (desempenho, segurança) — fora do escopo ou planejar?
6. Limite de tempo da rodada diária (passou de 230 min em 11/11).
7. Skill de abertura de bugs no formato da equipe (seção 11).
8. Lacunas de cobertura encontradas ao classificar as técnicas (16/11) — decidir se viram testes: ~~(a) idade 16 anos na verificação de idade~~ — virou o IDA04 (17/11), 16 anos segue para a "Nova conta"; ~~(b) CPF e data de nascimento errados ao mesmo tempo na redefinição personalizada~~ — virou o RP12 (17/11); (c) rodapé nos limites do tema, 767/768 px e 991/992 px; (d) limite aceito pelo "Número de cards na página" do Meus Cursos, entre o 3 recusado e o 9 aceito (MC11/MC12).

## Histórico de versões

| Versão | Data | O que mudou |
|---|---|---|
| 1.0 | 12/11/2026 | Primeira versão, aprovada pela QA; prioridade por risco aplicada aos 264 testes; métricas por módulo no relatório da rodada |
| 1.1 | 13/11/2026 | Testes organizados por etapa (Página de Login e depois Plataforma); diária de segunda a quinta e semanal na sexta às 09:03 com os críticos; Judy em "Botão flutuante" durante a rodada; pasta de evidências; riscos da semanal de 13/11 |
| 1.2 | 16/11/2026 | Critério de saída: críticos 100% e geral 95%, sem as falhas conhecidas (`fixtures/falhas-conhecidas.ts`); instáveis contam como falha; técnica de teste nas condições do Confluence e 4 lacunas de cobertura nos pontos em aberto |
| 1.3 | 17/11/2026 | Lacunas (a) e (b) do item 8 viraram os testes IDA04 (idade 16 anos) e RP12 (identificação e data erradas); seguem abertas as lacunas (c) e (d); métrica de cobertura consolidada por módulo na Rastreabilidade (seção 12) |
