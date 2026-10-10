# Strata Map — contexto do projeto

Este arquivo resume as decisões tomadas na fase de discovery, feita em conversa no claude.ai. Leia antes de qualquer alteração.

## O que é

Strata Map é um mapa visual e navegável que mostra como um software funciona de ponta a ponta, da tela do usuário até a infraestrutura física (fibra, cobre, rádio, satélite).

Tagline: **"O software por inteiro, do clique à infraestrutura física."**

Origem: a dificuldade de "ver o todo" ao entrar na área de tecnologia. Cada conteúdo explica um pedaço; quase nada mostra como as peças se encaixam.

## Público e prioridade atual

- Público técnico e educacional. Foco atual: **didático**, para iniciantes e cursos de tecnologia. Precisa prender o usuário e ser visual.
- Correção técnica é obrigatória. Alucinação não é tolerada; o conteúdo precisa ser fiel ao mercado real.
- A validação de conformidade arquitetural foi **adiada conscientemente** para um segundo momento.

## Decisões de produto

- **Dois eixos separados:** arquitetura (estrutural) é a espinha dorsal; processo ágil fica num eixo à parte. Não misturar.
- **Zoom semântico:** ao aproximar, a informação muda de natureza (servidor → pods e serviços → container, processo e threads).
- **Matriz, não escada:** eixo vertical = profundidade; horizontal = componentes que coexistem na camada; eixos transversais (segurança, observabilidade, resiliência) atravessam todas as camadas.
- **Seletor de estilo arquitetural:** escolher microsserviços, event-driven, hexagonal, serverless ou monólito reconfigura o mapa. Hoje estão mapeados **microsserviços**, **monólito** e **serverless**, escolhidos por `?estilo=<id>` (o seletor recarrega a página).
- **Personas:** mapear onde cada papel atua. É um diferencial central.
- **Mapa vivo:** nós conectados por arestas rotuladas, com movimento.
- **Formato:** mapa panorâmico (camadas paradas, usuário escolhe o que explorar), não jornada linear forçada. A jornada animada existe como recurso opcional.
- **Fase de brainstorming:** não limitar escopo nem forçar MVP sem o Dani pedir.

## Estado atual do protótipo

Site estático, sem build. Abra `index.html` (veja a seção "Estrutura" do README).

- `index.html`: estrutura da página.
- `assets/css/styles.css`: estilos, temas claro e escuro.
- `assets/js/data/base.js`: camadas, personas e eixos, comuns a todos os estilos.
- `assets/js/data/microsservicos.js`: peças, conexões, jornada e falhas do estilo microsserviços.
- `assets/js/data/monolito.js`: o mesmo para o monólito. Reaproveita as peças comuns de microsservicos.js com `pick(id, ajustes)`, então precisa carregar depois dele.
- `assets/js/data/serverless.js`: o mesmo para o serverless, também com `pick` (carrega depois de microsservicos.js). As funções têm ids próprios (`fnpedidos`, `fnpagamentos`, `fnavisos`) porque o "por dentro" delas é outro; o gateway e o pipeline trocam um item do "por dentro" (`swap`) que não valia para funções.
- `assets/js/data/zoom.js`: zoom dentro do zoom, em `STRATA.zoom[idDaPeça][nome do item do inside]` = `{what, ex?: [rótulo, código], refs?: [[rótulo, url]], kids: [[nome, texto, nível3?]]}`. Vale para todos os estilos, pela chave id + nome do item. Até 3 níveis.
- `assets/js/failure.js`: cálculo da cascata do modo falha (função pura, testável no Node).
- `assets/js/search.js`: busca rápida (função pura, testável no Node): pesos por campo, sem acentos, apelidos como k8s e db.
- `assets/js/app.js`: render do mapa, painel, filtros, jornada, modo falha e caixa de busca.
- `assets/img/`: favicon, apple-touch-icon e `og.png` (prévia de compartilhamento, 1200×630).
- `tools/og-image.html`: fonte do `og.png`, com o comando do Chrome headless para regenerar. Regenerar quando mudar a marca, a tagline ou os estilos citados na imagem.

