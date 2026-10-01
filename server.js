const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");


const SALAS_DISPONIVEIS = require("./public/salas.js");


/* =========================================================
   SERVIDOR
========================================================= */



const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

function criarEstadoVotacaoProfessor(sessao) {

    const jogadoresVivos =
        Object.values(sessao.jogadores)
            .filter(jogador => jogador.eVivo === true)
            .map(jogador => ({
                jogadorID: jogador.id,
                nome: jogador.nome,
                eVivo: jogador.eVivo,
                votou: jogador.voto !== null
            }));


    const votosRegistrados =
        jogadoresVivos.filter(
            jogador => jogador.votou === true
        ).length;


    return {
        fase: sessao.fase,

        quantidadeVivos:
            jogadoresVivos.length,

        votosRegistrados,

        jogadores:
            jogadoresVivos
    };

}

function enviarEstadoVotacaoProfessor(sessao) {

    if (!sessao) {
        return;
    }


    if (!sessao.professorId) {
        return;
    }


    io.to(sessao.professorId).emit(
        "estadoVotacaoProfessor",
        criarEstadoVotacaoProfessor(sessao)
    );

}


/* =========================================================
   ARQUIVOS PÚBLICOS
========================================================= */

app.use(express.static("public"));


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const PORTA = process.env.PORT || 3000;

const DURACOES_VALIDAS = [
    60,
    180,
    300,
    600
];

const TEMPO_ESPERA_PROFESSOR = 5 * 60 * 1000;

const TEMPO_RETOMADA_ALUNO = 10 * 60 * 1000;

/*
    Tempo da animação/noite.

    Primeiro:
    CIDADE DORME

    Depois:
    CIDADE ACORDA

    Depois:
    anúncio da morte/resultado.
*/

const TEMPO_CIDADE_DORME = 3000;


/* =========================================================
   SESSÕES ATIVAS
========================================================= */

const sessoes = {};


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function normalizarNome(nome) {

    return String(nome || "")
        .trim()
        .replace(/\s+/g, " ");

}


function chaveNome(nome) {

    return normalizarNome(nome)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


function normalizarCodigo(codigo) {

    return String(codigo || "")
        .trim()
        .toUpperCase()
        .replace(/\s/g, "");

}


/* =========================================================
   GERAR TOKEN
========================================================= */

function gerarToken() {

    return crypto
        .randomBytes(16)
        .toString("hex");

}


/* =========================================================
   GERAR CÓDIGO DA SALA
========================================================= */

function gerarCodigoAcesso() {

    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo;

    do {

        codigo = "";

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const indice =
                Math.floor(
                    Math.random() *
                    caracteres.length
                );

            codigo +=
                caracteres[indice];

        }

    } while (
        sessoes[codigo]
    );

    return codigo;
}


/* =========================================================
   LOCALIZAR SALA CADASTRADA
========================================================= */

function obterCadastroSala(codigoSala) {

    const codigo =
        normalizarCodigo(codigoSala);

    return SALAS_DISPONIVEIS.find(
        sala =>
            normalizarCodigo(
                sala.codigo
            ) === codigo
    );

}


/* =========================================================
   CARREGAR ARQUIVO DA SALA
========================================================= */

function carregarConfiguracaoSala(codigoSala) {

    const cadastro =
        obterCadastroSala(
            codigoSala
        );

    if (!cadastro) {

        return null;

    }


    const caminho =
        path.resolve(
            __dirname,
            "public",
            cadastro.arquivo
        );


    if (!fs.existsSync(caminho)) {

        console.error(
            `Arquivo da sala não encontrado: ${caminho}`
        );

        return null;

    }


    try {

        delete require.cache[
            require.resolve(caminho)
        ];


        const configuracao =
            require(caminho);


        return configuracao;

    }

    catch (erro) {

        console.error(
            `Erro ao carregar ${codigoSala}:`,
            erro
        );

        return null;

    }

}


/* =========================================================
   API - LISTAR SALAS
========================================================= */

app.get(
    "/api/salas",
    (req, res) => {

        const salas =
            SALAS_DISPONIVEIS.map(
                sala => {

                    const caminho =
                        path.resolve(
                            __dirname,
                            "public",
                            sala.arquivo
                        );


                    return {

                        codigo:
                            sala.codigo,

                        nome:
                            sala.nome,

                        descricao:
                            sala.descricao,

                        disponivel:
                            fs.existsSync(
                                caminho
                            )

                    };

                }
            );


        res.json(salas);

    }
);


/* =========================================================
   CONTADORES DA SALA
========================================================= */

function obterJogadoresVivos(sessao) {

    return Object.values(
        sessao.jogadores
    ).filter(
        jogador =>
            jogador.eVivo === true
    );

}


function obterQuantidadeVivos(sessao) {

    return obterJogadoresVivos(
        sessao
    ).length;

}


/* =========================================================
   RESULTADO DE FIM DE JOGO
========================================================= */

function obterResultadoFimDeJogo(sessao) {

    const jogadoresVivos =
        obterJogadoresVivos(
            sessao
        );


    const assassinosVivos =
        jogadoresVivos.filter(
            jogador =>
                jogador.papel === "ASSASSINO"
        );


    const cidadaosVivos =
        jogadoresVivos.filter(
            jogador =>
                jogador.papel !== "ASSASSINO"
        );


    /*
        CIDADE VENCE

        Não existe mais nenhum Assassin vivo.
    */

    if (
        assassinosVivos.length === 0
    ) {

        return {

            fim: true,

            vencedor: "CIDADE",

            mensagem:
                "HOJE ESSA CIDADE IRÁ DORMIR MAIS TRANQUILA"

        };

    }


    /*
        ASSASSINO VENCE

        Se o número de cidadãos vivos
        for menor ou igual ao número
        de assassinos vivos.
    */

    if (
        cidadaosVivos.length <=
        assassinosVivos.length
    ) {

        return {

            fim: true,

            vencedor: "ASSASSINO",

            mensagem:
                "INFELIZMENTE O TERRIVEL ASSASSINO PERMANECERÁ A SOLTA EM BUSCA DE NOVAS VITIMAS"

        };

    }


    return {

        fim: false,

        vencedor: null,

        mensagem: ""

    };

}


/* =========================================================
   FINALIZAR JOGO
========================================================= */

function finalizarJogo(
    sessao,
    resultado = null
) {

    if (!sessao) {
        return;
    }


    if (
        sessao.intervaloDia
    ) {

        clearInterval(
            sessao.intervaloDia
        );

        sessao.intervaloDia =
            null;

    }

    if (
    sessao.timerVotacao
) {

    clearTimeout(
        sessao.timerVotacao
    );

    sessao.timerVotacao =
        null;

}

    if (
        sessao.timerProfessor
    ) {

        clearTimeout(
            sessao.timerProfessor
        );

        sessao.timerProfessor =
            null;

    }


    const resultadoFinal =
        resultado ||
        obterResultadoFimDeJogo(
            sessao
        );


    sessao.fase =
        "FIM";


    sessao.tempoRestante =
        0;


    registrarNoticia(
        sessao,
        resultadoFinal.mensagem,
        "final"
    );


   io.to(
    sessao.codigoAcesso
).emit(
    "fimDeJogo",
    {

        vencedor:
            resultadoFinal.vencedor,

        mensagem:
            resultadoFinal.mensagem,

        quantidadeVivos:
            obterQuantidadeVivos(
                sessao
            ),

        resultados:
            Object.values(
                sessao.jogadores
            )
            .sort(
                (a, b) =>
                    b.pontuacao -
                    a.pontuacao
            )
            .map(
                jogador => {

                    const totalQuestoes =
                        (jogador.acertos || 0) +
                        (jogador.erros || 0);

                    const porcentagem =
                        totalQuestoes > 0
                            ? Number(
                                (
                                    (
                                        (jogador.acertos || 0) /
                                        totalQuestoes
                                    ) * 100
                                ).toFixed(1)
                            )
                            : 0;

                    return {

                        nome:
                            jogador.nome,

                        pontuacao:
                            jogador.pontuacao,

                        acertos:
                            jogador.acertos || 0,

                        erros:
                            jogador.erros || 0,

                        questoesRespondidas:
                            totalQuestoes,

                        porcentagemAcertos:
                            porcentagem,

                        eVivo:
                            jogador.eVivo === true

                    };

                }
            )

    }
);


    enviarEstado(
        sessao
    );


    console.log(
        `FIM DE JOGO - Sala ${sessao.codigoAcesso}: ${resultadoFinal.vencedor}`
    );

}


