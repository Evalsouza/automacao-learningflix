# Rastreabilidade — Módulo Cadastro

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução, um por validação.

| Tag | Significado |
|---|---|
| `@dt-criar-conta` | DTI/EVTI - Página Criar uma conta |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@cria-usuario` | Cria um usuário real no ambiente — desligado por padrão |

---

## DTI/EVTI - Página Criar uma conta

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3953491971/DTI+EVTI+-+P+gina+Criar+uma+conta

| Caso | Teste | Arquivo |
|---|---|---|
| Condição 001 | C001 - Campo "Cargo" ativo para exibição no formulário de cadastro | valida_criar_conta.spec.ts |
| Condição 002 | C002 - "Criar uma conta" exibe a página "Verificação de idade e localização" | valida_criar_conta.spec.ts |
| Condição 003 | C003 - "Continuar" redireciona para a página "Nova conta" | valida_criar_conta.spec.ts |
| Condição 004 | C004 - Campo "Cargo" exibe os cargos cadastrados e permite selecionar "Analista de Qualidade" | valida_criar_conta.spec.ts |
| Condição 005 | C005 - E-mail de confirmação — `fixme` | valida_cadastro_novo_usuario.spec.ts |
| Condição 006 | C006 - "Minha página" exibe o Cargo e o Gestor em "Dados Profissionais" | valida_criar_conta.spec.ts |
| Condição 007 | C007 - Cargos de gestão NÃO são exibidos no campo "Cargo" da "Nova conta" | valida_criar_conta.spec.ts |
| Condição 008 | C008 - Cadastro sem "Cargo" exibe o campo "Cargo" sem preenchimento na "Minha página" — usuário `qa.aluno30` | valida_cadastro_novo_usuario.spec.ts |
| Condição 009 | C009 - "Adm Cliente" consulta o Cargo de "Eva Souza" em "Gerenciar usuários" | valida_criar_conta.spec.ts |
| Condição 010 | C010 - "Administrador" consulta o Cargo de "Eva Souza" em "Gerenciar usuários" | valida_criar_conta.spec.ts |

**Não cobertos pelo documento**

| Teste | Motivo |
|---|---|
| CAN01 - "Cancelar" na "Verificação de idade e localização" volta para a página de login | Pedido da QA: o documento não valida os botões "Cancelar" |
| CAN02 - "Cancelar" na "Nova conta" volta para a página de login | Idem |
| CAN03 - "Cancelar" na edição do campo "Cargo" fecha sem alterar a configuração | Idem |
| CAN04 - "Cancelar" em "Editar usuário" fecha sem alterar o Cargo | Idem |
| Criar conta - Celular / Celular rotacionado / Tablet / Monitor — `validacao_responsividade_criar_conta.spec.ts` | Responsividade é padrão da equipe; o documento não pede |
| IDA01 e IDA02 - Idade 10 e 15 anos é bloqueada na página "Menor digital" | Pedido da QA (27/10) |
| IDA03 - Idade 17 anos segue para a página "Nova conta" | Pedido da QA (27/10): 17 anos é liberado, confirmado pela QA |
| C008.1 - Cadastro com "Cargo" "Analista de Qualidade" exibe o Cargo na "Minha página" — usuário `qa.aluno31` | Pedido da QA (27/10): cobertura com e sem Cargo |
| C009.1 e C010.1 - "Adm Cliente" e "Administrador" consultam o Cargo de "QA Aluno 30 Automação" — vazio | Pedido da QA (27/10): C009 e C010 repetidos com o usuário criado |
| C009.2 e C010.2 - "Adm Cliente" e "Administrador" consultam o Cargo de "QA Aluno 31 Automação" — "Analista de Qualidade" | Idem |

**Não cobertos pelo documento — campos obrigatórios**

A QA identifica pela comparação com o DTI/EVTI. Mensagens copiadas da tela.

| Teste | Tela | Mensagem validada |
|---|---|---|
| OBR01 - "Qual é a sua idade?" é obrigatório | Verificação de idade e localização | "- Inserir um valor." |
| OBR02 - "Em qual país você vive?" é obrigatório | Verificação de idade e localização | "- Inserir um valor." |
| OBR03 - "CPF" é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira a identificação de usuário." |
| OBR04 - "Senha" é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira a senha." |
| OBR05 - "Confirme a senha." é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira a senha." |
| OBR06 - "Endereço de e-mail" é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira o e-mail." |
| OBR07 - "Confirmar endereço de e-mail" é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira o e-mail." |
| OBR08 - "Nome" é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira o nome" |
| OBR09 - "Sobrenome" é obrigatório | Nova conta | "- Campo obrigatório. Por favor, insira o sobrenome" |
| OBR10 - "Data de Nascimento" é marcado como obrigatório | Nova conta | Só a marca: a tela não exibe mensagem |

Os testes de responsividade também enviam a "Nova conta" vazia e conferem as mensagens dentro da tela em cada resolução.

**Observações sobre os campos obrigatórios**

- "Data de Nascimento" tem a marca de obrigatório, mas não exibe mensagem: dia, mês e ano já vêm com valor padrão. Confirmar se é o comportamento esperado.
- "Confirme a senha." e "Confirmar endereço de e-mail" repetem a mensagem do campo principal — quem preenche não sabe qual dos dois ficou faltando.
- As mensagens de "Nome" e "Sobrenome" não terminam com ponto; as demais terminam.

**Suíte de cadastro real — `valida_cadastro_novo_usuario.spec.ts`**

Cria duas contas "QA AUTOMAÇÃO" — `qa.auto1` / `qa.auto1@yopmail.com` **sem Cargo** e `qa.auto2` / `qa.auto2@yopmail.com` **com Cargo "Analista de Qualidade"**, nomes definidos pela QA; cada conta é encontrada pelo e-mail —, confirma pelo Administrador, entra com cada uma usando a senha `NOVO_CADASTRO_SENHA` do `.env`, valida a "Minha página" e o Cargo em "Editar usuário" com o "Adm Cliente" e o "Administrador", e **exclui as contas** — antes de começar, se sobraram de uma execução anterior, e ao final, mesmo se o teste falhar. Desligada por padrão; para rodar: `npm run test:cadastro-real`.

Execuções de 28/10:
- `qa.aluno30` e `qa.aluno31@yopmail.com` já existem no ambiente — "Luísa Martins Costa" e "Antnio Almeida" (`qa.antonio`) —, por isso a QA indicou `qa.auto1` e `qa.auto2`. A suíte não alterou nem excluiu essas contas.
- **Defeito — confirmado pela QA em teste manual (28/10):** ao clicar em "Criar minha conta" com todos os dados válidos — identificação e e-mail livres, senha dentro da política, idade coerente com a data de nascimento —, a plataforma envia o formulário (POST para `signup.php`), devolve a mesma página "Nova conta", **sem mensagem em nenhum campo**, e a conta não é criada. Aconteceu nas 2 contas, em 3 execuções e em 3 tentativas isoladas. C008, C008.1, C009.1/C010.1 e C009.2/C010.2 ficam bloqueados até a causa ser identificada. Nenhuma conta ficou no ambiente.

**Decisões tomadas com a QA**

- "Gerenciado de cargos" do documento = "Gerenciador de Hierarquia", aba Cargos — nome alterado após os testes manuais.
- C006: Gestor validado como o cargo "Supervisor de Qualidade" — no lugar de "@Ricardo Lopes", alterado após os testes manuais.
- E-mails de teste sempre `@yopmail.com`; cadastro criado na execução é excluído ao final.
- C001 só verifica que "Mostrar na página de cadastro?" está ativo — não altera a configuração.
- C009 e C010: o Cargo é consultado em "Editar usuário" e a janela é fechada com "Cancelar", sem salvar.
- C007 compara com os cargos marcados como "Cargo Gestor = Sim" no Gerenciador de Hierarquia na hora da execução.
- Os dois "CENÁRIO 1" do documento foram agrupados em um.
- Textos ajustados para os da tela: "Nova conta", campo "Cargo", "Mostrar na página de cadastro?".
- Usuários do documento entram em `support/usuarios.ts`.
- Verificação de idade (27/10): 10 e 15 anos vão para a página "Menor digital" — "Você é muito jovem para criar uma conta neste site." —, não um modal; 17 anos segue para a "Nova conta", comportamento correto segundo a QA. Depois do bloqueio, o navegador continua na "Menor digital" ao clicar de novo em "Criar uma conta": cada teste de idade usa um navegador novo.
- CAN03 (27/10): a QA foi redirecionada para o login ao cancelar a edição do "Cargo". Na automação, alterar um campo da janela e clicar em "Cancelar" fecha a janela, mantém a página "Campos de perfil do usuário" e não grava nada. A sessão do Administrador estava expirada no mesmo período ("Sua sessão expirou. Por favor, identifique-se novamente."), o que leva ao login na próxima ação — provável causa.

**Possíveis defeitos**

| Caso | Esperado — DTI/EVTI | Obtido |
|---|---|---|
| C007 | Cargos marcados como Gestor **NÃO** exibidos no campo "Cargo" da "Nova conta" | 36 cargos de gestão exibidos — ex.: Coordenador de Qualidade, CTO, Diretor Geral, Coordenador de Tecnologia |

**Não automatizados**

| Caso | Motivo |
|---|---|
| Condição 005 | Depende da caixa de entrada do yopmail, site externo ao ambiente de QA |

**Divergências entre documento e sistema**

- Caminho do Administrador: o documento diz "Sidebar → Administração → Gerenciar usuários"; o sidebar do Administrador tem "Administração do site", não "Administração". O teste abre a página de administração direto — a mesma que o Adm Cliente acessa pelo sidebar.
- O campo "Cargo" da "Nova conta" é um autocomplete sem rótulo acessível: o teste usa o `id` do campo — `#fitem_id_profile_field_position`. Vale pedir ao DEV um `data-testid`.
- O objetivo do documento fala em "Plugins de Hierarquia" — mantido como está, nomenclatura da plataforma.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
