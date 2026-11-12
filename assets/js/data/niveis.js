/* Explicação em níveis: a primeira coisa que o painel mostra, antes do conteúdo técnico.
 * STRATA.levels.base[id]   = [em uma frase, como funciona (analogia do dia a dia)], vale para todos os estilos
 * STRATA.levels[estilo][id] sobrepõe a base quando a peça muda de sentido naquele estilo
 * (no monólito, "pedidos" é um módulo; no serverless, o gateway é gerenciado).
 * Linguagem de quem nunca viu arquitetura: sem jargão na frase, e a analogia não pode ensinar errado. */
window.STRATA = window.STRATA || { styles: {} };

STRATA.levels={
base:{
 usuario:["É quem usa o sistema: a pessoa com um objetivo, como ver os próprios pedidos.","É o cliente na loja. A cozinha, o estoque e o caixa existem para atender o que ele pediu."],
 dispositivo:["É o celular ou o computador onde a pessoa toca e lê.","É o balcão da loja: é ali que o cliente faz o pedido e recebe a resposta."],
 navegador:["É o programa que mostra o site ou o app e conversa com o servidor.","É o garçom: anota o pedido do cliente, leva até a cozinha e traz o prato montado."],
 roteador:["É o aparelho que liga a rede da sua casa à internet.","É a portaria do prédio: todo mundo que sai ou chega passa por ela."],
 provedor:["É a empresa que vende a internet e leva seus dados até o resto do mundo.","É a concessionária de estradas: liga a rua da sua casa às rodovias que vão para outras cidades."],
 dns:["Traduz o nome de um site, como loja.com, no endereço numérico do servidor.","É a lista de contatos do celular: você procura pelo nome e ela devolve o número para ligar."],
 tls:["Cifra a conversa entre o app e o servidor, para ninguém no caminho conseguir ler.","É um envelope lacrado com selo: só o destinatário abre, e o selo prova quem mandou."],
 cdn:["Guarda cópias da parte visual do site em servidores perto de quem acessa.","É ter filiais da loja em várias cidades com os produtos mais procurados, para ninguém precisar ir até a fábrica."],
 waf:["Inspeciona cada pedido que chega e barra os que parecem ataque.","É o segurança da porta, que revista quem entra e barra quem traz algo perigoso."],
 lb:["Distribui os pedidos entre várias cópias do sistema, para nenhuma ficar sobrecarregada.","É a fila única do banco que chama o próximo cliente para o caixa que ficou livre."],
 gateway:["É a porta de entrada única das APIs: confere quem chama e encaminha cada pedido para o lugar certo.","É a recepção de um prédio comercial: confere o crachá, registra a visita e indica o andar certo."],
 idp:["Confere quem é a pessoa no login e entrega um crachá digital que ela usa nas próximas chamadas.","É o balcão que confere seu documento uma vez e te dá uma pulseira; depois, basta mostrar a pulseira."],
 frontend:["É o código das telas, que roda dentro do navegador ou do app.","É a vitrine e o cardápio da loja: tudo que o cliente vê e toca."],
 bff:["É uma camada que junta dados de vários serviços no formato que cada tela precisa.","É o atendente que busca coisas em vários setores e entrega tudo num pacote só, pronto para o cliente."],
 pedidos:["É o programa que cuida só dos pedidos: criar, consultar e cancelar.","É o setor de pedidos de uma empresa, com equipe e arquivo próprios."],
 pagamentos:["É o programa que cobra o cliente e conversa com bancos e operadoras de cartão.","É o caixa da loja, que passa o cartão e confere com o banco se a compra foi aprovada."],
 notificacoes:["Avisa o cliente por e-mail, SMS ou notificação quando algo acontece.","É o carteiro do sistema: quando um setor avisa que algo aconteceu, ele leva a mensagem até o cliente."],
 kafka:["É um mural onde os serviços publicam o que aconteceu; quem se interessa lê e reage.","É o quadro de avisos do escritório: quem tem novidade pendura um aviso, e cada setor lê quando puder."],
 worker:["São programas que fazem trabalhos demorados em segundo plano, fora da conversa com o usuário.","É a equipe dos bastidores, que lava a louça e arruma o estoque enquanto o salão atende os clientes."],
 externas:["São sistemas de outras empresas dos quais o seu depende, como bancos e parceiros.","São os fornecedores da loja: você depende deles, mas não manda na fábrica deles."],
 cache:["Guarda numa memória rápida as respostas mais pedidas, para não buscar tudo de novo.","É o caderninho do atendente com as respostas que todo mundo pergunta, para não ir ao arquivo toda vez."],
 oltp:["É o banco de dados que guarda as informações em tabelas e não deixa nada ser gravado pela metade.","É um arquivo de fichários: cada registro tem seu lugar, e uma ficha nunca fica preenchida pela metade."],
 nosql:["São bancos de dados que guardam a informação em formatos mais flexíveis que tabelas.","É guardar cada cliente numa pasta própria com tudo dentro, em vez de espalhar os dados por várias planilhas."],
 busca:["Permite procurar palavras em milhões de registros em instantes.","É o índice remissivo no fim de um livro: diz em que páginas cada palavra aparece."],
 lake:["Guarda uma cópia histórica dos dados para relatórios e análises.","É o arquivo morto da empresa: não serve para atender o cliente agora, mas é onde se descobre o que aconteceu no ano."],
 cicd:["É a esteira automática que testa o código novo e coloca no ar.","É a linha de montagem com controle de qualidade: cada peça é testada antes de chegar à loja."],
 iac:["É descrever servidores, redes e permissões em arquivos, em vez de configurar tudo na mão.","É a planta da casa: com ela, dá para construir de novo igualzinho quantas vezes for preciso."],
 container:["É um pacote com o programa e tudo de que ele precisa, que roda igual em qualquer máquina.","É um contêiner de navio: o que está dentro chega intacto, não importa o navio ou o porto."],
 pod:["É a menor unidade que o Kubernetes põe para rodar: um ou mais containers juntos.","É um apartamento: os moradores, que são os containers, dividem o mesmo endereço e a mesma porta."],
 k8s:["É o sistema que decide onde cada container roda, reinicia o que cai e cria cópias quando a carga aumenta.","É o gerente de um restaurante, que distribui os cozinheiros nas bancadas e chama reforço quando enche."],
 mesh:["É uma camada que protege e mede todas as conversas entre os serviços, sem mudar o código deles.","São os intérpretes e seguranças que acompanham cada conversa entre os setores de uma empresa."],
 vm:["É um computador virtual: uma fatia de um computador físico maior.","É um apartamento num prédio: parece uma casa inteira, mas divide a estrutura com os vizinhos."],
 vpc:["É a rede privada do sistema dentro da nuvem, com regras de quem pode falar com quem.","É um condomínio fechado: as casas conversam entre si, e a portaria decide quem entra de fora."],
 storage:["São os discos onde os dados ficam gravados de verdade.","É o depósito onde as caixas ficam guardadas, mesmo quando a loja fecha."],
 regiao:["É onde a nuvem fica no mapa: regiões pelo mundo, cada uma com prédios independentes.","É ter a loja em vários bairros da mesma cidade: se falta luz num, os outros continuam abertos."],
 servidor:["É o computador físico, com processador, memória e discos, onde tudo acaba rodando.","É a cozinha de verdade, com fogão e geladeira, onde a comida é feita."],
 datacenter:["É o prédio cheio de servidores, com energia de reserva, refrigeração e segurança.","É uma fábrica: um galpão vigiado, com gerador próprio, cheio de máquinas trabalhando o dia todo."],
 fibra:["São fios de vidro que levam dados como pulsos de luz, entre cidades e continentes.","É uma rodovia de luz: os dados viajam como piscadas de lanterna dentro de um fio de vidro."],
 cobre:["São fios de metal que levam dados como sinais elétricos, como o cabo de rede.","É como o fio do telefone fixo: a informação viaja como eletricidade."],
 radio:["São ondas invisíveis que levam dados pelo ar, como o Wi-Fi, o 4G e o 5G.","É como uma rádio FM: o sinal viaja pelo ar até a antena que está sintonizada nele."],
 satelite:["Leva internet pelo espaço até lugares aonde o cabo não chega.","É um espelho no céu: o sinal sobe da antena, é rebatido lá em cima e desce longe dali."]
},
monolito:{
 app:["É um único programa com todas as partes da loja dentro: login, pedidos, pagamentos e avisos.","É um restaurante pequeno em que a mesma equipe, na mesma cozinha, faz tudo: atende, cozinha e cobra."],
 auth:["É a parte do sistema que confere a senha e lembra que você já entrou.","É a recepção que confere seu documento na entrada e depois te reconhece pela pulseira."],
 pedidos:["É a parte do programa que cuida dos pedidos, dentro do mesmo sistema que todo o resto.","É um setor dentro da mesma sala: para falar com o caixa, basta virar a cadeira."],
 pagamentos:["É a parte do programa que cobra o cliente e conversa com bancos e operadoras de cartão.","É o caixa da loja, no mesmo salão, que confere com o banco se a compra foi aprovada."],
 notificacoes:["É a parte do programa que prepara os avisos e deixa o envio para depois.","É escrever o bilhete e deixar na caixa de saída, para alguém entregar enquanto você atende o próximo cliente."],
 fila:["É uma lista de tarefas esperando alguém para fazer, sem atrasar o atendimento.","É o espeto de comandas da cozinha: os pedidos ficam pendurados em ordem até um cozinheiro pegar."],
 worker:["São cópias do mesmo programa que, em vez de atender pessoas, fazem as tarefas da fila.","São os cozinheiros que pegam as comandas do espeto e preparam os pratos nos bastidores."],
 oltp:["É o banco de dados único onde todas as partes do sistema guardam suas informações.","É um arquivo central usado por todos os setores: prático, mas todos dependem da mesma organização."]
},
serverless:{
 gateway:["É a porta de entrada das APIs, oferecida pelo provedor: confere quem chama e aciona a função certa.","É uma recepção terceirizada: confere o crachá e chama o especialista certo, sem você manter recepcionista."],
 fnpedidos:["É um pedaço pequeno de código que só roda quando alguém pede para ver ou criar pedidos.","É um profissional sob demanda: só aparece quando é chamado e só cobra pelo tempo de trabalho."],
 fnpagamentos:["É a função que cobra o pedido, preparada para não cobrar duas vezes se for chamada de novo.","É o caixa que anota o número de cada compra: se a mesma compra passar de novo, ele não cobra outra vez."],
 fnavisos:["É a função que acorda quando chegam mensagens na fila e envia os avisos ao cliente.","É o entregador que só sai quando há encomendas na caixa e leva várias de uma vez."],
 barramento:["É o serviço do provedor que recebe os fatos publicados e entrega cada um a quem se interessa.","É uma central de correios: recebe as cartas e, pelo endereço, sabe para quais setores mandar cópia."],
 filas:["Guarda as mensagens até a função dar conta delas, mesmo quando chegam muitas de uma vez.","É a senha de atendimento: chegou muita gente, cada um pega um número e espera sua vez, sem confusão."],
 orquestrador:["Conduz um processo de vários passos e lembra em que ponto cada pedido está.","É o gerente de projeto com um checklist: sabe o que já foi feito, o que falta e o que fazer se algo der errado."],
 proxy:["Fica entre as funções e o banco e reaproveita poucas conexões para atender muitas funções.","É uma central telefônica com poucas linhas: em vez de cada pessoa ter a sua, todos usam as que estão livres."],
 runtime:["É o serviço do provedor que roda as funções quando alguém chama e cobra só pelo tempo de uso.","É como chamar um carro por aplicativo: você não tem carro, chama quando precisa e paga só pela corrida."],
 microvm:["É um computador virtual minúsculo, criado em frações de segundo para rodar uma função isolada das outras.","É um quarto de hotel: cada hóspede tem o seu, trancado, e o quarto é arrumado de novo para o próximo."],
 nosql:["É o banco de dados principal das funções, que cresce sozinho conforme o uso.","É um armário que aumenta sozinho quando chega mais coisa, sem ninguém precisar comprar móvel novo."]
}
};
