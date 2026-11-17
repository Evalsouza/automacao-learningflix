# Rastreabilidade — Módulo Carrossel

Arquivos: `valida_*.spec.ts` para as validações funcionais e `validacao_responsividade_*.spec.ts` para as de resolução.

| Tag | Significado |
|---|---|
| `@dt-carrossel` | DT/EVT - Plugin Carrossel Infinito no Layout da Página inicial |
| `@responsivo` | Teste de resolução — padrão da equipe |
| `@altera-configuracao` | Altera configuração da plataforma — desligado por padrão |

| Script | O que roda |
|---|---|
| `npm run test:carrossel` | Todo o módulo, menos a suíte de configuração |
| `npm run test:carrossel-config` | Só a suíte de configuração (`EXECUTAR_CONFIG_CARROSSEL=sim`) — também roda na rodada semanal (sexta, 12:00) |

---

## DT/EVT - Plugin Carrossel Infinito no Layout da Página inicial

https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3422913852 — base escolhida pela QA (30/10). O DT/EVTR de regressão, https://epicbrasil.atlassian.net/wiki/spaces/LP1/pages/3448159400, foi comparado e as diferenças estão abaixo.

O documento não numera as condições ("RF001 à RF010"); os IDs seguem a ordem em que aparecem.

**Suíte normal — `valida_carrossel.spec.ts`** (só leitura)

| Condição do DT/EVT | Teste |
|---|---|
| Aba "Carrossel da Página Inicial" com os campos dos slides e sem "Alinhamento" | CR01 |
| Usuário vê o carrossel do Header até o início do 1º bloco | CR02 (Estudante) e CR03 (Administrador) |
| Slides apresentados dentro do tempo configurado | CR04 — intervalo lido na hora (30 s em 30/10) |

**Suíte de configuração — `valida_configuracao_carrossel.spec.ts`** (`@altera-configuracao`; cria **um slide de teste** no fim do carrossel e o remove — os slides existentes nunca são alterados; restaura "Habilita o Carrossel", o intervalo e a "Cor da Marca" ao final)