/* =========================================================
   REGISTRAR NOTÍCIA
========================================================= */

function registrarNoticia(
    sessao,
    mensagem,
    tipo = "info"
) {

    if (
        !sessao ||
        !mensagem
    ) {

        return;

    }


    if (!Array.isArray(sessao.noticias)) {

        sessao.noticias = [];

    }


    const noticia = {

        mensagem:
            String(mensagem),

        tipo:
            String(tipo),

        horario:
            new Date().toISOString()

    };


    sessao.noticias.push(
        noticia
    );


    /*
        Mantém somente as últimas 50 notícias.
    */

    if (
        sessao.noticias.length > 50
    ) {

        sessao.noticias.shift();

    }


    io.to(
        sessao.codigoAcesso
    ).emit(
        "noticiaJogo",
        noticia
    );

}


/* =========================================================
   ESTADO PÚBLICO DA SALA
========================================================= */

function criarEstadoPublico(
    sessao
) {

    const alunos =
        Object.values(
            sessao.jogadores
        ).map(
            jogador => ({

                id:
                    jogador.id,

                nome:
                    jogador.nome,

                pontuacao:
                    jogador.pontuacao,

                eVivo:
                    jogador.eVivo,

                eProfessor:
                    false

            })
        );


    const quantidadeVivos =
        alunos.filter(
            aluno =>
                aluno.eVivo === true
        ).length;


    return {

        fase:
            sessao.fase,

        codigoSala:
            sessao.codigoSala,

        nomeSala:
            sessao.nomeSala,

        descricao:
            sessao.descricaoSala,

        codigoAcesso:
            sessao.codigoAcesso,

        duracaoSegundos:
            sessao.duracaoSegundos,

        tempoRestante:
            sessao.tempoRestante,

        quantidadeAlunos:
            alunos.filter(
                aluno =>
                    aluno.eVivo === true
            ).length,

        quantidadeVivos,

        jogadoresVivos:
            quantidadeVivos,

        alunos,

        jogadores:
            alunos,

        noticias:
            sessao.noticias || []

    };

}


/* =========================================================
   ENVIAR ESTADO
========================================================= */

function enviarEstado(
    sessao
) {

    if (!sessao) {
        return;
    }


    const estado =
        criarEstadoPublico(
            sessao
        );


    io.to(
        sessao.codigoAcesso
    ).emit(
        "estadoSala",
        estado
    );


    io.to(
        sessao.codigoAcesso
    ).emit(
        "faseAtualizada",
        estado
    );


    io.to(
        sessao.codigoAcesso
    ).emit(
        "listaAlunosAtualizada",
        estado.alunos
    );

}


/* =========================================================
   EMBARALHAR
========================================================= */

function embaralhar(array) {

    const copia = [
        ...array
    ];


    for (
        let i = copia.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            copia[i],
            copia[j]
        ] =
        [
            copia[j],
            copia[i]
        ];

    }


    return copia;

}


/* =========================================================
   ATRIBUIR PAPÉIS
========================================================= */

function atribuirPapeis(
    sessao
) {

    const jogadores =
        Object.values(
            sessao.jogadores
        );


    jogadores.forEach(
        jogador => {

            jogador.papel =
                "CIDADAO";

        }
    );


    const ordem =
        embaralhar(
            jogadores
        );


    if (ordem.length >= 1) {

        ordem[0].papel =
            "ASSASSINO";

    }


    if (ordem.length >= 3) {

        ordem[1].papel =
            "ANJO";

    }

}


/* =========================================================
   ENVIAR QUESTÃO DO DIA
========================================================= */

function enviarNovaQuestaoDia(
    sessao,
    jogador
) {

    if (
        !sessao ||
        !jogador
    ) {

        return;

    }


    if (
        sessao.fase !== "DIA"
    ) {

        return;

    }


    if (
        jogador.eVivo !== true
    ) {

        return;

    }


    try {

        const questao =
            sessao.configuracao
                .criarQuestaoDia();


        jogador.questaoDia =
            questao;

        jogador.respondeuDia =
            false;


        io.to(
            jogador.id
        ).emit(
            "novaQuestaoDia",
            {

                tipo:
                    questao.tipo,

                texto:
                    questao.texto,

                alternativas:
                    questao.alternativas

            }
        );

    }

    catch (erro) {

        console.error(
            "Erro ao gerar questão do DIA:",
            erro
        );

    }

}


/* =========================================================
   CRONÔMETRO
========================================================= */

function iniciarCronometroDia(
    sessao
) {

    if (
        sessao.intervaloDia
    ) {

        clearInterval(
            sessao.intervaloDia
        );

    }


    sessao.tempoRestante =
        sessao.duracaoSegundos;


    enviarEstado(
        sessao
    );


    io.to(
        sessao.codigoAcesso
    ).emit(
        "cronometroAtualizado",
        sessao.tempoRestante
    );


    sessao.intervaloDia =
        setInterval(
            () => {

                if (
                    !sessoes[
                        sessao.codigoAcesso
                    ]
                ) {

                    clearInterval(
                        sessao.intervaloDia
                    );

                    return;

                }


                if (
                    sessao.fase !==
                    "DIA"
                ) {

                    clearInterval(
                        sessao.intervaloDia
                    );

                    return;

                }


                sessao.tempoRestante--;


                io.to(
                    sessao.codigoAcesso
                ).emit(
                    "cronometroAtualizado",
                    sessao.tempoRestante
                );


                enviarEstado(
                    sessao
                );


                if (
                    sessao.tempoRestante <= 0
                ) {

                    finalizarDia(
                        sessao
                    );

                }

            },
            1000
        );

}


/* =========================================================
   JOGADORES ELEGÍVEIS PARA BÔNUS
========================================================= */

function obterAlvosBonus(
    sessao,
    jogadorAtual
) {

    return Object.values(
        sessao.jogadores
    )

        .filter(
            jogador => {

                return (
                    jogador.id !==
                    jogadorAtual.id
                )
                &&
                jogador.eVivo === true;

            }
        )

        .sort(
            (
                a,
                b
            ) => {

                return (
                    a.pontuacao -
                    b.pontuacao
                );

            }
        )

        .slice(
            0,
            3
        )

        .map(
            jogador => ({

                id:
                    jogador.id,

                nome:
                    jogador.nome

            })
        );

}


/* =========================================================
   TODOS RESPONDERAM O BÔNUS?
========================================================= */

function todosResponderamBonus(
    sessao
) {

    const jogadores =
        Object.values(
            sessao.jogadores
        )
        .filter(
            jogador =>
                jogador.eVivo === true
        );


    if (
        jogadores.length === 0
    ) {

        return false;

    }


    return jogadores.every(
        jogador =>
            jogador.respostaBonus !== null
    );

}


/* =========================================================
   TODOS VOTARAM?
========================================================= */

function todosVotaram(
    sessao
) {

    const jogadoresVivos =
        Object.values(
            sessao.jogadores
        )
        .filter(
            jogador =>
                jogador.eVivo === true
        );


    if (
        jogadoresVivos.length === 0
    ) {

        return false;

    }


    return jogadoresVivos.every(
        jogador =>
            jogador.voto !== null
    );

}


/* =========================================================
   FINALIZAR DIA
========================================================= */

function finalizarDia(
    sessao
) {

    if (!sessao) {
        return;
    }


    if (
        sessao.fase !== "DIA"
    ) {

        return;

    }


    if (
        sessao.intervaloDia
    ) {

        clearInterval(
            sessao.intervaloDia
        );

        sessao.intervaloDia =
            null;

    }


    sessao.tempoRestante =
        0;

    sessao.fase =
        "BONUS";


    io.to(
        sessao.codigoAcesso
    ).emit(
        "cronometroAtualizado",
        0
    );


    registrarNoticia(
        sessao,
        "A FASE BÔNUS começou. Os jogadores estão realizando suas ações.",
        "destaque"
    );


    Object.values(
        sessao.jogadores
    ).forEach(
        jogador => {

            if (
                jogador.eVivo === false
            ) {

                return;

            }


            jogador.questaoBonus =
                null;

            jogador.respostaBonus =
                null;


            try {

                let questaoBonus;


                if (
                    jogador.papel ===
                    "CIDADAO"
                ) {

                    questaoBonus =
                        sessao.configuracao
                            .criarQuestaoBonusCidadao();

                }

                else {

                    const alvos =
                        obterAlvosBonus(
                            sessao,
                            jogador
                        );


                    questaoBonus =
                        sessao.configuracao
                            .criarQuestaoBonusAcao(
                                alvos,
                                jogador.papel
                            );

                }


                jogador.questaoBonus =
                    questaoBonus;


                io.to(
                    jogador.id
                ).emit(
                    "questaoBonus",
                    {

                        tipo:
                            questaoBonus.tipo,

                        texto:
                            questaoBonus.texto,

                        alternativas:
                            questaoBonus.alternativas

                    }
                );


            }

            catch (erro) {

                console.error(
                    "Erro ao gerar questão bônus:",
                    erro
                );

            }

        }
    );


    enviarEstado(
        sessao
    );


    io.to(
        sessao.codigoAcesso
    ).emit(
        "bonusIniciado"
    );
    sessao.timerBonus =
    setTimeout(
        () => {

            if (
                sessoes[
                    sessao.codigoAcesso
                ]
            ) {

                finalizarBonus(
                    sessao
                );

            }

        },
        10000
    );
}


