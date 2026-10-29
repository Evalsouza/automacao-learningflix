# Rastreabilidade — Módulo RedefinicaoSenha

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução, um por validação.

| Tag | Significado |
|---|---|
| `@dt-redefinicao-personalizada` | DTI/EVTI - Redefinição de Senha Personalizada |
| `@dt-pagina-de-login` | DT/EVT - Página de Login — casos C09 a C14 ("Esqueci a senha", redefinição padrão) |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@altera-configuracao` | Altera configuração da plataforma — desligado por padrão |

| Script | O que roda |
|---|---|
| `npm run test:redefinicao-senha` | Todo o módulo, menos a suíte de configuração |
| `npm run test:redefinicao-config` | Só a suíte de configuração (`EXECUTAR_CONFIG_REDEFINICAO=sim`) |

---

## DTI/EVTI - Redefinição de Senha Personalizada

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/4039606273

**Suíte normal — `valida_redefinicao_senha_personalizada.spec.ts`** (só leitura; nenhum teste salva senha nova)

| Condição | Teste |
|---|---|
| Campo "Cargo" em "Campos de perfil do usuário" | RP01 - Campo "Cargo" exibido em "Dados Profissionais" de "Campos de perfil do usuário" |
| Ativação do reset personalizado | RP02 - Redefinição personalizada ativa com "CPF" e "Data de Nascimento" |
| Configuração do "Telefone" | RP09 - "Telefone" configurado como obrigatório, único e visível para o usuário |
| "Telefone" no "Campo primário" | RP10 - "Telefone" exibido para seleção no "Campo primário" |
| Página "Perdeu a senha?" | RP03 - "Perdeu a senha?" exibe "CPF" e "Data de Nascimento" |
| Dados corretos | RP04 - "eva.souza" e RP05 - "qa.aluno5" com a data de nascimento do cadastro são redirecionados para "Redefinir senha" |
| Data errada | RP06 - "qa.anya" com a data de nascimento errada NÃO altera a senha |
| Identificação errada | RP07 - Identificação errada com a data de nascimento correta de "qa.aluno21" NÃO altera a senha |

**Suíte de configuração — `valida_configuracao_redefinicao_personalizada.spec.ts`** (`@altera-configuracao`, só roda com `npm run test:redefinicao-config`)

| Condição | Testes |
|---|---|
| "Este campo é obrigatório?" Sim / Não | RC01 e RC02 — marca de obrigatório do "Cargo" na "Nova conta" |
| "Quem pode ver este campo?" — as 4 opções | RC03 a RC06 — quem vê o "Cargo" no perfil (estudante, administrador; cliente em "Visível para todos") |
| "Campo secundário" — Obrigatório × visibilidade | RC07 a RC38 — Cargo, Unidade, Regional e Setor, 8 combinações cada |
| Redefinição com o campo no "Campo secundário" | RC39 a RC51 — página exibe "CPF" + campo; valor do cadastro leva a "Redefinir senha"; valor errado exibe a mensagem; para o Cargo (RC42), "qa.aluno102" sem cargo também |
| Sem dado cadastrado | RP08 - "qa.aluno102" sem "Cidade de Nascimento" cadastrada NÃO altera a senha — com "Cidade de Nascimento" no "Campo secundário" |
| "Campo primário" — "A informação deve ser única?" | RC52 a RC60 — Telefone, Cargo e Cidade de Nascimento: configurado Sim/Sim/visível ao usuário → aparece no "Campo primário" → com "Única" = Não, some |

Ao final a suíte restaura: campo primário e secundário iniciais, a configuração inicial dos campos alterados e o "Cargo" com os valores de 22/10 (Obrigatório "Não", Única "Não", "Visível para todos").

**Não cobertos pelo documento**

| Teste | Motivo |
|---|---|
| OBR01 e OBR02 - "CPF" e "Data de Nascimento" obrigatórios em "Perdeu a senha?" | Padrão da equipe: validar campos obrigatórios |
| CAN01 - "Cancelar" em "Perdeu a senha?" volta para a página de login | Padrão da equipe: validar "Cancelar" |
| Redefinição personalizada - Celular / Celular rotacionado / Tablet / Monitor — `validacao_responsividade_redefinicao_senha_personalizada.spec.ts` | Responsividade é padrão da equipe |

**Decisões tomadas com a QA**

- Datas, cargos e demais dados dos usuários são lidos do cadastro na hora do teste, porque podem mudar a qualquer momento.
- RP07 usa identificação errada com a data correta; o RP06 já cobre a data errada.
- Regra esperada do "Campo secundário": o campo aparece só com Obrigatório = "Sim" e visibilidade "Visível para o usuário" ou "Visivel para o usuário, professores e administradores".
- A matriz completa de 8 combinações vale para Cargo, Unidade, Regional e Setor.
- Os testes positivos param na página "Redefinir senha": nenhuma senha é alterada.

**Divergências entre documento e sistema**

- **Possível defeito (RC03, 26/10):** com "Quem pode ver este campo?" = "Não visível" no "Cargo", a Estudante ainda vê "Cargo" na própria "Minha página" (`/local/user/index.php`). Pela ajuda do campo, "Não visível" esconde o campo do usuário.
- O campo rotulado "CPF" recebe o nome de usuário (ex.: `eva.souza`), não um CPF.
- O documento usa "Cargo" no "Campo secundário"; hoje o campo secundário é "Data de Nascimento".
- A configuração do "Cargo" foi alterada manualmente depois de 22/10 (Obrigatório "Sim", "Visivel para o usuário, professores e administradores").
- Os cargos dos usuários citados no documento mudaram.
- A data de nascimento não pode ser apagada pela tela: "Editar usuário" só tem listas de dia, mês e ano, sem opção em branco. Por isso o RP08 (usuário sem o dado cadastrado) usa "Cidade de Nascimento" no "Campo secundário" e foi para a suíte de configuração — decisão da QA.
- Massa do RP08 e do RC42: `qa.aluno102`, que nunca acessou a plataforma. Em 26/10 a QA autorizou limpar "Cargo" e "Cidade de Nascimento" do cadastro dela; o sobrenome passou a "Lima AUTOMTIZADO" para marcar a alteração. Antes, `qa.aluno23` e `qa.andre` tinham data de nascimento e cargo e não serviam.
- Na página "Redefinir senha", "Nova senha" fica atrás do "Clique para inserir texto": o teste confere que o campo existe, não que está visível.
- A mensagem "Algo deu errado ao alterar a senha. Por favor, tente novamente!" fala em "alterar" mesmo sem nada alterado, e é a mesma para identificação errada, dado errado e dado não cadastrado.

---

## DT/EVT - Página de Login — C09 a C14 (redefinição padrão)

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3422929997/DT+EVT+-+P+gina+de+Login

A redefinição padrão só aparece com a personalizada desativada. Enquanto a personalizada estiver ativa, estes testes **falham** com a mensagem "Redefinição padrão não exibida: a redefinição personalizada está ativada".

| Caso | Teste | Arquivo |
|---|---|---|
| C09, C11 | RS01 - "Perdeu a senha?" exibe as duas formas de recuperar o acesso | valida_redefinicao_senha_padrao.spec.ts |
| C09 | RS02 - "Buscar" pelo nome de usuário confirma a recuperação e "Continuar" volta para o login | valida_redefinicao_senha_padrao.spec.ts |
| C11 | RS03 - "Buscar" pelo e-mail confirma a recuperação e "Continuar" volta para o login | valida_redefinicao_senha_padrao.spec.ts |
| C14 | RS04 - "Voltar ao acesso" volta para a página de login | valida_redefinicao_senha_padrao.spec.ts |
| C10, C12 | RS05 e RS06 — `fixme` | valida_redefinicao_senha_padrao.spec.ts |
| C13 | RS07 — `fixme` | valida_redefinicao_senha_padrao.spec.ts |
| — | Redefinição padrão - Celular / Celular rotacionado / Tablet / Monitor | validacao_responsividade_redefinicao_senha_padrao.spec.ts |

**Não automatizados**

| Caso | Motivo |
|---|---|
| C10, C12, C13 | Dependem de ler o e-mail de recuperação. Pendente até o QA ter caixa de teste com API (Mailpit) |

**Decisões tomadas com a QA**

- RS02 e RS03 enviam e-mail de recuperação para `eva.souza@yopmail.com` — aceito.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
