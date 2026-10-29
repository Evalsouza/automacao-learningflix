# Automação LearningFlix — regras para o Claude

Playwright + TypeScript. A estrutura, os padrões e os scripts estão no `README.md` e no Confluence (espaço LP1, pasta da automação).

## Execução dos testes fica fora do Claude

Decisão da QA (29/10/2026), para economizar tokens. O papel do Claude é **criar, editar e revisar** scripts de teste.

- **Nunca rode testes por conta própria** — `npm test`, `npm run test:*`, `npx playwright test`, modo UI ou sondas no navegador.
- Ao criar ou editar testes, **pergunte à QA** se ela quer rodar os testes afetados agora. Só rode com o "sim" dela, e rode **só o arquivo ou módulo alterado**, nunca a suíte inteira.
- Para analisar uma execução feita pela QA, leia `test-results/resumo.txt` (e `test-results/resultado.json` se precisar de detalhe) — não execute de novo para "ver o erro".
- Checagens locais rápidas, sem navegador, podem rodar sem perguntar: `npx tsc -p .`, `npx eslint <arquivos>`, `npx prettier --write <arquivos>` e `npx playwright test <arquivo> --project=desktop --no-deps --list`.
- Mapear telas no QA (abrir o navegador para entender a tela) também só com o "ok" da QA.

## Rodada diária

- **07:00** — Agendador de Tarefas do Windows roda `scripts\rodada-diaria.ps1`: `npm run test:diaria` (todos os módulos, inclusive as suítes desligadas) e salva o resultado em `relatorios\AAAA-MM-DD\` (`resumo.txt`, `resultado.json`, `playwright-report\`, `execucao.log`, `status.json`).
- **10:00** — tarefa agendada do Claude "Rodada diária — envio do relatório" só lê essa pasta e publica na página do Confluence "Execução Diária da Automação" e por e-mail para `config\destinatarios-relatorio.txt`. Ela não executa testes.
- Para agendar no Windows (uma vez): `powershell -ExecutionPolicy Bypass -File scripts\agendar-rodada-diaria.ps1`.

## Nunca

- Ler ou citar `.env` e `.auth/` (senhas e sessões).
- Alterar cadastro de usuário de teste sem o "ok" da QA para aquele usuário.
