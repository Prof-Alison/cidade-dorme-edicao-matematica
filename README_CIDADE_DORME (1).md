# CIDADE DORME --- EDIÇÃO MATEMÁTICA

## Documentação de continuidade do projeto

**Última atualização:** setembro de 2026

## 1. Objetivo

Projeto educacional multiplayer desenvolvido com Node.js, Express e
Socket.IO. É uma adaptação matemática de Cidade Dorme/Máfia/Lobisomem.

O objetivo é integrar conteúdos matemáticos à dinâmica do jogo, com
professor controlando a partida e alunos participando em rede.

## 2. Estrutura do projeto

``` text
SEU_PROJETO/
├── server.js
├── package.json
├── package-lock.json
├── node_modules/
└── public/
    ├── salas.js
    ├── salas/
    │   ├── sala01.js
    │   └── sala02.js
    ├── professor.html
    ├── professor.js
    ├── aluno.html
    ├── aluno.js
    └── estilo.css
```

### Arquivos

-   `server.js`: núcleo do jogo, salas, jogadores, fases, papéis,
    pontuação, votação e Socket.IO.
-   `professor.html` / `professor.js`: interface e lógica do professor.
-   `aluno.html` / `aluno.js`: interface e lógica do aluno.
-   `estilo.css`: aparência das interfaces.
-   `salas.js`: catálogo de salas.
-   `salas/sala01.js`: soma de frações com mesmo denominador.
-   `salas/sala02.js`: soma de frações com denominadores diferentes.

## 3. Salas matemáticas

### SALA01

**Soma de frações com mesmo denominador.**

### SALA02

**Soma de frações com denominadores diferentes.**

A SALA02 já foi testada e corrigida.

As respostas são atualmente tratadas internamente como strings, por
exemplo `2/5`.

### Melhoria futura

Mostrar frações visualmente empilhadas, em vez de apenas `2/5`.

Exemplo planejado:

``` html
<span class="fracao">
    <span class="numerador">2</span>
    <span class="denominador">5</span>
</span>
```

Essa melhoria deve ser feita somente depois da estabilização da lógica.

## 4. Fluxo da partida

``` text
AGUARDANDO_ALUNOS
        ↓
DIA
        ↓
BÔNUS
        ↓
VOTAÇÃO
        ↓
NOVO DIA
        ↓
...
        ↓
FIM
```

O professor também deve poder finalizar a partida manualmente.

## 5. Entrada

Professor:

`http://localhost:3000/professor.html`

Aluno:

`http://192.168.100.49:3000/aluno.html`

O IP pode mudar conforme a rede.

O professor cria a sala e recebe um código de acesso. Os alunos entram
informando nome e código. O aluno não escolhe professor.

Os nomes devem ser únicos.

## 6. Fase de espera

Enquanto a partida não começou:

-   alunos podem entrar;
-   professor vê nomes;
-   professor vê quantidade;
-   professor pode remover alunos;
-   professor define a duração;
-   professor inicia o DIA.

Durações previstas: 1, 3, 5 e 10 minutos.

O cronômetro começa somente quando o professor clicar em iniciar.

## 7. Papéis

Papéis:

-   CIDADÃO
-   ANJO
-   ASSASSINO

O papel não deve aparecer de forma escancarada. A instrução da fase
BÔNUS deve permitir ao aluno entender sua função sem tornar o papel
facilmente identificável por colegas.

### Quantidade

De 1 a 20 jogadores:

-   1 Assassino
-   1 Anjo
-   restante Cidadãos

Mais de 20 jogadores:

-   2 Assassinos
-   2 Anjos
-   restante Cidadãos

Essa regra foi definida após teste com 25 jogadores.

## 8. DIA

Durante o DIA, alunos vivos recebem questões matemáticas aleatórias e
podem responder várias questões até o cronômetro terminar.

Pontuação:

-   correta: `+10`
-   incorreta: `-5`

A pontuação começa em zero a cada partida.

## 9. BÔNUS

O BÔNUS tem máximo de **10 segundos**.

### Cidadão

Recebe questão matemática normal.

### Anjo

Escolhe um jogador vivo para proteger.

### Assassino

Escolhe um jogador vivo para eliminar.

As ações usam como opções até os 3 jogadores vivos com menor pontuação,
excluindo o próprio jogador.

Se não houver resposta em 10 segundos:

-   Cidadão: sem efeito;
-   Anjo: sem proteção;
-   Assassino: sem eliminação.

Com dois Assassinos/Anjos, os dois devem poder agir, inclusive
escolhendo o mesmo ou diferentes alvos.

## 10. Votação

A votação tem máximo de **15 segundos**.

-   somente jogadores vivos votam;
-   ninguém pode votar em si mesmo;
-   se todos votarem antes de 15 segundos, termina imediatamente;
-   votos recebidos após o encerramento não contam;
-   empate: ninguém é eliminado.

O professor possui acompanhamento da votação sem revelar os alvos dos
votos.

Exemplo:

``` text
🗳️ ACOMPANHAMENTO DA VOTAÇÃO

0 de 5 votos registrados

Aluno 1    ⏳ AGUARDANDO
Aluno 2    ✓ VOTOU
Aluno 3    ⏳ AGUARDANDO
```

## 11. Eliminações e vitória

Jogador eliminado:

-   fica inativo;
-   não responde;
-   não vota;
-   não participa de ações;
-   continua registrado na partida.

Se não houver mais Assassinos vivos, a cidade vence.

Mensagem da cidade:

> HOJE ESSA CIDADE IRÁ DORMIR MAIS TRANQUILA