| Condição do DT/EVT | Teste |
|---|---|
| "Adicionar um novo slide" → "Um novo slide foi adicionado ao carrossel da Página inicial."; sem "Alinhamento" | CR10 |
| Imagem 1280x720 → "Mudanças gravadas" e o usuário vê o slide | CR11 — com título, cor do título, idioma e URL |
| "Excluir" o arquivo ("Você tem certeza que quer excluir este arquivo?") e imagem 940x627 → "Algumas configurações não mudaram devido a um erro." + "Erro de dimensão: …" | CR12 |
| Intervalo configurado (CT 2: 5 segundos) | CR16 |
| Desmarcar "Habilita o Carrossel" → Administrador e usuário NÃO veem o carrossel | CR17 |
| "Cor da Marca" do CT 1 (#AD1400) | CR18 — confere que o estilo da Página inicial passou a usar a cor |
| "Remover o slide N" → confirmação e "O slide N do carrossel foi removido com sucesso." | CR19 — remove o slide de teste, não o slide 5 |

**Não cobertos pelo documento** — pedidos da QA (30/10)

| Teste | Motivo |
|---|---|
| CR13 - Imagem acima de 5 MB NÃO é adicionada ao slide | A história exige no máximo 5 MB, mas nenhum caso testa. A mensagem do campo fica registrada na execução: ainda não mapeada |
| CR14 - Slide com idioma "English" NÃO é exibido para a Estudante em português | O campo "Idioma" filtra os slides; o documento não diz o esperado |
| CR05 - Em português, Estudante e Administrador veem só os slides em "Português - Brasil" | Pedido da QA (17/11): cada slide aparece só para quem está com a plataforma no mesmo idioma. Só leitura — o "Idioma" de cada slide é lido como Administrador e a quantidade exibida é comparada |
| CR06.1 a CR06.3 - Com a plataforma em "Português - Brasil", "English" e "Español - Internacional", o visitante vê só os slides daquele idioma | Pedido da QA (17/11). O visitante troca o idioma pelo seletor do rodapé (`?lang=`), que vale só para a sessão — nenhum cadastro é alterado |
| CR15 - Slide com vídeo (mp4) é exibido na Página inicial | Os slides atuais usam vídeo; o DT/EVT só cobre imagens. Pendente até o vídeo de teste estar em `fixtures/arquivos/carrossel/video.mp4` |
| Carrossel - Celular / Celular rotacionado / Tablet / Monitor — `validacao_responsividade_carrossel.spec.ts` | Responsividade é padrão da equipe |

**Decisões tomadas com a QA (30/10)**

- Base da automação: DT/EVT original.
- Os 6 slides existentes — com vídeos e imagens da equipe — **não são alterados**: o documento manda excluir o arquivo do slide 1 e remover os slides 5, 4 e 3, o que apagaria conteúdo que não pode ser restaurado. A suíte trabalha só com um slide de teste.
- As imagens de teste (1280x720, 940x627 e uma de ~9,6 MB) são geradas em memória pelo próprio teste (`support/carrossel_commands/imagens.ts`) — sem arquivos no repositório.
- O texto do slide (editor) não é preenchido: o DT/EVT só usa o campo como dado da tabela de decisão.
- **Idioma dos slides (17/11):** o carrossel mostra só os slides com o "Idioma" igual ao da plataforma para quem acessa. Mapeado em 17/11, só leitura: 6 slides — 3 em "Português - Brasil" (2, 5 e 6), 2 em "English" (3 e 4) e 1 em "Español - Internacional" (1); o campo "Idioma" não tem a opção "Todos os idiomas". Com 1 slide o carrossel não mostra os botões "Próximo slide" e "Slide anterior", por isso CR05 e CR06 contam os slides em `#frontpage-carousel`. De manhã, em "English", só o slide 3 aparecia (o slide 4, "AI Assistant", não); a equipe alterou os slides no mesmo dia e, na execução das 13:19, os 2 slides em inglês foram exibidos — não ficou registrado como possível defeito.

**Divergências entre DT/EVT, DT/EVTR e sistema**

- O DT/EVTR troca a base (LFXP-7), usa "VERDE ESCURO" como cor da marca em todos os CTs, inclui vídeos (mp4, m4v, f4v, webm) e o usuário "QA.aluno4"/"QA Aluno4" (escrito de dois jeitos); o DT/EVT usa cores diferentes por CT, só imagens e o usuário genérico "QA.usuário".
- No DT/EVTR, o CT 1 não tem passo de upload e depois cita "o arquivo de **vídeo** adicionado ao Slide", mas a tabela do CT 1 diz "IMAGEM"; a coluna "Texto" traz "IMAGEM" / "IMAGEM e TEXTO", que parecem o tipo do slide.
- URLs dos documentos: `smart4-qa.leobr.net` / `smart4-homolog.leobr.net`; os testes rodam em `qa.learningflix.net`.
- Caminho: "Smart" na aba Temas → hoje "Administração do site → Aparência → Temas → Tema" (`smart_4`), aba "Carrossel da Página Inicial". A "Cor da Marca" fica na aba "Configurações gerais" do tema (`brandcolor`).
- Não há campo "Qtd. de Slides": os slides são adicionados um a um com "Adicionar um novo slide".
- A tela tem opções que o documento não cobre: "Habilita o Carrossel no Aplicativo", "Página de localização" e "Habilita controle de Play do Carrossel".
- O limite do campo de imagem na tela é "tamanho máximo total: 20 Mb"; os 5 MB da história não aparecem na tela.
- O tamanho da imagem ficou como "X MB" no documento; "TEXTE TÍTULO" e "miníma" são erros de digitação.

---

## Resoluções

| Tipo | Resolução |
|---|---|
| Celular | 412x839 |
| Celular rotacionado | 863x360 |
| Tablet | 810x1080 |
| Monitor | 1920x1080 |
