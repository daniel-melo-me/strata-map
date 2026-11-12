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
- **Seletor de estilo arquitetural:** escolher microsserviços, event-driven, hexagonal, serverless ou monólito reconfigura o mapa. Hoje estão mapeados **microsserviços**, **monólito** e **serverless**, escolhidos por `?estilo=<id>` (o seletor recarrega a página). Sem parâmetro, abre no **monólito**, o modelo mental mais simples para iniciantes; o seletor e o card de estilo seguem a progressão monólito → microsserviços → serverless (`STYLE_ORDER` em app.js).
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
- `assets/js/data/niveis.js`: explicação em níveis, `STRATA.levels.base[id] = [em uma frase, analogia]`, com `STRATA.levels[estilo][id]` sobrepondo quando a peça muda de sentido (no monólito, "pedidos" é módulo; no serverless, o gateway é gerenciado). Toda peça de todo estilo precisa resolver; a analogia não pode ensinar errado.
- `assets/js/data/glossario.js`: `STRATA.glossary[id] = {t, alt?, d, node?}`. O painel e o zoom linkam o primeiro uso de cada termo (siglas com maiúsculas exatas, palavras sem diferenciar), menos os que apontam para a própria peça e os que estão dentro de botões (itens do "por dentro" e cartões que abrem). O balão de definição tem "Abrir a peça" e "Ver no glossário". Formas (t e alt) não podem se repetir entre termos.
- `glossario.html` + `assets/js/glossario-page.js`: a lista do glossário, com filtro, letras e "Ver no mapa" por estilo. `professores.html`: estática, roteiros e atividades com links para o mapa; o validador confere cada link (estilo, peça, `#falha-`, `#zoom-` e `?papel=`). Os links usam `index.html?…`, não `./?…`, para funcionar também aberto do disco.
- `assets/js/data/zoom.js`: zoom dentro do zoom, em `STRATA.zoom[idDaPeça][nome do item do inside]` = `{what, ex?: [rótulo, código], refs?: [[rótulo, url]], kids: [[nome, texto, nível3?]]}`. Vale para todos os estilos, pela chave id + nome do item. Até 3 níveis.
- `assets/js/failure.js`: cálculo da cascata do modo falha (função pura, testável no Node).
- `assets/js/search.js`: busca rápida (função pura, testável no Node): pesos por campo, sem acentos, apelidos como k8s e db.
- `assets/js/app.js`: render do mapa, painel, filtros, jornada, modo falha e caixa de busca.
- `assets/img/`: favicon, apple-touch-icon e `og.png` (prévia de compartilhamento, 1200×630).
- `tools/og-image.html`: fonte do `og.png`, com o comando do Chrome headless para regenerar. Regenerar quando mudar a marca, a tagline ou os estilos citados na imagem.

