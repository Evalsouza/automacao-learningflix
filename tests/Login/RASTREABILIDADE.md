# Rastreabilidade — Módulo Login

O acesso como visitante fica no módulo `AcessoVisitante/` e a redefinição de senha (C09 a C14) no módulo `RedefinicaoSenha/`, cada um com rastreabilidade própria.

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução, um por validação.

Liga cada caso dos DT/EVT aos testes automatizados. Os testes usam tags para filtro no modo UI e no relatório:

| Tag | Significado |
|---|---|
| `@dt-pagina-de-login` | DT/EVT - Página de Login |
| `@dt-ver-senha` | DT/EVT - Tela de Login: possibilidade de ver a senha |
| `@responsivo` | Teste de resolução — padrão da equipe |

---

## DT/EVT - Página de Login

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3422929997/DT+EVT+-+P+gina+de+Login

O documento não numera os casos; C01 a C14 seguem a ordem em que aparecem.

| Caso | Teste | Arquivo |
|---|---|---|
| C01 | C01 - Página de login exibida | valida_login.spec.ts |
| C02 | C02 - Login válido redireciona para a página inicial | valida_login.spec.ts |
| C03 | C03 - Lembrar-me mantém o usuário salvo após Sair | valida_login.spec.ts |
| C04 | C04 - Tentativa sem usuário e com senha exibe mensagem de erro | valida_login.spec.ts |
| C05 | C05 - Tentativa com usuário e sem senha exibe mensagem de erro | valida_login.spec.ts |
| C06 | C06 - Tentativa sem usuário e sem senha exibe mensagem de erro | valida_login.spec.ts |
| C07 | C07 - Tentativa com usuário não cadastrado e senha inválida exibe mensagem de erro | valida_login.spec.ts |
| C08 | C08 - Esqueci a senha redireciona para "Perdeu a senha?" | valida_login.spec.ts |
| C09 a C14 | Movidos para o módulo RedefinicaoSenha | `tests/RedefinicaoSenha/` |

**Não cobertos pelo documento**

| Teste | Motivo |
|---|---|
| C03.1 - Sem "Lembrar-me", o usuário NÃO fica salvo após Sair | Pedido da QA: o documento só valida o "Lembrar-me" marcado |
| P01 - Login válido com o papel Cliente | O documento cobre só o Administrador |
| P02 - Login válido com o papel Estudante | O documento cobre só o Administrador |
| Login - Celular / Celular rotacionado / Tablet / Monitor — `validacao_responsividade_login.spec.ts` | Responsividade é padrão da equipe; o documento não pede |

**Divergências entre documento e sistema**

- Campo "Identificação de usuário" no documento; na tela, "CPF".
- URL do documento é `smart4-qa.leobr.net`; os testes rodam em `qa.learningflix.net`.
- Título "Perdeu a Senha?" no documento; na tela, "Perdeu a senha?".
- "Página inicial" não é definida; os testes validam que o login saiu da tela de acesso e o menu do usuário apareceu.
- A mensagem de erro aparece duas vezes na tela — possível defeito visual.
- **Possível defeito — C03.1 (27/10):** com "Lembrar-me" desmarcado, a plataforma grava o cookie `MOODLEID1_` (lembrar o nome de usuário) no login. Depois de "Sair", a página de login volta com "CPF" preenchido com o usuário e "Lembrar-me" marcado. Num navegador novo o campo vem vazio. O teste fica falhando até a correção.
- Senha do Adobe XD em texto aberto no documento.

---

## DT/EVT - Tela de Login: possibilidade de ver a senha

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3493068824/DT+EVT+-+Tela+de+Login+possibilidade+de+ver+a+senha

| Caso | Teste | Arquivo |
|---|---|---|
| CT001, CT002, CT003 | CT001.1 a CT001.4 — cenário único | valida_visualizar_senha.spec.ts |
| CT004 | Visualizar senha - Celular, Celular rotacionado, Tablet e Monitor | validacao_responsividade_visualizar_senha.spec.ts |
| CT005 — Mobile | Visualizar senha - Celular | validacao_responsividade_visualizar_senha.spec.ts |
| CT005 — Mobile responsivo | Visualizar senha - Celular rotacionado | validacao_responsividade_visualizar_senha.spec.ts |

**Decisões tomadas com a QA**

- CT001, CT002 e CT003 viraram um cenário único: antes do login a tela é igual para todos os perfis.
- CT001.4 cobre ativar o "Olho" antes de digitar a senha, que é o que o CT001 e o CT003 descrevem.
- Os testes digitam uma senha fictícia, nunca a senha real: com a senha visível, vídeo e trace a gravariam.
- "Mobile" e "Mobile responsivo" do CT005 = celular em pé e celular rotacionado.
- Responsividade validada pelo que é mensurável: elementos dentro da tela, sem rolagem horizontal e o "Olho" funcionando. A avaliação visual continua manual.

**Não cobertos pelo documento**

| Teste | Motivo |
|---|---|
| CT001.5 - Nome do "Olho" para leitores de tela alterna entre "Exibir a senha" e "Esconder a senha" | Pedido da QA; o documento não cita a troca de nome |

**Correções sugeridas no documento**

- "cliquei sob o ícone" → "cliquei sobre o ícone".
- CT005: "a atividade se comportou" → "a página se comportou".
- Usuários "qa.aluno8" e "qa.aluno6" não existem no `.env` do projeto.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
