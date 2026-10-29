# Rastreabilidade — Módulo Rodape

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução.

| Tag | Significado |
|---|---|
| `@dt-rodape` | Jira LFXP-1941 — Validação das alterações realizadas: habilitar/desabilitar informações no rodapé |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@altera-configuracao` | Altera configuração da plataforma — desligado por padrão |

| Script | O que roda |
|---|---|
| `npm run test:rodape` | Todo o módulo, menos a suíte de configuração |
| `npm run test:rodape-config` | Só a suíte de configuração (`EXECUTAR_CONFIG_RODAPE=sim`) — também roda na rodada diária |

---

## Jira LFXP-1941 — Validação das alterações realizadas

https://epicbrasil.atlassian.net/browse/LFXP-1941 — História LFXP-1907; subtarefas LFXP-1973 (footer após login), LFXP-1974 (footer antes de logar) e LFXP-1921 (restrição por perfil).

O Jira não numera os casos; os IDs seguem a ordem em que aparecem.

**Suíte normal — `valida_rodape.spec.ts`** (só leitura; confere o estado atual, com as 3 opções desabilitadas)

| Caso do Jira | Teste |
|---|---|
| Tema → "Configurações gerais" exibe as 3 opções com "habilitar" desmarcado | RD01 - "Configurações gerais" do Tema exibe as 3 opções de footer desmarcadas |
| Página de login sem o footer: só "Idioma" e "© Desenvolvido por REVVO" | RD02 - Página de login exibe só o idioma e os direitos, sem "Ajuda", "Privacidade", "Termos" |
| Usuário sem o footer: só "Idioma" e "©" | RD03 - "Estudante" vê o rodapé sem "Privacidade" e "Termos" |
| Administrador sem o footer: "Privacidade" e "Termos" não exibidos | RD05 - "Administrador" vê o rodapé sem "Privacidade" e "Termos" |

**Suíte de configuração — `valida_configuracao_rodape.spec.ts`** (`@altera-configuracao`; restaura os valores iniciais ao final)

| Caso do Jira | Teste |
|---|---|
| Habilitar "footer para usuário" → "Privacidade" e "Termos" exibidos ao aluno | RD10 |
| Desmarcar "footer para usuário" → não exibidos | RD11 |
| Habilitar "footer para administrador" → exibidos ao administrador | RD12 |
| Desmarcar "footer para administrador" → não exibidos | RD13 |
| Habilitar "footer para pagina de login" → "Ajuda", "Privacidade" e "Termos" na página de login | RD14 |
| Desmarcar "footer para pagina de login" → só "Idioma" e "©" | RD15 |
| As 3 habilitadas → cada papel vê o rodapé conforme a permissão | RD16 — Estudante, Adm Cliente, Administrador e página de login |

**Não cobertos pelo Jira**

| Teste | Motivo |
|---|---|
| RD04 - "Adm Cliente" vê o rodapé sem "Privacidade" e "Termos" | A História LFXP-1907 cita o Administrador Cliente; o LFXP-1941 não testa |
| Rodapé - Celular / Celular rotacionado / Tablet / Monitor — página de login e "Página inicial" da Estudante — `validacao_responsividade_rodape.spec.ts` | Responsividade é padrão da equipe |

**Decisões tomadas com a QA (28/10)**

- Depois do login, o rodapé completo — logo REVVO, endereço, "Mapa do Site", "Redes Sociais", "Você acessou como" e "Baixar o aplicativo móvel" — é o layout atual e está correto. Os testes validam só "Privacidade" e "Termos" (exibidos ou não), o idioma e "© Desenvolvido por".
- O Adm Cliente segue a opção "Habilitar footer para usuário".
- "Ajuda" só é verificado na página de login: depois do login ele também está no menu lateral e no "Mapa do Site".
- Responsividade: o tema esconde o rodapé em telas estreitas — na página de login abaixo de 768 px ("d-none d-md-flex") e depois do login abaixo de 992 px ("d-none d-lg-block"). Comportamento esperado, confirmado pela QA: o teste espera o rodapé no Celular rotacionado, Tablet e Monitor na página de login, e só no Monitor depois do login; nas demais resoluções confere que ele não aparece.
- O ano do "© Desenvolvido por" é sempre o ano vigente: o teste usa o ano corrente.
- Nomenclatura da plataforma prevalece: "Termos" (o Jira escreve "Termo").
- São 3 opções independentes — "Habilitar footer para usuário", "Habilitar footer para administrador" e "Habilitar footer para pagina de login" —, cada uma validada no seu caso (RD10 a RD15).
- "Papéis diferentes" (RD16) = os 3 papéis padrão: Usuário (Estudante), Administrador Geral e Cliente (Adm Cliente). Novos papéis entram quando mudar.
- O usuário do Jira, "qa.aluno8", não existe no projeto: os testes usam a Estudante (eva.souza).

**Divergências entre Jira e sistema** — revisadas com a QA em 28/10

- Caminho: o Jira cita "Aparência → raia "" → Tema"; a raia realmente não tem nome. Na plataforma: "Administração do site → Aparência → Temas → Tema" (`smart_4`), aba "Configurações gerais".
- O Jira mostra "© 2024 Desenvolvido por REVVO"; a tela exibe o ano vigente — decisão acima.
- No caso da página de login o Jira diz "desmarcou a opção **Habilitar footer para usuário** … e acessei a Página de login"; a opção que controla o login é "**Habilitar footer para pagina de login**" — sugestão de correção no Jira.
- O Jira escreve "Termo"; o teste usa "Termos", da plataforma.
- O nome interno da opção de usuário é `footerHiden` ("footer escondido"), embora o rótulo seja "Habilitar footer para usuário" — ciente, sem impacto no teste.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
