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
  ex:["Perguntando ao DNS pelo terminal","$ dig +short loja.com.br\n203.0.113.10"],
  kids:[
   ["Raiz","13 identidades de servidores raiz, operadas por 12 organizações e replicadas em mais de mil locais pelo mundo."],
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
    kids:[
     ["Chaves efêmeras","São jogadas fora quando a conexão termina."],
     ["Sigilo futuro","Se a chave privada do servidor vazar amanhã, as conversas de hoje continuam protegidas."],
     ["Pós-quântico","Navegadores e servidores já combinam o ECDHE com o ML-KEM, para resistir a futuros computadores quânticos."]
    ]}],
   ["Finished","Os dois confirmam que ninguém alterou o handshake. Daqui em diante, tudo é cifrado."]
  ]},
 "Certificado digital":{
  what:"Um documento que liga um domínio a uma chave pública, assinado por uma autoridade em quem o navegador confia.",
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
