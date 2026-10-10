/* Estilo arquitetural: serverless.
 * Mesmo formato de microsservicos.js. As peças que não mudam entre os estilos são
 * reaproveitadas de lá com pick(id, ajustes), então este arquivo carrega depois dele.
 * As funções têm ids próprios (fnpedidos, fnpagamentos, fnavisos) porque o "por dentro"
 * delas é outro, e o zoom é compartilhado por id + nome do item.
 * Fatos com data checados na web em outubro de 2026: limites do Lambda (15 min, 1.000 de
 * concorrência padrão, 10.240 MB), cobrança do INIT desde ago/2025, SnapStart, timeout do
 * API Gateway (29 s REST, 30 s HTTP API), retentativa do EventBridge (24 h, 185 vezes),
 * retentativa de chamadas assíncronas com throttling (6 h), Aurora Serverless v2 em 0 ACU,
 * Cloud Run functions (antes Cloud Functions), Azure Functions Flex Consumption.
 */
window.STRATA = window.STRATA || { styles: {} };

(function(){
const M=STRATA.styles.microsservicos.nodes;
const pick=(id,over)=>Object.assign({},M[id],over||{});
const swap=(id,from,to)=>M[id].inside.map(x=>x[0]===from?to:x);

STRATA.styles.serverless={
 name:"serverless",
 desc:"O código vira funções que só rodam quando chamadas. O provedor cuida de servidores, escala e sistema operacional; o time cuida do código, das permissões e dos limites. Paga-se pelo uso, e o preço é o cold start.",
 nodes:{
/* EXPERIÊNCIA */
usuario:pick("usuario"),
dispositivo:pick("dispositivo"),
navegador:pick("navegador"),

/* REDE */
roteador:pick("roteador"),
provedor:pick("provedor"),
dns:pick("dns"),
tls:pick("tls"),
cdn:pick("cdn"),

/* BORDA */
waf:pick("waf"),
gateway:pick("gateway",{t:"Porta de entrada e gatilho das funções",
 what:"Recebe cada chamada HTTP, autentica, limita e aciona a função certa. Aqui ele é um serviço gerenciado: não há servidor nem balanceador para o time cuidar.",
 inside:swap("gateway","Roteamento",["Rotas para funções","Cada rota e método aciona uma função: GET /pedidos chama a função de pedidos."]),
 tech:["Amazon API Gateway","Azure API Management","Google API Gateway","Lambda function URLs"],
 host:"Gerenciado pelo provedor de nuvem. O time só configura rotas, autenticação e limites.",
 refs:[["Timeout do API Gateway", "https://repost.aws/knowledge-center/api-gateway-timeout-limit"],["Cotas das HTTP APIs", "https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-quotas.html"],["Cotas do AWS Lambda", "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"]],
 fail:"Todas as APIs ficam inacessíveis. E há um teto de espera: no API Gateway da AWS, se a função não responde em 29 segundos (30 nas HTTP APIs), o cliente recebe um erro 504.",
 ax:{seg:"Autentica e limita antes que qualquer função seja executada.",obs:"Lugar ideal para medir latência e erros por rota.",res:"O limite de chamadas precisa caber no limite de concorrência das funções: na AWS, o gateway aceita 10 mil por segundo por padrão; as funções, mil execuções simultâneas."}}),
idp:pick("idp"),

/* APLICAÇÃO */
frontend:pick("frontend",{
 what:"O código da tela: arquivos estáticos guardados num bucket e entregues pela CDN, executados no navegador do usuário.",
 host:"Arquivos estáticos num bucket de objetos, servidos pela CDN. Nenhum servidor fica ligado esperando."}),
fnpedidos:{l:"app",n:"Função de pedidos",t:"Código que só existe quando chamado",
 what:"Um pedaço pequeno de código, uma função por caso de uso, que o provedor executa a cada chamada. Sem chamadas, nada roda e nada é cobrado.",
 inside:[["Handler","A função que recebe o evento da chamada e devolve a resposta."],["Código de inicialização","O que fica fora do handler roda uma vez por ambiente: carregar bibliotecas, criar os clientes do banco."],["Sem estado","Cada chamada pode cair num ambiente diferente. O que precisa durar vai para o banco."],["Papel de acesso","Uma permissão própria diz exatamente o que essa função pode ler e gravar."]],
 tech:["AWS Lambda","Azure Functions","Cloud Run functions","Cloudflare Workers"],host:"Só como serviço gerenciado de funções. O provedor decide onde e quantas cópias rodam.",
 who:["back","qa","arq"],fail:"Ninguém vê nem cria pedidos. As outras funções seguem funcionando, porque cada uma é publicada e escalada à parte.",
 ax:{seg:"Permissão mínima por função: a de pedidos não enxerga a tabela de pagamentos.",obs:"Cada execução gera logs e métricas de duração, erros e cold starts.",res:"O provedor cria uma cópia nova para cada chamada simultânea, até o limite de concorrência."}},
fnpagamentos:{l:"app",n:"Função de pagamentos",t:"Cobra uma vez, mesmo se chamada duas",
 what:"Executada pelo orquestrador a cada pedido, autoriza a cobrança no adquirente e grava o resultado no banco relacional.",
 inside:[["Entrega pelo menos uma vez","Filas, eventos e retentativas podem entregar a mesma mensagem duas vezes. A função precisa estar preparada."],["Chave de idempotência","Antes de cobrar, confere se aquela chave já foi processada."],["Tempo máximo","Cada execução tem um teto de duração: no Lambda, 15 minutos. Passou disso, é interrompida."]],
 tech:["AWS Lambda","Azure Functions","Cloud Run functions"],
 refs:[["Cotas do AWS Lambda", "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"]],
 who:["back","qa","si"],fail:"As cobranças ficam pendentes. O orquestrador guarda em que passo cada pedido está e tenta de novo até a função voltar.",
 ax:{seg:"Dados de cartão exigem PCI-DSS: tokenização e nunca guardar o número completo.",res:"Idempotência impede cobrança em dobro quando o mesmo evento chega repetido."}},
fnavisos:{l:"app",n:"Função de notificações",t:"Acorda quando chega mensagem",
 what:"Acionada pela fila: o serviço de funções lê as mensagens em lotes e chama a função com cada lote para enviar e-mail, SMS ou push.",
 inside:[["Gatilho da fila","O serviço de funções consulta a fila e entrega as mensagens em lotes."],["Falha parcial do lote","Se uma mensagem do lote falha, a função diz qual, para não reenviar as que deram certo."],["Mensagem e envio","Monta o texto de cada aviso e chama o provedor de e-mail, SMS ou push."]],
 tech:["AWS Lambda","Amazon SES","Twilio","Firebase Cloud Messaging"],
 who:["back"],fail:"A compra funciona normalmente. As mensagens esperam na fila e os avisos saem quando a função volta.",
 ax:{res:"A fila segura as mensagens enquanto a função está fora."}},

/* INTEGRAÇÃO */
barramento:{l:"int",n:"Barramento de eventos gerenciado",t:"Entrega cada fato a quem se interessa",
 what:"Recebe os eventos que as funções publicam e, por regras, entrega cada um aos destinos interessados: filas, fluxos ou outras funções.",
 inside:[["Regras","Um filtro sobre o conteúdo do evento decide para onde ele vai."],["Esquema do evento","O formato combinado de cada evento, como “pedido criado”."],["Retentativa de entrega","Se o destino falha, o barramento tenta de novo: no EventBridge, por padrão, por até 24 horas e 185 tentativas."]],
 tech:["Amazon EventBridge","Amazon SNS","Azure Event Grid","Google Eventarc"],host:"Só gerenciado, cobrado por evento publicado.",
 refs:[["Retentativa do EventBridge", "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-retry-policy.html"]],
 who:["arq","back","sre"],fail:"Os pedidos são gravados, mas nada reage a eles: pagamentos não começam e avisos não saem.",
 ax:{res:"Tenta de novo e, esgotadas as tentativas, manda o evento para uma fila de mensagens mortas, se houver uma configurada.",obs:"Métricas de eventos que casaram com regras e de entregas que falharam."}},
filas:{l:"int",n:"Fila gerenciada",t:"Segura o tranco entre as funções",
 what:"Guarda as mensagens até a função de notificações dar conta. Se chegam mil de uma vez, a fila absorve e a função consome no seu ritmo.",
 inside:[["Tempo de invisibilidade","Quem pegou a mensagem tem um prazo para concluir. Se não confirmar, ela volta para a fila."],["Fila de mensagens mortas","Depois de algumas tentativas sem sucesso, a mensagem vai para uma fila à parte, para alguém investigar."],["Padrão ou FIFO","A padrão aguenta mais volume, mas pode entregar repetido e fora de ordem. A FIFO garante a ordem, com menos vazão."]],
 tech:["Amazon SQS","Azure Queue Storage","Azure Service Bus","Google Pub/Sub"],host:"Só gerenciado, cobrado por mensagem.",
 refs:[["Filas de mensagens mortas no SQS", "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html"],["SQS FIFO: deduplicação", "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html"]],
 who:["back","sre"],fail:"Os avisos param de ser enfileirados. O barramento tenta entregar de novo por horas; se a fila não volta a tempo, os eventos vão para a fila de mensagens mortas ou se perdem.",
 ax:{res:"Fila de mensagens mortas: nada se perde em silêncio.",obs:"A idade da mensagem mais antiga denuncia quando a função não dá conta."}},
orquestrador:{l:"int",n:"Orquestrador de fluxos",t:"Os passos do pedido, com memória",
 what:"Conduz um processo de vários passos, como cobrar e depois confirmar, guardando em que ponto cada pedido está. As funções continuam curtas e sem estado.",
 inside:[["Máquina de estados","O fluxo desenhado como passos, decisões e caminhos de erro."],["Retentativa e compensação","Cada passo tem sua política de nova tentativa. Se algo não tem volta, um passo desfaz o que foi feito antes."],["Espera longa","Um fluxo pode esperar horas ou dias por uma confirmação sem nenhuma função rodando."]],
 tech:["AWS Step Functions","Lambda durable functions","Azure Durable Functions","Google Workflows","Temporal"],host:"Gerenciado. O Temporal também roda self-hosted.",
 who:["arq","back","sre"],fail:"Nenhum fluxo novo começa, e os que estavam em andamento param no último passo concluído.",
 ax:{res:"O estado de cada fluxo fica guardado: uma falha no meio retoma de onde parou.",obs:"Mostra cada execução passo a passo, com entrada, saída e erro."}},
externas:pick("externas"),

/* DADOS */
nosql:pick("nosql",{t:"O banco principal das funções",
 what:"Banco gerenciado que escala sozinho e é acessado por HTTP, sem conexões longas. Por isso combina com funções que nascem e morrem aos milhares.",
 tech:["DynamoDB","Cosmos DB","Firestore","MongoDB Atlas"],host:"Gerenciado, cobrado por leitura e escrita ou por capacidade reservada.",
 who:["back","dba","dados","arq"],
 fail:"Pedidos param de ser lidos e gravados. É o coração dos dados aqui.",
 ax:{res:"Cada escrita é replicada em várias zonas da região.",obs:"Métricas de leituras, escritas e requisições recusadas por excesso (throttling)."}}),
proxy:{l:"dados",n:"Proxy de conexões",t:"Muitas funções, poucas conexões",
 what:"Fica entre as funções e o banco relacional e reaproveita um número pequeno de conexões para atender milhares de execuções.",
 inside:[["O problema das conexões","Cada ambiente de função abre a sua conexão. Num pico, são milhares, e o banco tem um limite."],["Pool compartilhado","O proxy mantém conexões abertas e empresta uma a cada transação."],["Failover mais curto","Na troca para a réplica, o proxy segura as conexões e redireciona, sem esperar o DNS mudar."]],
 tech:["Amazon RDS Proxy","PgBouncer","Prisma Accelerate"],host:"Gerenciado, dentro da rede privada, ou PgBouncer em container próprio.",
 who:["dba","back","sre"],fail:"As funções não alcançam o banco relacional e os pagamentos param.",
 ax:{res:"Protege o banco de picos de conexões e encurta o failover.",seg:"Guarda as credenciais num cofre de segredos; as funções se autenticam pelo papel de acesso, sem senha no código."}},
oltp:pick("oltp",{t:"Relacional que escala sozinho",
 what:"O banco relacional dos pagamentos, numa versão serverless que aumenta e reduz a capacidade conforme a carga e pode até pausar sem uso.",
 tech:["Aurora Serverless v2","Azure SQL serverless","Neon","PostgreSQL"],
 host:"Gerenciado e serverless. Pausado, volta na primeira conexão, o que pode levar alguns segundos.",
 refs:[["Aurora Serverless v2 escala até zero","https://aws.amazon.com/about-aws/whats-new/2024/11/amazon-aurora-serverless-v2-scaling-zero-capacity/"]],
 fail:"Pagamentos param de ser gravados. Sem proxy, um pico de funções abre milhares de conexões e esgota o banco antes de ele cair."}),
lake:pick("lake"),

/* PLATAFORMA */
runtime:{l:"plat",n:"Plataforma de funções",t:"Executa, escala e cobra por chamada",
 what:"O serviço do provedor que recebe as chamadas, decide em qual ambiente cada uma roda, cria ambientes novos quando faltam e cobra pelo tempo de execução.",
 inside:[["Cold start","Sem ambiente livre, ele cria um: sobe a microVM, carrega o código, inicia o runtime e roda a inicialização."],["Concorrência","No Lambda, cada ambiente atende uma chamada por vez: mil chamadas simultâneas, mil ambientes. O limite padrão é de mil por conta e região."],["Throttling","Acima do limite, as chamadas são recusadas. As síncronas recebem erro; as assíncronas voltam para a fila interna e são tentadas de novo."],["Cobrança por uso","Paga-se por chamada e por tempo de execução, medido em milissegundos e proporcional à memória escolhida."]],
 tech:["AWS Lambda","Azure Functions Flex Consumption","Cloud Run functions","Cloudflare Workers"],
 host:"Serviço do provedor. Há opções que rodam na sua conta ou no seu cluster, como Lambda Managed Instances e Knative.",
 refs:[["Cotas do AWS Lambda", "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"],["Erros e retentativas em chamadas assíncronas", "https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html"],["Lambda Managed Instances", "https://docs.aws.amazon.com/lambda/latest/dg/lambda-managed-instances.html"]],
 who:["devops","sre","arq","back"],fail:"Nenhuma função roda: todas as APIs e todas as reações a eventos param ao mesmo tempo.",
 ax:{res:"Espalha os ambientes entre as zonas da região sem ninguém configurar.",obs:"Métricas de chamadas, erros, duração, concorrência e throttling."}},
cicd:pick("cicd",{inside:swap("cicd","Imagem e registry",["Pacote e versão","O código vira um .zip ou uma imagem e é publicado como uma versão imutável da função."])}),
iac:pick("iac",{tech:["AWS SAM","Serverless Framework","AWS CDK","Terraform","SST"],
 what:"A infraestrutura descrita em arquivos versionados. No serverless ela é boa parte do sistema: funções, gatilhos, filas, permissões e rotas nascem daqui."}),

/* INFRAESTRUTURA */
microvm:{l:"infra",n:"MicroVM",t:"Um mini computador por ambiente",
 what:"Cada ambiente de função roda numa máquina virtual minúscula, que sobe em frações de segundo e isola o código de um cliente do código de outros no mesmo servidor.",
 inside:[["Firecracker","O monitor de microVMs que a AWS criou para o Lambda e abriu como código aberto."],["Isolamento","Cada microVM tem o próprio kernel: uma falha ou um ataque não vaza para o vizinho."],["Congelar e reaproveitar","Depois da resposta, o ambiente é congelado. Pode ser reaproveitado na próxima chamada ou descartado."]],
 tech:["Firecracker","gVisor","V8 isolates"],host:"Do provedor. O time nunca vê nem administra essas máquinas.",
 refs:[["Firecracker", "https://firecracker-microvm.github.io/"]],
 who:["sre","si"],fail:"A chamada que rodava nela falha. A próxima ganha um ambiente novo, em outro servidor, e paga um cold start.",
 ax:{seg:"Isolamento por virtualização entre clientes que dividem o mesmo servidor."}},
vpc:pick("vpc",{
 what:"Por padrão, as funções rodam fora da sua rede. Elas entram na rede virtual só para falar com o que mora lá, como o proxy e o banco relacional."}),
storage:pick("storage"),
regiao:pick("regiao"),

/* FÍSICO */
servidor:pick("servidor",{fail:"Os ambientes de função que estavam nele somem. O provedor cria outros, em outro servidor, nas próximas chamadas."}),
datacenter:pick("datacenter"),
fibra:pick("fibra"),
cobre:pick("cobre"),
radio:pick("radio"),
satelite:pick("satelite")
 },

 edges:[
 // rede e caminho
 ["usuario","dispositivo","net","toca"],["dispositivo","navegador","net","evento"],
 ["navegador","dns","net","qual o IP?"],["navegador","roteador","net","Wi-Fi"],["roteador","provedor","net","fibra ou cabo"],
 ["provedor","fibra","net","backbone"],["fibra","waf","net","chega na nuvem"],
 ["dispositivo","radio","net","4G e 5G"],["roteador","radio","net","Wi-Fi"],["provedor","cobre","net","última milha"],["provedor","satelite","net","áreas remotas"],
 ["navegador","tls","net","cifra"],["tls","gateway","net","termina o TLS"],
 ["navegador","cdn","net","baixa a tela"],["cdn","frontend","net","hospeda"],["navegador","frontend","net","executa"],
 // síncronas
 ["waf","gateway","sync","filtrado"],["gateway","idp","sync","chaves públicas"],
 ["gateway","runtime","sync","pede a execução"],["gateway","fnpedidos","sync","GET e POST /pedidos"],
 ["fnpedidos","nosql","sync","lê e grava"],["orquestrador","fnpagamentos","sync","cobra"],
 ["fnpagamentos","proxy","sync","pede conexão"],["proxy","oltp","sync","conexões reaproveitadas"],
 ["fnpagamentos","externas","sync","autoriza"],["fnavisos","externas","sync","envia"],["fnavisos","nosql","sync","histórico"],
 // assíncronas
 ["fnpedidos","barramento","async","publica"],["barramento","orquestrador","async","inicia o fluxo"],
 ["barramento","filas","async","entrega"],["filas","fnavisos","async","aciona em lotes"],["nosql","lake","async","stream de mudanças"],
 // onde roda
 ["fnpedidos","runtime","run","roda na"],["fnpagamentos","runtime","run","roda na"],["fnavisos","runtime","run","roda na"],
 ["cicd","runtime","run","publica a versão"],["iac","runtime","run","configura"],["iac","vpc","run","cria"],
 ["runtime","microvm","run","isola em"],["microvm","servidor","run","fatia de"],["microvm","regiao","run","fica em"],
 ["proxy","vpc","run","fica na"],["oltp","vpc","run","fica na"],["oltp","storage","run","grava em"],
 ["storage","servidor","run","discos de"],["servidor","datacenter","run","fica em"],["datacenter","fibra","run","ligado por"]
 ],

 journey:[
 ["usuario","dispositivo","Você toca em “Meus pedidos”. O toque vira um evento no sistema operacional.",5],
 ["dispositivo","navegador","O navegador recebe o evento. O front-end, servido pela CDN, decide: preciso buscar os pedidos na API.",10],
 ["navegador","dns","Primeiro, onde fica api.loja.com? O navegador pergunta ao DNS.",20],
 ["dns","navegador","O DNS responde com um endereço IP. Agora o navegador sabe para onde mandar.",10],
 ["navegador","roteador","O pedido, já cifrado pelo TLS, sai pelo Wi-Fi até o roteador.",5],
 ["roteador","provedor","Do roteador para o provedor de internet, pela fibra que chega na sua rua.",5],
 ["provedor","fibra","O provedor encaminha pelo backbone: pulsos de luz em fibra óptica até a região da nuvem.",15],
 ["fibra","waf","Na nuvem, o primeiro filtro é o WAF: isso parece um ataque? Não. Pode passar.",3],
 ["waf","gateway","O API Gateway gerenciado decifra o HTTPS e confere a rota e o limite de chamadas. Não há balanceador para o time cuidar.",3],
 ["gateway","idp","O token é válido? O Gateway confere a assinatura com as chaves públicas do serviço de identidade, guardadas em cache.",1],
 ["idp","gateway","Assinatura e validade conferem: você é você e pode ver os seus pedidos.",1],
 ["gateway","runtime","O Gateway pede à plataforma de funções que execute a função de pedidos. Há um ambiente dela livre e aquecido?",2],
 ["runtime","microvm","Não há. É um cold start: a plataforma sobe uma microVM, carrega o código, inicia o runtime e roda a inicialização da função. Em Node.js ou Python, algumas centenas de milissegundos; em Java sem SnapStart, perto de um segundo.",250],
 ["microvm","fnpedidos","Ambiente pronto. O handler da função recebe o evento com a requisição.",1],
 ["fnpedidos","nosql","Leitura no banco NoSQL pela chave do cliente: sem pool de conexões, uma chamada HTTP de poucos milissegundos.",8],
 ["nosql","fnpedidos","O banco devolve os pedidos.",2],
 ["fnpedidos","barramento","A função publica no barramento um evento de auditoria. Precisa ser antes de responder: depois da resposta, o ambiente pode ser congelado no meio de qualquer coisa.",8],
 ["fnpedidos","gateway","A função devolve a resposta em JSON. O ambiente fica congelado, à espera da próxima chamada.",2],
 ["gateway","navegador","A resposta volta pelo mesmo caminho: borda, fibra, provedor, Wi-Fi. Pela internet, cifrada o tempo todo.",40],
 ["navegador","usuario","A tela mostra os pedidos. Do toque até aqui, cerca de 400 milissegundos, e mais da metade foi o cold start. Na próxima vez, com o ambiente aquecido, o mesmo caminho leva perto de 160.",16]
 ],

 /* Modo falha: mesmo formato de microsservicos.js. */
 failure:{
  samples:["runtime","fnpagamentos","oltp","filas","externas","datacenter"],
  deps:[
   ["usuario","dispositivo","para","sem o aparelho, não há como usar o sistema"],
   ["usuario","navegador","para","é pelo navegador ou app que a pessoa usa o sistema"],
   ["navegador","dispositivo","para","o navegador roda no aparelho"],
   ["navegador","frontend","para","sem o código da interface, a tela fica branca"],
   ["navegador","cdn","para","os arquivos da tela vêm da CDN"],
   ["navegador","dns","para","sem DNS, o navegador não acha o endereço do sistema"],
   ["navegador","tls","para","com o certificado inválido, o navegador bloqueia o acesso"],
   ["navegador","provedor","para","sem provedor, não há internet"],
   ["navegador","roteador","degrada","sem Wi-Fi, sobra o 4G e 5G ou o cabo"],
   ["navegador","radio","degrada","sem sinal sem fio, só quem está no cabo continua"],
   ["navegador","waf","para","bloqueadas no WAF, as requisições não chegam à nuvem"],
   ["navegador","gateway","para","todas as APIs passam pelo gateway"],
   ["navegador","runtime","para","todas as APIs rodam como funções"],
   ["navegador","microvm","para","todas as funções rodam em microVMs"],
   ["navegador","fnpedidos","degrada","a tela de pedidos falha, o resto funciona"],
   ["navegador","fnpagamentos","degrada","o pedido é aceito, mas a cobrança fica pendente"],
   ["provedor","fibra","para","o backbone do provedor é de fibra"],
   ["provedor","cobre","degrada","quem chega pelo cobre (DSL, cabo coaxial) fica sem internet"],
   ["provedor","satelite","degrada","quem depende de satélite, como zonas rurais, fica sem internet"],
   ["gateway","idp","degrada","novos logins falham; quem já entrou segue até o token expirar"],
   ["fnpedidos","runtime","para","a função só existe quando a plataforma a executa"],
   ["fnpagamentos","runtime","para","a função só existe quando a plataforma a executa"],
   ["fnavisos","runtime","para","a função só existe quando a plataforma a executa"],
   ["fnpedidos","microvm","para","cada execução roda numa microVM"],
   ["fnpagamentos","microvm","para","cada execução roda numa microVM"],
   ["fnavisos","microvm","para","cada execução roda numa microVM"],
   ["fnpedidos","nosql","para","sem banco, não lê nem grava pedidos"],
   ["fnpedidos","barramento","degrada","o pedido é gravado, mas o evento não sai e nada reage a ele"],
   ["orquestrador","barramento","fila","sem eventos, nenhum fluxo de pagamento começa"],
   ["fnpagamentos","orquestrador","fila","é o orquestrador que chama a função a cada pedido"],
   ["fnpagamentos","proxy","para","as conexões com o banco relacional passam pelo proxy"],
   ["fnpagamentos","externas","para","sem o adquirente, nenhum cartão é autorizado"],
   ["proxy","oltp","para","sem o banco, o proxy não tem a quem repassar"],
   ["filas","barramento","fila","sem o barramento, nenhuma mensagem chega à fila"],
   ["fnavisos","filas","fila","sem mensagens na fila, nenhum aviso é disparado"],
   ["fnavisos","externas","para","sem o provedor de e-mail e SMS, nenhum aviso sai"],
   ["fnavisos","nosql","degrada","perde o histórico de avisos enviados"],
   ["lake","nosql","fila","as mudanças param de chegar e os relatórios desatualizam"],
   ["runtime","cicd","muda","nenhuma versão nova é publicada; o que roda continua"],
   ["runtime","iac","muda","as funções seguem rodando; só não dá para mudar gatilhos, permissões nem criar novas"],
   ["vpc","iac","muda","a rede segue funcionando; só não dá para mudar nem recriar"],
   ["proxy","vpc","para","o proxy fica dentro da rede privada"],
   ["oltp","vpc","para","o banco relacional fica dentro da rede privada"],
   ["oltp","storage","para","sem disco, o banco para"],
   ["microvm","servidor","para","a microVM é uma fatia de um servidor físico"],
   ["microvm","regiao","para","os ambientes de função ficam numa região da nuvem"],
   ["storage","servidor","para","os discos ficam em servidores físicos"],
   ["servidor","datacenter","para","o servidor fica num data center"],
   ["regiao","datacenter","para","cada zona da região é um ou mais data centers"],
   ["runtime","regiao","para","a plataforma de funções é um serviço regional"],
   ["gateway","regiao","para","o gateway fica na região"],
   ["nosql","regiao","para","o banco gerenciado fica na região"],
   ["oltp","regiao","para","o banco gerenciado fica na região"],
   ["proxy","regiao","para","o proxy fica na região"],
   ["barramento","regiao","para","o barramento fica na região"],
   ["filas","regiao","para","a fila fica na região"],
   ["orquestrador","regiao","para","o orquestrador fica na região"],
   ["lake","regiao","para","o data lake fica na região"]
  ],
  guards:{
   fibra:["provedor","O provedor desvia o tráfego por outra rota, mais longa: fica um pouco mais lento.","degrada"],
   gateway:[null,"O gateway gerenciado roda em várias zonas da região: a falha de uma parte dele não aparece para ninguém.","nada"],
   runtime:[null,"A plataforma de funções roda em várias zonas da região: perder uma zona não para as funções.","nada"],
   microvm:["runtime","A chamada que rodava nela falha, e a plataforma cria outro ambiente para a próxima, pagando um cold start.","degrada"],
   externas:["orquestrador","O fluxo de pagamento tenta de novo com intervalo crescente: as cobranças ficam pendentes e saem quando o parceiro volta.","degrada"],
   nosql:[null,"O banco gerenciado guarda cada escrita em várias zonas: perder uma não perde dados nem disponibilidade.","nada"],
   barramento:[null,"O barramento gerenciado roda em várias zonas da região: a falha de uma parte dele não perde eventos.","nada"],
   filas:[null,"A fila gerenciada guarda cada mensagem em várias zonas: a falha de uma parte dela não perde mensagens.","nada"],
   proxy:[null,"O proxy gerenciado roda em várias zonas da região: se uma parte dele falha, as conexões seguem pelas outras.","nada"],
   oltp:["proxy","A réplica em outra zona é promovida a principal, e o proxy segura as conexões durante a troca. As escritas falham ou esperam por alguns segundos e voltam.","degrada"],
   servidor:["runtime","A plataforma cria os ambientes em outros servidores, e as próximas chamadas nem percebem.","nada"],
   datacenter:["regiao","Multi-AZ: as outras zonas da região assumem o tráfego.","nada"],
   regiao:[null,"Multi-AZ: a queda de uma zona é absorvida pelas outras. Perder a região inteira exige um plano de recuperação em outra região.","nada"]
  }
 }
};
})();