/* =========================================================
   FINALIZAR BÔNUS
========================================================= */

function finalizarBonus(
    sessao
) {

    if (!sessao) {
        return;
    }

    if (
    sessao.timerBonus
) {

    clearTimeout(
        sessao.timerBonus
    );

    sessao.timerBonus =
        null;

}

    if (
        sessao.fase !== "BONUS"
    ) {

        return;

    }


    console.log(
        `Finalizando bônus da sala ${sessao.codigoAcesso}`
    );


    const assassino =
        Object.values(
            sessao.jogadores
        ).find(
            jogador =>
                jogador.eVivo === true &&
                jogador.papel === "ASSASSINO"
        );


    const anjo =
        Object.values(
            sessao.jogadores
        ).find(
            jogador =>
                jogador.eVivo === true &&
                jogador.papel === "ANJO"
        );


    let vitima = null;

    let pessoaSalva = null;


    if (
        assassino &&
        assassino.respostaBonus &&
        assassino.respostaBonus.jogadorID
    ) {

        vitima =
            sessao.jogadores[
                assassino.respostaBonus.jogadorID
            ];

    }


    if (
        anjo &&
        anjo.respostaBonus &&
        anjo.respostaBonus.jogadorID
    ) {

        pessoaSalva =
            sessao.jogadores[
                anjo.respostaBonus.jogadorID
            ];

    }


    let jogadorMorreu = null;


    /*
        A morte é registrada internamente,
        mas ainda NÃO é anunciada.

        Primeiro acontece:

        CIDADE DORME

        Depois:

        CIDADE ACORDA

        Só então anunciamos a morte.
    */

    if (
        vitima &&
        vitima.eVivo
    ) {

        if (
            !pessoaSalva ||
            pessoaSalva.id !== vitima.id
        ) {

            vitima.eVivo =
                false;

            vitima.questaoDia =
                null;

            vitima.questaoBonus =
                null;

            vitima.respostaBonus =
                null;

            vitima.voto =
                null;

            jogadorMorreu =
                vitima;

        }

    }


    /*
        Avisa individualmente quem morreu,
        mas a mensagem pública da morte
        só acontecerá quando a cidade acordar.
    */

    if (
        jogadorMorreu
    ) {

        const socketMorto =
            io.sockets.sockets.get(
                jogadorMorreu.id
            );


        if (socketMorto) {

            socketMorto.emit(
                "jogadorEliminado",
                {

                    motivo:
                        "ASSASSINADO",

                    mensagem:
                        "VOCÊ FOI ASSASSINADO AGUARDE ATÉ O FIM DO JOGO",

                    detalhe:
                        ""

                }
            );

        }

    }


    /*
        Entra no estado de sono.
    */

    sessao.fase =
        "DORMINDO";


    io.to(
        sessao.codigoAcesso
    ).emit(
        "cidadeDormiu",
        {

            mensagem:
                "A CIDADE DORMIU... O terrível assassino está à espreita.",

            quantidadeVivos:
                obterQuantidadeVivos(
                    sessao
                )

        }
    );


    registrarNoticia(
        sessao,
        "A CIDADE DORMIU... Aguarde o que aconteceu durante a noite.",
        "noite"
    );


    enviarEstado(
        sessao
    );


    setTimeout(
        () => {

            if (
                !sessoes[
                    sessao.codigoAcesso
                ]
            ) {

                return;

            }


            if (
                sessao.fase !==
                "DORMINDO"
            ) {

                return;

            }


            sessao.fase =
                "ACORDANDO";


            io.to(
                sessao.codigoAcesso
            ).emit(
                "cidadeAcordou",
                {

                    mensagem:
                        "A CIDADE ACORDOU!",

                    quantidadeVivos:
                        obterQuantidadeVivos(
                            sessao
                        )

                }
            );


            registrarNoticia(
                sessao,
                "A CIDADE ACORDOU!",
                "sucesso"
            );


            enviarEstado(
                sessao
            );


            /*
                Pequeno intervalo para que
                a mensagem CIDADE ACORDA
                apareça antes da notícia da morte.
            */

            setTimeout(
                () => {

                    if (
                        !sessoes[
                            sessao.codigoAcesso
                        ]
                    ) {

                        return;

                    }


                    if (
                        sessao.fase !==
                        "ACORDANDO"
                    ) {

                        return;

                    }


                    let mensagem;


                    if (
                        jogadorMorreu
                    ) {

                        mensagem =
                            `${jogadorMorreu.nome} foi assassinado durante a noite.`;

                    }

                    else if (
                        vitima &&
                        pessoaSalva &&
                        vitima.id ===
                        pessoaSalva.id
                    ) {

                        mensagem =
                            `${pessoaSalva.nome} foi protegido e sobreviveu à noite.`;

                    }

                    else {

                        mensagem =
                            "A noite terminou sem nenhuma eliminação.";

                    }


                    io.to(
                        sessao.codigoAcesso
                    ).emit(
                        "resultadoBonus",
                        {

                            mensagem,

                            jogadorMorreu:
                                jogadorMorreu
                                    ? jogadorMorreu.nome
                                    : null,

                            jogadorSalvo:
                                pessoaSalva
                                    ? pessoaSalva.nome
                                    : null,

                            quantidadeVivos:
                                obterQuantidadeVivos(
                                    sessao
                                )

                        }
                    );


                    if (
                        jogadorMorreu
                    ) {

                        registrarNoticia(
                            sessao,
                            mensagem,
                            "destaque"
                        );

                    }

                    else {

                        registrarNoticia(
                            sessao,
                            mensagem,
                            "sucesso"
                        );

                    }


                    enviarEstado(
                        sessao
                    );


                    /*
                        Verifica vitória imediatamente
                        depois da morte.
                    */

                    const resultado =
                        obterResultadoFimDeJogo(
                            sessao
                        );


                    if (
                        resultado.fim
                    ) {

                        finalizarJogo(
                            sessao,
                            resultado
                        );

                        return;

                    }


                    /*
                        Depois da noite começa a votação.
                    */

                    sessao.fase =
                        "BONUS";


                    enviarEstado(
                        sessao
                    );


                    setTimeout(
                        () => {

                            if (
                                !sessoes[
                                    sessao.codigoAcesso
                                ]
                            ) {

                                return;

                            }


                            if (
                                sessao.fase !==
                                "BONUS"
                            ) {

                                return;

                            }


                            iniciarVotacao(
                                sessao
                            );

                        },
                        2000
                    );

                },
                1500
            );

        },
        TEMPO_CIDADE_DORME
    );

}


/* =========================================================
   INICIAR VOTAÇÃO
========================================================= */