Se jogadores vivos que não são Assassinos forem em quantidade menor ou
igual à quantidade de Assassinos vivos, os Assassinos vencem.

Mensagem dos Assassinos:

> INFELIZMENTE O TERRÍVEL ASSASSINO PERMANECERÁ A SOLTA EM BUSCA DE
> NOVAS VÍTIMAS

Quando um cidadão inocente for eliminado pela votação:

> HOJE COMETEMOS UMA INJUSTIÇA E UM INOCENTE FOI ASSASSINADO

Existe também a animação:

``` text
CIDADE DORME
↓
CIDADE ACORDA
```

## 12. Resultados finais

O professor deverá ter uma tela final com:

-   Aluno
-   Pontuação
-   Acertos
-   Erros
-   Questões respondidas
-   Porcentagem de acertos
-   Ações de bônus
-   Votos realizados
-   Situação

Porcentagem planejada:

``` text
acertos / (acertos + erros) × 100
```

Questões não respondidas ficam fora do denominador.

## 13. Finalização manual

Deve existir no professor um botão:

`FINALIZAR PARTIDA`

Ao clicar:

1.  partida encerra;
2.  cronômetros são encerrados;
3.  novas ações são bloqueadas;
4.  professor recebe resultados;
5.  painel final mostra os dados dos alunos.

A lógica do evento no servidor foi planejada, mas a interface ainda
precisa ser conectada e testada.

## 14. Reconexão

O projeto precisa permitir que aluno e professor recarreguem ou percam
conexão e retomem a partida.

Foi planejado o uso de `clientToken`, pois `socket.id` muda quando o
navegador reconecta.

O servidor já possui parte dessa lógica, mas ela ainda precisa ser
testada de ponta a ponta.

## 15. Estado do jogador

O servidor precisa preservar:

-   nome;
-   pontuação;
-   papel;
-   vivo/eliminado;
-   questão atual;
-   respostas;
-   acertos;
-   erros;
-   ações de bônus;
-   votos;
-   conexão.

## 16. Testes já realizados

### Teste com 6 jogadores

Foi testado:

-   2 responderam corretamente;
-   4 não responderam;
-   os que responderam corretamente não eram Assassinos;
-   mensagens compartilhadas;
-   regras de vitória dos Assassinos;
-   acompanhamento da partida.

### Teste com 25 jogadores

Foi descoberto que a versão anterior ainda tinha somente 1 Assassino e 1
Anjo.

Por isso foi criada a regra atual de mais de 20 jogadores:

`2 Assassinos + 2 Anjos`.

## 17. Estado atual e problema

A última tentativa de atualizar o `server.js` apresentou:

``` text
SyntaxError: Unexpected token ')'
```

O VS Code apontou erros próximos das linhas:

-   970
-   972
-   974
-   983

O primeiro erro provavelmente provoca os demais.

A região problemática está próxima da função `enviarNovaQuestaoDia()`.

**A versão quebrada não deve ser considerada a versão estável.**

## 18. Última versão estável

Antes de continuar o desenvolvimento:

1.  recuperar a última versão funcional;
2.  fazer backup;
3.  colocar a versão funcional no GitHub;
4.  testar novamente;
5.  somente então aplicar as novas alterações.

Não começar o projeto do zero.

## 19. Próxima sequência de desenvolvimento

1.  Recuperar `server.js` funcional.
2.  Fazer backup no GitHub.
3.  Implementar/testar 2 Assassinos + 2 Anjos.
4.  Implementar/testar BÔNUS de 10 segundos.
5.  Implementar/testar votação de 15 segundos.
6.  Criar botão `FINALIZAR PARTIDA`.
7.  Criar painel final de resultados.
8.  Finalizar reconexão de aluno e professor.
9.  Melhorar visualização das frações.
10. Automatizar descoberta das salas `sala01.js`, `sala02.js`, etc.

## 20. Regra de desenvolvimento

Não reescrever funcionalidades já funcionando sem necessidade.

Trabalhar assim:

``` text
1 alteração
↓
testar
↓
confirmar
↓
backup
↓
próxima alteração
```

Quando uma alteração puder ser feita em um arquivo, evitar modificar
vários arquivos ao mesmo tempo.

## 21. GitHub

Recomenda-se criar versões/commits claros, por exemplo:

``` text
versao-estavel-salas-01-02
adiciona-2-assassinos-2-anjos
adiciona-cronometro-bonus-votacao
adiciona-resultados-finais
```

## 22. Comandos

Iniciar:

``` bash
node server.js
```

Verificar sintaxe:

``` bash
node --check server.js
```

Se aparecer `EADDRINUSE`, a porta 3000 já está sendo utilizada por outro
processo.

## 23. Resumo para outra IA

Este projeto é o **Cidade Dorme --- Edição Matemática**, feito em
Node.js + Express + Socket.IO.

Já existem salas matemáticas, professor, alunos, DIA, BÔNUS, votação,
papéis, pontuação, eliminações e mensagens de vitória.

SALA01 = soma de frações com mesmo denominador.

SALA02 = soma de frações com denominadores diferentes.

De 1 a 20 jogadores = 1 Assassino + 1 Anjo.

Mais de 20 = 2 Assassinos + 2 Anjos.

BÔNUS = máximo 10 segundos.

VOTAÇÃO = máximo 15 segundos.

Professor deve poder finalizar a partida antecipadamente.

Ao final, professor deve ver resultados dos alunos, incluindo pontuação
e porcentagem de acertos.

Existe necessidade de reconexão de alunos e professor.

A última atualização do `server.js` apresentou erro de sintaxe. A
prioridade é preservar a última versão funcional e continuar a partir
dela.

**Não refazer o projeto do zero.**
