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
- **Seletor de estilo arquitetural:** escolher microsserviços, event-driven, hexagonal, serverless ou monólito reconfigura o mapa. Hoje só **microsserviços** está mapeado.
- **Personas:** mapear onde cada papel atua. É um diferencial central.
- **Mapa vivo:** nós conectados por arestas rotuladas, com movimento.
- **Formato:** mapa panorâmico (camadas paradas, usuário escolhe o que explorar), não jornada linear forçada. A jornada animada existe como recurso opcional.
- **Fase de brainstorming:** não limitar escopo nem forçar MVP sem o Dani pedir.

## Estado atual do protótipo

Site estático, sem build. Abra `index.html` (veja a seção "Estrutura" do README).

- `index.html`: estrutura da página.
- `assets/css/styles.css`: estilos, temas claro e escuro.
- `assets/js/data/base.js`: camadas, personas e eixos, comuns a todos os estilos.
- `assets/js/data/microsservicos.js`: peças, conexões e jornada do estilo microsserviços.
- `assets/js/app.js`: render do mapa, painel, filtros e jornada.

- 9 camadas: Experiência, Rede e internet, Borda do sistema, Aplicação, Integração e eventos, Dados, Plataforma, Infraestrutura, Físico.
- 41 peças. Cada uma abre um painel com: o que é, por dentro, tecnologias reais, onde pode rodar, quem cuida, se cair, eixos transversais e conexões.
- "Disparar um clique": 24 passos narrados com contador de milissegundos (~200 ms no total).
- Toggles: eixos transversais, "Mostrar onde cada coisa roda" (liga serviço → container → pod → Kubernetes → VM → servidor → data center → meio físico) e filtro "Ver pelos olhos de" com 11 personas.
- Pacotes ambientes circulando nas conexões; respeita `prefers-reduced-motion`; tema claro e escuro.
- Tipografia: Bricolage Grotesque (títulos), Source Sans 3 (corpo) e JetBrains Mono (rótulos técnicos, números de camada, milissegundos). Faixas escurecem conforme a profundidade, como um corte de terreno.
- Tela inicial: hero com o "testemunho" (as 9 camadas em miniatura, clicáveis, com um pacote descendo) e barra de controles fixa no topo; as personas ficam num seletor.

Camadas, personas e eixos ficam em `base.js`. Cada estilo arquitetural registra `STRATA.styles.<nome>` com `nodes` (peças), `edges` (conexões: tipos net, sync, async, run) e `journey`. Para um novo estilo, crie um arquivo em `assets/js/data/` seguindo `microsservicos.js`.

## Próximos passos levantados

- Outros estilos arquiteturais: event-driven, hexagonal, serverless, monólito.
- Zoom dentro do zoom: tornar navegável o "por dentro" de cada peça.
- Validação de conformidade (adiada): requisitos por arquitetura com peso (inegociáveis, estruturais, operação), gerando score de aptidão e lista de lacunas.
- Linha do tempo da evolução das arquiteturas, custo e trade-off por peça, modo falha.
- Eixo de processo ágil (discovery, refinamento, sprint, review, retro).

## Como trabalhar comigo

- Idioma: português do Brasil.
- Pode atuar como arquiteto sênior e propor elementos além do que eu citar.
- Na dúvida entre seguro e forte, escolher forte. Evitar visual genérico e textos de template.