function iniciarVotacao(
    sessao
) {

    if (!sessao) {
        return;
    }


    if (
        sessao.fase !== "BONUS"
    ) {

        return;

    }


    /*
        Antes da votação verificamos
        as condições de vitória.
    */

    const resultado =
        obterResultadoFimDeJogo(
            sessao
        );


    if (
        resultado.fim
    ) {

        finalizarJogo(
            sessao,
            resultado
        );

        return;

    }


    sessao.fase =
        "VOTACAO";


    Object.values(
        sessao.jogadores
    ).forEach(
        jogador => {

            jogador.voto =
                null;

        }
    );

    enviarEstadoVotacaoProfessor(sessao);


    const jogadoresVivos =
        Object.values(
            sessao.jogadores
        )
        .filter(
            jogador =>
                jogador.eVivo === true
        )
        .map(
            jogador => ({

                jogadorID:
                    jogador.id,

                nome:
                    jogador.nome

            })
        );


    Object.values(
        sessao.jogadores
    )
    .filter(
        jogador =>
            jogador.eVivo === true
    )
    .forEach(
        jogador => {

            io.to(
                jogador.id
            ).emit(
                "iniciarVotacao",
                {

                    jogadores:
                        jogadoresVivos,

                    quantidadeVivos:
                        jogadoresVivos.length

                }
            );

        }
    );


    registrarNoticia(
        sessao,
        "A votação começou. Os jogadores vivos devem votar em quem acreditam ser o Assassino.",
        "votacao"
    );


    enviarEstado(
        sessao
    );

    sessao.timerVotacao =
    setTimeout(
        () => {

            if (
                sessoes[
                    sessao.codigoAcesso
                ]
            ) {

                finalizarVotacao(
                    sessao
                );

            }

        },
        15000
    );

    console.log(
        `Votação iniciada na sala ${sessao.codigoAcesso}`
    );

}


/* =========================================================
   FINALIZAR VOTAÇÃO
========================================================= */

function finalizarVotacao(
    sessao
) {

    if (!sessao) {
        return;
    }


    if (
        sessao.fase !== "VOTACAO"
    ) {

        return;

    }

    if (
    sessao.timerVotacao
) {

    clearTimeout(
        sessao.timerVotacao
    );

    sessao.timerVotacao =
        null;

}

    const vivos =
        obterJogadoresVivos(
            sessao
        );


    const contagem = {};


    vivos.forEach(
        jogador => {

            if (
                !jogador.voto
            ) {

                return;

            }


            if (
                !contagem[
                    jogador.voto
                ]
            ) {

                contagem[
                    jogador.voto
                ] = 0;

            }


            contagem[
                jogador.voto
            ]++;

        }
    );


    let maiorNumeroDeVotos =
        0;

    let alvoID =
        null;

    let empate =
        false;


    Object.entries(
        contagem
    ).forEach(
        (
            [
                id,
                quantidade
            ]
        ) => {

            if (
                quantidade >
                maiorNumeroDeVotos
            ) {

                maiorNumeroDeVotos =
                    quantidade;

                alvoID =
                    id;

                empate =
                    false;

            }

            else if (
                quantidade ===
                maiorNumeroDeVotos &&
                quantidade > 0
            ) {

                empate =
                    true;

            }

        }
    );


    /*
    Empate ou ninguém recebeu voto.
*/

if (
    !alvoID ||
    empate
) {

    const mensagem =
        "A cidade não conseguiu chegar a um consenso. Ninguém será eliminado hoje.";

    io.to(
        sessao.codigoAcesso
    ).emit(
        "resultadoVotacao",
        {

            tipo:
                "EMPATE",

            mensagem:
                mensagem,

            quantidadeVivos:
                obterQuantidadeVivos(
                    sessao
                )

        }
    );


    registrarNoticia(
        sessao,
        mensagem,
        "votacao"
    );


    Object.values(
        sessao.jogadores
    ).forEach(
        jogador => {

            jogador.voto =
                null;

        }
    );


    enviarEstado(
        sessao
    );


    setTimeout(
        () => {

            if (
                sessoes[
                    sessao.codigoAcesso
                ]
            ) {

                iniciarNovoDia(
                    sessao
                );

            }

        },
        4000
    );


    return;

}


    const alvo =
        sessao.jogadores[
            alvoID
        ];


    if (!alvo) {
        return;
    }


    if (
        alvo.eVivo !== true
    ) {

        return;

    }


    const eraAssassino =
        alvo.papel ===
        "ASSASSINO";


    /*
        ELIMINAÇÃO DEFINITIVA
    */

    alvo.eVivo =
        false;

    alvo.questaoDia =
        null;

    alvo.questaoBonus =
        null;

    alvo.respostaBonus =
        null;

    alvo.voto =
        null;


    /*
        Avisa individualmente o eliminado.
    */

    const socketAlvo =
        io.sockets.sockets.get(
            alvo.id
        );


    if (socketAlvo) {

        socketAlvo.emit(
            "jogadorEliminado",
            {

                motivo:
                    eraAssassino
                        ? "VOTACAO_ASSASSINO"
                        : "VOTACAO_INOCENTE",

                mensagem:
                    eraAssassino
                        ? "VOCÊ FOI ELIMINADO"
                        : "VOCÊ FOI ASSASSINADO",

                detalhe:
                    "Aguarde até o fim do jogo."

            }
        );

    }


    /*
        ASSASSINO DESCOBERTO
    */

    if (
        eraAssassino
    ) {

        const mensagemDescoberta =
            "VOCÊS DESCOBRIRAM O ASSASSINO!";


        io.to(
            sessao.codigoAcesso
        ).emit(
            "resultadoVotacao",
            {

                tipo:
                    "ASSASSINO_ELIMINADO",

                nome:
                    alvo.nome,

                votos:
                    maiorNumeroDeVotos,

                mensagem:
                    mensagemDescoberta,

                quantidadeVivos:
                    obterQuantidadeVivos(
                        sessao
                    )

            }
        );


        registrarNoticia(
            sessao,
            `${mensagemDescoberta} ${alvo.nome} recebeu ${maiorNumeroDeVotos} voto(s).`,
            "sucesso"
        );


        enviarEstado(
            sessao
        );


        const resultado =
            obterResultadoFimDeJogo(
                sessao
            );


        if (
            resultado.fim
        ) {

            setTimeout(
                () => {

                    finalizarJogo(
                        sessao,
                        {
                            fim: true,
                            vencedor: "CIDADE",
                            mensagem:
                                "HOJE ESSA CIDADE IRÁ DORMIR MAIS TRANQUILA"
                        }
                    );

                },
                2500
            );


            return;

        }

    }

    else {

        /*
            CIDADÃO INJUSTIÇADO
        */

        const mensagemInocente =
            "HOJE COMETEMOS UMA INJUSTIÇA E UM INOCENTE FOI ASSASSINADO";


        io.to(
            sessao.codigoAcesso
        ).emit(
            "resultadoVotacao",
            {

                tipo:
                    "INOCENTE_ELIMINADO",

                nome:
                    alvo.nome,

                votos:
                    maiorNumeroDeVotos,

                mensagem:
                    mensagemInocente,

                quantidadeVivos:
                    obterQuantidadeVivos(
                        sessao
                    )

            }
        );


        registrarNoticia(
            sessao,
            `${mensagemInocente}: ${alvo.nome} recebeu ${maiorNumeroDeVotos} voto(s).`,
            "destaque"
        );


        enviarEstado(
            sessao
        );


        /*
            Depois de eliminar um inocente,
            verifica se o Assassin já venceu.
        */

        const resultado =
            obterResultadoFimDeJogo(
                sessao
            );


        if (
            resultado.fim
        ) {

            setTimeout(
                () => {

                    finalizarJogo(
                        sessao,
                        resultado
                    );

                },
                2500
            );


            return;

        }

    }


    /*
        Próximo DIA.
    */

    setTimeout(
        () => {

            if (
                sessoes[
                    sessao.codigoAcesso
                ]
            ) {

                iniciarNovoDia(
                    sessao
                );

            }

        },
        4000
    );

}


/* =========================================================
   INICIAR NOVO DIA
========================================================= */

function iniciarNovoDia(
    sessao
) {

    if (!sessao) {
        return;
    }


    const jogadoresVivos =
        obterJogadoresVivos(
            sessao
        );


    /*
        Se não existem jogadores vivos.
    */

    if (
        jogadoresVivos.length === 0
    ) {

        finalizarJogo(
            sessao,
            {

                fim:
                    true,

                vencedor:
                    "FIM",

                mensagem:
                    "Todos os jogadores foram eliminados."

            }
        );

        return;

    }


    /*
        Verifica as condições de vitória.
    */

    const resultado =
        obterResultadoFimDeJogo(
            sessao
        );


    if (
        resultado.fim
    ) {

        finalizarJogo(
            sessao,
            resultado
        );

        return;

    }


    /*
        NOVO DIA
    */

    sessao.fase =
        "DIA";


    sessao.tempoRestante =
        sessao.duracaoSegundos;


    Object.values(
        sessao.jogadores
    ).forEach(
        jogador => {

            jogador.questaoDia =
                null;

            jogador.respondeuDia =
                false;

            jogador.questaoBonus =
                null;

            jogador.respostaBonus =
                null;

            jogador.voto =
                null;

        }
    );


    registrarNoticia(
        sessao,
        "Um novo DIA começou. Os jogadores vivos estão respondendo às questões.",
        "info"
    );


    enviarEstado(
        sessao
    );


    jogadoresVivos.forEach(
        jogador => {

            enviarNovaQuestaoDia(
                sessao,
                jogador
            );

        }
    );


    iniciarCronometroDia(
        sessao
    );


    io.to(
        sessao.codigoAcesso
    ).emit(
        "novoDia",
        {

            quantidadeVivos:
                obterQuantidadeVivos(
                    sessao
                )

        }
    );


    console.log(
        `Novo DIA iniciado na sala ${sessao.codigoAcesso}`
    );

}