- 9 camadas: Experiência, Rede e internet, Borda do sistema, Aplicação, Integração e eventos, Dados, Plataforma, Infraestrutura, Físico.
- Microsserviços: 41 peças, jornada de 24 passos (~180 ms). Monólito: 35 peças (aplicação monolítica, módulos de autenticação, pedidos, pagamentos e notificações, fila de jobs), jornada de 19 passos (~166 ms). Serverless: 36 peças (funções, plataforma de funções, microVM, barramento e fila gerenciados, orquestrador de fluxos, proxy de conexões), jornada de 20 passos (~407 ms, dos quais 250 de cold start). Cada peça abre um painel com: o que é, por dentro, tecnologias reais, onde pode rodar, quem cuida, se cair, eixos transversais e conexões.
- "Disparar um clique": por padrão, a história da Ana (`tour` em cada estilo: 10 ou 11 passos, linguagem de iniciante). Cada passo é `[de, para, narração, ms, extra?]`; `extra.via` lista as peças do meio para o pacote seguir as linhas, e `extra.p/o/c/why` é uma pergunta de 3 opções que pausa a jornada até a resposta. A soma dos ms do tour tem que bater com a da jornada (o validador confere). O botão no topo da caixa alterna para todos os passos (`journey`), e a escolha fica em `localStorage` "strata-tour". No fim, um resumo (peças e camadas atravessadas, ms) e o convite para o próximo estilo. Passos narrados com contador de milissegundos. Avançar corta a animação na hora; setas ← → e swipe na caixa navegam; a barra de progresso é clicável; o tempo de cada passo acompanha o tamanho do texto (`readMs`). A rolagem (`revealStep`) deixa as peças do passo entre a barra e a caixa de narração; se não couberem juntas, mostra o destino. Com o painel ao lado (≥981px), a caixa fica centrada no mapa.
- Barra de controles, nesta ordem: Disparar, Buscar, "Ver pelos olhos de" (porta de entrada por papel), Modo falha e as visões avançadas (eixos e "onde cada coisa roda"). Abaixo de 1400px as visões avançadas ficam no menu "Mais visões", com um ponto avisando quando alguma está ligada; nada da barra pode ficar cortado. No celular (≤680px) só aparecem as linhas da peça aberta, da queda e do passo da jornada, e não há tráfego ambiente.
- Toggles: eixos transversais, "Mostrar onde cada coisa roda" (liga serviço → container → pod → Kubernetes → VM → servidor → data center → meio físico) e filtro "Ver pelos olhos de" com 11 personas.
- Modo falha: com "Tentar adivinhar antes" (padrão ligado, `localStorage` "strata-guess"), derrubar uma peça primeiro pergunta o que o usuário vai perceber (nada, degrada, fora do ar) e só depois mostra a cascata com "Você acertou" ou não; trocar a redundância não pergunta de novo. A chave "Com redundância" só aparece onde alguém segura a queda (`guards`); abrir um link de peça (`#id`) sai do modo. Rótulos das linhas são posicionados fora dos cards (`placeLabels`) e somem se não houver espaço.
- Modo falha: derrubar uma peça mostra quem para, degrada, congela ou segura o tranco, e se o usuário percebe. Chave "Com redundância" (ligada = produção real; desligada = cascata inteira). Link direto `#falha-<id>`. O relatório compara com a mesma queda nos outros estilos.
- Zoom dentro do zoom: botão "Entrar na peça" no painel (ou clique num item do "por dentro"). Tela cheia na cor da camada, cartões que abrem até 3 níveis, trilha para voltar, Esc sobe um nível, link `#zoom-<id>-<item>-<subitem>`. Todas as peças dos três estilos têm zoom (193 itens, 610 cartões). Toda peça no mapa leva um ícone de expandir (canto inferior direito, na cor da camada), porque toda peça abre um painel; o painel inicial explica o ícone e o botão "Entrar na peça". Na primeira visita o primeiro card pulsa com "Toque para abrir" até a pessoa abrir alguma peça (`localStorage` "strata-seen"). Peças com o mesmo id em mais de um estilo dividem o objeto em `STRATA.zoom[id]`; itens com o mesmo nome (Templates, Idempotência, Agendador) servem a todos, então o texto precisa valer em todos os contextos.
- Busca rápida: ⌘K, Ctrl+K ou /. Procura nas peças (nome, tecnologias, "por dentro", descrição, onde roda, camada, "se cair") e nos cartões do zoom (`searchZoom`); um resultado do zoom abre o nível certo com o cartão destacado. Mostra o trecho que explica o resultado e, para termos que só existem em outro estilo, leva até ele.
- Pacotes ambientes circulando nas conexões; respeita `prefers-reduced-motion`; tema claro e escuro, com seletor no topo (sistema, claro, escuro). A escolha fica em `localStorage` ("strata-theme") e é aplicada por um script no `<head>`, antes de pintar; o CSS usa `:root[data-theme]` e, sem ele, `prefers-color-scheme`.
- Tipografia: Bricolage Grotesque (títulos), Source Sans 3 (corpo) e JetBrains Mono (rótulos técnicos, números de camada, milissegundos). Faixas escurecem conforme a profundidade, como um corte de terreno.
- Painel da peça em níveis: em uma frase e "Como funciona" (analogia) no topo; "Quem cuida" e "Se cair" visíveis; o resto (o que é tecnicamente, por dentro, tecnologias, onde roda, eixos, fontes) recolhido em "Para ir além", que lembra se a pessoa abriu (`localStorage` "strata-deep"). "Conversa com" fica fora, porque é navegação. Peças abertas ganham ✓ no mapa e contam no progresso do painel inicial (`localStorage` "strata-explored-<estilo>").
- Modo apresentação (`?apresentar`): textos maiores, sem rodapé, botão para sair; os links de estilo mantêm o modo. Não usar `zoom` de CSS: desalinha a rolagem da jornada e as linhas, principalmente no Safari. `?papel=<id>` abre o mapa pelos olhos de um papel.
- Público: iniciantes sem visão do todo, juniores e pessoas experientes. O hero diz o caminho de cada um ("Novo em tecnologia?" / "Já trabalha na área?" / "Dá aula?"). O card de estilo no painel inicial tem o seletor como progressão (monólito → microsserviços → serverless).
- Tela inicial: hero com o "testemunho" (as 9 camadas em miniatura, clicáveis, com um pacote descendo) e barra de controles fixa no topo; as personas ficam num seletor.

