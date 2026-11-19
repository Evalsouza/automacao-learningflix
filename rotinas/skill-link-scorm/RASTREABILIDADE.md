# Rotina — Skill Link nas atividades SCORM (QA)

Gera as competências com o **Skill Link** nas atividades SCORM do QA que ainda não têm competências, e salva cada atividade. Pedido da QA em 16/11/2026.

É uma **rotina**, não um teste: fica em `rotinas/`, com configuração própria (`rotinas/playwright.config.ts`), e **não entra** nas rodadas diária e semanal.

## Como rodar

```bash
npm run rotina:skill-link-scorm:listar
```
Só lista: confere cada SCORM e grava o relatório. Não gera, não salva e não gasta crédito.

```bash
npm run rotina:skill-link-scorm
```
Gera e salva nos SCORMs sem competências.

Filtros, que valem para os dois comandos:

| Variável | Exemplo | O que faz |
|---|---|---|
| `SKILL_LINK_CMID` | `3087,3088` | Só essas atividades (id da atividade, o `update=` da edição) |
| `SKILL_LINK_CURSO` | `325` | Só os SCORMs desses cursos |
| `SKILL_LINK_LIMITE` | `10` | No máximo N gerações nesta execução |

Exemplo, só uma atividade:

```bash
npx cross-env EXECUTAR_SKILL_LINK=sim SKILL_LINK_CMID=3087 playwright test -c rotinas --project=rotina skill-link-scorm
```

O resultado de cada SCORM fica em `test-results/rotinas/skill-link-scorm-<data-hora>.csv`, que abre no Excel. O arquivo é gravado a cada SCORM, então também serve para acompanhar uma execução longa.

## Decisões da QA (16/11/2026)

- Só os SCORMs **sem competências**. O SCORM que já tem competências não é alterado.
- **Gerar e salvar**: o botão só preenche a lista no formulário, e a rotina clica em "Salvar e voltar ao curso".
- Automação Playwright reutilizável, para rodar de novo quando entrarem SCORMs novos.

## Como a rotina funciona

1. Lista os cursos com SCORM (busca do Moodle por módulo, `core_course_search_courses`) e as atividades SCORM de cada curso (`core_courseformat_get_state`).
2. Para cada atividade, lê o formulário de edição sem abrir a página e conta as competências da seção **Skill Link** (lista `#addscormskill`).
3. Se não houver competências: abre `/course/modedit.php?update=<cmid>`, espera os scripts da página iniciarem → **Gerar competências com o Skill Link** → confirma que a geração começou ("Gerando competências..."; senão clica de novo, até 3 vezes, só se não houver resposta) → espera a geração (o botão mostra "Gerando competências...", até 6 min) → **Salvar e voltar ao curso** → lê o formulário de novo e confere que as competências ficaram gravadas.
4. Se os créditos acabarem (o botão fica bloqueado com "Créditos do Skill Link esgotados"), a rotina para.

| Situação no relatório | Significado |
|---|---|
| já tinha competências | Não foi alterado |
| pendente | Sem competências (modo listar, ou além do `SKILL_LINK_LIMITE`) |
| gerada e salva | Competências geradas e gravadas na atividade |
| SCORM sem conteúdo para o Skill Link | A API respondeu "Conteudo extraido do SCORM esta vazio": o pacote não tem texto para a IA ler. Não salva, não conta como falha da rotina e não consumiu crédito no 3087 |
| Skill Link não retornou competências | A IA não devolveu nenhuma competência: a atividade não foi salva |
| erro ao salvar / erro | O Moodle recusou o formulário, ou a tela não respondeu: o motivo vai na coluna `detalhe` |
| créditos esgotados | A rotina parou aqui |
| sem a seção Skill Link | O formulário da atividade não tem o botão (geração para SCORM desligada) |

## Créditos

Cada geração consome créditos do Skill Link: **≈ 1 crédito (US$ 0,0033 a 0,0038) por SCORM**, pelo histórico de "Atividade SCORM" em `/local/skillbox/tokens.php` (11/2026).

## Levantamento no QA (16/11/2026, só leitura)

- **135 cursos** com SCORM e **621 atividades SCORM**.
- Das 612 atividades lidas, todas têm o botão do Skill Link e **549 estão sem competências**. Outras 7 não responderam à leitura e são conferidas de novo pela rotina.
- Saldo de créditos: **1.795**. As 549 gerações devem consumir cerca de 549 créditos.

## Alternativa sem créditos: SCORMs LFX

Para os SCORMs que **vêm do Lizza**, a tela **Alteração em lote de competências** (`/local/skillbox/migration.php`, opção **SCORMs LFX**) traz as competências já geradas no Lizza, em lote e **sem consumir créditos** (ver o tutorial em `tutoriais/lote/`). Os SCORMs que não vêm do Lizza só recebem competências pelo botão na própria atividade, que é o que esta rotina faz.

## Execuções

**16/11/2026 — só a atividade 3087 "SCORM pelo PPTX" (curso 325), com o "sim" da QA**
- Primeira execução: o clique não disparou a geração. O botão aparece antes de o script do Skill Link iniciar, e a rotina leu o botão no estado original. Nada foi salvo e não houve consumo (o histórico de créditos não mudou).
- Corrigido: a rotina espera os scripts da página e confirma o "Gerando competências...".
- Segunda execução (3,6 min): a geração rodou e o Skill Link respondeu **"Erro na API: Conteudo extraido do SCORM esta vazio"**. A atividade não foi salva e continua sem competências. **Não houve consumo de crédito**: saldo 1.794 e última entrada do histórico em 12/11.
- Ajustado depois: essa resposta virou a situação "SCORM sem conteúdo para o Skill Link", e a mensagem deixou de levar o texto do botão de fechar.
