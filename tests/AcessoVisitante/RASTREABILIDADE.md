# Rastreabilidade — Módulo AcessoVisitante

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução, um por validação.

| Tag | Significado |
|---|---|
| `@dt-acessar-como-visitante` | DT/EVT - "Acessar como visitante" Inserir a funcionalidade na página de login |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@altera-configuracao` | Altera configuração da plataforma — desligado por padrão |
| `@envia-email` | Envia e-mail de verdade — desligado por padrão |

---

## DT/EVT - "Acessar como visitante" Inserir a funcionalidade na página de login

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3518365704/DT+EVT+-+Acessar+como+visitante+Inserir+a+funcionalidade+na+p+gina+de+login

| Caso do documento | Teste | Arquivo |
|---|---|---|
| CT001 — Administração do site → Gerenciar autenticação, opção "Mostrar" | V01 | valida_acessar_como_visitante.spec.ts |
| CT001 — "Acessar como visitante" exibido no login | V02 | valida_acessar_como_visitante.spec.ts |
| CT001 — "Ocultar" → botão NÃO exibido | V18 — suíte desligada | valida_configuracao_botao_visitante.spec.ts |
| CT001 — "Mostrar" → botão exibido | V19 — suíte desligada | valida_configuracao_botao_visitante.spec.ts |
| CT002 — "Acessar como visitante" → Acordo de política do site | V03 | valida_acessar_como_visitante.spec.ts |
| CT002 — "Não" → página de login | V04 | valida_acessar_como_visitante.spec.ts |
| CT002 — "Sim" → Página Inicial | V05 | valida_acessar_como_visitante.spec.ts |
| CT002 — blocos do carrossel | V06 | valida_acessar_como_visitante.spec.ts |
| CT002 — opções do sidebar | V07 e V08 | valida_acessar_como_visitante.spec.ts |
| CT002 — carrossel exibido na página "my" e navegação | V09 | valida_acessar_como_visitante.spec.ts |
| CT002 — curso com restrição em Cursos Livres | V10 — primeiro curso exibido no bloco | valida_acessar_como_visitante.spec.ts |
| CT002 — "Continuar" → página de login | V11 | valida_acessar_como_visitante.spec.ts |
| CT002 — método "Acesso como visitante" no curso | V12 — só verifica | valida_acessar_como_visitante.spec.ts |
| CT002 — visitante acessa o curso | V13 | valida_acessar_como_visitante.spec.ts |
| CT002 — atividade "Tarefa" da Temporada 1 | V14 | valida_acessar_como_visitante.spec.ts |
| CT002 — Calendário | V15 | valida_acessar_como_visitante.spec.ts |
| CT002 — Ajuda: página e campos | V16 | valida_acessar_como_visitante.spec.ts |
| CT002 — Ajuda: "Enviar" → "Enviado com sucesso" | V20 — suíte desligada | valida_envio_ajuda_visitante.spec.ts |
| CT002 — e-mail de suporte | V21 — `fixme` | valida_envio_ajuda_visitante.spec.ts |
| CT002 — "Acessar" → página de login | V17 | valida_acessar_como_visitante.spec.ts |
| CT003 e CT004 — responsividade e mobile | Acessar como visitante - Celular / Celular rotacionado / Tablet / Monitor | validacao_responsividade_acessar_como_visitante.spec.ts |

**Não cobertos pelo documento**

| Teste | Motivo |
|---|---|
| OBR01 a OBR03 — campos obrigatórios da Ajuda | Padrão da equipe: todo formulário tem os obrigatórios validados |
| CAN01 — "Cancelar" na Ajuda | Padrão da equipe: botões "Cancelar" sempre cobertos |
| V06 — blocos "Novidades para você" e "Cursos recomendados para seu cargo" | Exibidos na tela; incluídos a pedido da QA |
| V07 — opções "Dashboards" e "Chamados" do menu lateral | Exibidas ao visitante; incluídas a pedido da QA (27/10) |
| V22 - "Dashboards" no menu lateral abre a página "Geral" com as abas do painel | Pedido da QA (27/10) |
| V23 - "Chamados" no menu lateral abre a página "Chamados" | Pedido da QA (27/10) |
| V24 - "Slide anterior" volta para o slide exibido antes | Pedido da QA (27/10): navegação completa do carrossel |
| V25 - Marcador do carrossel mostra o slide correspondente | Idem |

**Suítes desligadas por padrão**

- `valida_configuracao_botao_visitante.spec.ts` — `npm run test:visitante-config`. Muda "Botão de entrada como visitante" para "Ocultar", confere que o botão some, volta para "Mostrar", confere que reaparece e, ao final, garante "Mostrar" mesmo se falhar. A configuração vale para a plataforma inteira.
- `valida_envio_ajuda_visitante.spec.ts` — `npm run test:ajuda-envio`. Envia a Ajuda de verdade: manda e-mail para o suporte.

**Decisões tomadas com a QA**

- Numeração: o documento tem dois "CASOS DE TESTE 001"; o segundo foi tratado como 002.
- Textos da plataforma prevalecem sobre o documento: "Página inicial" no menu, título "Painel (Visitante)", "Administração do site".
- Texto do Acordo de política: segue o texto atual do QA, mesmo sendo do "ESPAÇO UNIVERSEG / BRADESCO SEGUROS" — será atualizado no futuro.
- Curso usado nos testes: 319, "ACESSO COMO VISITANTE", com o método "Acesso como visitante" já configurado e a Tarefa "Acesso como visitante" na Temporada 1 — no lugar de "Como liderar na era digital", que no documento é aberto pelo Catálogo.
- "Catálogo": o teste confere que ele NÃO aparece no menu do visitante — comportamento atual; o curso é aberto direto pelo endereço.
- Carrossel: "se comportou corretamente" = o carrossel é exibido na página "my" e "Próximo slide" mostra outro slide (V09); "Slide anterior" (V24) e os marcadores (V25) também são validados.
- Menu lateral: "Dashboards" e "Chamados" são validados — exibidos e abrindo a página, que o visitante pode acessar, confirmado pela QA. O link "Teste" não é validado.
- Ajuda: "todos os campos funcionaram" = cada campo aceita o valor; sem enviar.
- V10 e V11: em vez de "TESTE BOTÃO SCORM - Com restrição", abrem o primeiro curso exibido no bloco "Cursos Livres" — os cursos do bloco mudam com as atualizações da página.

**Divergências e observações**

- "Catálogo" não aparece no menu lateral do visitante — o DT/EVT espera.
- O menu lateral do visitante mostra o link "Teste", que aponta para as configurações do tema na Administração do site.
- "Dashboards" abre para o visitante a página "Geral" com o caminho "Administração do site \ Geral", as abas Geral, Usuários, Gamificação e Recertificação e o conteúdo em branco. "Chamados" abre "Meus Chamados" com o botão "Novo Ticket".
- Os marcadores do carrossel não têm nome acessível — leitores de tela não os identificam; o teste usa a classe do Glide.
- O ícone "Acessar" do menu lateral e o item ao lado de "Página inicial" não têm nome acessível — leitores de tela não os identificam.
- Curso "TESTE BOTÃO SCORM - Com restrição" não aparece no bloco "Cursos Livres" do visitante.
- **Possível defeito — CAN01:** na Ajuda, "Cancelar" deveria limpar o formulário — confirmado pela QA —, mas mantém o que foi selecionado: o assunto continua "Assunto 1". O teste fica falhando até a correção.
- Na Ajuda, "Nome" e "Matrícula" vêm preenchidos e bloqueados para o visitante: "Usuário visitante" e "guest".
- **Possível defeito — OBR01 a OBR03:** na Ajuda, "Selecione o curso", "Selecione o assunto" e "Mensagem" têm a marca de obrigatório, mas "Enviar" com eles vazios não exibe mensagem. Os testes mostram que a mensagem não aparece. Ainda não se sabe se esse envio vazio chega ao suporte.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