Camadas, personas e eixos ficam em `base.js`. Cada estilo arquitetural registra `STRATA.styles.<nome>` com `nodes` (peças), `edges` (conexões: tipos net, sync, mem, async, run; mem = chamada em memória, sem rede) e `journey`. O modo falha usa `failure`: `deps` diz quem precisa de quem (efeitos para, degrada, fila, muda), separado de `edges`, que é o caminho da requisição; `guards` diz quem segura cada queda quando há redundância. O 5º campo `"raiz"` numa dep faz ela valer só quando a dependência é a peça derrubada (módulo em pane derruba o processo; módulo sem banco, não). `samples` lista as peças sugeridas para derrubar. Para um novo estilo, crie um arquivo em `assets/js/data/` seguindo `microsservicos.js`.

## Próximos passos levantados

- Outros estilos arquiteturais: event-driven, hexagonal.
- Validação de conformidade (adiada): requisitos por arquitetura com peso (inegociáveis, estruturais, operação), gerando score de aptidão e lista de lacunas.
- Linha do tempo da evolução das arquiteturas, custo e trade-off por peça.
- Eixo de processo ágil (discovery, refinamento, sprint, review, retro).

## Validação e fatos

- Depois de mexer em qualquer arquivo de `assets/`, rode `node tools/versionar.js`: ele põe `?v=<hash do conteúdo>` em cada arquivo local do `index.html`, para o cache do GitHub Pages (10 min) nunca misturar versões. O validador acusa versão desatualizada.
- Rode `node tests/validate.js` depois de mexer em dados. O GitHub Actions (`.github/workflows/validar.yml`) roda o mesmo a cada push. Erros quebram a verificação; peças sem conexão ou itens sem zoom só geram aviso.
- Ids de peça: letra minúscula seguida de letras e números (vão nos links `#id`, `#falha-id`, `#zoom-id-…`).
- Fontes: todo fato com número, data ou limite de fornecedor leva `refs: [[rótulo, url https]]` no nível onde aparece (peça ou nível do zoom). O painel mostra em "Fontes" e o zoom, embaixo dos cartões; abrem em nova aba. Prefira a documentação oficial ou a fonte primária (Anatel, CA/Browser Forum, root-servers.org); reportagem só quando não houver. O validador confere o formato; antes de publicar, confira se os links respondem.
- Fatos com data foram checados na web em outubro de 2026: validade de certificados (200 dias desde mar/2026, 47 em 2029), faixa de 6 GHz (dividida pela Anatel no fim de 2024: 500 MHz Wi-Fi, 700 MHz móvel), failover do RDS (60 a 120 s), latência e tamanho da Starlink, ML-KEM nos navegadores, ~2 mil instâncias de servidores raiz, fibra em ~80% da banda larga fixa, IX.br, cabos de Fortaleza, PUE das nuvens. Serverless, checado em outubro de 2026: limites do Lambda (15 min, 1.000 de concorrência padrão, 1.000 ambientes novos a cada 10 s, /tmp até 10 GB, 1.769 MB = 1 vCPU), cobrança do INIT desde ago/2025, SnapStart em Java, Python e .NET, timeout do API Gateway (29 s REST, 30 s HTTP API), EventBridge (24 h e 185 tentativas), throttling assíncrono (6 h), Aurora Serverless v2 em 0 ACU, Cloud Run functions (antes Cloud Functions), Azure Linux Consumption aposentado em set/2028 (Flex Consumption), Lambda durable functions e Managed Instances (re:Invent 2025). Rechecar antes de grandes divulgações.

## Como trabalhar comigo

- Idioma: português do Brasil.
- Pode atuar como arquiteto sênior e propor elementos além do que eu citar.
- Na dúvida entre seguro e forte, escolher forte. Evitar visual genérico e textos de template.
