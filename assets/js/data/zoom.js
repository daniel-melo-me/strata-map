/* Zoom dentro do zoom: o que existe por dentro de cada parte de uma peça.
 * STRATA.zoom[idDaPeça][nome do item em inside] = nível 2:
 *   { what, ex?: [rótulo, código], kids: [[nome, texto, nível 3?], ...] }
 * O nível 3 tem o mesmo formato ({ what, ex?, kids }), e os kids dele são folhas.
 * Vale para qualquer estilo: a chave é o id da peça e o nome do item. */
window.STRATA = window.STRATA || { styles: {} };

(function(){
const processo={
 what:"Dentro do container roda um processo do sistema operacional, com sua memória e suas threads, atendendo muitas requisições ao mesmo tempo.",
 kids:[
  ["Processo","Um programa em execução, com memória própria que nenhum outro processo enxerga."],
  ["Threads","Linhas de execução dentro do processo. Compartilham a memória: dividem os dados, e também os riscos."],
  ["Pool de threads ou event loop","Java e .NET costumam atender cada requisição numa thread de um pool. Node.js atende todas num event loop, sem bloquear enquanto espera a rede."],
  ["Heap e stack","O heap guarda os objetos criados. Cada thread tem a sua stack, com as chamadas de função em andamento."]
 ]};

STRATA.zoom={

navegador:{
 "Motor de renderização":{
  what:"Transforma o HTML e o CSS que chegam pela rede nos pixels da tela. Isso acontece em etapas, num caminho chamado pipeline de renderização.",
  kids:[
   ["Parse do HTML","O HTML vira o DOM: uma árvore de objetos com cada elemento da página."],
   ["CSSOM","O CSS vira outra árvore, com as regras de estilo de cada elemento."],
   ["Layout","Calcula a posição e o tamanho de cada caixa. Mudar o tamanho de algo pode obrigar a refazer o layout da página toda."],
   ["Paint e composição","Pinta cada camada em pixels e junta as camadas, muitas vezes com ajuda da GPU."]
  ]},
 "Motor JavaScript":{
  what:"Executa o código do front-end. Começa interpretando e, nas partes que rodam muito, compila para código de máquina durante a execução (JIT).",
  ex:["O toque em “Meus pedidos”, em JavaScript","botao.addEventListener('click', async () => {\n  const resposta = await fetch('/api/pedidos');\n  desenhar(await resposta.json());\n});"],
  kids:[
   ["Event loop","O JavaScript da página roda numa thread principal. Cliques, respostas da rede e timers entram numa fila e são atendidos um por vez."],
   ["Compilação JIT","O motor observa o código rodando e otimiza as funções mais usadas."],
   ["Coleta de lixo","Libera sozinha a memória dos objetos que ninguém mais usa."]
  ]},
 "Cache, cookies e armazenamento":{
  what:"O navegador guarda coisas para não pedir de novo e para lembrar quem você é.",
  kids:[
   ["Cache HTTP","Arquivos guardados conforme os cabeçalhos Cache-Control e ETag que o servidor envia."],
   ["Cookies","Pequenos valores enviados de volta ao servidor a cada requisição. É assim que a sessão de login costuma viajar."],
   ["localStorage e IndexedDB","Armazenamento que só o JavaScript da página lê. Não viaja nas requisições."]
  ]},
 "Pilha de rede":{
  what:"A parte do navegador que abre conexões e fala HTTP com os servidores.",
  kids:[
   ["HTTP/1.1","Uma requisição por vez em cada conexão. Para paralelizar, o navegador abre várias conexões."],
   ["HTTP/2","Várias requisições ao mesmo tempo numa só conexão TCP, com cabeçalhos comprimidos."],
   ["HTTP/3","Usa QUIC sobre UDP: um pacote perdido não trava as outras requisições, e a conexão sobrevive à troca do Wi-Fi para o 4G."]
  ]}
},

dns:{
 "Resolvedor":{
  what:"O primeiro servidor que o aparelho consulta. Se já sabe a resposta, responde na hora; se não, sai perguntando por você.",
  kids:[
   ["Cache","Guarda as respostas pelo tempo do TTL. A maioria das consultas termina aqui."],
   ["Consulta recursiva","Quando não sabe, pergunta à raiz, depois ao TLD, depois ao servidor do domínio, e devolve a resposta final."],
   ["DNS cifrado","DNS over HTTPS (DoH) e DNS over TLS (DoT) impedem que a rede veja quais sites você procura."]
  ]},
 "Servidores raiz e de TLD":{
  what:"A hierarquia que permite achar qualquer domínio do mundo começando sempre do mesmo ponto.",
  refs:[["Root Server System (root-servers.org)","https://root-servers.org/"]],
  ex:["Perguntando ao DNS pelo terminal","$ dig +short loja.com.br\n203.0.113.10"],
  kids:[
   ["Raiz","13 identidades de servidores raiz, operadas por 12 organizações e replicadas, por anycast, em cerca de 2 mil servidores pelo mundo."],
   ["TLD","Os servidores de .com, .org e .br. O .br é operado pelo Registro.br, do NIC.br."],
   ["Delegação","Cada nível só sabe quem é o próximo: a raiz aponta para o .br, que aponta para os servidores de loja.com.br."]
  ]},
 "Servidor autoritativo":{
  what:"Guarda os registros oficiais do domínio. É a fonte da verdade.",
  kids:[
   ["A e AAAA","Ligam o nome a um endereço IPv4 ou IPv6."],
   ["CNAME","Um nome que aponta para outro nome, como um subdomínio apontando para o GitHub Pages."],
   ["MX e TXT","Para onde vão os e-mails do domínio, e textos de verificação e segurança, como SPF e DKIM."]
  ]},
 "TTL":{
  what:"Por quantos segundos uma resposta pode ficar guardada em cache.",
  kids:[
   ["TTL alto","Menos consultas e respostas mais rápidas, mas mudanças demoram a chegar a todos."],
   ["TTL baixo","Permite trocar de servidor depressa num desastre, ao custo de mais consultas."],
   ["Propagação","Não existe uma propagação de verdade: cada cache expira no seu tempo. Por isso uma mudança aparece aos poucos."]
  ]}
},

tls:{
 "Handshake":{
  what:"Antes de qualquer dado, navegador e servidor combinam como vão cifrar a conversa. No TLS 1.3, isso leva uma ida e volta.",
  kids:[
   ["ClientHello","O navegador diz quais cifras aceita e já envia a sua parte da troca de chaves."],
   ["ServerHello e certificado","O servidor escolhe a cifra, envia a parte dele da troca de chaves e o certificado que prova quem é."],
   ["Troca de chaves (ECDHE)","Os dois calculam a mesma chave secreta sem que ela trafegue. Mesmo quem gravou tudo não consegue decifrar depois.",{
    what:"Diffie-Hellman com curvas elípticas: cada lado gera um par de chaves temporário só para esta conversa e, com a parte pública do outro, chega ao mesmo segredo.",
    refs:[["Chromium: troca de chaves pós-quântica","https://blog.chromium.org/2024/05/advancing-our-amazing-bet-on-asymmetric.html"],["Cloudflare: suporte a criptografia pós-quântica","https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/"]],
    kids:[
     ["Chaves efêmeras","São jogadas fora quando a conexão termina."],
     ["Sigilo futuro","Se a chave privada do servidor vazar amanhã, as conversas de hoje continuam protegidas."],
     ["Pós-quântico","Os navegadores atuais e muitos servidores já combinam o ECDHE com o ML-KEM, para resistir a futuros computadores quânticos."]
    ]}],
   ["Finished","Os dois confirmam que ninguém alterou o handshake. Daqui em diante, tudo é cifrado."]
  ]},
 "Certificado digital":{
  what:"Um documento que liga um domínio a uma chave pública, assinado por uma autoridade em quem o navegador confia.",
  refs:[["CA/Browser Forum, ballot SC-081v3","https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/"]],
  kids:[
   ["Cadeia de confiança","O certificado do site é assinado por uma autoridade intermediária, assinada por uma raiz que já vem instalada no sistema."],
   ["Validade cada vez menor","O limite dos certificados públicos caiu de 398 para 200 dias em 2026 e chega a 47 dias em 2029. A renovação precisa ser automática."],
   ["Let's Encrypt e ACME","Autoridade gratuita que emite certificados por um protocolo automático, o ACME."]
  ]},
 "Criptografia do tráfego":{
  what:"Depois do handshake, cada pedaço da conversa é cifrado e autenticado com uma chave simétrica, muito mais rápida que a criptografia do handshake.",
  kids:[
   ["AES-GCM e ChaCha20","As cifras do TLS 1.3. Cifram e, ao mesmo tempo, detectam qualquer alteração."],
   ["Integridade","Se alguém mudar um único bit no caminho, a mensagem é rejeitada."],
   ["O que fica visível","Quem observa a rede ainda vê o IP de destino, o volume de dados e, em geral, o nome do site. Só o ECH, ainda pouco usado, esconde o nome."]
  ]},
 "TCP ou QUIC":{
  what:"O transporte que leva os bytes cifrados de um lado a outro e garante que cheguem completos e em ordem.",
  kids:[
   ["TCP","Abre a conexão com três mensagens (SYN, SYN-ACK, ACK), numera os pacotes e reenvia os perdidos."],
   ["QUIC","Roda sobre UDP, traz o TLS embutido e abre a conexão segura em uma ida e volta, ou em nenhuma, se já conversou antes."],
   ["Ida e volta (RTT)","O tempo de um pacote ir e voltar. Entre São Paulo e a Virgínia, nos EUA, fica perto de 120 ms: cada ida e volta poupada no handshake se sente."]
  ]}
},

pedidos:{
 "API":{
  what:"A porta do serviço: recebe requisições HTTP e devolve respostas, quase sempre em JSON.",
  ex:["Uma requisição e a resposta","GET /pedidos?cliente=42 HTTP/1.1\nHost: api.loja.com\nAuthorization: Bearer eyJhbGciOi…\n\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n[{\"id\": 981, \"status\": \"pago\", \"total\": 129.90}]"],
  kids:[
   ["Método e rota","GET lê, POST cria, PUT e PATCH alteram, DELETE remove. A rota diz sobre o quê."],
   ["Cabeçalhos","Os metadados da conversa: quem é você (Authorization), em que formato (Content-Type), por quanto tempo guardar (Cache-Control)."],
   ["Código de status","2xx deu certo, 4xx o pedido estava errado, 5xx o servidor falhou."],
   ["Contrato","A especificação da API, em geral em OpenAPI, para outros times saberem como chamá-la."]
  ]},
 "Regras de negócio":{
  what:"O coração do serviço: o que a empresa considera certo. Fica separado da API e do banco para poder ser testado sozinho.",
  kids:[
   ["Entidades","Pedido, item, cliente: os objetos do domínio e o que cada um pode fazer."],
   ["Invariantes","Regras que nunca podem ser quebradas, como um pedido pago não poder ser cancelado sem estorno."],
   ["Testes de unidade","Testam as regras sem banco nem rede, em milissegundos."]
  ]},
 "Repositório":{
  what:"A parte que traduz os objetos do domínio para as tabelas do banco, e de volta.",
  kids:[
   ["ORM","Bibliotecas como Hibernate, Entity Framework e Prisma geram o SQL a partir dos objetos."],
   ["Consultas escritas à mão","Quando o ORM não basta, SQL próprio para as consultas críticas."],
   ["Pool de conexões","Abrir conexão com o banco é caro, então o serviço mantém algumas abertas e as reutiliza."]
  ]},
 "Publicador de eventos":{
  what:"Avisa o resto do sistema que algo aconteceu, publicando no barramento.",
  kids:[
   ["Evento","Um fato no passado, com nome e dados: PedidoCriado, com id, cliente e total."],
   ["Padrão outbox","O evento é gravado numa tabela na mesma transação do pedido, e um processo o publica depois. Nunca existe pedido sem evento, nem evento sem pedido."],
   ["Esquema do evento","O formato combinado entre quem publica e quem consome, versionado para não quebrar ninguém."]
  ]},
 "Processo e threads":processo
},

/* no monólito, o processo fica na peça da aplicação */
app:{ "Processo e threads":processo },

kafka:{
 "Tópicos e partições":{
  what:"Um tópico é um canal com nome, como pedidos. Ele é dividido em partições: logs separados, que podem ficar em máquinas diferentes.",
  kids:[
   ["Partição","Uma sequência em que só se acrescenta: cada evento novo vai para o fim e nunca é alterado."],
   ["Offset","A posição de cada evento na partição. O consumidor anota até onde já leu."],
   ["Chave e ordem","Eventos com a mesma chave, como o id do pedido, caem na mesma partição e mantêm a ordem."],
   ["Réplicas","Cada partição tem cópias em outros brokers. Se um broker cai, uma réplica assume."]
  ]},
 "Produtores e consumidores":{
  what:"Quem publica não sabe quem vai ler. Essa ignorância é o que deixa os serviços independentes.",
  kids:[
   ["Produtor","Envia o evento e espera a confirmação de quantas réplicas gravaram (acks)."],
   ["Consumidor","Lê no próprio ritmo e confirma o offset depois de processar."],
   ["Pelo menos uma vez","Se o consumidor cai antes de confirmar, o evento é lido de novo. Por isso o processamento precisa ser idempotente."]
  ]},
 "Grupos de consumo":{
  what:"Várias cópias de um serviço dividem as partições entre si para processar em paralelo.",
  kids:[
   ["Uma partição, um consumidor","Dentro do grupo, cada partição é lida por uma cópia só. Mais partições permitem mais paralelismo."],
   ["Rebalanceamento","Quando uma cópia entra ou sai, as partições são redistribuídas."],
   ["Grupos independentes","Pagamentos e notificações leem o mesmo tópico, cada um no seu grupo e no seu ritmo."]
  ]},
 "Retenção e replay":{
  what:"No Kafka, ler não apaga. Os eventos ficam guardados pelo tempo configurado.",
  kids:[
   ["Retenção","Sete dias é o padrão; há tópicos que guardam por tamanho ou para sempre."],
   ["Replay","Um serviço novo pode ler o histórico desde o início e montar o próprio estado."],
   ["Compactação","Em tópicos compactados, o Kafka guarda só o último evento de cada chave."]
  ]}
},

oltp:{
 "Tabelas e índices":{
  what:"Os dados ficam em tabelas de linhas e colunas. Sem índice, achar uma linha é ler a tabela inteira; com índice, são poucos saltos.",
  ex:["Criando um índice e conferindo o plano (PostgreSQL)","CREATE INDEX idx_pedidos_cliente ON pedidos (cliente_id);\n\nEXPLAIN SELECT * FROM pedidos WHERE cliente_id = 42;\n-- Index Scan using idx_pedidos_cliente on pedidos"],
  kids:[
   ["B-tree","A estrutura da maioria dos índices: uma árvore balanceada em que cada salto descarta quase todo o resto. Milhões de linhas cabem em três ou quatro níveis."],
   ["Plano de execução","O banco decide como responder a cada consulta: qual índice usar, em que ordem juntar as tabelas. O EXPLAIN mostra essa decisão."],
   ["Custo do índice","Cada índice acelera leituras, mas deixa as escritas mais lentas e ocupa disco."]
  ]},
 "Transações ACID":{
  what:"Um conjunto de operações que o banco trata como uma coisa só.",
  ex:["Uma transação","BEGIN;\nUPDATE contas SET saldo = saldo - 100 WHERE id = 1;\nUPDATE contas SET saldo = saldo + 100 WHERE id = 2;\nCOMMIT;"],
  kids:[
   ["Atomicidade","Ou tudo é gravado, ou nada é. Debitar e creditar acontecem juntos."],
   ["Consistência","Nenhuma transação deixa o banco violando as regras declaradas, como chaves estrangeiras e restrições."],
   ["Isolamento","Transações simultâneas não enxergam o trabalho pela metade umas das outras.",{
    what:"O quanto uma transação enxerga das outras é configurável. Mais isolamento traz menos anomalias e menos concorrência.",
    kids:[
     ["Read committed","Só enxerga o que já foi confirmado. É o padrão do PostgreSQL e do SQL Server."],
     ["Repeatable read","Uma linha lida duas vezes na mesma transação dá o mesmo resultado. É o padrão do MySQL (InnoDB)."],
     ["Serializable","Como se as transações rodassem uma de cada vez. O mais seguro e o mais caro."]
    ]}],
   ["Durabilidade","Confirmou, está gravado, mesmo que a energia caia um segundo depois.",{
    what:"O segredo é o log de escrita antecipada (WAL): antes de mexer nas tabelas, o banco grava a mudança num log em disco.",
    kids:[
     ["Log primeiro","A confirmação só volta para quem pediu depois que a mudança está no log, em disco."],
     ["Recuperação","Depois de uma queda, o banco relê o log e refaz o que faltava."],
     ["Checkpoint","De tempos em tempos, as páginas alteradas vão para as tabelas e o log antigo pode ser descartado."]
    ]}]
  ]},
 "Réplicas":{
  what:"Cópias do banco que recebem as mudanças do principal, para atender leituras e para assumir se ele cair.",
  refs:[["Failover do RDS Multi-AZ","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html"]],
  kids:[
   ["Replicação pelo log","O principal envia o próprio WAL às réplicas, que aplicam as mesmas mudanças."],
   ["Síncrona ou assíncrona","Síncrona espera a réplica confirmar e não perde nada, mas é mais lenta. Assíncrona é rápida, mas pode perder os últimos segundos numa queda."],
   ["Failover","Quando o principal cai, uma réplica é promovida. Em serviços gerenciados, como o RDS, isso costuma levar de um a dois minutos."],
   ["Réplicas de leitura","Recebem consultas pesadas, como relatórios, para aliviar o principal. Podem estar um pouco atrasadas."]
  ]},
 "Backup e log de transações":{
  what:"Duas coisas juntas permitem voltar o banco a qualquer segundo do passado.",
  kids:[
   ["Backup completo","Uma fotografia do banco inteiro, feita de tempos em tempos."],
   ["Arquivamento do log","Cada pedaço do WAL é guardado, em geral em armazenamento de objetos."],
   ["Recuperação a um ponto no tempo","Restaura a fotografia e reaplica o log até o instante desejado, como um minuto antes de um DELETE errado."],
   ["RPO e RTO","Quanto dado se aceita perder (RPO) e quanto tempo se aceita ficar fora (RTO). São decisões de negócio."]
  ]}
},

container:{
 "Imagem":{
  what:"Um pacote somente leitura, em camadas, com tudo de que o processo precisa: sistema base, bibliotecas e o código.",
  ex:["Um Dockerfile","FROM node:22-slim\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nCMD [\"node\", \"server.js\"]"],
  kids:[
   ["Dockerfile","A receita da imagem. Cada instrução gera uma camada."],
   ["Camadas","Camadas iguais são reaproveitadas entre imagens e baixadas uma vez só. Por isso o que muda menos vem primeiro."],
   ["Registry","Onde as imagens ficam guardadas e versionadas, como Docker Hub, Amazon ECR e GitHub Container Registry."],
   ["Tag e digest","A tag é um apelido, como 1.4.2. O digest é a impressão digital exata da imagem."]
  ]},
 "Processo isolado":{
  what:"Um container não é uma máquina virtual: é um processo comum do Linux, com visão e recursos restritos.",
  kids:[
   ["Namespaces","Cada container enxerga os seus próprios processos, rede, arquivos e nome de máquina.",{
    what:"O kernel do Linux tem um tipo de namespace para cada coisa que pode ser isolada. Um container usa vários ao mesmo tempo.",
    kids:[
     ["PID","O container vê só os próprios processos, e o primeiro deles tem o número 1."],
     ["Network","Interfaces, endereços IP e portas próprias."],
     ["Mount","Um sistema de arquivos próprio, montado a partir da imagem."],
     ["UTS","Um nome de máquina próprio."],
     ["User","O root de dentro do container pode ser um usuário comum do lado de fora."]
    ]}],
   ["cgroups","Limitam quanto de CPU e memória o processo pode usar. Passou do limite de memória, o kernel encerra o processo."],
   ["Kernel compartilhado","Todos os containers da máquina usam o mesmo kernel. Por isso sobem em milissegundos, e por isso isolam menos que uma VM."]
  ]},
 "Configuração":{
  what:"A mesma imagem roda em teste e em produção. O que muda é a configuração injetada ao subir.",
  kids:[
   ["Variáveis de ambiente","Endereço do banco, nível de log, flags de funcionalidade."],
   ["Segredos","Senhas e chaves vêm de um cofre, como Vault ou AWS Secrets Manager, nunca de dentro da imagem."],
   ["Twelve-factor","O conjunto de práticas que popularizou separar a configuração do código."]
  ]}
},

k8s:{
 "Control plane":{
  what:"O cérebro do cluster: guarda o estado desejado e trabalha sem parar para que a realidade fique igual a ele.",
  kids:[
   ["API server","A única porta de entrada: kubectl, pipelines e os próprios componentes falam com ele."],
   ["etcd","O banco chave e valor onde fica todo o estado do cluster."],
   ["Scheduler","Escolhe em qual nó cada pod novo vai rodar, conforme CPU, memória e regras."],
   ["Controllers","Laços que comparam o desejado com o real e corrigem a diferença: faltou um pod, criam outro."]
  ]},
 "Deployments":{
  what:"Descrevem o estado desejado de um serviço: qual imagem, quantas cópias e como atualizar.",
  ex:["Um Deployment","apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: pedidos\nspec:\n  replicas: 3\n  selector:\n    matchLabels: {app: pedidos}\n  template:\n    metadata:\n      labels: {app: pedidos}\n    spec:\n      containers:\n      - name: pedidos\n        image: registry.loja.com/pedidos:1.4.2"],
  kids:[
   ["Réplicas","Quantas cópias do pod devem existir. Se uma morre, o controller cria outra."],
   ["Rolling update","Troca a versão aos poucos: sobe pods novos e só derruba os antigos quando os novos estão prontos."],
   ["Rollback","Voltar à versão anterior é um comando, porque o histórico fica guardado."]
  ]},
 "Services e Ingress":{
  what:"Pods nascem e morrem com endereços novos. Services e Ingress dão um endereço estável para encontrá-los.",
  kids:[
   ["Service","Um nome e um IP fixos dentro do cluster, que distribuem o tráfego entre os pods saudáveis."],
   ["DNS interno","Um serviço chama o outro pelo nome, como http://pagamentos."],
   ["Ingress e Gateway API","Regras para o tráfego de fora chegar ao Service certo, por domínio e caminho."]
  ]},
 "Autoscaling":{
  what:"O cluster cresce e encolhe com a carga, em dois níveis.",
  kids:[
   ["HPA","Aumenta ou diminui o número de pods conforme CPU, memória ou métricas próprias."],
   ["Autoscaler de nós","Quando os pods não cabem mais, pede VMs novas à nuvem; quando sobram, devolve. Karpenter e Cluster Autoscaler fazem isso."],
   ["Requests e limits","Quanto cada container reserva e quanto pode usar. Sem isso, o scheduler decide no escuro."]
  ]}
},

servidor:{
 "CPU":{
  what:"O processador executa instruções: bilhões por segundo, em cada núcleo.",
  kids:[
   ["Núcleos","Processadores de servidor vão de dezenas a mais de cem núcleos. Na nuvem, uma vCPU costuma ser uma thread de hardware de um núcleo."],
   ["Cache L1, L2 e L3","Memórias pequenas e muito rápidas dentro do processador. Ler da L1 leva cerca de 1 nanossegundo; da RAM, perto de 100."],
   ["x86 e ARM","Intel e AMD usam x86. Processadores ARM, como o AWS Graviton, entregam mais desempenho por watt."]
  ]},
 "Memória RAM":{
  what:"Onde ficam os dados que os programas usam agora. Rápida, mas volátil: faltou energia, perdeu tudo.",
  kids:[
   ["Capacidade","Servidores de nuvem vão de poucos gigabytes a vários terabytes."],
   ["ECC","Memória que detecta e corrige erros de bit. É o padrão em servidores."],
   ["Latência","Cerca de 100 nanossegundos por acesso: mil vezes mais rápido que um SSD."]
  ]},
 "SSD e NVMe":{
  what:"Armazenamento persistente em chips de memória flash, sem partes móveis.",
  kids:[
   ["NVMe","Liga o SSD direto ao barramento PCIe, sem passar pela interface antiga dos discos."],
   ["IOPS","Operações por segundo: um SSD NVMe faz centenas de milhares; um disco giratório, poucas centenas."],
   ["Desgaste","Cada célula aguenta um número limitado de gravações. O controlador espalha as escritas para durar mais."]
  ]},
 "Placa de rede":{
  what:"Liga o servidor ao switch do rack, a 25, 100 ou mais gigabits por segundo.",
  kids:[
   ["Switch do rack","O primeiro salto: liga os servidores do rack entre si e à rede do data center."],
   ["Offload","Placas modernas fazem parte do trabalho de rede, e até de cifragem, sem gastar CPU."],
   ["Placas da nuvem","Na AWS, o sistema Nitro cuida da rede e dos discos virtuais em hardware dedicado."]
  ]}
}
};
})();