/* =========================================================
   CRIAR SESSÃO
========================================================= */

function criarSessao({
    socketId,
    professorNome,
    codigoSala,
    duracaoSegundos,
    configuracao,
    cadastro
}) {

    const codigoAcesso =
        gerarCodigoAcesso();


    const sessao = {

        codigoAcesso,

        codigoSala,

        nomeSala:
            cadastro.nome,

        descricaoSala:
            cadastro.descricao,

        configuracao,

        professorId:
            socketId,

        professorNome,

        professorToken:
            gerarToken(),

        fase:
            "AGUARDANDO_ALUNOS",

        duracaoSegundos,

        tempoRestante:
            0,

        jogadores: {},

        noticias: [],

        bloqueadosNomes:
            new Set(),

        bloqueadosClientes:
            new Set(),

        intervaloDia:
    null,

timerBonus:
    null,

timerVotacao:
    null,

timerProfessor:
    null

    };


    sessoes[
        codigoAcesso
    ] = sessao;


    return sessao;

}


/* =========================================================
   ENCERRAR SESSÃO
========================================================= */

function encerrarSessao(
    codigoAcesso,
    motivo = "Sessão encerrada."
) {

    const sessao =
        sessoes[codigoAcesso];


    if (!sessao) {
        return;
    }


    if (
        sessao.intervaloDia
    ) {

        clearInterval(
            sessao.intervaloDia
        );

    }


    if (
        sessao.timerProfessor
    ) {

        clearTimeout(
            sessao.timerProfessor
        );

    }

    if (
    sessao.timerBonus
) {

    clearTimeout(
        sessao.timerBonus
    );

    sessao.timerBonus =
        null;

}

    io.to(
        codigoAcesso
    ).emit(
        "sessaoEncerrada",
        {
            mensagem:
                motivo
        }
    );


    delete sessoes[
        codigoAcesso
    ];

}

function sairDaSalaProfessor(socket) {

    const codigoAcesso =
        socket.data.codigoAcesso;

    if (!codigoAcesso) {
        return;
    }

    const sessao =
        sessoes[codigoAcesso];

    /*
        Retira o professor do room do Socket.IO.
    */

    socket.leave(codigoAcesso);

    /*
        Se a sessão ainda existir e este socket
        for realmente o professor, libera a sessão.
    */

    if (
        sessao &&
        sessao.professorId === socket.id
    ) {

        sessao.professorId = null;

        /*
            Se ainda estava esperando alunos,
            começa a contagem para encerrar a sala.
        */

        if (
            sessao.fase ===
            "AGUARDANDO_ALUNOS"
        ) {

            agendarEncerramentoProfessor(
                sessao
            );

        }

        /*
            Se a partida já terminou,
            podemos apagar imediatamente.
        */

        else if (
            sessao.fase ===
            "FIM"
        ) {

            delete sessoes[
                codigoAcesso
            ];

        }

    }

    /*
        Limpa os dados deste socket.
    */

    socket.data.codigoAcesso =
        null;

    socket.data.professorToken =
        null;

    socket.data.tipo =
        null;

}

/* =========================================================
   AGENDAR FECHAMENTO SE PROFESSOR SAIR
========================================================= */

function agendarEncerramentoProfessor(
    sessao
) {

    if (
        sessao.timerProfessor
    ) {

        clearTimeout(
            sessao.timerProfessor
        );

    }


    sessao.timerProfessor =
        setTimeout(
            () => {

                if (
                    sessao.professorId
                ) {

                    return;

                }


                if (
                    sessao.fase ===
                    "AGUARDANDO_ALUNOS"
                ) {

                    encerrarSessao(
                        sessao.codigoAcesso,
                        "O tempo de espera do professor terminou."
                    );

                }

            },
            TEMPO_ESPERA_PROFESSOR
        );

}


/* =========================================================
   SOCKET.IO
========================================================= */

