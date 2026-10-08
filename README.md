# 🗺️ Strata Map

> **O software por inteiro, do clique à infraestrutura física.**

Um mapa visual e navegável que mostra como um software funciona de ponta a ponta, camada por camada: da tela que você toca até os cabos, ondas e satélites que carregam tudo.

---

## 💡 Por que existe

Quando entrei na área de tecnologia, senti uma dificuldade que quase todo mundo sente: cada conteúdo explica um pedaço, mas quase nada mostra **como as peças se encaixam**.

O resultado é gente que domina a própria parte e não enxerga o todo.

O Strata Map nasceu para resolver isso: abrir o software em corte e deixar qualquer pessoa descer da superfície até o metal.

---

## 🧭 As nove camadas

| Camada | Nome | O que responde |
|:---:|---|---|
| 1 | Experiência | O que a pessoa vê e toca |
| 2 | Rede e internet | Como a mensagem viaja |
| 3 | Borda do sistema | Quem pode entrar, e por onde |
| 4 | Aplicação | Onde as regras de negócio rodam |
| 5 | Integração e eventos | Como os sistemas conversam |
| 6 | Dados | Onde a informação mora |
| 7 | Plataforma | Como o código é empacotado, entregue e orquestrado |
| 8 | Infraestrutura | As máquinas por trás da nuvem |
| 9 | Físico | Os meios que carregam os bits: luz, eletricidade e ondas |

Quanto mais fundo, mais longe do usuário.

---

## 🔍 Cada peça abre por dentro

Ao tocar em qualquer componente, você vê:

- **Por dentro:** do que ele é feito
- **Tecnologias reais:** o que o mercado usa de fato
- **Onde pode rodar:** SaaS, nuvem gerenciada ou on-premises
- **Quem cuida:** os papéis responsáveis por ele
- **Se cair:** o que acontece com o resto do sistema
- **Conversa com:** as peças ligadas a ele

---

## ✨ Recursos

### 🏛️ Dois estilos arquiteturais

Escolha o estilo no topo da página e veja o mesmo sistema montado de outro jeito:

- **Microsserviços:** cada parte do negócio é um serviço independente, com deploy e banco próprios, conversando pela rede.
- **Monólito:** um único programa com todos os módulos dentro. Os módulos se chamam em memória, sem rede, e dividem um banco só.

As camadas são as mesmas; mudam as peças, as conexões, a jornada do clique e o que cai junto no modo falha. O estilo fica no link: `?estilo=monolito`.

### ▶️ A jornada de um clique

Acompanhe uma requisição real atravessando todas as camadas, em 24 passos narrados: DNS, Wi-Fi, provedor, backbone, borda, gateway, identidade, cache, banco, eventos e a volta. Com contador de tempo, chegando a cerca de **200 milissegundos**.

### ⚡ Modo falha

Derrube qualquer peça e veja a cascata: quem para junto, quem só degrada, quem congela (o que roda continua, só as mudanças param) e quem segura o tranco, como a fila que guarda os eventos até o consumidor voltar. No fim, o veredito: o usuário percebe ou não?

Cada queda também mostra o que aconteceria no outro estilo: no monólito, um módulo com vazamento de memória derruba o processo inteiro; em microsserviços, a mesma falha só degrada.

A chave **Com redundância** mostra a produção real, com réplicas, failover e várias zonas. Desligada, mostra a cascata inteira e por que a redundância existe. Cada cenário tem link direto: `#falha-oltp` abre o mapa com o banco relacional derrubado.

### 🔍 Zoom dentro do zoom

Toda peça abre por dentro. Em **Entrar na peça**, o mapa dá um zoom e cada parte vira um cartão que pode abrir de novo, até três níveis: Banco relacional › Transações ACID › Isolamento. Alguns níveis trazem exemplos reais, como o SQL de um índice, uma requisição HTTP, um Dockerfile e um Deployment do Kubernetes. Cada nível tem link direto, como `#zoom-oltp-1-2`.

### 🌗 Tema claro ou escuro

No topo, escolha entre o tema do sistema, claro ou escuro. A escolha fica guardada para a próxima visita.

### 🔎 Busca rápida

Aperte **⌘K** (ou **Ctrl+K**, ou **/**) e digite uma peça, tecnologia ou conceito: Kafka, JWT, Redis, failover. A busca ignora acentos, entende apelidos como k8s e db e mostra por que cada peça apareceu. Se o termo só existe no outro estilo, ela leva até lá.

### 🧪 Eixos que atravessam tudo

Acenda as peças por onde passa cada preocupação transversal:

- 🔴 Segurança
- 🔵 Observabilidade
- 🟢 Resiliência

### 🕳️ Onde cada coisa roda

Ligue o serviço ao container, ao pod, ao Kubernetes, à máquina virtual, ao servidor, ao data center e ao meio físico. É a engenharia reversa até a matéria-prima.

### 👀 Ver pelos olhos de

Filtre o mapa pelo papel de quem atua em cada camada:

- Produto e UX
- Dev front-end
- Dev back-end
- QA
- Arquiteto de solução
- DevOps
- SRE
- DBA
- Dados
- Segurança da informação
- Infra e redes

---

## 🎯 Para quem é

- **Quem está começando** e precisa de uma visão clara do sistema inteiro
- **Estudantes e cursos de tecnologia** que querem ensinar com algo visual e vivo
- **Profissionais** que querem enxergar além da própria camada

---

## 🚀 Como rodar

É um site estático, sem build e sem dependências. Basta abrir o `index.html` no navegador.

Se preferir um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Cada peça tem link direto: `index.html#pedidos` abre o mapa já com o serviço de pedidos aberto.

---

## 🗂️ Estrutura

```
index.html                     estrutura da página
assets/css/styles.css          estilos, temas claro e escuro
assets/js/data/base.js         camadas, personas e eixos (comuns a todos os estilos)
assets/js/data/microsservicos.js  peças, conexões, jornada e falhas do estilo microsserviços
assets/js/data/monolito.js     o mesmo para o monólito, reaproveitando as peças comuns
assets/js/data/zoom.js         o que existe por dentro de cada parte das peças (zoom dentro do zoom)
assets/js/failure.js           cálculo da cascata do modo falha
assets/js/search.js            busca rápida por nome, tecnologia e conteúdo das peças
assets/js/app.js               render do mapa, painel, filtros, jornada e modo falha
assets/img/                    favicon, ícone para iOS e imagem de prévia (og.png)
tools/og-image.html            fonte da imagem de prévia; o comando para regenerar está no arquivo
```

Para criar um novo estilo arquitetural, adicione um arquivo em `assets/js/data/` que registre `STRATA.styles.<nome>` com `nodes`, `edges`, `journey` e `failure` (dependências e redundâncias do modo falha), seguindo o formato de `microsservicos.js`.

---

## 🛣️ Próximos passos

- [x] Segundo estilo arquitetural: monólito
- [ ] Novos estilos arquiteturais: event-driven, hexagonal e serverless
- [x] Busca rápida (⌘K)
- [x] Zoom dentro do zoom: tornar navegável o "por dentro" de cada peça
- [ ] Validação de conformidade: checar se uma aplicação está apta a uma arquitetura
- [ ] Linha do tempo: como as arquiteturas evoluíram, e por quê
- [ ] Custo e trade-off por componente
- [x] Modo falha: simular a queda de uma peça e ver o impacto

---

**Strata Map** — veja o software camada por camada.

Criado por **Daniel Melo** · [GitHub](https://github.com/daniel-melo-me) · [LinkedIn](https://www.linkedin.com/in/daniel--melo/) · [dancode.com.br](https://www.dancode.com.br/)
