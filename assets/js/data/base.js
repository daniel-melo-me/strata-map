/* Dados comuns a todos os estilos arquiteturais: camadas, personas e eixos. */
window.STRATA = window.STRATA || { styles: {} };

STRATA.layers=[
 {id:"exp",n:"Experiência",q:"O que a pessoa vê e toca"},
 {id:"rede",n:"Rede e internet",q:"Como a mensagem viaja"},
 {id:"borda",n:"Borda do sistema",q:"Quem pode entrar, e por onde"},
 {id:"app",n:"Aplicação",q:"Onde as regras de negócio rodam"},
 {id:"int",n:"Integração e eventos",q:"Como os sistemas conversam"},
 {id:"dados",n:"Dados",q:"Onde a informação mora"},
 {id:"plat",n:"Plataforma",q:"Como o código é empacotado, entregue e orquestrado"},
 {id:"infra",n:"Infraestrutura",q:"As máquinas por trás da nuvem"},
 {id:"fis",n:"Físico",q:"Os meios que carregam os bits: luz, eletricidade e ondas"}
];

STRATA.personas={
 ux:["Produto e UX","Decide o que construir e como a pessoa vai usar. Vive na superfície, mas precisa saber o custo do que pede lá embaixo."],
 front:["Dev front-end","Constrói a interface que roda no navegador e consome as APIs."],
 back:["Dev back-end","Escreve as regras de negócio, as APIs e a integração com dados e eventos."],
 qa:["QA","Garante que cada camada faz o que promete, do clique ao banco."],
 arq:["Arquiteto de solução","Desenha como as peças se encaixam e escolhe os trade-offs."],
 devops:["DevOps","Automatiza o caminho do código até produção: pipeline, containers, infraestrutura como código."],
 sre:["SRE","Mantém tudo de pé: disponibilidade, latência, alertas, capacidade e resposta a incidentes."],
 dba:["DBA","Cuida dos bancos: desempenho, backup, réplicas e integridade."],
 dados:["Dados","Arquiteto e engenheiro de dados: modelam, movem e disponibilizam a informação para análise."],
 si:["Segurança da informação","Atravessa todas as camadas: identidade, criptografia, rede, código e prédio."],
 infra:["Infra e redes","Cuida das máquinas, redes, links e data centers que sustentam tudo."]
};

STRATA.axes={
 seg:["Segurança","Atravessa todas as camadas: cifrar na rede, filtrar na borda, autenticar no gateway, isolar na rede virtual, analisar o código no pipeline, trancar o prédio. As peças marcadas em vermelho são onde ela age."],
 obs:["Observabilidade","Cada peça emite logs, métricas e traces. Um trace segue a mesma requisição por todos os serviços, exatamente como o pacote que você vê andando no mapa."],
 res:["Resiliência","Nada pode ser ponto único de falha. Réplicas, balanceamento, filas que seguram o tranco, circuit breakers e outra zona pronta para assumir."]
};

