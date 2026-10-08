/* Estilo arquitetural: monólito.
 * Mesmo formato de microsservicos.js. As peças que não mudam entre os estilos
 * (rede, borda, infraestrutura, físico) são reaproveitadas de lá com pick(id, ajustes).
 * edges tem um tipo a mais: mem = chamada de função dentro do mesmo processo, sem rede.
 */
window.STRATA = window.STRATA || { styles: {} };

(function(){
const M=STRATA.styles.microsservicos.nodes;
const pick=(id,over)=>Object.assign({},M[id],over||{});

STRATA.styles.monolito={
 name:"monólito",
 desc:"Um único programa com todos os módulos dentro: um deploy, um processo e um banco. Mais simples de construir e operar; mais acoplado para crescer.",
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
lb:pick("lb",{
 what:"Distribui as requisições entre várias cópias idênticas do monólito e tira do caminho as que não respondem.",
 ax:{res:"Tira do ar a cópia doente sem o usuário perceber.",obs:"Conta requisições e erros 5xx: o primeiro termômetro do sistema."}}),

/* APLICAÇÃO */
frontend:pick("frontend",{
 what:"O código da tela. No monólito, costuma ser montado pelo próprio servidor (views) ou ser uma SPA publicada junto com ele.",
 inside:[["Views e templates","O servidor monta o HTML de cada tela."],["JavaScript da página","Interatividade no navegador, de pequenos scripts a uma SPA completa."],["Arquivos estáticos","CSS, imagens e JavaScript, servidos pela CDN."]],
 tech:["Blade","Razor","Thymeleaf","ERB","Hotwire","HTMX","React"],
 host:"Dentro do próprio monólito, com os arquivos estáticos na CDN.",
 fail:"Um erro de template quebra a tela, mesmo com o resto do sistema funcionando."}),
app:{l:"app",n:"Aplicação monolítica",t:"Um processo, todos os módulos",
 what:"Um único programa, com um único deploy, que contém todas as regras de negócio. Várias cópias idênticas rodam atrás do balanceador.",
 inside:[["Roteador do framework","Olha a URL e decide qual parte do código atende."],["Módulos","Pedidos, pagamentos, login: pastas e pacotes do mesmo código."],["ORM e pool de conexões","Todos os módulos dividem as mesmas conexões com o banco."],["Processo e threads","Um processo atende várias requisições em paralelo, com a memória compartilhada."]],
 tech:["Laravel","Ruby on Rails","Django","Spring Boot","ASP.NET Core"],host:"Container em VM, PaaS (Heroku, Render, Elastic Beanstalk) ou servidor próprio on-premises.",
 who:["back","arq","sre","qa"],fail:"Se o processo cai, todos os módulos caem juntos. Por isso rodam várias cópias atrás do balanceador.",
 ax:{obs:"Um log e um trace contam a história inteira: tudo acontece num processo só.",res:"Várias cópias idênticas atrás do balanceador."}},
auth:{l:"app",n:"Autenticação e sessão",t:"O login dentro do sistema",
 what:"O módulo que confere a senha, cria a sessão e reconhece o usuário a cada requisição pelo cookie.",
 inside:[["Senha com hash","Nunca se guarda a senha, só um hash lento como bcrypt ou Argon2."],["Sessão","O cookie leva um identificador; os dados da sessão ficam no servidor, no Redis ou no banco."],["Permissões","O que cada perfil pode ver e fazer."]],
 tech:["Laravel Sanctum","Devise","Django auth","Spring Security","ASP.NET Identity"],
 who:["back","si"],fail:"Ninguém consegue entrar nem continuar logado.",
 ax:{seg:"Hash forte de senha, cookie seguro (HttpOnly, Secure) e proteção contra CSRF."}},
pedidos:{l:"app",n:"Módulo de pedidos",t:"Regras de pedidos, sem rede no meio",
 what:"A parte do código que cria, consulta e cancela pedidos. Fala com os outros módulos chamando funções, no mesmo processo.",
 inside:[["Controller e rotas","Recebe a requisição já roteada pelo framework."],["Regras de negócio","O que é um pedido válido, quando pode ser cancelado."],["Modelos e ORM","Lê e grava nas tabelas do banco compartilhado."],["Fronteira do módulo","Num monólito modular, os outros módulos só usam a interface pública dele."]],
 tech:["PHP","Ruby","Python","Java","C#"],
 who:["back","qa","arq"],fail:"Um erro comum quebra só as telas de pedidos. Mas um vazamento de memória ou uma consulta que prende todas as threads derruba o processo inteiro, e com ele login, pagamentos e todo o resto.",
 ax:{obs:"Logs e métricas saem do mesmo processo que todos os outros módulos."}},
pagamentos:{l:"app",n:"Módulo de pagamentos",t:"Cobrança no mesmo deploy",
 what:"Cuida da cobrança e da conversa com adquirentes. Uma mudança aqui sobe junto com todo o resto no próximo deploy.",
 inside:[["Integração financeira","Conversa com adquirentes, bancos e Pix."],["Idempotência","Se a mesma cobrança chegar duas vezes, cobra uma vez só."],["Transação compartilhada","Pedido e pagamento podem ser gravados na mesma transação do banco: algo que os microsserviços perdem."]],
 tech:["PHP","Ruby","Python","Java","C#"],
 who:["back","qa","si"],fail:"Ninguém consegue pagar. Se o problema for de memória ou de threads, o processo inteiro cai junto.",
 ax:{seg:"Dados de cartão exigem PCI-DSS: tokenização e nunca guardar o número completo.",res:"Idempotência impede cobrança em dobro quando há retentativa."}},
notificacoes:{l:"app",n:"Módulo de notificações",t:"Avisos sem atrasar a resposta",
 what:"Monta os avisos de e-mail, SMS e push. Para não atrasar a resposta ao usuário, o envio vai para a fila de jobs.",
 inside:[["Templates","O texto de cada mensagem."],["Enfileiramento","Grava a tarefa de envio na fila e segue em frente."],["Preferências","Quem quer receber o quê, e por qual canal."]],
 tech:["Laravel Notifications","Action Mailer","Django"],
 who:["back"],fail:"A compra funciona; os avisos deixam de ser criados até o módulo voltar."},

/* INTEGRAÇÃO */
fila:{l:"int",n:"Fila de jobs",t:"Trabalho para depois",
 what:"Uma fila simples onde o monólito deixa tarefas demoradas, como enviar e-mails, para os workers processarem.",
 inside:[["Enfileirar","O módulo grava a tarefa e responde ao usuário na hora."],["Onde a fila mora","Geralmente no Redis ou numa tabela do próprio banco."],["Retentativa","Se a tarefa falha, volta para a fila com intervalo crescente."]],
 tech:["Sidekiq","Celery","Laravel Queues","Hangfire","RabbitMQ"],host:"Redis gerenciado, o próprio banco ou um broker como RabbitMQ.",
 who:["back","sre"],fail:"As tarefas não são enfileiradas: e-mails e rotinas param, e o código que enfileira precisa tratar o erro.",
 ax:{res:"Segura o tranco: se um worker cai, as tarefas esperam na fila.",obs:"O tamanho da fila denuncia quando os workers não dão conta."}},
worker:pick("worker",{t:"O mesmo código, outro processo",
 what:"Processos que rodam o mesmo código do monólito, mas em vez de atender requisições, consomem a fila de jobs.",
 inside:[["Mesmo código","Usa os mesmos módulos e o mesmo banco da aplicação."],["Consumo da fila","Pega uma tarefa, executa e marca como feita."],["Agendador","Dispara rotinas em horários definidos."]],
 tech:["Sidekiq","Celery","Laravel Horizon","Hangfire"],host:"Containers ou VMs separados da aplicação web, com a mesma imagem.",
 fail:"As tarefas acumulam na fila até os workers voltarem."}),
externas:pick("externas"),

/* DADOS */
cache:pick("cache",{
 what:"Guarda em memória as respostas mais pedidas e, muitas vezes, as sessões dos usuários.",
 fail:"Tudo fica mais lento e o banco recebe de uma vez a carga que o cache segurava. Se as sessões moram nele, todo mundo é deslogado."}),
oltp:pick("oltp",{t:"Um banco para tudo",
 what:"Guarda os dados de todos os módulos num só lugar, com garantia de consistência. Facilita relatórios e transações, mas acopla os módulos pelo esquema das tabelas.",
 fail:"Escritas param no sistema inteiro de uma vez. Por isso existem réplica e failover automático."}),
lake:pick("lake"),

/* PLATAFORMA */
cicd:pick("cicd",{fail:"Ninguém consegue publicar correções, nem as urgentes. E como o deploy é um só, toda mudança espera a mesma esteira."}),
iac:pick("iac"),
container:pick("container",{
 what:"Um pacote isolado com o monólito inteiro e tudo que ele precisa para rodar igual em qualquer lugar. A aplicação web e os workers usam a mesma imagem.",
 fail:"Uma imagem quebrada impede o sistema inteiro de subir."}),

/* INFRAESTRUTURA */
vm:pick("vm",{t:"Onde as cópias do monólito rodam",
 what:"Um computador virtual, fatiado de um servidor físico. Cada cópia do monólito roda numa delas, em geral dentro de um container.",
 fail:"O balanceador para de mandar tráfego para ela e as outras cópias atendem. Um grupo de autoescala sobe uma nova."}),
vpc:pick("vpc"),
storage:pick("storage"),
regiao:pick("regiao"),

/* FÍSICO */
servidor:pick("servidor"),
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
 ["navegador","tls","net","cifra"],["tls","lb","net","termina o TLS"],
 ["navegador","cdn","net","baixa CSS e JS"],["cdn","frontend","net","arquivos estáticos"],["navegador","frontend","net","executa"],
 // síncronas
 ["waf","lb","sync","filtrado"],["lb","app","sync","encaminha"],
 ["auth","cache","sync","sessão"],["auth","oltp","sync","usuários"],["pedidos","cache","sync","busca rápida"],
 ["pedidos","oltp","sync","consulta e grava"],["pagamentos","oltp","sync","grava"],["pagamentos","externas","sync","autoriza"],
 ["worker","oltp","sync","rotinas"],["worker","externas","sync","envia avisos"],
 // em memória
 ["app","auth","mem","confere a sessão"],["app","pedidos","mem","chama"],["app","pagamentos","mem","chama"],
 ["app","frontend","mem","renderiza"],["pedidos","pagamentos","mem","cobra o pedido"],["pagamentos","notificacoes","mem","avisa"],
 // assíncronas
 ["notificacoes","fila","async","enfileira"],["fila","worker","async","consome"],["oltp","lake","async","replica (CDC)"],
 // onde roda
 ["app","container","run","empacotado em"],["worker","container","run","mesma imagem"],["cicd","container","run","publica a imagem"],
 ["container","vm","run","roda em"],["iac","vm","run","cria"],["iac","vpc","run","cria"],
 ["vm","vpc","run","conectada à"],["vm","regiao","run","fica em"],
 ["oltp","storage","run","grava em"],["vm","servidor","run","fatia de"],["storage","servidor","run","discos de"],
 ["servidor","datacenter","run","fica em"],["datacenter","fibra","run","ligado por"]
 ],

 journey:[
 ["usuario","dispositivo","Você toca em “Meus pedidos”. O toque vira um evento no sistema operacional.",5],
 ["dispositivo","navegador","O navegador recebe o evento e pede a página de pedidos ao servidor.",10],
 ["navegador","dns","Primeiro, onde fica loja.com? O navegador pergunta ao DNS.",20],
 ["dns","navegador","O DNS responde com um endereço IP. Agora o navegador sabe para onde mandar.",10],
 ["navegador","roteador","O pedido, já cifrado pelo TLS, sai pelo Wi-Fi até o roteador.",5],
 ["roteador","provedor","Do roteador para o provedor de internet, pela fibra que chega na sua rua.",5],
 ["provedor","fibra","O provedor encaminha pelo backbone: pulsos de luz em fibra óptica até a região da nuvem.",15],
 ["fibra","waf","No data center, o primeiro filtro é o WAF: isso parece um ataque? Não. Pode passar.",3],
 ["waf","lb","O balanceador escolhe uma das cópias do monólito que está saudável e decifra o HTTPS.",2],
 ["lb","app","Chega ao monólito. O roteador do framework olha a URL /pedidos e sabe qual código chamar.",1],
 ["app","auth","Primeiro, o módulo de autenticação confere o cookie. É uma chamada de função, sem rede.",0],
 ["auth","cache","A sessão está guardada no Redis: uma consulta rápida pela rede interna.",1],
 ["cache","auth","Sessão válida: você é você.",1],
 ["app","pedidos","O monólito chama o módulo de pedidos. Mesma memória, mesmo processo: sem rede e sem JSON, leva microssegundos.",0],
 ["pedidos","oltp","Consulta no banco, que guarda as tabelas de todos os módulos. Um índice acha só os pedidos desse cliente.",25],
 ["oltp","pedidos","O banco devolve as linhas, e o ORM as transforma em objetos.",5],
 ["pedidos","app","O módulo devolve os pedidos para quem chamou, de novo sem sair do processo.",0],
 ["app","navegador","O monólito monta a resposta, que volta pelo mesmo caminho: balanceador, fibra, provedor, Wi-Fi. Pela internet, cifrada o tempo todo.",42],
 ["navegador","usuario","A tela mostra os pedidos. Do toque até aqui, cerca de 170 milissegundos: sem saltos de rede entre serviços, o caminho interno fica mais curto.",16]
 ],

 /* Modo falha: mesmo formato de microsservicos.js.
  * O 5º campo "raiz" faz a dependência valer só quando a própria peça é a que caiu:
  * um módulo em pane (memória, threads) derruba o processo, mas um módulo que só
  * está sem banco não derruba. */
 failure:{
  samples:["pedidos","app","cache","oltp","fila","datacenter"],
  deps:[
   ["usuario","dispositivo","para","sem o aparelho, não há como usar o sistema"],
   ["usuario","navegador","para","é pelo navegador ou app que a pessoa usa o sistema"],
   ["navegador","dispositivo","para","o navegador roda no aparelho"],
   ["navegador","frontend","para","sem o código da interface, a tela não aparece"],
   ["navegador","cdn","para","CSS e JavaScript da tela vêm da CDN"],
   ["navegador","dns","para","sem DNS, o navegador não acha o endereço do sistema"],
   ["navegador","tls","para","com o certificado inválido, o navegador bloqueia o acesso"],
   ["navegador","provedor","para","sem provedor, não há internet"],
   ["navegador","roteador","degrada","sem Wi-Fi, sobra o 4G e 5G ou o cabo"],
   ["navegador","radio","degrada","sem sinal sem fio, só quem está no cabo continua"],
   ["navegador","waf","para","bloqueadas no WAF, as requisições não chegam à nuvem"],
   ["navegador","lb","para","sem balanceador, as requisições não chegam ao monólito"],
   ["navegador","app","para","todas as telas e dados vêm do monólito"],
   ["navegador","auth","para","sem login, ninguém usa o sistema"],
   ["navegador","pedidos","degrada","a tela de pedidos falha, o resto funciona"],
   ["navegador","pagamentos","degrada","não dá para pagar, mas dá para navegar"],
   ["provedor","fibra","para","o backbone do provedor é de fibra"],
   ["provedor","cobre","degrada","quem chega pelo cobre (DSL, cabo coaxial) fica sem internet"],
   ["provedor","satelite","degrada","quem depende de satélite, como zonas rurais, fica sem internet"],
   ["frontend","app","para","as telas são montadas pelo monólito"],
   ["auth","app","para","o módulo roda dentro do processo do monólito"],
   ["pedidos","app","para","o módulo roda dentro do processo do monólito"],
   ["pagamentos","app","para","o módulo roda dentro do processo do monólito"],
   ["notificacoes","app","para","o módulo roda dentro do processo do monólito"],
   ["app","auth","para","um vazamento de memória ou threads presas no módulo derrubam o processo inteiro","raiz"],
   ["app","pedidos","para","um vazamento de memória ou threads presas no módulo derrubam o processo inteiro","raiz"],
   ["app","pagamentos","para","um vazamento de memória ou threads presas no módulo derrubam o processo inteiro","raiz"],
   ["app","notificacoes","para","um vazamento de memória ou threads presas no módulo derrubam o processo inteiro","raiz"],
   ["auth","cache","para","as sessões ficam no Redis: sem ele, ninguém continua logado"],
   ["auth","oltp","degrada","novos logins falham: usuários e senhas ficam no banco"],
   ["pedidos","oltp","para","sem banco, não lê nem grava pedidos"],
   ["pedidos","cache","degrada","sem cache, cada leitura vai ao banco e tudo fica mais lento"],
   ["pedidos","pagamentos","degrada","o pedido é criado, mas a cobrança falha"],
   ["pagamentos","oltp","para","sem banco, não registra pagamentos"],
   ["pagamentos","externas","para","sem o adquirente, nenhum cartão é autorizado"],
   ["pagamentos","notificacoes","degrada","o pagamento é feito, mas o aviso não é criado"],
   ["notificacoes","fila","degrada","os avisos não conseguem ser enfileirados"],
   ["worker","fila","fila","sem a fila, os workers não recebem tarefas"],
   ["worker","oltp","para","as tarefas leem e gravam no banco"],
   ["worker","externas","para","sem o provedor de e-mail e SMS, nenhum aviso sai"],
   ["lake","oltp","fila","as mudanças param de chegar e os relatórios desatualizam"],
   ["app","container","para","o monólito roda dentro de um container"],
   ["worker","container","para","os workers usam a mesma imagem"],
   ["container","cicd","muda","nenhuma imagem nova é publicada; o que roda continua"],
   ["container","vm","para","o container roda numa máquina virtual"],
   ["vpc","iac","muda","a rede segue funcionando; só não dá para mudar nem recriar"],
   ["vm","vpc","para","sem rede virtual, as máquinas ficam isoladas"],
   ["vm","servidor","para","a VM é uma fatia de um servidor físico"],
   ["vm","regiao","para","as máquinas ficam numa região da nuvem"],
   ["oltp","storage","para","sem disco, o banco para"],
   ["storage","servidor","para","os discos ficam em servidores físicos"],
   ["servidor","datacenter","para","o servidor fica num data center"],
   ["regiao","datacenter","para","cada zona da região é um ou mais data centers"],
   ["oltp","regiao","para","o banco gerenciado fica na região"],
   ["cache","regiao","para","o cache gerenciado fica na região"],
   ["fila","regiao","para","a fila fica na região"],
   ["lake","regiao","para","o data lake fica na região"],
   ["lb","regiao","para","o balanceador fica na região"]
  ],
  guards:{
   app:["lb","Várias cópias do monólito atrás do balanceador: se uma instância cai, as outras atendem.","nada"],
   fibra:["provedor","O provedor desvia o tráfego por outra rota, mais longa: fica um pouco mais lento.","degrada"],
   lb:[null,"Balanceadores trabalham em par: se um cai, o outro assume.","nada"],
   externas:["pagamentos","Circuit breaker e fila de retentativa: os pagamentos ficam pendentes e são tentados de novo quando o parceiro volta.","degrada"],
   oltp:[null,"A réplica em outra zona é promovida a principal. As escritas falham durante a troca, que em serviços gerenciados leva de segundos a um ou dois minutos, e voltam.","degrada"],
   container:[null,"A nova imagem não passa no health check e as cópias antigas seguem no ar.","nada"],
   vm:["lb","O balanceador tira a VM do rodízio e as outras cópias atendem; a autoescala sobe uma nova.","nada"],
   servidor:[null,"O provedor de nuvem reinicia as VMs em outro servidor, e as outras cópias do monólito atendem enquanto isso.","nada"],
   datacenter:["regiao","Multi-AZ: as outras zonas da região assumem o tráfego.","nada"],
   regiao:[null,"Multi-AZ: a queda de uma zona é absorvida pelas outras. Perder a região inteira exige um plano de recuperação em outra região.","nada"]
  }
 }
};
})();
