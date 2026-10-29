# Automação LearningFlix

Testes automatizados E2E da plataforma LearningFlix (ambiente de QA: https://qa.learningflix.net), em **Playwright + TypeScript**.

A organização segue o modelo da equipe — [Estrutura do Repositório](https://epicbrasil.atlassian.net/wiki/spaces/Builder/pages/4661444620/Estrutura+do+Reposit+rio) e [Estrutura de Testes](https://epicbrasil.atlassian.net/wiki/spaces/Builder/pages/4663607398/Estrutura+de+Testes) — adaptado do Cypress para o Playwright.

## Estrutura

```
📂 tests/                         # Casos de teste (E2E), organizados por módulo
│   ├── 📂 Login/                 # Login, autenticação, ver a senha, responsividade
│   │   ├── valida_login.spec.ts
│   │   ├── valida_visualizar_senha.spec.ts
│   │   ├── validacao_responsividade_login.spec.ts
│   │   ├── validacao_responsividade_visualizar_senha.spec.ts
│   │   └── RASTREABILIDADE.md    # Caso do DT/EVT → teste, decisões e pendências
│   ├── 📂 AcessoVisitante/       # Acordo de política, Página Inicial, menu, Ajuda e botão do visitante
│   │   ├── valida_acessar_como_visitante.spec.ts
│   │   ├── valida_configuracao_botao_visitante.spec.ts   # altera configuração — desligado por padrão
│   │   ├── valida_envio_ajuda_visitante.spec.ts          # envia e-mail — desligado por padrão
│   │   ├── validacao_responsividade_acessar_como_visitante.spec.ts
│   │   └── RASTREABILIDADE.md
│   ├── 📂 Cadastro/              # Criar uma conta, cargo no cadastro, consulta em Gerenciar usuários
│   │   ├── valida_criar_conta.spec.ts
│   │   ├── valida_cadastro_novo_usuario.spec.ts   # cria usuário real — desligado por padrão
│   │   ├── validacao_responsividade_criar_conta.spec.ts
│   │   └── RASTREABILIDADE.md
│   ├── 📂 RedefinicaoSenha/      # "Esqueci a senha": redefinição personalizada e padrão
│   │   ├── valida_redefinicao_senha_personalizada.spec.ts
│   │   ├── valida_configuracao_redefinicao_personalizada.spec.ts   # altera configuração — desligado por padrão
│   │   ├── valida_redefinicao_senha_padrao.spec.ts                 # falha enquanto a personalizada estiver ativa
│   │   ├── validacao_responsividade_redefinicao_senha_personalizada.spec.ts
│   │   ├── validacao_responsividade_redefinicao_senha_padrao.spec.ts
│   │   └── RASTREABILIDADE.md
│   └── 📂 Rodape/                # Jira LFXP-1941: habilitar/desabilitar informações no rodapé
│       ├── valida_rodape.spec.ts
│       ├── valida_configuracao_rodape.spec.ts   # altera configuração — desligado por padrão
│       ├── validacao_responsividade_rodape.spec.ts
│       └── RASTREABILIDADE.md
│
📂 fixtures/                      # Massas de dados fixas: mensagens, títulos de página
│   ├── login.ts
│   ├── acessovisitante.ts
│   ├── cadastro.ts
│   ├── redefinicaosenha.ts
│   └── rodape.ts
│
📂 support/                       # Comandos e utilitários reutilizáveis
│   ├── 📂 login_commands/        # Comandos do módulo Login
│   │   └── LoginPage.ts
│   ├── 📂 acessovisitante_commands/  # Comandos do módulo AcessoVisitante
│   │   ├── VisitantePage.ts, AjudaPage.ts
│   │   └── GerenciarAutenticacaoPage.ts, CursoPage.ts
│   ├── 📂 cadastro_commands/     # Comandos do módulo Cadastro
│   │   ├── CriarContaPage.ts, CamposPerfilPage.ts, GerenciadorHierarquiaPage.ts
│   │   └── GerenciarUsuariosPage.ts, MinhaPaginaPage.ts, ListaUsuariosAdminPage.ts
│   ├── 📂 redefinicaosenha_commands/  # Comandos do módulo RedefinicaoSenha
│   │   ├── PerdeuSenhaPage.ts, ConfiguracaoRedefinicaoPage.ts
│   │   └── dadosDoUsuario.ts     # Lê os dados do cadastro do usuário na hora do teste
│   ├── 📂 rodape_commands/       # Comandos do módulo Rodape
│   │   └── RodapePage.ts, TemaPage.ts
│   ├── commands.ts               # Comandos globais (menu do usuário, Sair)
│   ├── 📂 reporters/
│   │   └── resumo.ts             # Resultado da rodada no terminal
│   ├── e2e.ts                    # Configuração global: disponibiliza as telas em todos os testes
│   ├── usuarios.ts               # Usuários fixos dos testes
│   ├── responsividade.ts         # Resoluções padrão da equipe
│   └── auth.setup.ts             # Login de cada perfil, salvo para reuso
│
📂 Factories/                     # Dados falsos gerados a cada execução
│   ├── 📂 definitions/           # Define os dados possíveis por módulo
│   │   ├── login.ts
│   │   ├── cadastro.ts
│   │   └── redefinicao.ts
│   ├── faker.ts                  # Faker em português do Brasil
│   └── index.ts                  # Reúne todas as factories
│
📄 playwright.config.ts           # Configurações do Playwright
📄 package.json                   # Dependências e scripts npm
📄 eslint.config.mjs / .prettierrc.json
📄 .env.example                   # Modelo das variáveis de ambiente
```

### Equivalência com o modelo Cypress

| Modelo (Cypress) | Este projeto (Playwright) |
|---|---|
| `cypress/e2e/<Módulo>/` | `tests/<Módulo>/` |
| `arquivo.cy.js` | `arquivo.spec.ts` |
| `support/<modulo>_commands/` | `support/<modulo>_commands/` — classes de tela (Page Objects) |
| `support/commands.js` | `support/commands.ts` |
| `support/e2e.js` | `support/e2e.ts` — `test` estendido com as telas |
| Objeto `SELECTORS` | Localizadores centralizados no construtor de cada classe de tela |
| `Cypress.env('admin').name` | `usuarios.administrador.nome` — `support/usuarios.ts` |
| `cypress.env.json` | `.env` |
| `npx cypress open` | `npm run test:ui` |

## Instalação

Requer Node.js 20 ou superior.

```bash
npm install
```

```bash
npx playwright install chromium
```

Copie o `.env.example` para `.env` e preencha a identificação e a senha de cada usuário. O `.env` nunca vai para o repositório.

## Usuários fixos

| Perfil | Nome exibido | Variáveis no `.env` |
|---|---|---|
| Administrador geral | Admin Revvo | `ADMINISTRADOR_USUARIO`, `ADMINISTRADOR_SENHA` |
| Cliente | Adm Cliente | `CLIENTE_USUARIO`, `CLIENTE_SENHA` |
| Estudante | Eva Souza | `ESTUDANTE_USUARIO`, `ESTUDANTE_SENHA` |

Uso no teste:

```ts
import { usuarios } from '../../support/usuarios';

await login.entrar(usuarios.administrador);
```

## Execução

| Comando | O que faz |
|---|---|
| `npm run test:ui` | Modo visual — escolha o teste e clique em ▶ |
| `npm test` | Roda tudo, sem janela |
| `npm run test:visivel` | Roda tudo com o navegador aberto |
| `npm run test:login` | Só o módulo Login |
| `npm run test:acesso-visitante` | Só o módulo AcessoVisitante — as suítes que alteram configuração ou enviam e-mail ficam puladas |
| `npm run test:cadastro` | Só o módulo Cadastro — a suíte que cria usuário fica pulada |
| `npm run test:cadastro-real` | Suíte que cria e exclui os usuários `qa.auto1` (sem Cargo) e `qa.auto2` (com Cargo), "QA AUTOMAÇÃO"; senha em `NOVO_CADASTRO_SENHA` no `.env` — use só quando necessário |
| `npm run test:visitante-config` | Troca "Botão de entrada como visitante" para Ocultar e Mostrar e restaura Mostrar — use só quando necessário |
| `npm run test:ajuda-envio` | Envia a Ajuda como visitante: manda e-mail para o suporte — use só quando necessário |
| `npm run test:redefinicao-senha` | Só o módulo RedefinicaoSenha — a suíte que altera configuração fica pulada; a redefinição padrão falha enquanto a personalizada estiver ativa |
| `npm run test:redefinicao-config` | Altera campos de perfil e o campo primário/secundário da redefinição personalizada e restaura no final — use só quando necessário |
| `npm run test:diaria` | Rodada diária completa: todos os módulos, inclusive as suítes desligadas por padrão — roda sozinha às 07:00 |
| `npm run test:rodape` | Só o módulo Rodape — a suíte que altera configuração fica pulada |
| `npm run test:rodape-config` | Habilita e desabilita as opções de footer do Tema e restaura no final — use só quando necessário |
| `npm run test:responsivo` | Só os testes de resolução |
| `npm run report` | Abre o relatório da última execução |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Rodada diária (07:00) — fora do Claude

Durante o dia, rode só o módulo em que está trabalhando (`npm run test:<modulo>`). A rodada completa roda sozinha:

- **07:00 — Agendador de Tarefas do Windows** roda `scripts\rodada-diaria.ps1`: executa `npm run test:diaria` — todos os módulos, inclusive as suítes que criam usuário, alteram configuração ou enviam e-mail — e salva em `relatorios\AAAA-MM-DD\`:
  `resumo.txt`, `resultado.json`, `playwright-report\index.html` (prints e vídeos), `execucao.log` e `status.json`. Guarda os últimos 30 dias.
- **10:00 — tarefa do Claude "Rodada diária — envio do relatório"** só lê essa pasta (não executa testes) e publica a rodada no topo da página do Confluence [Execução Diária da Automação](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5912526881) e por e-mail para os endereços de `config/destinatarios-relatorio.txt` — um por linha; para incluir ou remover alguém, edite esse arquivo.

Para agendar no Windows (uma vez, no PowerShell, na pasta do projeto):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\agendar-rodada-diaria.ps1
```

A tarefa roda com o seu usuário, quando você estiver conectado ao Windows; se o computador estiver desligado às 07:00, roda assim que possível. Para rodar na hora: `Start-ScheduledTask -TaskName 'Automacao LearningFlix - Rodada diaria'`.

Ao terminar qualquer rodada pelo terminal, aparece o **Resultado da rodada**: os testes agrupados por módulo com ✅ Passou, ❌ Falhou, ⚠️ Instável ou ⏸ Pulado/Pendente e o tempo de cada um; o detalhe de cada falha — arquivo, passo, motivo e print —; e os totais. O mesmo resumo fica salvo em `test-results/resumo.txt`. No modo UI (`npm run test:ui`) o resumo não aparece: lá o resultado é mostrado na própria janela.

Arquivo específico:

```bash
npx playwright test tests/Login/valida_visualizar_senha.spec.ts --project=desktop --no-deps
```

O ambiente de QA é lento e não aguenta logins simultâneos: os testes rodam um por vez e com tempo de espera maior.

Os scripts `npm run test:*` refazem o login dos perfis antes de rodar. Com `npx playwright test ... --no-deps` o login não é refeito: se as falhas mostrarem a tela "Acesso", a sessão salva expirou — rode `npm run login:perfis`.

## Escrevendo testes

- **Arquivo:** verbo no infinitivo, palavras separadas por `_` — `valida_login.spec.ts`, `valida_visualizar_senha.spec.ts`. Validações funcionais começam com `valida_`.
- **Arquivo de responsividade:** `validacao_responsividade_` + nome da validação — `validacao_responsividade_login.spec.ts`, `validacao_responsividade_visualizar_senha.spec.ts`. Um por validação, para ficarem agrupados.
- **Título do teste:** ID do caso no DT/EVT + o resultado esperado — `C02 - Login válido redireciona para a página inicial`.
- **Passos:** um `test.step` por intenção, no formato Quando / E / Então.
- **Tags:** `@dt-<documento>` em todo teste; `@responsivo` para resolução. Testes que o DT/EVT não cobre não levam tag: ficam registrados no `RASTREABILIDADE.md` do módulo.
- **Responsividade:** toda validação tem seu arquivo `validacao_responsividade_*`, com um teste por resolução — Celular, Celular rotacionado, Tablet e Monitor.
- **Rastreabilidade:** no `RASTREABILIDADE.md` do módulo, não dentro do teste.
- **Comandos:** sequência repetida 3+ vezes vira método da classe de tela ou comando em `support/`.
- **Dados:** sem valores "mágicos" no teste — fixos em `fixtures/`, gerados em `Factories/`, usuários em `support/usuarios.ts`.
- **Seletores:** priorize papel e nome acessível (`getByRole`) ou `data-testid`; evite classes utilitárias e índices. Se faltar um identificador estável, peça ao DEV.
- **Estabilidade:** rode o teste mais de uma vez antes de subir.

## Checklist antes de abrir a PR

- [ ] Nome do arquivo no padrão `valida_*.spec.ts` ou `validacao_responsividade_*.spec.ts`
- [ ] Títulos com o ID do DT/EVT e passos Quando / Então claros
- [ ] `RASTREABILIDADE.md` atualizado
- [ ] Sem código duplicado — use comandos
- [ ] Seletores estáveis
- [ ] `npm run lint` sem erros
- [ ] Teste passou mais de uma vez
- [ ] PR com o que foi implementado, manutenções, observações e como executar

## Extensões do VS Code

Ao abrir o projeto, o VS Code sugere as extensões de `.vscode/extensions.json`. São as do [modelo da equipe](https://epicbrasil.atlassian.net/wiki/spaces/Builder/pages/4663181317/Extens+es), trocando as específicas de Cypress pela do Playwright:

| Extensão | Uso |
|---|---|
| Playwright Test for VS Code | Roda e depura os testes no editor — substitui Cypress Snippets e Cypress Helper |
| ESLint | Padrão de código |
| Prettier | Formatação |
| Path Intellisense | Autocompleta caminhos de import |
| GitLens | Histórico e autor de cada linha |
| npm Intellisense | Autocompleta pacotes |
| Todo Tree | Lista os `TODO` do código |
| REST Client | Testa APIs no editor |
| JavaScript (ES6) Code Snippets | Snippets de JavaScript |

TypeScript Hero e Bracket Pair Colorizer 2 ficaram de fora: o VS Code já organiza imports e colore pares de chaves nativamente, e as duas extensões foram descontinuadas.