- 9 camadas: Experiência, Rede e internet, Borda do sistema, Aplicação, Integração e eventos, Dados, Plataforma, Infraestrutura, Físico.
- Microsserviços: 41 peças, jornada de 24 passos (~180 ms). Monólito: 35 peças (aplicação monolítica, módulos de autenticação, pedidos, pagamentos e notificações, fila de jobs), jornada de 19 passos (~166 ms). Serverless: 36 peças (funções, plataforma de funções, microVM, barramento e fila gerenciados, orquestrador de fluxos, proxy de conexões), jornada de 20 passos (~407 ms, dos quais 250 de cold start). Cada peça abre um painel com: o que é, por dentro, tecnologias reais, onde pode rodar, quem cuida, se cair, eixos transversais e conexões.
- "Disparar um clique": passos narrados com contador de milissegundos.
- Toggles: eixos transversais, "Mostrar onde cada coisa roda" (liga serviço → container → pod → Kubernetes → VM → servidor → data center → meio físico) e filtro "Ver pelos olhos de" com 11 personas.
- Modo falha: derrubar uma peça mostra quem para, degrada, congela ou segura o tranco, e se o usuário percebe. Chave "Com redundância" (ligada = produção real; desligada = cascata inteira). Link direto `#falha-<id>`. O relatório compara com a mesma queda nos outros estilos.
- Zoom dentro do zoom: botão "Entrar na peça" no painel (ou clique num item do "por dentro"). Tela cheia na cor da camada, cartões que abrem até 3 níveis, trilha para voltar, Esc sobe um nível, link `#zoom-<id>-<item>-<subitem>`. Todas as peças dos três estilos têm zoom (193 itens, 610 cartões). Toda peça no mapa leva um ícone de expandir (canto inferior direito, na cor da camada), porque toda peça abre um painel; o painel inicial explica o ícone e o botão "Entrar na peça". Peças com o mesmo id em mais de um estilo dividem o objeto em `STRATA.zoom[id]`; itens com o mesmo nome (Templates, Idempotência, Agendador) servem a todos, então o texto precisa valer em todos os contextos.
- Busca rápida: ⌘K, Ctrl+K ou /. Procura nas peças (nome, tecnologias, "por dentro", descrição, onde roda, camada, "se cair") e nos cartões do zoom (`searchZoom`); um resultado do zoom abre o nível certo com o cartão destacado. Mostra o trecho que explica o resultado e, para termos que só existem em outro estilo, leva até ele.
- Pacotes ambientes circulando nas conexões; respeita `prefers-reduced-motion`; tema claro e escuro, com seletor no topo (sistema, claro, escuro). A escolha fica em `localStorage` ("strata-theme") e é aplicada por um script no `<head>`, antes de pintar; o CSS usa `:root[data-theme]` e, sem ele, `prefers-color-scheme`.
- Tipografia: Bricolage Grotesque (títulos), Source Sans 3 (corpo) e JetBrains Mono (rótulos técnicos, números de camada, milissegundos). Faixas escurecem conforme a profundidade, como um corte de terreno.
- Tela inicial: hero com o "testemunho" (as 9 camadas em miniatura, clicáveis, com um pacote descendo) e barra de controles fixa no topo; as personas ficam num seletor.

Camadas, personas e eixos ficam em `base.js`. Cada estilo arquitetural registra `STRATA.styles.<nome>` com `nodes` (peças), `edges` (conexões: tipos net, sync, mem, async, run; mem = chamada em memória, sem rede) e `journey`. O modo falha usa `failure`: `deps` diz quem precisa de quem (efeitos para, degrada, fila, muda), separado de `edges`, que é o caminho da requisição; `guards` diz quem segura cada queda quando há redundância. O 5º campo `"raiz"` numa dep faz ela valer só quando a dependência é a peça derrubada (módulo em pane derruba o processo; módulo sem banco, não). `samples` lista as peças sugeridas para derrubar. Para um novo estilo, crie um arquivo em `assets/js/data/` seguindo `microsservicos.js`.

## Próximos passos levantados

- Outros estilos arquiteturais: event-driven, hexagonal.
- Validação de conformidade (adiada): requisitos por arquitetura com peso (inegociáveis, estruturais, operação), gerando score de aptidão e lista de lacunas.
- Linha do tempo da evolução das arquiteturas, custo e trade-off por peça.
- Eixo de processo ágil (discovery, refinamento, sprint, review, retro).

## Validação e fatos

- Rode `node tests/validate.js` depois de mexer em dados. O GitHub Actions (`.github/workflows/validar.yml`) roda o mesmo a cada push. Erros quebram a verificação; peças sem conexão ou itens sem zoom só geram aviso.
- Ids de peça: letra minúscula seguida de letras e números (vão nos links `#id`, `#falha-id`, `#zoom-id-…`).
- Fontes: todo fato com número, data ou limite de fornecedor leva `refs: [[rótulo, url https]]` no nível onde aparece (peça ou nível do zoom). O painel mostra em "Fontes" e o zoom, embaixo dos cartões; abrem em nova aba. Prefira a documentação oficial ou a fonte primária (Anatel, CA/Browser Forum, root-servers.org); reportagem só quando não houver. O validador confere o formato; antes de publicar, confira se os links respondem.
- Fatos com data foram checados na web em outubro de 2026: validade de certificados (200 dias desde mar/2026, 47 em 2029), faixa de 6 GHz (dividida pela Anatel no fim de 2024: 500 MHz Wi-Fi, 700 MHz móvel), failover do RDS (60 a 120 s), latência e tamanho da Starlink, ML-KEM nos navegadores, ~2 mil instâncias de servidores raiz, fibra em ~80% da banda larga fixa, IX.br, cabos de Fortaleza, PUE das nuvens. Serverless, checado em outubro de 2026: limites do Lambda (15 min, 1.000 de concorrência padrão, 1.000 ambientes novos a cada 10 s, /tmp até 10 GB, 1.769 MB = 1 vCPU), cobrança do INIT desde ago/2025, SnapStart em Java, Python e .NET, timeout do API Gateway (29 s REST, 30 s HTTP API), EventBridge (24 h e 185 tentativas), throttling assíncrono (6 h), Aurora Serverless v2 em 0 ACU, Cloud Run functions (antes Cloud Functions), Azure Linux Consumption aposentado em set/2028 (Flex Consumption), Lambda durable functions e Managed Instances (re:Invent 2025). Rechecar antes de grandes divulgações.

## Como trabalhar comigo

- Idioma: português do Brasil.
- Pode atuar como arquiteto sênior e propor elementos além do que eu citar.
- Na dúvida entre seguro e forte, escolher forte. Evitar visual genérico e textos de template.
