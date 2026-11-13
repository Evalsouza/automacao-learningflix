# Automação LearningFlix

Testes automatizados E2E da plataforma LearningFlix (ambiente de QA: https://qa.learningflix.net), em **Playwright + TypeScript**.

A organização segue o modelo da equipe — [Estrutura do Repositório](https://epicbrasil.atlassian.net/wiki/spaces/Builder/pages/4661444620/Estrutura+do+Reposit+rio) e [Estrutura de Testes](https://epicbrasil.atlassian.net/wiki/spaces/Builder/pages/4663607398/Estrutura+de+Testes) — adaptado do Cypress para o Playwright.

## Estrutura

```
📂 tests/                         # Casos de teste (E2E) por etapa do fluxo: o número fixa a ordem da rodada
│   ├── 📂 1-PaginaDeLogin/       # Tudo o que começa na página de login — roda primeiro
│   │   ├── 📂 1-Login/           # Login, "Sair", ver a senha, elementos conforme a configuração
│   │   │   ├── valida_login.spec.ts
│   │   │   ├── valida_visualizar_senha.spec.ts
│   │   │   ├── validacao_responsividade_login.spec.ts
│   │   │   ├── validacao_responsividade_visualizar_senha.spec.ts
│   │   │   └── RASTREABILIDADE.md    # Caso do DT/EVT → teste, decisões e pendências
│   │   ├── 📂 2-Cadastro/        # Criar uma conta, cargo no cadastro, consulta em Gerenciar usuários
│   │   │   ├── valida_criar_conta.spec.ts
│   │   │   ├── valida_configuracao_cadastro.spec.ts    # altera configuração — rodada semanal
│   │   │   ├── valida_cadastro_novo_usuario.spec.ts    # cria usuário real — rodada semanal
│   │   │   ├── validacao_responsividade_criar_conta.spec.ts
│   │   │   └── RASTREABILIDADE.md
│   │   ├── 📂 3-RedefinicaoSenha/  # "Esqueci a senha": redefinição personalizada e padrão
│   │   │   ├── valida_redefinicao_senha_personalizada.spec.ts
│   │   │   ├── valida_configuracao_redefinicao_personalizada.spec.ts   # altera configuração — rodada semanal
│   │   │   ├── valida_redefinicao_senha_padrao.spec.ts
│   │   │   ├── validacao_responsividade_redefinicao_senha_personalizada.spec.ts
│   │   │   ├── validacao_responsividade_redefinicao_senha_padrao.spec.ts
│   │   │   └── RASTREABILIDADE.md
│   │   ├── 📂 4-Rodape/          # Jira LFXP-1941: rodapé — também na página de login
│   │   │   ├── valida_rodape.spec.ts
│   │   │   ├── valida_configuracao_rodape.spec.ts   # altera configuração — rodada semanal
│   │   │   ├── validacao_responsividade_rodape.spec.ts
│   │   │   └── RASTREABILIDADE.md
│   │   └── 📂 5-Visitante/       # "Acessar como visitante": acordo de política, Página Inicial, menu, Ajuda
│   │       ├── valida_acessar_como_visitante.spec.ts
│   │       ├── valida_configuracao_botao_visitante.spec.ts   # altera configuração — rodada semanal
│   │       ├── valida_envio_ajuda_visitante.spec.ts          # envia e-mail — rodada semanal
│   │       ├── validacao_responsividade_acessar_como_visitante.spec.ts
│   │       └── RASTREABILIDADE.md
│   └── 📂 2-Plataforma/          # Validações dentro da plataforma — roda depois da página de login
│       ├── 📂 1-Carrossel/       # Plugin Carrossel Infinito na Página inicial
│       │   ├── valida_carrossel.spec.ts
│       │   ├── valida_configuracao_carrossel.spec.ts   # altera configuração — rodada semanal
│       │   ├── validacao_responsividade_carrossel.spec.ts
│       │   └── RASTREABILIDADE.md
│       └── 📂 2-MeusCursos/      # Bloco "Meus Cursos" e Obrigatoriedade do Curso
│           ├── valida_meus_cursos.spec.ts
│           ├── valida_configuracao_meus_cursos.spec.ts   # altera configuração — rodada semanal
│           ├── valida_meus_cursos_usuario_novo.spec.ts   # cria usuário — rodada semanal
│           ├── validacao_responsividade_meus_cursos.spec.ts
│           └── RASTREABILIDADE.md
│
📂 fixtures/                      # Massas de dados fixas: mensagens, títulos de página
│   ├── login.ts
│   ├── acessovisitante.ts
│   ├── cadastro.ts
│   ├── redefinicaosenha.ts
│   ├── rodape.ts
│   ├── carrossel.ts
│   ├── meuscursos.ts
│   └── 📂 arquivos/carrossel/    # vídeo de teste do carrossel (video.mp4), enviado pela QA
│
📂 support/                       # Comandos e utilitários reutilizáveis
│   ├── 📂 login_commands/        # Comandos do módulo Login
│   │   └── LoginPage.ts
│   ├── 📂 acessovisitante_commands/  # Comandos do módulo Visitante
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
│   ├── 📂 carrossel_commands/    # Comandos do módulo Carrossel
│   │   ├── CarrosselPage.ts, ConfiguracaoCarrosselPage.ts
│   │   └── imagens.ts            # Gera as imagens PNG de teste em memória
│   ├── 📂 meuscursos_commands/   # Comandos do módulo MeusCursos
│   │   └── MeusCursosPage.ts, ConfiguracaoMeusCursosPage.ts
│   ├── PaginaBase.ts             # Base das classes de tela: page, abrir(caminho) e mensagem(texto)
│   ├── sessoes.ts                # Sessões dos perfis, semSessao, comSessao() e bloqueio de vídeos
│   ├── commands.ts               # Comandos globais (menu do usuário, Sair)
│   ├── 📂 reporters/
│   │   └── resumo.ts             # Resultado da rodada no terminal
│   ├── e2e.ts                    # Configuração global: disponibiliza as telas em todos os testes
│   ├── usuarios.ts               # Usuários fixos dos testes
│   ├── responsividade.ts         # Resoluções padrão da equipe
│   └── auth.setup.ts             # Login de cada perfil, salvo para reuso (reaproveitado por 2 h)
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
| `npm run test:pagina-de-login` | Só a etapa Página de Login: Login, Cadastro, Redefinição de Senha, Rodapé e Visitante |
| `npm run test:plataforma` | Só a etapa Plataforma: Carrossel e Meus Cursos |
| `npm run test:login` | Só o módulo Login |
| `npm run test:acesso-visitante` | Só o módulo Visitante — as suítes que alteram configuração ou enviam e-mail ficam puladas |
| `npm run test:cadastro` | Só o módulo Cadastro — a suíte que cria usuário fica pulada |
| `npm run test:cadastro-real` | Suíte que cria e exclui os usuários `qa.auto1` (sem Cargo) e `qa.auto2` (com Cargo), "QA AUTOMAÇÃO"; senha em `NOVO_CADASTRO_SENHA` no `.env` — use só quando necessário |
| `npm run test:visitante-config` | Troca "Botão de entrada como visitante" para Ocultar e Mostrar e restaura Mostrar — use só quando necessário |
| `npm run test:ajuda-envio` | Envia a Ajuda como visitante: manda e-mail para o suporte — use só quando necessário |
| `npm run test:redefinicao-senha` | Só o módulo RedefinicaoSenha — a suíte que altera configuração fica pulada; a redefinição padrão falha enquanto a personalizada estiver ativa |
| `npm run test:redefinicao-config` | Altera campos de perfil e o campo primário/secundário da redefinição personalizada e restaura no final — use só quando necessário |
| `npm run test:diaria` | Rodada diária: todos os módulos, só as suítes normais (só leitura) — roda sozinha de segunda a quinta às 09:03 |
| `npm run test:semanal` | Rodada semanal: só as suítes que alteram configuração, criam usuário ou enviam e-mail (`@altera-configuracao`, `@cria-usuario`, `@envia-email`), mais os testes `@critico` — roda sozinha às sextas, 09:03 |
| `npm run test:rodape` | Só o módulo Rodape — a suíte que altera configuração fica pulada |
| `npm run test:rodape-config` | Habilita e desabilita as opções de footer do Tema e restaura no final — use só quando necessário |
| `npm run test:carrossel` | Só o módulo Carrossel — a suíte que altera configuração fica pulada |
| `npm run test:carrossel-config` | Cria e remove um slide de teste, troca "Habilita o Carrossel", o intervalo e a "Cor da Marca" e restaura no final — use só quando necessário |
| `npm run test:meus-cursos` | Só o módulo MeusCursos — as suítes de configuração e de usuário novo ficam puladas |
| `npm run test:meus-cursos-config` | Troca "Número de cards na página" do bloco Meus Cursos e restaura no final — use só quando necessário |
| `npm run test:meus-cursos-novo` | Cria o usuário `qa.auto3`, valida o bloco e o "Ver todos" sem cursos e o exclui — bloqueado pelo defeito do cadastro |
| `npm run test:critico` | Só os testes de prioridade crítica — verificação rápida da plataforma |
| `npm run test:prioridade-alta` | Testes críticos e de prioridade alta |
| `npm run test:responsivo` | Só os testes de resolução |
| `npm run report` | Abre o relatório da última execução |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Rodadas diária e semanal — fora do Claude

Durante o dia, rode só o módulo em que está trabalhando (`npm run test:<modulo>`). As rodadas completas rodam sozinhas, pelo Agendador de Tarefas do Windows (`scripts\rodada-diaria.ps1`):

- **Diária — segunda a quinta, 09:03** (até 4 horas): `npm run test:diaria` — todos os módulos, só as suítes normais — e salva em `relatorios\AAAA-MM-DD\`.
- **Semanal — sexta, 09:03** (até 8 horas): `npm run test:semanal` — as suítes que alteram configuração, criam usuário ou enviam e-mail, todas restauradas no final, mais os testes `@critico` — e salva em `relatorios\AAAA-MM-DD-semanal\`. Ficam separadas porque são lentas no QA e, se a rodada for interrompida, a configuração pode ficar sem restaurar. Na sexta não há diária: as duas no mesmo dia disputavam o ambiente — decisão da QA (13/11/2026).
- Em cada pasta: `resumo.txt`, `resultado.json`, `metricas.json`, `playwright-report\index.html` (prints e vídeos), `execucao.log` e `status.json`. Guarda as últimas 30 pastas.
- **13:00 — tarefa do Claude "Rodada diária — envio do relatório"** só lê essas pastas (não executa testes) e publica cada rodada no topo da página do Confluence [Execução Diária da Automação](https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/5912526881) e por e-mail para os endereços de `config/destinatarios-relatorio.txt` — um por linha; para incluir ou remover alguém, edite esse arquivo. O e-mail traz o caminho do `index.html` no computador da QA: o conector do Outlook não envia anexos.

Para agendar no Windows (uma vez, no PowerShell, na pasta do projeto):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\agendar-rodada-diaria.ps1
```

O script cria (ou atualiza) as duas tarefas, "Automacao LearningFlix - Rodada diaria" e "Automacao LearningFlix - Rodada semanal". Elas rodam com o seu usuário, quando você estiver conectado ao Windows, com a janela oculta; se o computador estiver desligado no horário, rodam assim que possível.

- **Notebook suspenso ou hibernando:** a tarefa acorda o notebook, se ele estiver na tomada e com os temporizadores de ativação ligados (Opções de energia → Configurações avançadas → Suspender → Permitir temporizadores de ativação).
- **Durante a rodada**, o notebook não suspende sozinho. Fechar a tampa ainda suspende e interrompe a rodada.
- **Novas tentativas:** rodada interrompida é tentada de novo 1 h e 2 h depois — diária às 10:03 e 11:03, semanal às 13:00 e 14:00. Rodada que já terminou no dia não roda de novo.
- **Andamento da rodada:** `npm run rodada:andamento` — no terminal do VS Code, mostra a porcentagem executada, quantos passaram, falharam e foram pulados, o último teste e as falhas até agora, sem interferir na rodada.
- **Para rodar na hora:** `Start-ScheduledTask -TaskName 'Automacao LearningFlix - Rodada diaria'` (ou `- Rodada semanal`). Para repetir uma rodada que já terminou no dia: `powershell -ExecutionPolicy Bypass -File scripts
odada-diaria.ps1 -Tipo diaria -Forcar`.

Ao terminar qualquer rodada pelo terminal, aparece o **Resultado da rodada**: os testes agrupados por módulo com ✅ Passou, ❌ Falhou, ⚠️ Instável ou ⏸ Pulado/Pendente e o tempo de cada um; o detalhe de cada falha — arquivo, passo, motivo e print —; e os totais. O mesmo resumo fica salvo em `test-results/resumo.txt`. No modo UI (`npm run test:ui`) o resumo não aparece: lá o resultado é mostrado na própria janela.

Arquivo específico:

```bash
npx playwright test tests/1-PaginaDeLogin/1-Login/valida_visualizar_senha.spec.ts --project=desktop --no-deps
```

O ambiente de QA é lento e não aguenta logins simultâneos: os testes rodam um por vez e com tempo de espera maior.

Os scripts `npm run test:*` fazem o login dos perfis antes de rodar, mas reaproveitam a sessão salva há menos de 2 h — o login dos 3 perfis leva ~1,7 min. Com `npx playwright test ... --no-deps` o login não é feito. Se as falhas mostrarem a tela "Acesso", a sessão salva expirou: rode `npm run login:perfis`, que sempre faz o login de novo.

Os vídeos (mp4, webm…) não são baixados nos testes: os do carrossel deixavam cada página 40 s mais lenta. O módulo Carrossel os carrega com `test.use({ bloquearVideos: false })`.

## Escrevendo testes

- **Arquivo:** verbo no infinitivo, palavras separadas por `_` — `valida_login.spec.ts`, `valida_visualizar_senha.spec.ts`. Validações funcionais começam com `valida_`.
- **Arquivo de responsividade:** `validacao_responsividade_` + nome da validação — `validacao_responsividade_login.spec.ts`, `validacao_responsividade_visualizar_senha.spec.ts`. Um por validação, para ficarem agrupados.
- **Título do teste:** ID do caso no DT/EVT + o resultado esperado — `C02 - Login válido redireciona para a página inicial`.
- **Passos:** um `test.step` por intenção, no formato Quando / E / Então.
- **Prioridade por risco:** todo teste leva `{ tag: prioridade('<Módulo>', '<ID>') }` — `@critico`, `@alto`, `@medio` ou `@baixo`, definidos em `fixtures/prioridades.ts` (Estratégia de Automação, seção 9). ID novo sem regra na tabela faz a listagem falhar.
- **Tags:** `@dt-<documento>` em todo teste; `@responsivo` para resolução. Testes que o DT/EVT não cobre não levam tag: ficam registrados no `RASTREABILIDADE.md` do módulo.
- **Responsividade:** toda validação tem seu arquivo `validacao_responsividade_*`, com um teste por resolução — Celular, Celular rotacionado, Tablet e Monitor.
- **Rastreabilidade:** no `RASTREABILIDADE.md` do módulo, não dentro do teste.
- **Comandos:** sequência repetida 3+ vezes vira método da classe de tela ou comando em `support/`.
- **Classes de tela:** herdam `PaginaBase` (`support/PaginaBase.ts`) e abrem as páginas com `this.abrir(caminho)`, que espera os scripts da página carregarem — sem eles, o "Olho" da senha e o menu do usuário não respondem ao clique. Só o Carrossel abre com `'domcontentloaded'`, porque carrega os vídeos. Nada de `page.goto` nem leitura de tela dentro da spec: vira método da classe.
- **Sessões:** sempre por `sessoes.administrador`, `sessoes.cliente`, `sessoes.estudante` ou `semSessao` (`support/sessoes.ts`). Outro perfil no mesmo teste: `comSessao(browser, sessoes.cliente, (pagina) => ...)`, que abre e fecha a sessão.
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
