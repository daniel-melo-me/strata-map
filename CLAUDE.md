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
- **Seletor de estilo arquitetural:** escolher microsserviços, event-driven, hexagonal, serverless ou monólito reconfigura o mapa. Hoje estão mapeados **microsserviços** e **monólito**, escolhidos por `?estilo=<id>` (o seletor recarrega a página).
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
- `assets/js/data/zoom.js`: zoom dentro do zoom, em `STRATA.zoom[idDaPeça][nome do item do inside]` = `{what, ex?: [rótulo, código], kids: [[nome, texto, nível3?]]}`. Vale para os dois estilos, pela chave id + nome do item. Até 3 níveis.
- `assets/js/failure.js`: cálculo da cascata do modo falha (função pura, testável no Node).
- `assets/js/search.js`: busca rápida (função pura, testável no Node): pesos por campo, sem acentos, apelidos como k8s e db.
- `assets/js/app.js`: render do mapa, painel, filtros, jornada, modo falha e caixa de busca.
- `assets/img/`: favicon, apple-touch-icon e `og.png` (prévia de compartilhamento, 1200×630).
- `tools/og-image.html`: fonte do `og.png`, com o comando do Chrome headless para regenerar. Regenerar quando mudar a marca, a tagline ou os estilos citados na imagem.

- 9 camadas: Experiência, Rede e internet, Borda do sistema, Aplicação, Integração e eventos, Dados, Plataforma, Infraestrutura, Físico.
- Microsserviços: 41 peças, jornada de 24 passos (~180 ms). Monólito: 35 peças (aplicação monolítica, módulos de autenticação, pedidos, pagamentos e notificações, fila de jobs), jornada de 19 passos (~166 ms). Cada peça abre um painel com: o que é, por dentro, tecnologias reais, onde pode rodar, quem cuida, se cair, eixos transversais e conexões.
- "Disparar um clique": passos narrados com contador de milissegundos.
- Toggles: eixos transversais, "Mostrar onde cada coisa roda" (liga serviço → container → pod → Kubernetes → VM → servidor → data center → meio físico) e filtro "Ver pelos olhos de" com 11 personas.
- Modo falha: derrubar uma peça mostra quem para, degrada, congela ou segura o tranco, e se o usuário percebe. Chave "Com redundância" (ligada = produção real; desligada = cascata inteira). Link direto `#falha-<id>`. O relatório compara com a mesma queda nos outros estilos.
- Zoom dentro do zoom: botão "Entrar na peça" no painel (ou clique num item do "por dentro"). Tela cheia na cor da camada, cartões que abrem até 3 níveis, trilha para voltar, Esc sobe um nível, link `#zoom-<id>-<item>-<subitem>`. Todas as peças dos dois estilos têm zoom (162 itens, 513 cartões). A lupa no mapa só aparece se o estilo tiver peças sem zoom. Peças com o mesmo id nos dois estilos dividem o objeto em `STRATA.zoom[id]`; itens com o mesmo nome (Templates, Idempotência, Agendador) servem aos dois, então o texto precisa valer nos dois contextos.
- Busca rápida: ⌘K, Ctrl+K ou /. Procura em nome, tecnologias, "por dentro", descrição, onde roda, camada e "se cair"; mostra o trecho que explica o resultado e, para termos que só existem em outro estilo, leva até ele.
- Pacotes ambientes circulando nas conexões; respeita `prefers-reduced-motion`; tema claro e escuro.
- Tipografia: Bricolage Grotesque (títulos), Source Sans 3 (corpo) e JetBrains Mono (rótulos técnicos, números de camada, milissegundos). Faixas escurecem conforme a profundidade, como um corte de terreno.
- Tela inicial: hero com o "testemunho" (as 9 camadas em miniatura, clicáveis, com um pacote descendo) e barra de controles fixa no topo; as personas ficam num seletor.

Camadas, personas e eixos ficam em `base.js`. Cada estilo arquitetural registra `STRATA.styles.<nome>` com `nodes` (peças), `edges` (conexões: tipos net, sync, mem, async, run; mem = chamada em memória, sem rede) e `journey`. O modo falha usa `failure`: `deps` diz quem precisa de quem (efeitos para, degrada, fila, muda), separado de `edges`, que é o caminho da requisição; `guards` diz quem segura cada queda quando há redundância. O 5º campo `"raiz"` numa dep faz ela valer só quando a dependência é a peça derrubada (módulo em pane derruba o processo; módulo sem banco, não). `samples` lista as peças sugeridas para derrubar. Para um novo estilo, crie um arquivo em `assets/js/data/` seguindo `microsservicos.js`.

## Próximos passos levantados

- Outros estilos arquiteturais: event-driven, hexagonal, serverless.
- Validação de conformidade (adiada): requisitos por arquitetura com peso (inegociáveis, estruturais, operação), gerando score de aptidão e lista de lacunas.
- Linha do tempo da evolução das arquiteturas, custo e trade-off por peça.
- Eixo de processo ágil (discovery, refinamento, sprint, review, retro).

## Como trabalhar comigo

- Idioma: português do Brasil.
- Pode atuar como arquiteto sênior e propor elementos além do que eu citar.
- Na dúvida entre seguro e forte, escolher forte. Evitar visual genérico e textos de template.
