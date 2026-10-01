function embaralhar(array) {
    return [...array].sort(() => Math.random() - 0.5);
}


function gerarQuestao() {

    const denominadores = [
    3, 4, 5, 6, 7, 8, 9, 10
    ];

    const denominador =
        denominadores[
            Math.floor(
                Math.random() * denominadores.length
            )
        ];

    let numerador1;
    let numerador2;

    do {

        numerador1 =
            Math.floor(
                Math.random() *
                (denominador - 1)
            ) + 1;

        numerador2 =
            Math.floor(
                Math.random() *
                (denominador - 1)
            ) + 1;

    } while (
        numerador1 + numerador2 >
        denominador
    );

    const soma =
        numerador1 + numerador2;

    return {

        numerador1,
        numerador2,
        denominador,

        resposta:
            `${soma}/${denominador}`

    };
}


function gerarAlternativas(questao) {

    const alternativas = new Set();

    alternativas.add(
        questao.resposta
    );

    while (
        alternativas.size < 3
    ) {

        const numero =
            Math.floor(
                Math.random() *
                questao.denominador
            ) + 1;

        const alternativa =
            `${numero}/${questao.denominador}`;

        if (
            alternativa !==
            questao.resposta
        ) {

            alternativas.add(
                alternativa
            );

        }

    }

    return embaralhar(
        Array.from(alternativas)
    );
}


/* =========================================================
   FASE DIA
========================================================= */

function criarQuestaoDia() {

    const questao =
        gerarQuestao();

    return {

        tipo: "MATEMATICA",

        texto:
            `Quanto é ${questao.numerador1}/${questao.denominador} + ${questao.numerador2}/${questao.denominador}?`,

        alternativas:
            gerarAlternativas(questao),

        respostaCorreta:
            questao.resposta

    };
}


/* =========================================================
   BÔNUS — CIDADÃO
========================================================= */

function criarQuestaoBonusCidadao() {

    const questao =
        gerarQuestao();

    return {

        tipo: "MATEMATICA",

        texto:
            `Quanto é ${questao.numerador1}/${questao.denominador} + ${questao.numerador2}/${questao.denominador}?`,

        alternativas:
            gerarAlternativas(questao),

        respostaCorreta:
            questao.resposta

    };
}


/* =========================================================
   BÔNUS — ANJO / ASSASSINO
========================================================= */

function criarQuestaoBonusAcao(alvos, papel) {

    if (
        !alvos ||
        alvos.length === 0
    ) {
        return criarQuestaoBonusCidadao();
    }


    const questao =
        gerarQuestao();


    let instrucao;


    /*
        Não mostramos "ANJO" ou "ASSASSINO".

        A própria instrução permite que o jogador
        descubra discretamente o que precisa fazer.
    */

    if (
    papel === "ANJO"
) {

    instrucao =
        `🛡️ VOCÊ É O ANJO  — ESCOLHA UM JOGADOR PARA PROTEGER. SEJA RÁPIDO: ${questao.numerador1}/${questao.denominador} + ${questao.numerador2}/${questao.denominador}.`;

}

else {

    instrucao =
        `🎯 VOCÊ É O ASSASSINO — ESCOLHA UM JOGADOR PARA ELIMINAR. SEJA RÁPIDO: ${questao.numerador1}/${questao.denominador} + ${questao.numerador2}/${questao.denominador}.`;

}


    const alternativas =
        alvos.map(
            alvo => ({

                nome:
                    alvo.nome,

                jogadorID:
                    alvo.id

            })
        );


    return {

        tipo:
            "ACAO_SECRETA",

        texto:
            instrucao,

        alternativas:
            embaralhar(
                alternativas
            )

    };

}


/* =========================================================
   EXPORTAÇÃO
========================================================= */

module.exports = {

    codigo:
        "SALA01",

    nome:
        "Sala 01",

    descricao:
        "Soma de frações com mesmo denominador",

    criarQuestaoDia,

    criarQuestaoBonusCidadao,

    criarQuestaoBonusAcao

};