io.on(
    "connection",
    socket => {

        console.log(
            "Novo dispositivo conectado:",
            socket.id
        );

/* =====================================================
   PROFESSOR — SAIR DA SALA ATUAL
===================================================== */

socket.on(
    "sairDaSalaProfessor",
    () => {

        sairDaSalaProfessor(socket);

        console.log(
            `Professor ${socket.id} saiu da sala atual.`
        );

    }
);


        /* =====================================================
           PROFESSOR — CRIAR SALA
        ===================================================== */

        socket.on(
            "criarSalaProfessor",
            dados => {

                const nome =
                    normalizarNome(
                        dados?.nome
                    );


                const codigoSala =
                    normalizarCodigo(
                        dados?.codigoSala
                    );


                const duracao =
                    Number(
                        dados?.duracaoSegundos
                    );


                if (!nome) {

                    socket.emit(
                        "entradaErro",
                        "Digite o nome do professor."
                    );

                    return;

                }


                if (
                    !obterCadastroSala(
                        codigoSala
                    )
                ) {

                    socket.emit(
                        "entradaErro",
                        "A sala selecionada não existe."
                    );

                    return;

                }


                if (
                    !DURACOES_VALIDAS.includes(
                        duracao
                    )
                ) {

                    socket.emit(
                        "entradaErro",
                        "Duração inválida."
                    );

                    return;

                }


                const cadastro =
                    obterCadastroSala(
                        codigoSala
                    );


                const configuracao =
                    carregarConfiguracaoSala(
                        codigoSala
                    );


                if (
                    !configuracao
                ) {

                    socket.emit(
                        "entradaErro",
                        "O arquivo desta sala ainda não foi criado."
                    );

                    return;

                }


                if (
                    typeof configuracao
                        .criarQuestaoDia !==
                    "function"
                ) {

                    socket.emit(
                        "entradaErro",
                        "A sala não possui a função criarQuestaoDia()."
                    );

                    return;

                }


                const sessao =
                    criarSessao({

                        socketId:
                            socket.id,

                        professorNome:
                            nome,

                        codigoSala,

                        duracaoSegundos:
                            duracao,

                        configuracao,

                        cadastro

                    });


                socket.data.tipo =
                    "PROFESSOR";

                socket.data.codigoAcesso =
                    sessao.codigoAcesso;

                socket.data.professorToken =
                    sessao.professorToken;


                socket.join(
                    sessao.codigoAcesso
                );


                socket.emit(
                    "salaCriada",
                    {

                        codigoSala:
                            sessao.codigoSala,

                        nomeSala:
                            sessao.nomeSala,

                        descricao:
                            sessao.descricaoSala,

                        codigoAcesso:
                            sessao.codigoAcesso,

                        duracaoSegundos:
                            sessao.duracaoSegundos,

                        professorToken:
                            sessao.professorToken,

                        jogadores: []

                    }
                );


                enviarEstado(
                    sessao
                );


                console.log(
                    `Professor "${nome}" criou ${codigoSala} com código ${sessao.codigoAcesso}`
                );

            }
        );


/*
    Se este professor ainda estiver vinculado
    a uma sala anterior, sai dela antes de criar
    uma nova.
*/

if (
    socket.data.codigoAcesso
) {

    sairDaSalaProfessor(socket);

}

        /* =====================================================
           PROFESSOR — RETOMAR SALA
        ===================================================== */

        socket.on(
            "retomarSalaProfessor",
            dados => {

                const codigoAcesso =
                    normalizarCodigo(
                        dados?.codigoAcesso
                    );


                const token =
                    String(
                        dados?.professorToken ||
                        ""
                    );


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {

                    socket.emit(
                        "retomarErro",
                        "Essa sala não está mais disponível."
                    );

                    return;

                }
                
                if (
    sessao.fase === "FIM"
) {

    delete sessoes[
        codigoAcesso
    ];

    socket.emit(
        "retomarErro",
        "Essa partida já foi encerrada."
    );

    return;

}


                if (
                    token !==
                    sessao.professorToken
                ) {

                    socket.emit(
                        "retomarErro",
                        "Não foi possível confirmar o professor desta sala."
                    );

                    return;

                }


                if (
                    sessao.timerProfessor
                ) {

                    clearTimeout(
                        sessao.timerProfessor
                    );

                    sessao.timerProfessor =
                        null;

                }


                sessao.professorId =
                    socket.id;


                socket.data.tipo =
                    "PROFESSOR";


                socket.data.codigoAcesso =
                    codigoAcesso;


                socket.data.professorToken =
                    sessao.professorToken;


                socket.join(
                    codigoAcesso
                );


                socket.emit(
                    "salaRetomada",
                    {

                        codigoSala:
                            sessao.codigoSala,

                        nomeSala:
                            sessao.nomeSala,

                        descricao:
                            sessao.descricaoSala,

                        codigoAcesso:
                            sessao.codigoAcesso,

                        duracaoSegundos:
                            sessao.duracaoSegundos,

                        professorToken:
                            sessao.professorToken

                    }
                );


                enviarEstado(
                    sessao
                );


                console.log(
                    `Professor retomou a sala ${codigoAcesso}`
                );

            }
        );


        
        /* =====================================================
           ALUNO — ENTRAR
        ===================================================== */

        /* =====================================================
   ALUNO — RETOMAR CONEXÃO
===================================================== */

socket.on(
    "retomarSalaAluno",
    dados => {

        const codigoAcesso =
            normalizarCodigo(
                dados?.codigoAcesso
            );

        const clientToken =
            String(
                dados?.clientToken ||
                ""
            );

        if (
            !codigoAcesso ||
            !clientToken
        ) {

            socket.emit(
                "retomadaErro",
                "Não foi possível identificar sua partida."
            );

            return;

        }


        const sessao =
            sessoes[
                codigoAcesso
            ];

        if (!sessao) {

            socket.emit(
                "retomadaErro",
                "Essa sala não está mais disponível."
            );

            return;

        }


        const jogadorEncontrado =
            Object.values(
                sessao.jogadores
            )
            .find(
                jogador =>
                    jogador.clientToken ===
                    clientToken
            );


        if (!jogadorEncontrado) {

            socket.emit(
                "retomadaErro",
                "Não encontramos seu jogador nessa partida."
            );

            return;

        }

        if (
    sessao.fase === "FIM"
) {

    delete sessoes[
        codigoAcesso
    ];

    socket.emit(
        "retomadaErro",
        "Essa partida já foi encerrada."
    );

    return;

}
        /*
            Cancela o timer de retomada,
            caso ainda esteja ativo.
        */

        if (
            jogadorEncontrado.timerRetomada
        ) {

            clearTimeout(
                jogadorEncontrado.timerRetomada
            );

            jogadorEncontrado.timerRetomada =
                null;

        }


        /*
            Remove a referência antiga.
        */

        delete sessao.jogadores[
            jogadorEncontrado.id
        ];


        /*
            O jogador passa a usar
            o novo socket.id.
        */

        jogadorEncontrado.id =
            socket.id;

        jogadorEncontrado.conectado =
            true;


        sessao.jogadores[
            socket.id
        ] =
            jogadorEncontrado;


        /*
            Configura o novo socket.
        */

        socket.data.tipo =
            "ALUNO";

        socket.data.codigoAcesso =
            codigoAcesso;

        socket.data.clientToken =
            clientToken;

        socket.data.jogadorID =
            socket.id;


        socket.join(
            codigoAcesso
        );


        /*
            Confirma a retomada.
        */

        socket.emit(
            "salaRetomada",
            {

                codigoAcesso,

                nome:
                    jogadorEncontrado.nome,

                eVivo:
                    jogadorEncontrado.eVivo,

                fase:
                    sessao.fase

            }
        );


        /*
            Envia novamente o estado
            atual da partida.
        */

        enviarEstado(
            sessao
        );


        /*
            Se estiver no DIA,
            envia novamente a questão atual.
        */

        if (
            sessao.fase ===
            "DIA" &&
            jogadorEncontrado.eVivo === true
        ) {

            if (
                jogadorEncontrado.questaoDia
            ) {

                socket.emit(
                    "novaQuestaoDia",
                    {

                        tipo:
                            jogadorEncontrado
                                .questaoDia
                                .tipo,

                        texto:
                            jogadorEncontrado
                                .questaoDia
                                .texto,

                        alternativas:
                            jogadorEncontrado
                                .questaoDia
                                .alternativas

                    }
                );

            }
        }


        /*
            Se estiver no BÔNUS,
            envia novamente a ação atual.
        */

        if (
            sessao.fase ===
            "BONUS" &&
            jogadorEncontrado.eVivo === true
        ) {

            if (
                jogadorEncontrado.questaoBonus
            ) {

                socket.emit(
                    "novaQuestaoBonus",
                    jogadorEncontrado.questaoBonus
                );

            }

        }

        /*
    Se estiver na VOTAÇÃO,
    envia novamente a lista de jogadores vivos.
*/

if (
    sessao.fase ===
    "VOTACAO" &&
    jogadorEncontrado.eVivo === true
) {

    const jogadoresVivos =
        Object.values(
            sessao.jogadores
        )
        .filter(
            jogador =>
                jogador.eVivo === true
        )
        .map(
            jogador => ({
                jogadorID:
                    jogador.id,

                nome:
                    jogador.nome
            })
        );

    socket.emit(
        "iniciarVotacao",
        {
            jogadores:
                jogadoresVivos,

            quantidadeVivos:
                jogadoresVivos.length
        }
    );

}

/*
    Como o jogador recebeu um novo socket.id,
    atualizamos a lista de votação de todos
    os jogadores vivos.
*/

if (
    sessao.fase ===
    "VOTACAO"
) {

    const jogadoresVivos =
        Object.values(
            sessao.jogadores
        )
        .filter(
            jogador =>
                jogador.eVivo === true
        )
        .map(
            jogador => ({
                jogadorID:
                    jogador.id,

                nome:
                    jogador.nome
            })
        );

    Object.values(
        sessao.jogadores
    )
    .filter(
        jogador =>
            jogador.eVivo === true
    )
    .forEach(
        jogador => {

            io.to(
                jogador.id
            ).emit(
                "iniciarVotacao",
                {
                    jogadores:
                        jogadoresVivos,

                    quantidadeVivos:
                        jogadoresVivos.length
                }
            );

        }
    );

}

        console.log(
            `Aluno "${jogadorEncontrado.nome}" retomou a sala ${codigoAcesso}`
        );

    }
);


        socket.on(
            "entrarComoAluno",
            dados => {

                const nome =
                    normalizarNome(
                        dados?.nome
                    );


                const codigoAcesso =
                    normalizarCodigo(
                        dados?.codigoAcesso
                    );


                if (!nome) {

                    socket.emit(
                        "entradaErro",
                        "Digite seu nome."
                    );

                    return;

                }


                if (
                    codigoAcesso.length !== 4
                ) {

                    socket.emit(
                        "entradaErro",
                        "O código deve ter 4 caracteres."
                    );

                    return;

                }


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {

                    socket.emit(
                        "entradaErro",
                        "Sala não encontrada. Confira o código."
                    );

                    return;

                }


                if (
                    sessao.fase !==
                    "AGUARDANDO_ALUNOS"
                ) {

                    socket.emit(
                        "entradaErro",
                        "O DIA já começou. Não é mais possível entrar nesta sala."
                    );

                    return;

                }


                const nomeChave =
                    chaveNome(
                        nome
                    );


                if (
                    sessao.bloqueadosNomes.has(
                        nomeChave
                    )
                ) {

                    socket.emit(
                        "entradaErro",
                        "Você foi removido desta sala e não pode entrar novamente nesta partida."
                    );

                    return;

                }


                let clientToken =
                    String(
                        dados?.clientToken ||
                        ""
                    );


                if (!clientToken) {

                    clientToken =
                        gerarToken();

                }


                if (
                    sessao.bloqueadosClientes.has(
                        clientToken
                    )
                ) {

                    socket.emit(
                        "entradaErro",
                        "Este dispositivo foi bloqueado nesta partida."
                    );

                    return;

                }


                const nomeJaExiste =
                    Object.values(
                        sessao.jogadores
                    ).some(
                        jogador =>
                            chaveNome(
                                jogador.nome
                            ) ===
                            nomeChave
                    );


                if (
                    nomeJaExiste
                ) {

                    socket.emit(
                        "entradaErro",
                        "Esse nome já está sendo usado nesta sala."
                    );

                    return;

                }


                const dispositivoJaExiste =
                    Object.values(
                        sessao.jogadores
                    ).some(
                        jogador =>
                            jogador.clientToken ===
                            clientToken
                    );


                if (
                    dispositivoJaExiste
                ) {

                    socket.emit(
                        "entradaErro",
                        "Este dispositivo já está conectado nesta sala."
                    );

                    return;

                }


                const jogador = {

                    id:
                        socket.id,

                    nome,

                    clientToken:
                    clientToken,

                        conectado:
                            true,

                        timerRetomada:
                            null,

                        pontuacao:
                            0,

                        eVivo:
                            true,

                    papel:
                        "CIDADAO",

                    questaoDia:
                        null,

                    respondeuDia:
                        false,

                    questaoBonus:
                        null,

                    respostaBonus:
                        null,

                    voto:
                        null

                };


                sessao.jogadores[
                    socket.id
                ] = jogador;


                socket.data.tipo =
                    "ALUNO";


                socket.data.codigoAcesso =
                    codigoAcesso;


                socket.data.clientToken =
                    clientToken;


                socket.data.jogadorID =
                    socket.id;


                socket.join(
                    codigoAcesso
                );


                socket.emit(
                    "alunoEntrou",
                    {

                        codigoSala:
                            codigoAcesso,

                        nomeSala:
                            sessao.nomeSala,

                        descricao:
                            sessao.descricaoSala,

                        codigoAcesso,

                        clientToken

                    }
                );


                registrarNoticia(
                    sessao,
                    `${nome} entrou na sala.`,
                    "info"
                );


                enviarEstado(
                    sessao
                );


                console.log(
                    `Aluno "${nome}" entrou na sala ${codigoAcesso}`
                );

            }
        );


        /* =====================================================
           PROFESSOR — REMOVER ALUNO
        ===================================================== */

        socket.on(
            "removerAluno",
            dados => {

                const codigoAcesso =
                    socket.data.codigoAcesso;


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {
                    return;
                }


                if (
                    sessao.professorId !==
                    socket.id
                ) {

                    return;

                }


                if (
                    sessao.fase !==
                    "AGUARDANDO_ALUNOS"
                ) {

                    socket.emit(
                        "entradaErro",
                        "Não é possível remover alunos depois que o DIA começou."
                    );

                    return;

                }


                const jogadorID =
                    String(
                        dados?.jogadorID ||
                        ""
                    );


                const jogador =
                    sessao.jogadores[
                        jogadorID
                    ];


                if (!jogador) {
                    return;
                }


                sessao.bloqueadosNomes.add(
                    chaveNome(
                        jogador.nome
                    )
                );


                if (
                    jogador.clientToken
                ) {

                    sessao.bloqueadosClientes.add(
                        jogador.clientToken
                    );

                }


                io.to(
                    jogador.id
                ).emit(
                    "alunoRemovido"
                );


                const socketAluno =
                    io.sockets.sockets.get(
                        jogador.id
                    );


                if (
                    socketAluno
                ) {

                    socketAluno.leave(
                        codigoAcesso
                    );


                    socketAluno.data.codigoAcesso =
                        null;

                }


                registrarNoticia(
                    sessao,
                    `${jogador.nome} foi removido da sala pelo professor.`,
                    "destaque"
                );


                delete sessao.jogadores[
                    jogadorID
                ];


                enviarEstado(
                    sessao
                );


                console.log(
                    `Aluno "${jogador.nome}" removido da sala ${codigoAcesso}`
                );

            }
        );


        /* =====================================================
           PROFESSOR — INICIAR DIA
        ===================================================== */

        socket.on(
            "iniciarDia",
            dados => {

                const codigoAcesso =
                    socket.data.codigoAcesso;


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {
                    return;
                }


                if (
                    sessao.professorId !==
                    socket.id
                ) {

                    socket.emit(
                        "entradaErro",
                        "Somente o professor pode iniciar o DIA."
                    );

                    return;

                }


                if (
                    sessao.fase !==
                    "AGUARDANDO_ALUNOS"
                ) {

                    socket.emit(
                        "entradaErro",
                        "O DIA já foi iniciado."
                    );

                    return;

                }


                const jogadores =
                    Object.values(
                        sessao.jogadores
                    );


                if (
                    jogadores.length === 0
                ) {

                    socket.emit(
                        "entradaErro",
                        "É necessário ter pelo menos um aluno na sala."
                    );

                    return;

                }


                atribuirPapeis(
                    sessao
                );


                jogadores.forEach(
                    jogador => {

                        jogador.eVivo =
                            true;

                        jogador.questaoDia =
                            null;

                        jogador.respondeuDia =
                            false;

                        jogador.questaoBonus =
                            null;

                        jogador.respostaBonus =
                            null;

                        jogador.voto =
                            null;


                        io.to(
                            jogador.id
                        ).emit(
                            "dadosPrivados",
                            {

                                papel:
                                    jogador.papel

                            }
                        );

                    }
                );


                sessao.fase =
                    "DIA";


                sessao.tempoRestante =
                    sessao.duracaoSegundos;


                registrarNoticia(
                    sessao,
                    "O DIA começou. Os alunos já podem responder às questões.",
                    "info"
                );


                enviarEstado(
                    sessao
                );


                jogadores.forEach(
                    jogador => {

                        enviarNovaQuestaoDia(
                            sessao,
                            jogador
                        );

                    }
                );


                iniciarCronometroDia(
                    sessao
                );


                console.log(
                    `DIA iniciado na sala ${codigoAcesso}`
                );

            }
        );


                /* =====================================================
           PROFESSOR — ENCERRAR PARTIDA MANUALMENTE
        ===================================================== */

        socket.on(
    "encerrarPartida",
    () => {

        const codigoAcesso =
            socket.data.codigoAcesso;

        const sessao =
            sessoes[
                codigoAcesso
            ];

        if (!sessao) {
            return;
        }

        if (
            sessao.professorId !==
            socket.id
        ) {

            socket.emit(
                "entradaErro",
                "Somente o professor pode encerrar a partida."
            );

            return;

        }

        if (
            sessao.fase ===
            "FIM"
        ) {

            socket.emit(
                "entradaErro",
                "A partida já foi encerrada."
            );

            return;

        }

        /* =====================================================
           FINALIZA A PARTIDA E ENVIA OS RESULTADOS
        ===================================================== */

        finalizarJogo(
            sessao,
            {
                fim:
                    true,

                vencedor:
                    "MANUAL",

                mensagem:
                    "A partida foi encerrada pelo professor."
            }
        );


        /* =====================================================
           AVISA OS ALUNOS QUE A SESSÃO FOI ENCERRADA
        ===================================================== */

        io.to(
            codigoAcesso
        ).emit(
            "sessaoEncerrada",
            {
                mensagem:
                    "A partida foi encerrada pelo professor."
            }
        );


        /* =====================================================
           ENCERRA A SESSÃO NO SERVIDOR
        ===================================================== */

        delete sessoes[
            codigoAcesso
        ];


        console.log(
            `Partida encerrada manualmente e sessão removida - Sala ${codigoAcesso}`
        );

    }
);

        /* =====================================================
           ALUNO — RESPONDER DIA
        ===================================================== */

        socket.on(
            "responderQuestaoDia",
            dados => {

                const codigoAcesso =
                    socket.data.codigoAcesso;


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {
                    return;
                }


                if (
                    sessao.fase !==
                    "DIA"
                ) {

                    return;

                }


                const jogador =
                    sessao.jogadores[
                        socket.id
                    ];


                if (!jogador) {
                    return;
                }


                if (
                    jogador.eVivo !== true
                ) {

                    return;

                }


                if (
                    jogador.respondeuDia
                ) {

                    return;

                }


                const resposta =
                    String(
                        dados?.resposta ||
                        ""
                    );


                const questao =
                    jogador.questaoDia;


                if (!questao) {
                    return;
                }


                jogador.respondeuDia =
                    true;


                const correta =
                    resposta ===
                    questao.respostaCorreta;


                if (correta) {

    jogador.pontuacao +=
        10;

    jogador.acertos +=
        1;

}

else {

    jogador.pontuacao -=
        5;

    jogador.erros +=
        1;

}


                io.to(
                    jogador.id
                ).emit(
                    "resultadoQuestaoDia",
                    {

                        correta,

                        respostaEscolhida:
                            resposta,

                        respostaCorreta:
                            questao.respostaCorreta,

                        pontuacao:
                            jogador.pontuacao

                    }
                );


                enviarEstado(
                    sessao
                );


                setTimeout(
                    () => {

                        if (
                            !sessoes[
                                codigoAcesso
                            ]
                        ) {

                            return;

                        }


                        if (
                            sessao.fase !==
                            "DIA"
                        ) {

                            return;

                        }


                        const jogadorAtual =
                            sessao.jogadores[
                                socket.id
                            ];


                        if (
                            !jogadorAtual ||
                            jogadorAtual.eVivo !== true
                        ) {

                            return;

                        }


                        enviarNovaQuestaoDia(
                            sessao,
                            jogadorAtual
                        );

                    },
                    700
                );

            }
        );


        /* =====================================================
           ALUNO — RESPONDER BÔNUS
        ===================================================== */

        socket.on(
            "responderBonus",
            dados => {

                const codigoAcesso =
                    socket.data.codigoAcesso;


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {
                    return;
                }


                if (
                    sessao.fase !==
                    "BONUS"
                ) {

                    return;

                }


                const jogador =
                    sessao.jogadores[
                        socket.id
                    ];


                if (!jogador) {
                    return;
                }


                if (
                    jogador.eVivo !== true
                ) {

                    return;

                }


                if (
                    jogador.respostaBonus !==
                    null
                ) {

                    return;

                }


                const alternativa =
                    dados?.alternativa;


                const questao =
                    jogador.questaoBonus;


                if (!questao) {
                    return;
                }


                /*
                    QUESTÃO MATEMÁTICA
                */

                if (
                    questao.tipo ===
                    "MATEMATICA"
                ) {

                    if (
                        typeof alternativa !==
                        "string"
                    ) {

                        return;

                    }


                    const correta =
                        alternativa ===
                        questao.respostaCorreta;


                    jogador.respostaBonus =
                        alternativa;


                    if (correta) {

    jogador.pontuacao +=
        10;

    jogador.acertos +=
        1;

}

else {

    jogador.pontuacao -=
        5;

    jogador.erros +=
        1;

}


                    io.to(
                        jogador.id
                    ).emit(
                        "resultadoBonusQuestao",
                        {

                            correta,

                            respostaEscolhida:
                                alternativa,

                            respostaCorreta:
                                questao.respostaCorreta,

                            pontuacao:
                                jogador.pontuacao

                        }
                    );

                }


                /*
                    AÇÃO DO ANJO / ASSASSINO
                */

                else {

                    if (
                        !alternativa ||
                        !alternativa.jogadorID
                    ) {

                        return;

                    }


                    const alvo =
                        sessao.jogadores[
                            alternativa.jogadorID
                        ];


                    if (!alvo) {

                        socket.emit(
                            "entradaErro",
                            "Esse jogador não está mais disponível."
                        );

                        return;

                    }


                    if (
                        alvo.eVivo !== true
                    ) {

                        socket.emit(
                            "entradaErro",
                            "Esse jogador já foi eliminado."
                        );

                        return;

                    }


                    if (
                        alvo.id === jogador.id
                    ) {

                        return;

                    }


                    jogador.respostaBonus = {

                        jogadorID:
                            alvo.id,

                        nome:
                            alvo.nome

                    };


                    socket.emit(
                        "acaoBonusRegistrada",
                        {

                            mensagem:
                                "Sua escolha foi registrada."

                        }
                    );

                }


                enviarEstado(
                    sessao
                );


                if (
                    todosResponderamBonus(
                        sessao
                    )
                ) {

                    setTimeout(
                        () => {

                            if (
                                sessoes[
                                    codigoAcesso
                                ]
                            ) {

                                finalizarBonus(
                                    sessao
                                );

                            }

                        },
                        1200
                    );

                }

            }
        );


        /* =====================================================
           ALUNO — VOTAR NO ASSASSINO
        ===================================================== */

        socket.on(
            "votarAssassino",
            dados => {

                const codigoAcesso =
                    socket.data.codigoAcesso;


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {
                    return;
                }


                if (
                    sessao.fase !==
                    "VOTACAO"
                ) {

                    return;

                }


                const jogador =
                    sessao.jogadores[
                        socket.id
                    ];


                if (!jogador) {
                    return;

                }


                if (
                    jogador.eVivo !== true
                ) {

                    return;

                }


                if (
                    jogador.voto !== null
                ) {

                    return;

                }


                const alvoID =
                    String(
                        dados?.alvoID ||
                        ""
                    );


                const alvo =
                    sessao.jogadores[
                        alvoID
                    ];


                if (!alvo) {

                    socket.emit(
                        "erroVotacao",
                        "Jogador não encontrado."
                    );

                    return;

                }


                if (
                    alvo.eVivo !== true
                ) {

                    socket.emit(
                        "erroVotacao",
                        "Esse jogador já foi eliminado."
                    );

                    return;

                }


                if (
                    alvo.id ===
                    jogador.id
                ) {

                    socket.emit(
                        "erroVotacao",
                        "Você não pode votar em si mesmo."
                    );

                    return;

                }


                jogador.voto =
                    alvo.id;

                    enviarEstadoVotacaoProfessor(sessao);

                socket.emit(
                    "votoRegistrado",
                    {

                        nome:
                            alvo.nome

                    }
                );


                registrarNoticia(
                    sessao,
                    `${jogador.nome} registrou seu voto.`,
                    "votacao"
                );


                enviarEstado(
                    sessao
                );


            }
        );


        /* =====================================================
           DESCONEXÃO
        ===================================================== */

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Dispositivo desconectado:",
                    socket.id
                );


                const codigoAcesso =
                    socket.data.codigoAcesso;


                if (!codigoAcesso) {
                    return;
                }


                const sessao =
                    sessoes[
                        codigoAcesso
                    ];


                if (!sessao) {
                    return;
                }


                /* =============================================
                   PROFESSOR
                ============================================= */

                if (
                    socket.data.tipo ===
                    "PROFESSOR"
                ) {

                    if (
                        sessao.professorId ===
                        socket.id
                    ) {

                        sessao.professorId =
                            null;


                        if (
                            sessao.fase ===
                            "AGUARDANDO_ALUNOS"
                        ) {

                            io.to(
                                codigoAcesso
                            ).emit(
                                "professorDesconectado"
                            );


                            agendarEncerramentoProfessor(
                                sessao
                            );

                        }

                    }


                    return;

                }


                /* =============================================
                   ALUNO
                ============================================= */

                if (
                    socket.data.tipo ===
                    "ALUNO"
                ) {

                    const jogador =
                        sessao.jogadores[
                            socket.id
                        ];


                    if (
                        jogador
                    ) {

                        /*
                            Se já foi eliminado,
                            mantém registro.
                        */

                        if (
                            jogador.eVivo === false
                        ) {

                            enviarEstado(
                                sessao
                            );

                            return;

                        }


                        /*
    Jogador vivo desconectado
    permanece reservado para retomada.
*/

jogador.conectado =
    false;


if (
    jogador.timerRetomada
) {

    clearTimeout(
        jogador.timerRetomada
    );

}


jogador.timerRetomada =
    setTimeout(
        () => {

            jogador.timerRetomada =
                null;

        },
        TEMPO_RETOMADA_ALUNO
    );


registrarNoticia(
    sessao,
    `${jogador.nome} foi desconectado e poderá retomar a partida.`,
    "info"
);


enviarEstado(
    sessao
);


console.log(
    `Aluno "${jogador.nome}" desconectou da sala ${codigoAcesso} e permanece reservado para retomada.`
);

                    }

                }

            }
        );

    }
);


/* =========================================================
   INICIAR SERVIDOR
========================================================= */

server.listen(
    PORTA,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "===================================="
        );
        console.log(
            "  CIDADE DORME - SERVIDOR ONLINE"
        );
        console.log(
            "===================================="
        );
        console.log(
            `Servidor: http://localhost:${PORTA}`
        );
        console.log(
            `Professor: http://localhost:${PORTA}/professor.html`
        );
        console.log(
            `Aluno:     http://localhost:${PORTA}/aluno.html`
        );
        console.log(
            "===================================="
        );
        console.log("");

    }
);