/* Demais peças, camada por camada. Peças que já existiam acima (pedidos, app) ganham itens por Object.assign. */
(function(){
const Z=STRATA.zoom;
const retentativa={
 what:"Falhas passageiras são comuns, e tentar de novo resolve muitas delas.",
 kids:[
  ["Backoff exponencial","Espera 1, 2, 4, 8 segundos: cada tentativa dá mais tempo para o problema passar."],
  ["Jitter","Um pouco de aleatoriedade na espera, para mil workers não tentarem todos no mesmo instante."],
  ["Limite","Depois de algumas tentativas, desiste e manda a tarefa para uma fila de mensagens mortas, para alguém investigar."]
 ]};

Object.assign(Z,{

/* EXPERIÊNCIA */
usuario:{
 "Intenção":{
  what:"O que a pessoa quer resolver raramente é o botão que ela aperta. Entender a intenção é o trabalho de produto e UX.",
  kids:[
   ["Tarefa","Saber se o pedido chegou é a tarefa; tocar em “Meus pedidos” é só o caminho."],
   ["Pesquisa com usuários","Entrevistas e testes de usabilidade mostram o que as pessoas tentam fazer, não só o que dizem."],
   ["Métricas de produto","Conversão, abandono e tempo até concluir a tarefa mostram onde a intenção se perde."]
  ]},
 "Interface percebida":{
  what:"Para quem usa, o sistema é a tela. As outras oito camadas só aparecem quando algo dá errado.",
  kids:[
   ["Modelo mental","A ideia que a pessoa faz de como o sistema funciona. A interface precisa combinar com ela."],
   ["Feedback","Todo toque precisa de uma resposta visível: um botão que muda, um carregando, uma mensagem."],
   ["Acessibilidade","Leitor de tela, contraste e navegação por teclado. No Brasil, a Lei Brasileira de Inclusão exige sites acessíveis."]
  ]},
 "Paciência":{
  what:"A percepção do tempo define a experiência tanto quanto o tempo real.",
  kids:[
   ["0,1 segundo","Parece instantâneo: a pessoa sente que ela mesma causou a resposta."],
   ["1 segundo","O fluxo de pensamento continua, mas o atraso já é percebido."],
   ["10 segundos","O limite da atenção. Acima disso, a pessoa muda de tarefa ou desiste."]
  ]}
},
dispositivo:{
 "Sistema operacional":{
  what:"O software que divide o aparelho entre os programas e fala com o hardware por eles.",
  kids:[
   ["Agendamento","Decide qual programa usa a CPU a cada instante, centenas de vezes por segundo."],
   ["Memória virtual","Cada programa enxerga a própria memória, isolada da dos outros."],
   ["Pilha de rede","Implementa IP, TCP e UDP: o navegador só pede uma conexão e o sistema cuida do resto."]
  ]},
 "CPU e memória":{
  what:"Num celular, processador, gráficos e memória ficam juntos num único chip, o SoC.",
  kids:[
   ["SoC","System on a Chip: CPU, GPU, aceleradores e, em muitos aparelhos, o modem no mesmo chip."],
   ["Núcleos grandes e pequenos","Núcleos rápidos para os picos de trabalho e núcleos econômicos para poupar bateria."],
   ["Limite térmico","Esquentou demais, o chip reduz a velocidade. Um app pesado fica mais lento depois de alguns minutos."]
  ]},
 "Rádios e rede":{
  what:"Os circuitos que transformam bits em sinais, e os sinais de volta em bits.",
  kids:[
   ["Wi-Fi","Fala com o roteador da casa ou do escritório."],
   ["Modem celular","Fala com as antenas da operadora pelo 4G ou 5G, usando o chip SIM ou o eSIM para se identificar."],
   ["Ethernet","No computador, o cabo de rede: mais estável e sem interferência."]
  ]}
},

/* REDE */
roteador:{
 "Wi-Fi":{
  what:"A rede sem fio local, padronizada pelo IEEE como 802.11.",
  kids:[
   ["Gerações","Wi-Fi 5 (802.11ac), Wi-Fi 6 e 6E (802.11ax) e Wi-Fi 7 (802.11be): cada uma mais rápida e melhor com muitos aparelhos."],
   ["Canais","As faixas são divididas em canais. Vizinhos no mesmo canal disputam o ar e ficam todos mais lentos."],
   ["Segurança","WPA3 é o padrão atual de cifragem e o WPA2 ainda é comum. WEP e o WPA original são quebráveis."]
  ]},
 "DHCP":{
  what:"O protocolo que dá a cada aparelho um endereço ao entrar na rede, sem configuração manual.",
  kids:[
   ["Concessão","O endereço é emprestado por um tempo e renovado enquanto o aparelho estiver na rede."],
   ["IP privado","Endereços como 192.168.0.10, que só valem dentro da rede local."],
   ["O que vem junto","Além do IP, o roteador informa a máscara, o gateway padrão e os servidores DNS."]
  ]},
 "NAT":{
  what:"Traduz os endereços privados da rede local para o único IP público que o provedor entregou.",
  kids:[
   ["Tabela de tradução","O roteador anota qual aparelho abriu cada conexão, para devolver a resposta ao aparelho certo."],
   ["Falta de IPv4","Existem cerca de 4,3 bilhões de endereços IPv4, poucos para o mundo. O NAT foi a forma de esticá-los."],
   ["CGNAT e IPv6","Muitos provedores fazem um NAT a mais e dividem um IP entre clientes. O IPv6, com endereços de sobra, dispensa o NAT."]
  ]}
},
provedor:{
 "Última milha":{
  what:"O trecho entre a rede do provedor e a sua casa. É onde estão as maiores diferenças de velocidade.",
  refs:[["Anatel: painel de acessos","https://informacoes.anatel.gov.br/paineis/acessos"],["Tecnoblog: fibra passa de 80%","https://tecnoblog.net/noticias/fibra-optica-ultrapassa-marca-de-80-pela-primeira-vez-no-brasil/"]],
  kids:[
   ["FTTH","Fibra até a casa: cerca de 80% dos acessos de banda larga fixa no Brasil, segundo a Anatel."],
   ["GPON","Uma fibra do provedor é dividida por divisores ópticos passivos entre dezenas de casas."],
   ["Cabo, rádio e satélite","Onde a fibra não chega, o acesso vem por cabo coaxial, rádio ou satélite."]
  ]},
 "BGP":{
  what:"O protocolo com que as redes da internet, chamadas sistemas autônomos, anunciam umas às outras quais endereços alcançam.",
  kids:[
   ["Sistema autônomo (AS)","Uma rede com política de roteamento própria e um número único, como cada operadora."],
   ["Anúncio de rotas","Cada AS diz aos vizinhos: por mim, você chega a estes endereços."],
   ["Incidentes","Um anúncio errado pode desviar ou sumir com o tráfego de regiões inteiras. Já tirou grandes serviços do ar."]
  ]},
 "Pontos de troca de tráfego":{
  what:"Lugares onde várias redes se conectam diretamente para trocar tráfego, sem intermediários.",
  refs:[["IX.br","https://ix.br/"]],
  kids:[
   ["IX.br","O programa de pontos de troca do NIC.br, em 39 áreas metropolitanas. O de São Paulo, com picos acima de 35 Tbps, está entre os maiores do mundo."],
   ["Peering","Duas redes trocam tráfego entre si, em geral sem cobrança."],
   ["Trânsito","Uma rede paga a outra para chegar ao resto da internet."]
  ]}
},
cdn:{
 "Pontos de presença":{
  what:"Os data centers da CDN espalhados pelo mundo, perto das pessoas.",
  kids:[
   ["Anycast","O mesmo endereço IP é anunciado em todos os pontos, e a rede leva cada usuário ao mais próximo."],
   ["Latência menor","Responder de São Paulo em vez de outro continente poupa dezenas ou centenas de milissegundos."],
   ["Escudo da origem","Só a CDN fala com o seu servidor, o que alivia e protege a origem."]
  ]},
 "Cache de borda":{
  what:"Cada ponto guarda cópias dos arquivos e responde sem consultar a origem.",
  kids:[
   ["Hit e miss","Achou a cópia, responde na hora. Não achou, busca na origem e guarda para os próximos."],
   ["Cache-Control","O cabeçalho da origem diz o que pode ser guardado e por quanto tempo."],
   ["Conteúdo dinâmico","Respostas personalizadas, como a lista dos seus pedidos, em geral não ficam no cache."]
  ]},
 "Invalidação":{
  what:"Quando uma versão nova é publicada, as cópias antigas precisam sair de todos os pontos.",
  kids:[
   ["Purge","Pedir à CDN que apague um arquivo ou um caminho em todos os pontos."],
   ["Nomes versionados","app.3f9a1c.js: cada versão tem um nome novo, então nada precisa ser apagado."],
   ["Stale-while-revalidate","Entrega a cópia antiga por um instante enquanto busca a nova em segundo plano."]
  ]}
},

/* BORDA */
waf:{
 "Regras como o OWASP Core Rule Set":{
  what:"Conjuntos de regras que reconhecem padrões de ataque nas requisições HTTP.",
  kids:[
   ["Injeção de SQL","Textos como ' OR 1=1 -- tentando mudar a consulta do banco."],
   ["XSS","Scripts escondidos em campos e parâmetros, para rodar no navegador de outra pessoa."],
   ["Falsos positivos","Regras rígidas também barram usuários legítimos. Por isso começam em modo de observação."]
  ]},
 "Proteção contra DDoS":{
  what:"Ataques de negação de serviço tentam afogar o sistema em tráfego. A defesa acontece em várias camadas.",
  kids:[
   ["Volumétrico","Enxurradas de pacotes nas camadas 3 e 4, absorvidas pela capacidade de rede de serviços como AWS Shield e Cloudflare."],
   ["Camada 7","Requisições HTTP que parecem legítimas. O WAF entra aqui, com limites por origem e desafios."],
   ["Rate limiting","Limita quantas requisições cada origem pode fazer por segundo."]
  ]},
 "Bloqueio por origem":{
  what:"Regras que olham quem está pedindo, não só o que está pedindo.",
  kids:[
   ["Listas de IP","Bloqueia endereços conhecidos por ataques, ou libera só os de parceiros."],
   ["Geolocalização","Restringe países de onde o sistema não deveria receber acesso."],
   ["Detecção de robôs","Comportamento, impressão digital do navegador e desafios separam pessoas de scripts."]
  ]}
},
lb:{
 "Health checks":{
  what:"O balanceador testa cada instância o tempo todo e só manda tráfego para as saudáveis.",
  kids:[
   ["Rota de saúde","Um endereço como /health, que responde se a instância consegue trabalhar."],
   ["Limiar","Algumas falhas seguidas tiram a instância do rodízio; alguns sucessos a trazem de volta."],
   ["Drenagem","Antes de remover uma instância, espera as conexões em andamento terminarem."]
  ]},
 "Algoritmo de distribuição":{
  what:"A regra que decide qual instância recebe cada requisição.",
  kids:[
   ["Rodízio (round robin)","Uma para cada, em ordem. Simples e bom quando as instâncias são iguais."],
   ["Menos conexões","Manda para quem está com menos trabalho em andamento."],
   ["Afinidade de sessão","Mantém o mesmo usuário na mesma instância. Útil, mas atrapalha a distribuição."]
  ]},
 "Terminação TLS":{
  what:"O balanceador decifra o HTTPS e repassa a requisição para dentro.",
  kids:[
   ["Um lugar para os certificados","Instalar e renovar certificados num ponto só, em vez de em cada serviço."],
   ["Recifrar ou não","Do balanceador para dentro, o tráfego pode seguir em claro numa rede privada ou ser cifrado de novo."],
   ["Roteamento pelo conteúdo","Decifrado, o tráfego pode ser roteado pelo caminho da URL e inspecionado."]
  ]},
 "Camada 4 ou 7":{
  what:"Os números vêm do modelo OSI: a camada 4 é o transporte (TCP e UDP), a 7 é a aplicação (HTTP).",
  kids:[
   ["Camada 4","Olha só IP e porta. Muito rápido, mas não entende HTTP. Exemplo: AWS NLB."],
   ["Camada 7","Lê a requisição e pode rotear por caminho, cabeçalho ou cookie. Exemplo: AWS ALB."],
   ["A troca","Mais inteligência na camada 7; mais desempenho e simplicidade na camada 4."]
  ]}
},
gateway:{
 "Roteamento":{
  what:"O gateway olha cada requisição e decide para qual serviço ela vai.",
  kids:[
   ["Por caminho","/pedidos vai para o serviço de pedidos; /pagamentos, para o de pagamentos."],
   ["Por versão ou cabeçalho","/v2/pedidos pode ir para uma versão nova do serviço."],
   ["Descoberta de serviços","O gateway descobre o endereço atual de cada serviço, que muda com o tempo."]
  ]},
 "Autenticação":{
  what:"Antes de qualquer serviço ser tocado, o gateway confere quem está chamando.",
  kids:[
   ["Validação do JWT","Confere assinatura, validade e emissor do token com as chaves públicas do serviço de identidade."],
   ["Chaves de API","Em integrações entre sistemas, uma chave identifica cada cliente."],
   ["Repasse da identidade","Depois de validar, informa aos serviços quem é o usuário, em cabeçalhos ou no próprio token."]
  ]},
 "Rate limiting":{
  what:"Limita quantas chamadas cada cliente pode fazer num intervalo.",
  kids:[
   ["Token bucket","Cada cliente tem um balde de fichas que se reabastece com o tempo; cada chamada gasta uma."],
   ["429 Too Many Requests","A resposta padrão para quem passou do limite, com o tempo de espera no cabeçalho Retry-After."],
   ["Cotas por plano","Clientes diferentes podem ter limites diferentes, como em APIs pagas."]
  ]},
 "Versionamento e transformação":{
  what:"Permite mudar uma API sem quebrar quem ainda usa a versão antiga.",
  kids:[
   ["Versão na URL","/v1 e /v2 convivem enquanto os clientes migram."],
   ["Transformação","O gateway pode adaptar o formato da requisição ou da resposta."],
   ["Depreciação","Avisar com antecedência, medir quem ainda usa a versão velha e só então desligar."]
  ]}
},
idp:{
 "Login e MFA":{
  what:"Provar quem você é com mais de uma evidência: algo que você sabe, algo que tem ou algo que é.",
  kids:[
   ["Senha","Algo que você sabe. Sozinha, é a evidência mais fraca."],
   ["Segundo fator","Código de aplicativo (TOTP), notificação no celular ou chave física."],
   ["Passkeys","Login sem senha, com criptografia de chave pública desbloqueada pela biometria do aparelho. Resiste a phishing."]
  ]},
 "Tokens JWT":{
  what:"Um JSON assinado, em três partes separadas por pontos, que o usuário carrega em cada chamada.",
  ex:["Um JWT decodificado","{\"alg\": \"RS256\", \"typ\": \"JWT\"}\n.\n{\"sub\": \"42\", \"exp\": 1767225600, \"scope\": \"pedidos:ler\"}\n.\n(assinatura)"],
  kids:[
   ["Cabeçalho","Diz o algoritmo da assinatura."],
   ["Payload","As informações, chamadas claims: quem é o usuário, até quando vale, o que pode fazer. Qualquer um consegue ler, então nada de segredos ali."],
   ["Assinatura","Garante que ninguém alterou o token. Quem tem a chave pública confere sem consultar o emissor."]
  ]},
 "OAuth 2.0 e OpenID Connect":{
  what:"O OAuth 2.0 diz o que um aplicativo pode acessar em nome de alguém. O OpenID Connect, construído sobre ele, diz quem é esse alguém.",
  kids:[
   ["Authorization code com PKCE","O fluxo recomendado para apps web e mobile: o login acontece no provedor de identidade, e o app recebe um código que troca por tokens."],
   ["Access token","Vai em cada chamada às APIs para provar o que o app pode fazer."],
   ["ID token","Um JWT do OpenID Connect com quem é o usuário: identificador, nome, e-mail."],
   ["Refresh token","Renova o access token sem pedir login de novo."]
  ]},
 "Perfis e permissões":{
  what:"Depois de saber quem é, decidir o que essa pessoa pode fazer.",
  kids:[
   ["RBAC","Permissões por papel: atendente, gerente, administrador."],
   ["Escopos","O que um token libera, como pedidos:ler."],
   ["Menor privilégio","Cada pessoa e cada sistema com o mínimo de acesso de que precisa."]
  ]}
},

/* APLICAÇÃO */
frontend:{
 "Componentes e rotas":{
  what:"A interface é uma árvore de componentes, e a URL decide qual tela aparece.",
  kids:[
   ["Componente","Uma peça de interface com aparência e comportamento, como um botão ou o cartão de um pedido."],
   ["Rotas","/pedidos mostra a lista; /pedidos/981 mostra um pedido. Numa SPA, trocar de rota não recarrega a página."],
   ["Design system","Os componentes e as regras visuais compartilhados por todas as telas."]
  ]},
 "Estado da aplicação":{
  what:"Tudo o que a tela sabe num instante. Quando o estado muda, a tela se redesenha.",
  kids:[
   ["Estado local","O que só um componente precisa, como um campo sendo digitado."],
   ["Estado global","O que várias telas usam, como o usuário logado e o carrinho."],
   ["Dados do servidor","Bibliotecas como TanStack Query guardam as respostas da API e decidem quando buscar de novo."]
  ]},
 "Chamadas de API":{
  what:"O front-end pede dados ao back-end e reage à resposta, sem travar a tela.",
  kids:[
   ["Assíncrono","A chamada sai e a tela continua respondendo enquanto a resposta não chega."],
   ["Carregando e erro","Toda chamada pode demorar ou falhar, e a tela precisa mostrar as duas coisas."],
   ["CORS","Regra do navegador: uma página só lê respostas de outro domínio se esse domínio permitir."]
  ]},
 "Build":{
  what:"O código que o time escreve não é o que vai para o navegador. O build transforma um no outro.",
  kids:[
   ["Transpilação","TypeScript e JSX viram o JavaScript que o navegador entende."],
   ["Empacotamento","Junta e divide os arquivos em pacotes. Vite e webpack são as ferramentas mais comuns."],
   ["Minificação e hash","Remove espaços e encurta nomes; o nome do arquivo ganha um hash da versão, para o cache."]
  ]},
 /* no monólito */
 "Views e templates":{
  what:"O servidor monta o HTML completo de cada tela e o envia pronto ao navegador.",
  ex:["Um template Blade (Laravel)","@foreach ($pedidos as $pedido)\n  <li>Pedido {{ $pedido->id }}: {{ $pedido->status }}</li>\n@endforeach"],
  kids:[
   ["Renderização no servidor","A tela chega pronta: aparece rápido e funciona até sem JavaScript."],
   ["Layouts e parciais","Cabeçalho e menu escritos uma vez e reaproveitados em todas as telas."],
   ["Escape automático","Os templates escapam o que vem do usuário, o que protege contra XSS."]
  ]},
 "JavaScript da página":{
  what:"Mesmo com o HTML pronto, a página precisa de interatividade, em vários graus.",
  kids:[
   ["Pequenos scripts","Um menu, uma validação de formulário."],
   ["HTML pela rede","Hotwire e HTMX trocam pedaços de HTML vindos do servidor, sem recarregar a página e sem escrever uma SPA."],
   ["SPA dentro do monólito","React ou Vue em algumas telas, consumindo o próprio monólito. O Inertia.js faz essa ponte no Laravel."]
  ]},
 "Arquivos estáticos":{
  what:"CSS, JavaScript e imagens não mudam a cada requisição e podem ser servidos perto do usuário.",
  kids:[
   ["Pipeline de assets","O Vite e ferramentas parecidas empacotam e versionam os arquivos no build."],
   ["CDN","Os arquivos versionados são servidos pela CDN, com cache longo."],
   ["Origem","Se a CDN não tem o arquivo, busca no próprio monólito ou num bucket."]
  ]}
},
bff:{
 "Agregação":{
  what:"A tela pede uma vez; o BFF faz várias chamadas internas e junta as respostas.",
  kids:[
   ["Em paralelo","Pedidos, pagamentos e entregas ao mesmo tempo, em vez de um depois do outro."],
   ["Menos idas e voltas","No celular, cada requisição pela rede móvel custa caro. Uma chamada é melhor que cinco."],
   ["Falha parcial","Se um serviço não responde, o BFF pode devolver o resto e avisar o que faltou."]
  ]},
 "Adaptação por canal":{
  what:"Cada canal recebe o formato de que precisa, sem obrigar os serviços a saberem de telas.",
  kids:[
   ["Um BFF por canal","Um para o site, outro para o app: cada time de front-end cuida do seu."],
   ["Só os campos usados","O app recebe só o que mostra, poupando dados móveis."],
   ["GraphQL","Uma alternativa em que o próprio cliente diz quais campos quer."]
  ]},
 "Cache de respostas":{
  what:"Guarda respostas que não mudam a cada segundo, para não refazer o mesmo trabalho.",
  kids:[
   ["Geral ou por usuário","Um catálogo serve a todos; a lista de pedidos é de cada um."],
   ["Validade curta","Segundos ou minutos de cache já tiram boa parte da carga dos serviços."],
   ["Cuidado com dados pessoais","Um erro na chave do cache pode entregar a resposta de um usuário a outro."]
  ]}
},
pedidos:Object.assign(Z.pedidos,{
 /* no monólito */
 "Controller e rotas":{
  what:"A porta de entrada do módulo: recebe a requisição já roteada pelo framework e devolve a resposta.",
  kids:[
   ["Validação","Confere os dados recebidos antes de tocar nas regras."],
   ["Controller fino","Só traduz a requisição e chama as regras; a lógica fica no domínio."],
   ["HTML ou JSON","O mesmo módulo pode responder uma tela ou uma API."]
  ]},
 "Modelos e ORM":{
  what:"Cada tabela vira uma classe, e o ORM cuida do SQL.",
  ex:["Consultando com o Eloquent (Laravel)","$pedidos = Pedido::where('cliente_id', 42)\n    ->with('itens')\n    ->latest()\n    ->get();"],
  kids:[
   ["Relacionamentos","Um pedido tem itens; um item pertence a um produto."],
   ["Carregamento antecipado","with('itens') busca tudo em duas consultas e evita o problema N+1."],
   ["Migrações","As mudanças no esquema do banco ficam versionadas junto com o código."]
  ]},
 "Fronteira do módulo":{
  what:"O que separa um monólito modular de um emaranhado: regras claras sobre quem pode usar o quê.",
  kids:[
   ["Interface pública","Outros módulos chamam algo como PedidoService::criar, nunca as classes internas."],
   ["Dados próprios","O ideal é que só o módulo de pedidos leia e grave as tabelas de pedidos."],
   ["Eventos internos","Um módulo pode avisar os outros por eventos dentro do processo, sem chamá-los diretamente."]
  ]}
}),
app:Object.assign(Z.app,{
 "Roteador do framework":{
  what:"Uma tabela que liga cada URL e método HTTP ao código que atende.",
  ex:["Rotas no Laravel","Route::get('/pedidos', [PedidoController::class, 'index']);\nRoute::post('/pedidos/{id}/pagar', [PagamentoController::class, 'store']);"],
  kids:[
   ["Middleware","Código que roda antes de cada rota: sessão, autenticação, proteção contra CSRF."],
   ["Controller","A classe que recebe a requisição e chama os módulos."],
   ["Web e API","Telas HTML e endpoints JSON podem conviver no mesmo roteador."]
  ]},
 "Módulos":{
  what:"Num monólito modular, o código é dividido por assunto do negócio, não por tipo técnico.",
  kids:[
   ["Por domínio","Pastas de pedidos, pagamentos e login, cada uma com suas regras, modelos e telas."],
   ["Interface pública","Cada módulo expõe poucas funções aos outros e esconde o resto."],
   ["Regras de dependência","Ferramentas como ArchUnit e Deptrac quebram o build se um módulo usar as entranhas de outro."],
   ["Caminho para serviços","Módulos bem separados podem virar microsserviços no futuro, se for preciso."]
  ]},
 "ORM e pool de conexões":{
  what:"Todos os módulos acessam o mesmo banco, pelo mesmo ORM e pelas mesmas conexões.",
  kids:[
   ["ORM","Eloquent, Active Record, Django ORM ou Hibernate traduzem objetos em SQL."],
   ["Pool compartilhado","Um módulo com consultas lentas pode ocupar todas as conexões e travar os outros."],
   ["N+1","Um erro clássico: buscar 100 pedidos e depois fazer 100 consultas para os itens, em vez de uma."]
  ]}
}),
auth:{
 "Senha com hash":{
  what:"O banco nunca guarda a senha, só um resumo calculado de um jeito que não dá para desfazer.",
  kids:[
   ["Lento de propósito","bcrypt e Argon2 são lentos para que testar bilhões de senhas vazadas fique caro."],
   ["Sal","Um valor aleatório por usuário: senhas iguais geram hashes diferentes."],
   ["Senhas fracas","Mesmo com hash, senhas fáceis são descobertas. Por isso o segundo fator importa."]
  ]},
 "Sessão":{
  what:"O servidor lembra quem está logado; o navegador só carrega um identificador.",
  kids:[
   ["Cookie de sessão","Um identificador aleatório, marcado como HttpOnly (o JavaScript não lê), Secure (só HTTPS) e SameSite."],
   ["Onde a sessão mora","No Redis, no banco ou em arquivos. Com várias cópias do monólito, precisa ser um lugar compartilhado."],
   ["Sessão ou token","Sessão é fácil de revogar: basta apagá-la no servidor. Um JWT vale até expirar."]
  ]},
 "Permissões":{
  what:"Decidir, em cada ação, se o usuário logado pode fazer aquilo.",
  kids:[
   ["Papéis","Cliente, atendente, administrador."],
   ["Políticas","Regras por objeto: um cliente só vê os próprios pedidos."],
   ["Sempre no servidor","Esconder o botão não basta: cada requisição precisa ser verificada no back-end."]
  ]}
},
pagamentos:{
 "Integração financeira":{
  what:"Receber dinheiro envolve vários atores além do seu sistema.",
  kids:[
   ["Gateway de pagamento","Recebe os dados do cartão e conversa com a adquirente. Exemplos: Stripe, Adyen, Pagar.me."],
   ["Adquirente e bandeira","A adquirente processa a venda; a bandeira, como Visa ou Mastercard, a leva ao banco emissor, que aprova ou nega."],
   ["Pix","O pagamento instantâneo do Banco Central: liquida em segundos, a qualquer hora, e o sistema recebe a confirmação por webhook."]
  ]},
 "Idempotência":{
  what:"Fazer a mesma operação duas vezes tem o mesmo efeito que fazer uma.",
  ex:["Uma cobrança com chave de idempotência","POST /cobrancas\nIdempotency-Key: 7c1e9a52-pedido-981\n\n{\"pedido\": 981, \"valor\": 129.90}"],
  kids:[
   ["Chave de idempotência","O cliente envia um identificador único. Se a mesma chave chegar de novo, o servidor devolve o resultado da primeira vez."],
   ["Retentativa segura","Com idempotência, repetir depois de um timeout não cobra em dobro."],
   ["Mensagens repetidas","Filas e barramentos entregam pelo menos uma vez, então quem consome também precisa ignorar repetidas."]
  ]},
 "Conciliação":{
  what:"Conferir, todo dia, se o que o sistema registrou bate com o que o dinheiro fez de verdade.",
  kids:[
   ["Arquivos da adquirente","Relatórios com cada venda, taxa e data de pagamento."],
   ["Divergências","Venda aprovada sem pedido, pedido pago sem venda, taxa diferente da combinada."],
   ["Chargeback","Quando o titular contesta a compra e o valor é estornado pelo banco emissor."]
  ]},
 /* no monólito */
 "Transação compartilhada":{
  what:"No monólito, pedido e pagamento moram no mesmo banco e podem ser gravados juntos.",
  ex:["Pedido e pagamento na mesma transação","BEGIN;\nUPDATE pedidos SET status = 'pago' WHERE id = 981;\nINSERT INTO pagamentos (pedido_id, valor) VALUES (981, 129.90);\nCOMMIT;"],
  kids:[
   ["Tudo ou nada","Ou o pedido fica pago e o pagamento registrado, ou nenhum dos dois."],
   ["Em microsserviços","Cada serviço tem o seu banco e essa garantia some. Entram as sagas: passos separados, com ações de compensação se algo falhar."],
   ["O que fica de fora","A chamada à adquirente não entra na transação: o cartão pode ter sido cobrado mesmo que o COMMIT falhe. Idempotência e conciliação continuam necessárias."]
  ]}
},
notificacoes:{
 "Consumidor de eventos":{
  what:"O serviço reage a fatos publicados pelos outros, sem que eles saibam que ele existe.",
  kids:[
   ["Assinatura de tópicos","Escuta PedidoCriado, PagamentoAprovado e outros eventos de interesse."],
   ["Regra de aviso","Decide se o evento merece aviso, para quem e por qual canal."],
   ["Sem duplicar","Guarda o que já enviou para não mandar o mesmo e-mail duas vezes se o evento chegar repetido."]
  ]},
 "Templates":{
  what:"O texto de cada mensagem, com espaços para os dados de cada pessoa.",
  kids:[
   ["Variáveis","Olá, {{nome}}, seu pedido {{numero}} foi pago."],
   ["Por canal","O mesmo aviso tem versões para e-mail, SMS e push, cada uma com seu limite de tamanho."],
   ["Idioma e marca","Traduções e identidade visual mantidas fora do código."]
  ]},
 "Provedores de envio":{
  what:"Quem entrega a mensagem de fato. Entregar bem é um negócio à parte.",
  kids:[
   ["E-mail","Serviços como Amazon SES e SendGrid. Sem SPF, DKIM e DMARC configurados no DNS do domínio, a mensagem cai no spam."],
   ["SMS e WhatsApp","Twilio e outros enviam pela rede das operadoras ou pela API oficial do WhatsApp."],
   ["Push","No celular, o envio passa pelo Firebase Cloud Messaging (Android) ou pelo APNs (iOS)."]
  ]},
 /* no monólito */
 "Enfileiramento":{
  what:"O módulo não envia nada na hora: grava a tarefa e devolve a resposta ao usuário.",
  kids:[
   ["Por que enfileirar","Falar com o provedor de e-mail pode levar segundos ou falhar. O usuário não deve esperar por isso."],
   ["A tarefa","Um registro pequeno: qual aviso, para quem, com quais dados."],
   ["Depois do COMMIT","Enfileirar só depois que a transação do pedido confirma, para não avisar algo que não aconteceu."]
  ]},
 "Preferências":{
  what:"Cada pessoa decide o que quer receber, e a lei exige respeitar essa escolha.",
  kids:[
   ["Canais","E-mail, SMS, push: quem quer o quê."],
   ["Transacional ou marketing","O aviso de pagamento é transacional. Promoção é marketing e pede consentimento."],
   ["LGPD","A Lei Geral de Proteção de Dados exige base legal para usar dados pessoais e garante à pessoa o direito de recusar o marketing."]
  ]}
},

/* INTEGRAÇÃO */
fila:{
 "Enfileirar":{
  what:"Gravar a tarefa leva milissegundos; executá-la pode levar segundos.",
  ex:["Enfileirando no Laravel","EnviarAvisoDePagamento::dispatch($pedido)->afterCommit();"],
  kids:[
   ["A resposta não espera","O usuário vê “pagamento confirmado” enquanto o e-mail ainda vai sair."],
   ["Dados mínimos","A tarefa leva só identificadores; o worker busca o resto no banco na hora de executar."],
   ["Prioridade","Filas separadas para o urgente e para o que pode esperar."]
  ]},
 "Onde a fila mora":{
  what:"A fila precisa de um lugar para guardar as tarefas até alguém pegá-las.",
  kids:[
   ["Redis","Rápido e comum, usado pelo Sidekiq e pelo Laravel Horizon."],
   ["Tabela no banco","Mais simples, sem peça extra, e aguenta bem volumes moderados."],
   ["Broker dedicado","RabbitMQ ou Amazon SQS para volumes altos e roteamento mais rico."]
  ]},
 "Retentativa":retentativa
},
worker:{
 "Agendador":{
  what:"Dispara tarefas em horários definidos, como um despertador do sistema.",
  ex:["Uma expressão cron: todo dia às 3h","0 3 * * *"],
  kids:[
   ["Expressão cron","Cinco campos: minuto, hora, dia do mês, mês e dia da semana."],
   ["Uma execução só","Com várias cópias rodando, é preciso garantir que a tarefa rode uma vez, e não uma vez por cópia."],
   ["Fuso horário","Uma rotina marcada para a meia-noite precisa dizer de qual fuso."]
  ]},
 "Fila de tarefas":{
  what:"O trabalho demorado sai da requisição: o usuário recebe a resposta e o trabalho acontece depois.",
  kids:[
   ["Quem cria não espera","Uma parte do sistema cria a tarefa; um worker livre pega e executa."],
   ["Escala independente","Fila crescendo, mais workers. Fila vazia, menos."],
   ["Mensagens mortas","Tarefas que falham sempre vão para uma fila separada, para alguém investigar."]
  ]},
 "Retentativa":retentativa,
 /* no monólito */
 "Mesmo código":{
  what:"O worker é o próprio monólito, iniciado num modo diferente.",
  kids:[
   ["Mesma imagem","A aplicação web e os workers saem do mesmo build; muda só o comando que inicia."],
   ["Mesmos modelos","O worker usa as mesmas classes e o mesmo banco da aplicação."],
   ["Deploy junto","Mudou o código, os dois precisam ser atualizados, para não haver versões misturadas."]
  ]},
 "Consumo da fila":{
  what:"Cada worker pega uma tarefa, executa e confirma.",
  kids:[
   ["Reserva","A tarefa fica reservada enquanto o worker trabalha, para outro não pegar a mesma."],
   ["Confirmação","Só depois de concluída a tarefa sai da fila. Se o worker morrer no meio, ela volta."],
   ["Concorrência","Cada worker pode processar várias tarefas em paralelo, com threads ou processos."]
  ]}
},
externas:{
 "Contrato e SLA":{
  what:"Depender de um parceiro é aceitar o que ele promete, e se preparar para quando não cumprir.",
  kids:[
   ["SLA","O compromisso de disponibilidade. 99,9% ao mês ainda permite cerca de 43 minutos fora do ar."],
   ["Limites de uso","Quantas chamadas por segundo o parceiro aceita antes de recusar."],
   ["Ambiente de testes","Um sandbox para testar a integração sem efeitos reais."]
  ]},
 "Timeout e retentativa":{
  what:"Esperar para sempre é o jeito mais comum de um parceiro lento derrubar o seu sistema.",
  kids:[
   ["Timeout","Um tempo máximo de espera. Sem ele, as threads ficam presas até acabarem."],
   ["Repetir só o seguro","Repetir uma consulta é seguro; repetir uma cobrança, só com idempotência."],
   ["Orçamento de tempo","Se a tela precisa responder em 2 segundos, cada chamada externa recebe só uma fatia disso."]
  ]},
 "Circuit breaker":{
  what:"Como o disjuntor de casa: quando as falhas passam do limite, o circuito abre e as chamadas param.",
  kids:[
   ["Fechado","Tudo normal: as chamadas passam e as falhas são contadas."],
   ["Aberto","Falhas demais: as chamadas falham na hora, sem esperar, e o parceiro ganha tempo para se recuperar."],
   ["Meio aberto","Depois de um tempo, deixa passar algumas chamadas de teste. Se derem certo, fecha de novo."]
  ]}
},

/* DADOS */
cache:{
 "Chave e valor em RAM":{
  what:"Cada valor é guardado na memória sob uma chave, como pedidos:cliente:42.",
  ex:["No Redis: guardar por 5 minutos e ler","SET pedidos:cliente:42 '[...]' EX 300\nGET pedidos:cliente:42"],
  kids:[
   ["Memória, não disco","Por isso é rápido, e por isso o que está ali pode sumir num reinício."],
   ["Estruturas","O Redis guarda também listas, conjuntos, hashes e contadores."],
   ["Um comando por vez","O Redis executa os comandos um de cada vez, o que torna cada operação atômica."]
  ]},
 "Expiração":{
  what:"Cada item tem prazo de validade, o TTL, e some sozinho quando vence.",
  kids:[
   ["TTL curto","Dados mais frescos, mais idas ao banco."],
   ["TTL longo","Menos carga no banco, mais risco de mostrar algo velho."],
   ["Despejo","Com a memória cheia, o cache descarta itens, em geral os usados há mais tempo (LRU)."]
  ]},
 "Estratégia":{
  what:"Como o cache e o banco conversam.",
  kids:[
   ["Cache-aside","O serviço procura no cache; se não acha, lê do banco e guarda. É a mais comum."],
   ["Write-through","Toda escrita vai ao cache e ao banco ao mesmo tempo."],
   ["Avalanche","Muitos itens vencendo juntos mandam todas as consultas ao banco de uma vez. Variar o TTL evita."]
  ]},
 "Invalidação":{
  what:"Saber quando o que está no cache deixou de ser verdade.",
  kids:[
   ["Apagar na escrita","Mudou o pedido, apaga a chave dele. A próxima leitura busca o dado novo."],
   ["Por evento","Um evento de mudança avisa todos os caches interessados."],
   ["A frase famosa","“Só existem duas coisas difíceis na computação: invalidar cache e dar nome às coisas”, atribuída a Phil Karlton."]
  ]}
},
nosql:{
 "Documentos":{
  what:"Cada registro é um documento JSON, que pode ter campos diferentes dos outros.",
  ex:["Um documento no MongoDB","{\n  \"_id\": \"aviso-77\",\n  \"cliente\": 42,\n  \"canal\": \"email\",\n  \"enviado_em\": \"2026-10-08T14:03:00Z\",\n  \"tentativas\": [{\"status\": \"entregue\"}]\n}"],
  kids:[
   ["Esquema flexível","Um campo novo não exige alterar a tabela inteira."],
   ["Dados aninhados","O que seria um JOIN vira um documento só, lido de uma vez."],
   ["O preço","Validar a estrutura dos dados passa a ser trabalho do código."]
  ]},
 "Escala horizontal":{
  what:"Em vez de uma máquina maior, mais máquinas, cada uma com uma parte dos dados.",
  kids:[
   ["Particionamento","Uma chave, como o id do cliente, decide em qual máquina cada registro fica."],
   ["Chave ruim","Se muitos acessos caem na mesma partição, uma máquina sofre enquanto as outras descansam."],
   ["Replicação","Cada partição tem cópias em outras máquinas."]
  ]},
 "Consistência eventual":{
  what:"As cópias recebem a escrita em momentos diferentes. Por um instante, podem discordar.",
  kids:[
   ["Teorema CAP","Se a rede entre as máquinas falha, um sistema distribuído precisa escolher entre sempre responder e sempre responder o dado mais recente."],
   ["Leitura forte","Bancos como DynamoDB e Cosmos DB permitem pedir a versão mais recente, com mais custo ou latência."],
   ["Onde serve","Um histórico de avisos tolera segundos de atraso; um saldo bancário, não."]
  ]}
},
busca:{
 "Índice invertido":{
  what:"Como o índice remissivo de um livro: para cada palavra, onde ela aparece.",
  kids:[
   ["Análise do texto","O texto é quebrado em termos, sem acentos e em minúsculas, e as palavras podem ser reduzidas ao radical."],
   ["Lista de ocorrências","Para cada termo, os documentos e as posições em que aparece."],
   ["Por que é rápido","Achar “tênis azul” é cruzar duas listas, e não ler todos os textos."]
  ]},
 "Relevância":{
  what:"Achar é fácil; ordenar pelo que mais interessa é a parte difícil.",
  kids:[
   ["BM25","O cálculo padrão: valoriza termos raros e termos que aparecem muito no documento."],
   ["Reforços","O título vale mais que a descrição; produto em estoque pode subir na lista."],
   ["Busca semântica","Vetores de significado acham “bota” quando se procura “calçado”, mesmo sem a palavra."]
  ]},
 "Indexação por eventos":{
  what:"O motor de busca não é a fonte da verdade: ele recebe cópias dos dados.",
  kids:[
   ["Consumir eventos","Cada PedidoCriado ou ProdutoAlterado atualiza o documento no índice."],
   ["Atraso","Entre a gravação no banco e o resultado aparecer na busca, passam alguns segundos."],
   ["Reindexação","Se o índice se perder, ele é reconstruído lendo tudo de novo da fonte."]
  ]}
},
lake:{
 "Ingestão":{
  what:"Trazer os dados dos sistemas da operação para o ambiente de análise.",
  kids:[
   ["ETL","Extrai, transforma e só então carrega. O jeito clássico."],
   ["ELT","Carrega o dado bruto e transforma dentro do próprio warehouse, que hoje tem fôlego para isso."],
   ["CDC","Lê o log de mudanças do banco e copia cada alteração quase em tempo real. O Debezium é a ferramenta mais conhecida."]
  ]},
 "Armazenamento em arquivos":{
  what:"O data lake guarda arquivos em armazenamento de objetos, barato e praticamente sem limite.",
  kids:[
   ["Parquet","Formato colunar e comprimido: a consulta lê só as colunas de que precisa."],
   ["Formatos de tabela","Delta Lake e Apache Iceberg dão transações e histórico aos arquivos do lago."],
   ["Camadas","Bruto, limpo e pronto para análise: os dados são refinados em etapas."]
  ]},
 "Data warehouse":{
  what:"Tabelas organizadas para responder perguntas de negócio depressa.",
  kids:[
   ["Modelo dimensional","Fatos, como vendas, cercados de dimensões, como tempo, produto e cliente."],
   ["Processamento paralelo","Snowflake, BigQuery e Redshift varrem bilhões de linhas dividindo o trabalho entre muitas máquinas."],
   ["Lakehouse","A junção dos dois: tabelas de warehouse sobre os arquivos do lago."]
  ]},
 "BI":{
  what:"Onde os dados viram decisão.",
  kids:[
   ["Painéis","Indicadores acompanhados todo dia, como vendas e conversão."],
   ["Métricas definidas uma vez","Uma camada semântica garante que “receita” signifique a mesma coisa em todos os relatórios."],
   ["Ferramentas","Power BI, Looker, Tableau e Metabase."]
  ]}
},

/* PLATAFORMA */
cicd:{
 "Git e pull request":{
  what:"Todo código entra pelo controle de versão e passa por revisão antes de chegar ao ramo principal.",
  kids:[
   ["Branch","Cada mudança nasce num ramo separado."],
   ["Revisão","Outra pessoa lê, comenta e aprova. Pega erros e espalha conhecimento."],
   ["Ramo protegido","Ninguém publica direto: só com revisão aprovada e testes passando."]
  ]},
 "Build e testes":{
  what:"A cada mudança, uma máquina compila e testa tudo do zero, sempre do mesmo jeito.",
  kids:[
   ["Pirâmide de testes","Muitos testes de unidade, menos de integração, poucos de ponta a ponta."],
   ["Integração contínua","Juntar pequenas mudanças várias vezes ao dia, com o build sempre passando."],
   ["Testes de contrato","Garantem que um serviço não quebrou o que outro espera dele."]
  ]},
 "Análise de código":{
  what:"Ferramentas leem o código sem executá-lo, procurando defeitos e vulnerabilidades.",
  kids:[
   ["SAST","Análise estática de segurança: injeção, segredos no código, criptografia fraca."],
   ["Dependências (SCA)","Confere se alguma biblioteca usada tem vulnerabilidade conhecida."],
   ["Qualidade","Complexidade, duplicação e cobertura de testes, com ferramentas como o SonarQube."]
  ]},
 "Imagem e registry":{
  what:"O resultado do build vira uma imagem de container, publicada uma vez e promovida entre os ambientes.",
  kids:[
   ["Construir uma vez","A mesma imagem testada em homologação vai para produção, sem recompilar."],
   ["Varredura da imagem","Procura vulnerabilidades no sistema base e nas bibliotecas da imagem."],
   ["Assinatura","Ferramentas como o Sigstore assinam a imagem para provar de onde ela veio."]
  ]},
 "Deploy":{
  what:"Colocar a versão nova no ar com o menor risco possível.",
  kids:[
   ["Blue-green","Dois ambientes iguais: a versão nova sobe no outro e o tráfego troca de uma vez, com volta imediata."],
   ["Canary","A versão nova recebe uma fatia pequena do tráfego; se as métricas forem boas, a fatia cresce."],
   ["Feature flags","O código vai para produção desligado e é ativado depois, para quem e quando se quiser."]
  ]}
},
iac:{
 "Declaração":{
  what:"Você descreve o estado final; a ferramenta descobre os passos para chegar lá.",
  ex:["Um bucket em Terraform","resource \"aws_s3_bucket\" \"backups\" {\n  bucket = \"loja-backups\"\n}"],
  kids:[
   ["Recursos","Cada peça da infraestrutura é um bloco no arquivo: rede, máquina, banco."],
   ["Módulos","Blocos reutilizáveis, como a rede padrão da empresa."],
   ["No Git","Toda mudança na infraestrutura tem autor, revisão e histórico."]
  ]},
 "Plano e aplicação":{
  what:"Antes de mudar, a ferramenta mostra o que vai criar, alterar ou destruir.",
  kids:[
   ["plan","Compara o arquivo com o que existe e lista as diferenças."],
   ["apply","Executa as mudanças aprovadas."],
   ["Estado","Um arquivo onde a ferramenta guarda o que já criou, para saber o que mudar da próxima vez."]
  ]},
 "GitOps":{
  what:"O repositório descreve o ambiente, e um agente garante que o ambiente fique igual a ele.",
  kids:[
   ["Puxar em vez de empurrar","Um agente dentro do cluster, como Argo CD ou Flux, busca as mudanças no Git e as aplica."],
   ["Desvio","Se alguém muda algo à mão, o agente percebe e desfaz."],
   ["Reverter é um commit","Voltar à versão anterior é reverter o commit."]
  ]}
},
pod:{
 "Containers":{
  what:"O pod é a menor coisa que o Kubernetes agenda: um ou mais containers que vivem juntos.",
  kids:[
   ["Mesmo endereço","Os containers do pod dividem o IP e se falam por localhost."],
   ["Sidecar","Um container auxiliar ao lado do principal, como o proxy do mesh ou um coletor de logs."],
   ["Init container","Roda antes do principal para preparar algo, como esperar uma dependência ou baixar configuração, e termina."]
  ]},
 "Probes":{
  what:"Testes que o Kubernetes faz no pod para saber o que fazer com ele.",
  kids:[
   ["Liveness","Está vivo? Se falhar, o container é reiniciado."],
   ["Readiness","Está pronto para receber tráfego? Se não, sai do Service até ficar."],
   ["Startup","Para aplicações que demoram a subir: segura as outras probes até a inicialização terminar."]
  ]},
 "Réplicas":{
  what:"Várias cópias idênticas do pod, mantidas pelo Deployment, atendem em paralelo.",
  kids:[
   ["Sem estado","As cópias só são intercambiáveis se não guardarem nada importante na própria memória ou disco."],
   ["Espalhar","Regras de distribuição colocam as réplicas em nós e zonas diferentes."],
   ["Orçamento de interrupção","O PodDisruptionBudget garante um mínimo de réplicas de pé durante manutenções."]
  ]}
},
mesh:{
 "Sidecar":{
  what:"Um proxy, em geral o Envoy, roda ao lado de cada serviço e intercepta tudo o que entra e sai.",
  kids:[
   ["Plano de dados","Os proxies, que carregam o tráfego de verdade."],
   ["Plano de controle","Distribui configuração e certificados para todos os proxies."],
   ["Sem sidecar","Modos mais novos, como o ambient do Istio, levam o proxy para cada nó e dispensam o sidecar."]
  ]},
 "mTLS":{
  what:"TLS nos dois sentidos: o servidor prova quem é, e o cliente também.",
  kids:[
   ["Identidade de serviço","Cada serviço recebe um certificado com a sua identidade, no padrão SPIFFE."],
   ["Rotação automática","Os certificados duram horas e são trocados sozinhos."],
   ["Zero trust","Estar dentro da rede não basta: toda chamada precisa provar quem é."]
  ]},
 "Retries, timeouts e circuit breaker":{
  what:"Políticas de resiliência configuradas no mesh, iguais para todos os serviços, sem mudar o código.",
  kids:[
   ["Retentativas","O proxy repete chamadas que falharam, com limite."],
   ["Timeouts","Corta as chamadas que passam do tempo."],
   ["Detecção de outliers","Tira do rodízio a cópia de um serviço que começou a falhar."]
  ]}
},

/* INFRAESTRUTURA */
vm:{
 "Hypervisor":{
  what:"O software que cria e isola máquinas virtuais sobre um servidor físico.",
  kids:[
   ["Tipo 1","Roda direto no hardware, como KVM, VMware ESXi e o Nitro da AWS."],
   ["Isolamento","Cada VM tem o próprio kernel. Uma falha numa não afeta as vizinhas."],
   ["Vizinho barulhento","VMs no mesmo servidor disputam cache, memória e rede. Instâncias dedicadas evitam isso."]
  ]},
 "vCPU e memória":{
  what:"A fatia do servidor físico que a VM pode usar.",
  kids:[
   ["Tipos de instância","Combinações prontas de vCPU e memória, para uso geral, computação ou memória."],
   ["Crédito de CPU","Instâncias pequenas e baratas, como as da família t da AWS, aguentam picos curtos e depois desaceleram."],
   ["Sob demanda, reservada ou spot","Pagar por hora, comprometer-se por anos com desconto, ou usar sobras baratas que podem ser tomadas de volta."]
  ]},
 "Sistema operacional":{
  what:"Quase sempre Linux, a partir de uma imagem que já sobe configurada.",
  kids:[
   ["Imagem da máquina","Uma fotografia do disco com sistema e configurações, como a AMI da AWS."],
   ["Inicialização","Na primeira subida, scripts como o cloud-init instalam e configuram o que falta."],
   ["Atualizações","Correções de segurança constantes. Muitos times preferem trocar a VM inteira a atualizar a que está rodando."]
  ]}
},
vpc:{
 "Sub-redes públicas e privadas":{
  what:"A rede virtual é dividida em sub-redes, cada uma numa zona, com regras próprias de entrada e saída.",
  ex:["Um endereçamento","VPC        10.0.0.0/16\npública-a  10.0.1.0/24\nprivada-a  10.0.11.0/24"],
  kids:[
   ["Pública","Tem rota para a internet. Ali ficam o balanceador e pouco mais."],
   ["Privada","Sem entrada da internet. Ali ficam os serviços e o banco."],
   ["NAT gateway","Deixa a sub-rede privada sair para a internet, por exemplo para baixar atualizações, sem receber conexões de fora."]
  ]},
 "Firewall de rede":{
  what:"Regras de quem pode falar com quem, e em que porta.",
  kids:[
   ["Security group","Regras presas a cada recurso: o banco só aceita conexões dos serviços, na porta 5432."],
   ["Com estado","Se a conexão de saída foi permitida, a resposta volta sozinha."],
   ["Network ACL","Regras da sub-rede inteira, sem estado: uma segunda barreira."]
  ]},
 "VPN e peering":{
  what:"Ligar a rede da nuvem a outras redes, de forma privada.",
  kids:[
   ["VPN site a site","Um túnel cifrado pela internet entre o escritório e a nuvem."],
   ["Link dedicado","Uma conexão física contratada, como o AWS Direct Connect, com mais banda e estabilidade."],
   ["Peering","Duas redes virtuais conversando direto, como se fossem uma."]
  ]}
},
storage:{
 "Bloco":{
  what:"Um disco virtual ligado a uma máquina, onde o sistema de arquivos e o banco gravam.",
  kids:[
   ["Volumes","Discos como o Amazon EBS, replicados dentro da zona e independentes da VM."],
   ["IOPS e throughput","Quantas operações e quantos megabytes por segundo o disco aguenta; dá para contratar mais."],
   ["Preso à zona","Um volume fica numa zona e só pode ser ligado a máquinas daquela zona."]
  ]},
 "Objeto":{
  what:"Arquivos inteiros guardados sob uma chave e acessados por HTTP.",
  kids:[
   ["Buckets e chaves","backups/2026/10/08/banco.dump parece uma pasta, mas é só o nome do objeto."],
   ["Durabilidade","O S3 foi projetado para 99,999999999% de durabilidade, com os dados copiados entre zonas."],
   ["Classes de armazenamento","Mais barato para o que quase não é lido, como backups antigos, com recuperação mais lenta."]
  ]},
 "Snapshots":{
  what:"Uma fotografia do disco num instante, para recuperar ou copiar.",
  kids:[
   ["Incremental","Cada snapshot guarda só os blocos que mudaram desde o anterior."],
   ["Cópia para outra região","Snapshots copiados para outra região protegem contra um desastre regional."],
   ["Teste de restauração","Backup que nunca foi restaurado é só uma esperança."]
  ]}
},
regiao:{
 "Zona de disponibilidade":{
  what:"Um ou mais data centers com energia, refrigeração e rede independentes, perto o bastante para se falarem rápido.",
  kids:[
   ["Distância","Zonas da mesma região ficam a quilômetros umas das outras: longe para não caírem juntas, perto para a latência ficar em poucos milissegundos."],
   ["Rede entre zonas","Links de fibra dedicados e redundantes ligam as zonas."],
   ["Custo","O tráfego entre zonas costuma ser cobrado; dentro da mesma zona, não."]
  ]},
 "Multi-AZ":{
  what:"Espalhar cópias do sistema por zonas diferentes, para que a queda de uma não derrube tudo.",
  kids:[
   ["Serviços sem estado","Réplicas em cada zona, atrás do mesmo balanceador."],
   ["Banco","Principal numa zona e réplica síncrona em outra, pronta para assumir."],
   ["Capacidade de sobra","Se uma zona cai, as outras precisam aguentar a carga dela."]
  ]},
 "Recuperação de desastre":{
  what:"O plano para quando a região inteira fica indisponível.",
  kids:[
   ["Backup e restauração","O mais barato e o mais lento: horas para voltar."],
   ["Pilot light","O mínimo ligado na outra região, como o banco replicado; o resto sobe na hora."],
   ["Ativo-ativo","As duas regiões atendem o tempo todo. O mais rápido e o mais caro."]
  ]}
},

/* FÍSICO */
datacenter:{
 "Racks e switches":{
  what:"Os servidores ficam em armários padronizados, os racks, ligados por camadas de switches.",
  kids:[
   ["Rack","Um armário de cerca de 2 metros com dezenas de servidores."],
   ["Switch do topo do rack","Liga os servidores do rack à rede do prédio."],
   ["Spine-leaf","Uma malha em que cada switch de rack se liga a todos os switches centrais: qualquer servidor fica a poucos saltos de qualquer outro."]
  ]},
 "Energia":{
  what:"Um data center não pode apagar. A energia chega por mais de um caminho.",
  refs:[["Google: eficiência dos data centers","https://datacenters.google/efficiency"],["AWS: eficiência dos data centers","https://sustainability.aboutamazon.com/products-services/aws-cloud"]],
  kids:[
   ["Nobreak","Baterias seguram tudo nos segundos entre a queda da rede elétrica e a partida dos geradores."],
   ["Geradores","Motores a diesel com combustível para horas ou dias."],
   ["PUE","Quanto da energia total vai para os servidores. 1,0 seria perfeito; as grandes nuvens ficam perto de 1,1."]
  ]},
 "Refrigeração":{
  what:"Quase toda a energia que um servidor consome vira calor, e o calor precisa sair.",
  kids:[
   ["Corredores frio e quente","Os racks são alinhados para que o ar frio entre pela frente e o quente saia por trás, sem se misturar."],
   ["Resfriamento líquido","Chips de IA esquentam tanto que o ar já não basta: o líquido circula junto aos processadores."],
   ["Água","Torres de resfriamento consomem muita água, um tema crescente de sustentabilidade."]
  ]},
 "Acesso físico":{
  what:"Proteger o prédio é tão importante quanto proteger o software.",
  kids:[
   ["Camadas","Cerca, portaria, crachá, biometria e gaiolas: cada camada restringe mais."],
   ["Registro","Câmeras e registro de cada entrada, auditados."],
   ["Certificações","Normas como a ISO 27001 e relatórios SOC 2 atestam esses controles."]
  ]}
},
fibra:{
 "Pulsos de luz":{
  what:"A luz viaja presa dentro de um fio de vidro, refletindo nas paredes sem escapar.",
  kids:[
   ["Núcleo e casca","Um núcleo de vidro mais fino que um fio de cabelo, envolto por uma casca de vidro que reflete a luz de volta para dentro."],
   ["Monomodo e multimodo","A monomodo leva a luz por dezenas de quilômetros; a multimodo, mais barata, serve a distâncias curtas, como dentro do data center."],
   ["Várias cores","Com DWDM, dezenas de comprimentos de onda, cada um um canal, viajam na mesma fibra."]
  ]},
 "Cabos submarinos":{
  what:"Quase todo o tráfego entre continentes passa por cabos no fundo do mar, não por satélites.",
  refs:[["Submarine Cable Map: Fortaleza","https://www.submarinecablemap.com/landing-point/fortaleza-brazil"],["O Povo: Fortaleza terá o 18º cabo (jan/2026)","https://mais.opovo.com.br/jornal/economia/2026/01/22/fortaleza-tera-18-cabo-submarino-de-fibra-optica-com-foco-em-ia.html"]],
  kids:[
   ["Volume","Entre 95% e 99% do tráfego entre continentes passa por eles. O tráfego dentro do país, em geral, nem chega ao mar."],
   ["Repetidores","A cada dezenas de quilômetros, amplificadores reforçam o sinal, alimentados por energia que corre no próprio cabo."],
   ["Brasil","Fortaleza é o maior ponto de chegada de cabos das Américas, com cerca de 17 cabos ligando o Brasil à América do Norte, à Europa e à África."]
  ]},
 "Backbone":{
  what:"As grandes rotas de fibra que ligam cidades e países, operadas por provedores e operadoras.",
  kids:[
   ["Anéis","As rotas formam anéis: cortou de um lado, o tráfego volta pelo outro."],
   ["Capacidade","Um único par de fibras com DWDM carrega dezenas de terabits por segundo."],
   ["Limite físico","No vidro, a luz anda a cerca de 200 mil km por segundo, dois terços da velocidade no vácuo. Distância sempre custa tempo."]
  ]}
},
cobre:{
 "Par trançado":{
  what:"Quatro pares de fios de cobre trançados, no conector RJ45: o cabo de rede do dia a dia.",
  kids:[
   ["Por que trançar","A trança cancela interferências: o ruído atinge os dois fios do par por igual."],
   ["Categorias","Cat5e para até 1 Gbps; Cat6a para 10 Gbps em até 100 metros."],
   ["PoE","O mesmo cabo leva energia: alimenta câmeras, telefones e pontos de acesso Wi-Fi."]
  ]},
 "Coaxial":{
  what:"Um condutor central envolto por uma malha metálica que blinda o sinal.",
  kids:[
   ["DOCSIS","O padrão que leva internet pela rede de TV a cabo. O DOCSIS 3.1 chega a gigabits."],
   ["Rede compartilhada","Os vizinhos dividem o mesmo trecho do cabo, então a velocidade cai nos horários de pico."],
   ["HFC","Fibra até o bairro e coaxial no último trecho até as casas."]
  ]},
 "Par telefônico":{
  what:"O fio do telefone fixo, adaptado para dados com o DSL.",
  kids:[
   ["ADSL e VDSL","Usam frequências acima da voz no mesmo fio. Quanto mais longe da central, mais lento."],
   ["Em declínio","No Brasil, a fibra substituiu quase todo o DSL: os cabos metálicos somam pouco mais de 1% dos acessos fixos."],
   ["O cobre que fica","O par trançado continua dentro de prédios e escritórios, onde as distâncias são curtas."]
  ]}
},
radio:{
 "Wi-Fi":{
  what:"Rádio de curto alcance, em faixas que dispensam licença.",
  refs:[["Teletime: Anatel divide a faixa de 6 GHz (jan/2025)","https://teletime.com.br/13/01/2025/ppps-criticam-nova-decisao-da-anatel-que-divide-faixa-de-6-ghz/"],["Teletime: Wi-Fi restrito à parte de baixo dos 6 GHz (ago/2026)","https://teletime.com.br/13/08/2026/anatel-wi-fi-banda-inferior-6-ghz/"]],
  kids:[
   ["2,4 GHz","Vai mais longe e atravessa paredes, mas é lenta e congestionada."],
   ["5 e 6 GHz","Mais rápidas e com mais canais, mas de alcance menor. Em 2021 a Anatel deu os 6 GHz inteiros ao Wi-Fi; no fim de 2024 dividiu a faixa: 500 MHz ficaram com o Wi-Fi e 700 MHz foram reservados à telefonia móvel. A partir de março de 2027, os equipamentos Wi-Fi certificados no Brasil precisam ficar na parte de baixo."],
   ["Malha (mesh)","Vários pontos de acesso cobrindo a casa toda como uma rede só."]
  ]},
 "Rede celular":{
  what:"A cidade é dividida em células, cada uma atendida por uma antena.",
  kids:[
   ["Estação rádio base","A antena e os equipamentos de cada célula, ligados à operadora por fibra."],
   ["Handover","Ao se mover, o celular passa de uma célula para outra sem cair."],
   ["5G","Mais velocidade, latência menor e muito mais aparelhos por célula. No Brasil, a faixa principal é a de 3,5 GHz."]
  ]},
 "Espectro":{
  what:"As frequências de rádio são um recurso finito, dividido por todos.",
  kids:[
   ["Leilões","Operadoras pagam pelo direito de usar faixas. O leilão do 5G no Brasil foi em 2021."],
   ["Frequência e alcance","Frequências baixas vão longe e atravessam obstáculos; altas carregam mais dados, mas alcançam menos."],
   ["Interferência","Dois transmissores na mesma frequência e no mesmo lugar se atrapalham. Por isso o uso é regulado."]
  ]}
},
satelite:{
 "Órbita geoestacionária":{
  what:"A 35.786 km de altura, o satélite gira junto com a Terra e parece parado no céu.",
  kids:[
   ["Cobertura","Três satélites bem posicionados cobrem quase todo o planeta."],
   ["Latência","A ida e volta passa de meio segundo. Videochamadas e jogos sofrem."],
   ["Antena fixa","Como o satélite não se move no céu, a antena é apontada uma vez e fica."]
  ]},
 "Órbita baixa":{
  what:"Constelações de milhares de satélites a algumas centenas de quilômetros de altura.",
  refs:[["Jonathan McDowell: estatísticas da Starlink","https://planet4589.org/space/con/star/stats.html"]],
  kids:[
   ["Latência","Algo entre 25 e 60 milissegundos, perto da banda larga terrestre."],
   ["Constelação","Cada satélite cruza o céu em minutos, por isso são necessários milhares: a Starlink já passou de 10 mil em órbita."],
   ["Antena eletrônica","A antena muda a direção do feixe eletronicamente para seguir os satélites, sem partes móveis."]
  ]},
 "Estação terrestre":{
  what:"Onde o sinal que vem do espaço desce para a internet dos cabos.",
  kids:[
   ["Gateway","Grandes antenas ligadas por fibra ao backbone."],
   ["Laser entre satélites","Satélites mais novos passam dados entre si por laser e chegam a lugares sem estação por perto, como o meio do oceano."],
   ["Regulação","Satélites também usam espectro e precisam de autorização da Anatel para operar no Brasil."]
  ]}
}
});

/* Serverless: peças próprias do estilo e os itens que só ele usa no gateway e no pipeline.
 * Fatos com data checados na web em outubro de 2026 (veja o cabeçalho de serverless.js). */
Object.assign(Z.gateway,{
 "Rotas para funções":{
  what:"O gateway liga cada rota a uma função. Não há serviço esperando: a rota é o gatilho.",
  refs:[["Timeout do API Gateway","https://repost.aws/knowledge-center/api-gateway-timeout-limit"],["Cotas das HTTP APIs","https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-quotas.html"]],
  ex:["Uma rota no AWS SAM","Events:\n  ListarPedidos:\n    Type: HttpApi\n    Properties:\n      Path: /pedidos\n      Method: GET"],
  kids:[
   ["Rota e método","GET /pedidos aciona a função de pedidos; POST /pedidos pode acionar a mesma ou outra função."],
   ["Evento padronizado","O gateway transforma a requisição HTTP num evento JSON que a função entende."],
   ["Limite de espera","Se a função passa de 29 segundos (30 nas HTTP APIs), o gateway desiste e responde 504."]
  ]}
});
Object.assign(Z.cicd,{
 "Pacote e versão":{
  what:"O build gera um pacote da função, publicado como uma versão numerada e imutável.",
  refs:[["Cotas do AWS Lambda","https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"]],
  kids:[
   ["Zip ou imagem","Um arquivo .zip com o código e as bibliotecas, ou uma imagem de container de até 10 GB."],
   ["Versões e aliases","Cada publicação gera uma versão; um alias, como prod, aponta para a versão que está no ar."],
   ["Canary pelo alias","O alias pode mandar uma fatia das chamadas, como 10%, para a versão nova antes de virar tudo."]
  ]}
});

Object.assign(Z,{
fnpedidos:{
 "Handler":{
  what:"O ponto de entrada da função. A plataforma chama o handler com um evento que descreve a requisição e espera um retorno.",
  ex:["A função de pedidos, em Node.js","export const handler = async (event) => {\n  const cliente = event.requestContext.authorizer.jwt.claims.sub;\n  const pedidos = await listarPedidos(cliente);\n  return { statusCode: 200, body: JSON.stringify(pedidos) };\n};"],
  kids:[
   ["Evento","Um objeto JSON com método, caminho, cabeçalhos, corpo e quem está chamando, já validado pelo gateway."],
   ["Contexto","Dados da execução, como quanto tempo ainda resta antes do limite."],
   ["Retorno","Para o gateway, um status HTTP, cabeçalhos e corpo. Uma exceção não tratada vira erro para quem chamou."]
  ]},
 "Código de inicialização":{
  what:"Tudo que está fora do handler roda uma vez, quando o ambiente nasce, e fica na memória para as próximas chamadas.",
  refs:[["AWS: cobrança da fase INIT (ago/2025)","https://aws.amazon.com/blogs/compute/aws-lambda-standardizes-billing-for-init-phase/"]],
  ex:["Fora e dentro do handler","// roda uma vez por ambiente, no cold start\nconst db = new DynamoDBClient({});\n\n// roda a cada chamada\nexport const handler = async (event) => { /* usa db */ };"],
  kids:[
   ["Reaproveitar clientes","Criar o cliente do banco fora do handler evita refazer conexão e TLS a cada chamada."],
   ["Pacote enxuto","Quanto menos bibliotecas para carregar, mais curto o cold start."],
   ["Também é cobrado","Desde agosto de 2025, o Lambda cobra o tempo dessa inicialização, que antes era grátis na maioria das funções."]
  ]},
 "Sem estado":{
  what:"Duas chamadas seguidas podem cair em ambientes diferentes, e um ambiente pode sumir a qualquer momento.",
  refs:[["Cotas do AWS Lambda","https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"]],
  kids:[
   ["Memória é só cache","Dá para guardar algo na memória entre chamadas do mesmo ambiente, mas nunca contar com isso."],
   ["Disco temporário","Cada ambiente tem uma pasta /tmp, de 512 MB a 10 GB no Lambda, apagada quando ele morre."],
   ["Estado de verdade","Sessões, carrinhos e arquivos vão para banco, cache ou armazenamento de objetos."]
  ]},
 "Papel de acesso":{
  what:"A função não guarda senha nem chave: ela assume um papel, e o provedor entrega credenciais temporárias a cada ambiente.",
  ex:["Uma permissão mínima, em IAM","{\n  \"Effect\": \"Allow\",\n  \"Action\": [\"dynamodb:Query\"],\n  \"Resource\": \"arn:aws:dynamodb:sa-east-1:123456789012:table/pedidos\"\n}"],
  kids:[
   ["Menor privilégio","A função de pedidos só consulta a tabela de pedidos. Se for invadida, o estrago fica nesse limite."],
   ["Credenciais temporárias","Expiram sozinhas e são renovadas pelo provedor; nada fica escrito no código."],
   ["Quem pode chamar","Outra política diz quem pode acionar a função: o gateway, a fila, o orquestrador."]
  ]}
},
fnpagamentos:{
 "Entrega pelo menos uma vez":{
  what:"Garantir que uma mensagem chegue exatamente uma vez numa rede que falha é caro. Os serviços gerenciados preferem garantir que ela chegue, mesmo que repetida.",
  kids:[
   ["Por que repete","A função cobrou, mas caiu antes de confirmar. Para o sistema, a mensagem não foi processada e volta."],
   ["Onde acontece","Filas padrão, barramentos, gatilhos assíncronos e retentativas do orquestrador podem repetir."],
   ["A resposta","Em vez de impedir a repetição, tornar o efeito repetível sem dano: idempotência."]
  ]},
 "Chave de idempotência":{
  what:"Um identificador único da operação, como o id do pedido, que acompanha a cobrança do começo ao fim.",
  refs:[["Powertools for AWS Lambda: idempotência","https://docs.powertools.aws.dev/lambda/python/latest/utilities/idempotency/"]],
  ex:["Registrar a chave só se ela for nova (PostgreSQL)","INSERT INTO cobrancas (pedido_id, status)\nVALUES ($1, 'em andamento')\nON CONFLICT (pedido_id) DO NOTHING;"],
  kids:[
   ["Primeiro registra, depois cobra","Se a chave já existe, a função devolve o resultado guardado em vez de cobrar de novo."],
   ["No adquirente também","Muitos adquirentes aceitam uma chave de idempotência na própria chamada e não cobram duas vezes com ela."],
   ["Ferramentas prontas","Bibliotecas como o Powertools for AWS Lambda trazem idempotência pronta para usar."]
  ]},
 "Tempo máximo":{
  what:"Toda função tem um limite de duração. Ao atingi-lo, a plataforma interrompe a execução no meio.",
  refs:[["Cotas do AWS Lambda","https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"],["Timeout do API Gateway","https://repost.aws/knowledge-center/api-gateway-timeout-limit"]],
  kids:[
   ["Os tetos","15 minutos no Lambda. Atrás de um API Gateway, a resposta precisa vir em até 29 ou 30 segundos."],
   ["Trabalho longo","Divide-se em passos curtos, coordenados por um orquestrador, que pode esperar dias entre um e outro."],
   ["Menor que o de quem chama","Se a função demora mais do que o chamador espera, ele desiste e tenta de novo enquanto ela ainda roda: cobrança em dobro à vista."]
  ]}
},
fnavisos:{
 "Gatilho da fila":{
  what:"A função não consulta a fila: a plataforma faz isso por ela e só a chama quando há mensagens.",
  refs:[["Lambda com SQS: escala e concorrência máxima","https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-scaling.html"]],
  ex:["O gatilho, no AWS SAM","Events:\n  Avisos:\n    Type: SQS\n    Properties:\n      Queue: !GetAtt FilaDeAvisos.Arn\n      BatchSize: 10\n      FunctionResponseTypes:\n        - ReportBatchItemFailures"],
  kids:[
   ["Lotes","Várias mensagens numa chamada só, o que reduz o número de execuções."],
   ["Escala pela fila","Com a fila cheia, a plataforma aumenta aos poucos as execuções em paralelo."],
   ["Concorrência máxima","Um teto de execuções simultâneas evita que a função sufoque o provedor de e-mail."]
  ]},
 "Falha parcial do lote":{
  what:"Se uma mensagem de dez falha e a função lança erro, as dez voltam para a fila, inclusive as nove que já tinham dado certo.",
  refs:[["Lambda com SQS: falhas parciais do lote","https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html"]],
  ex:["Devolvendo só a que falhou","return {\n  batchItemFailures: [{ itemIdentifier: mensagem.messageId }]\n};"],
  kids:[
   ["Aviso em dobro","Sem isso, quem já recebeu o e-mail recebe de novo."],
   ["Só as que falharam voltam","A função lista as mensagens com problema; as outras são apagadas da fila."],
   ["Mensagem envenenada","Uma mensagem que sempre falha acaba na fila de mensagens mortas, em vez de travar as outras."]
  ]},
 "Mensagem e envio":{
  what:"A parte que de fato fala com o usuário: monta o texto e entrega pelo canal certo.",
  kids:[
   ["Templates","O texto de cada aviso, com espaços para o nome, o número do pedido e o valor."],
   ["Provedores","Amazon SES ou outro serviço de e-mail, Twilio para SMS, Firebase Cloud Messaging para push."],
   ["Ritmo do provedor","Cada provedor aceita um número de envios por segundo; a concorrência máxima da função respeita esse ritmo."]
  ]}
},
barramento:{
 "Regras":{
  what:"Cada regra é um padrão sobre o conteúdo do evento. Quando um evento casa com ele, é entregue aos destinos da regra.",
  ex:["Uma regra no EventBridge","{\n  \"source\": [\"loja.pedidos\"],\n  \"detail-type\": [\"PedidoCriado\"],\n  \"detail\": { \"valor\": [{ \"numeric\": [\">\", 0] }] }\n}"],
  kids:[
   ["Quem publica não sabe quem ouve","A função de pedidos só publica o fato; quem reage é decidido nas regras."],
   ["Vários destinos","O mesmo evento pode iniciar o fluxo de pagamento e alimentar a fila de avisos."],
   ["Filtro no barramento","Cada destino recebe só o que interessa, sem código para descartar o resto."]
  ]},
 "Esquema do evento":{
  what:"O contrato entre quem publica e quem consome: os campos e o significado de cada um.",
  ex:["O evento “pedido criado”","{\n  \"source\": \"loja.pedidos\",\n  \"detail-type\": \"PedidoCriado\",\n  \"detail\": { \"pedido\": \"p-981\", \"cliente\": 42, \"valor\": 129.9 }\n}"],
  kids:[
   ["Fato no passado","O nome diz o que já aconteceu, como PedidoCriado, e não dá uma ordem."],
   ["Registro de esquemas","Guarda as versões de cada evento e pode gerar código a partir delas."],
   ["Mudar sem quebrar","Campos novos podem ser adicionados; remover ou renomear quebra quem consome."]
  ]},
 "Retentativa de entrega":{
  what:"Se o destino não aceita o evento, o barramento tenta de novo, com intervalos crescentes e um pouco de aleatoriedade.",
  refs:[["Retentativa do EventBridge","https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-retry-policy.html"]],
  kids:[
   ["Os padrões","No EventBridge, até 24 horas e 185 tentativas, o que vier primeiro. Os dois valores podem ser reduzidos."],
   ["Quando desiste","O evento é descartado, a não ser que haja uma fila de mensagens mortas configurada para recebê-lo."],
   ["Só erros temporários","Destino sobrecarregado ou fora do ar ganha nova tentativa; erro de permissão ou de configuração, não."]
  ]}
},
filas:{
 "Tempo de invisibilidade":{
  what:"Quando alguém pega uma mensagem, ela não é apagada: fica invisível por um prazo. Se não for confirmada, reaparece.",
  refs:[["Lambda com SQS: tempo de invisibilidade","https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html"]],
  kids:[
   ["Confirmar é apagar","Depois de processar, o consumidor apaga a mensagem. Com o gatilho de funções, a plataforma faz isso sozinha."],
   ["Prazo maior que a função","O prazo precisa ser maior que o tempo máximo da função; a AWS recomenda pelo menos seis vezes."],
   ["Por que repete","Se a função passa do prazo, a mensagem reaparece e outro ambiente a processa de novo."]
  ]},
 "Fila de mensagens mortas":{
  what:"Uma segunda fila que recebe as mensagens que falharam vezes demais.",
  refs:[["Filas de mensagens mortas no SQS","https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html"]],
  kids:[
   ["Número de tentativas","Configurado na fila: depois de, por exemplo, cinco recebimentos sem sucesso, a mensagem é movida."],
   ["Investigar e reenviar","Corrigido o problema, as mensagens podem voltar para a fila original."],
   ["Alarme","Mensagem morta quase sempre é bug: vale um alerta assim que essa fila deixa de estar vazia."]
  ]},
 "Padrão ou FIFO":{
  what:"Dois tipos de fila, com garantias diferentes.",
  refs:[["SQS FIFO: deduplicação","https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html"]],
  kids:[
   ["Padrão","Vazão quase ilimitada, entrega pelo menos uma vez e ordem aproximada."],
   ["FIFO","Ordem garantida dentro de cada grupo de mensagens e sem duplicatas num intervalo de cinco minutos, com vazão menor."],
   ["Qual escolher","Avisos de e-mail toleram ordem trocada; movimentações de uma mesma conta, não."]
  ]}
},
orquestrador:{
 "Máquina de estados":{
  what:"O fluxo vira um desenho de passos, com o que entra e sai de cada um. O orquestrador executa e registra cada transição.",
  ex:["Dois passos, em Amazon States Language","{\n  \"StartAt\": \"Cobrar\",\n  \"States\": {\n    \"Cobrar\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": { \"FunctionName\": \"cobrar\" },\n      \"Next\": \"Confirmar\"\n    },\n    \"Confirmar\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": { \"FunctionName\": \"confirmar\" },\n      \"End\": true\n    }\n  }\n}"],
  kids:[
   ["Passos","Chamar uma função, esperar, escolher um caminho, rodar coisas em paralelo."],
   ["Histórico","Cada execução fica registrada passo a passo, com entradas, saídas e erros."],
   ["Desenho ou código","No Step Functions, o fluxo é um JSON; nas durable functions e no Temporal, é código comum com pontos de checkpoint."]
  ]},
 "Retentativa e compensação":{
  what:"Num fluxo distribuído não há uma transação que desfaz tudo. Cada passo precisa saber tentar de novo e, se preciso, voltar atrás.",
  kids:[
   ["Retentativa por passo","Quantas vezes, com que intervalo e para quais erros."],
   ["Saga","Uma sequência de passos em que cada um tem o seu desfazer: cobrou e não conseguiu confirmar o pedido? Estorna."],
   ["Erro de negócio","Cartão recusado não é falha técnica: não se tenta de novo, segue-se outro caminho."]
  ]},
 "Espera longa":{
  what:"O fluxo pode parar e esperar sem nenhuma função rodando, e sem pagar pela espera delas.",
  refs:[["Cotas do Step Functions","https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html"],["Lambda durable functions","https://docs.aws.amazon.com/lambda/latest/dg/durable-functions.html"]],
  kids:[
   ["Esperar um tempo","Por exemplo, cancelar o pedido se o Pix não for pago em 30 minutos."],
   ["Esperar um sinal","Pausar até alguém aprovar ou um sistema externo avisar, com um token de retorno."],
   ["Até um ano","Os fluxos padrão do Step Functions e as durable functions do Lambda podem durar até um ano."]
  ]}
},
proxy:{
 "O problema das conexões":{
  what:"Uma conexão com o banco relacional custa memória no servidor. Com funções, o número delas cresce junto com a concorrência.",
  kids:[
   ["Uma por ambiente","Mil execuções simultâneas podem significar mil conexões abertas ao mesmo tempo."],
   ["O limite do banco","O banco aceita um número máximo de conexões, que depende do tamanho da instância. Acima dele, recusa."],
   ["Conexões esquecidas","Um ambiente congelado ou descartado pode deixar a conexão aberta até ela expirar."]
  ]},
 "Pool compartilhado":{
  what:"O proxy mantém poucas conexões reais com o banco e as empresta às funções, uma transação por vez.",
  refs:[["RDS Proxy: fixação de conexões","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-pinning.html"]],
  kids:[
   ["Multiplexação","Entre uma transação e outra, a mesma conexão real atende outra função."],
   ["Fila de espera","Num pico, as funções esperam por uma conexão livre em vez de derrubar o banco."],
   ["Fixação","Alguns recursos, como variáveis de sessão, prendem a conexão a uma função só e reduzem o ganho."]
  ]},
 "Failover mais curto":{
  what:"Quando o banco principal cai, a réplica assume. O proxy esconde essa troca das funções.",
  refs:[["Amazon RDS Proxy","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html"]],
  kids:[
   ["Sem esperar o DNS","O proxy sabe para onde ir na hora; as funções continuam usando o mesmo endereço."],
   ["Conexões preservadas","As funções esperam a troca terminar, em vez de receberem erro de conexão."],
   ["Segredos","O proxy busca as credenciais num cofre de segredos e pode exigir autenticação pelo papel de acesso."]
  ]}
},
runtime:{
 "Cold start":{
  what:"A primeira chamada de um ambiente novo paga a preparação dele. As seguintes reaproveitam o que já está pronto.",
  refs:[["Cold start por linguagem, medições de Mikhail Shilkov","https://mikhail.io/serverless/coldstarts/aws/languages/"],["Lambda SnapStart","https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html"]],
  kids:[
   ["As etapas","Criar a microVM, carregar o código, iniciar o runtime da linguagem e rodar o código de inicialização."],
   ["Quanto custa","Em Node.js ou Python, algumas centenas de milissegundos; em Java, .NET e imagens grandes, perto de um segundo ou mais."],
   ["Como encurtar","Pacote menor, foto do ambiente pronto ou ambientes sempre aquecidos.",{
    what:"Três caminhos, com custos diferentes.",
    refs:[["Lambda SnapStart","https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html"]],
    kids:[
     ["Pacote menor","Menos bibliotecas e uma inicialização mais simples."],
     ["SnapStart","Guarda uma foto do ambiente já iniciado e restaura a partir dela. Funciona em Java, Python e .NET."],
     ["Concorrência provisionada","Deixa um número de ambientes sempre aquecidos, pagando por eles mesmo sem uso."]
    ]}]
  ]},
 "Concorrência":{
  what:"Concorrência é quantas execuções acontecem ao mesmo tempo. Ela cresce e diminui sozinha com a demanda.",
  refs:[["Escala do Lambda","https://docs.aws.amazon.com/lambda/latest/dg/scaling-behavior.html"],["Concorrência no Cloud Run","https://cloud.google.com/run/docs/about-concurrency"],["Lambda Managed Instances","https://docs.aws.amazon.com/lambda/latest/dg/lambda-managed-instances.html"]],
  kids:[
   ["A conta","Chamadas por segundo vezes a duração média: cem por segundo, de 200 ms cada, dão 20 execuções simultâneas."],
   ["Ritmo de escala","No Lambda, cada função pode ganhar até mil ambientes novos a cada 10 segundos."],
   ["Reservada","Separar uma parte do limite da conta para uma função garante capacidade a ela e impede que tome a das outras."],
   ["Várias por ambiente","No Cloud Run functions e no Lambda Managed Instances, um mesmo ambiente pode atender várias chamadas ao mesmo tempo."]
  ]},
 "Throttling":{
  what:"Quando a concorrência chega ao limite, a plataforma recusa novas execuções até sobrar espaço.",
  refs:[["Erros e retentativas em chamadas assíncronas","https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html"]],
  kids:[
   ["Síncrona","Quem chamou recebe um erro 429 e decide se tenta de novo."],
   ["Assíncrona","O evento volta para a fila interna e é tentado de novo por até seis horas."],
   ["Vizinho barulhento","O limite é da conta inteira: uma função em pico pode deixar as outras sem espaço, se não houver concorrência reservada."]
  ]},
 "Cobrança por uso":{
  what:"Sem chamadas, a conta das funções é zero. Com muitas, pode passar do custo de servidores ligados o tempo todo.",
  refs:[["Preços do AWS Lambda","https://aws.amazon.com/lambda/pricing/"],["Cotas do AWS Lambda","https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"]],
  kids:[
   ["As duas partes","Um valor por milhão de chamadas e outro por GB-segundo: memória configurada vezes tempo de execução."],
   ["Memória é CPU","No Lambda, a CPU cresce junto com a memória: com 1.769 MB, a função tem o equivalente a uma vCPU."],
   ["Quando deixa de compensar","Tráfego alto e constante costuma sair mais barato em containers ou no Lambda Managed Instances."]
  ]}
},
microvm:{
 "Firecracker":{
  what:"Um monitor de máquinas virtuais minimalista, escrito em Rust, que a AWS publicou como código aberto em 2018.",
  refs:[["Firecracker","https://firecracker-microvm.github.io/"]],
  kids:[
   ["Só o essencial","Emula poucos dispositivos, como rede e disco, e por isso sobe rápido e ocupa pouca memória."],
   ["Em frações de segundo","O projeto promete iniciar uma microVM em 125 ms ou menos, até o sistema dela começar a rodar."],
   ["Quem usa","O AWS Lambda e o AWS Fargate, além de outras plataformas que executam código de terceiros."]
  ]},
 "Isolamento":{
  what:"Num servidor da nuvem rodam funções de muitos clientes. Separar umas das outras é a primeira regra.",
  refs:[["gVisor","https://gvisor.dev/"],["Como o Cloudflare Workers funciona","https://developers.cloudflare.com/workers/reference/how-workers-works/"]],
  kids:[
   ["Kernel próprio","Cada microVM tem o seu kernel: quem escapa do processo continua preso na máquina virtual."],
   ["Containers sozinhos não bastam","Containers dividem o kernel do servidor. Para código de estranhos, as nuvens põem uma camada a mais."],
   ["Outros caminhos","O Google usa o gVisor, um kernel em espaço de usuário; o Cloudflare Workers usa isolates do V8, mais leves e com outro modelo de segurança."]
  ]},
 "Congelar e reaproveitar":{
  what:"Depois que a função responde, o ambiente não morre na hora: fica congelado, à espera.",
  kids:[
   ["Congelado","Nada roda: timers e tarefas em segundo plano param exatamente onde estavam."],
   ["Reaproveitado","Se outra chamada chega, o ambiente descongela e atende sem cold start."],
   ["Descartado","Depois de um tempo sem uso, ou quando a plataforma precisa, o ambiente é destruído sem aviso."]
  ]}
}
});
})();
