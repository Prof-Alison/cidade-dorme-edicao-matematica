function embaralhar(array) {
    return [...array].sort(() => Math.random() - 0.5);
}


/* =========================================================
   MDC
========================================================= */

function mdc(a, b) {

    while (b !== 0) {

        const resto = a % b;

        a = b;
        b = resto;
    }

    return Math.abs(a);
}


/* =========================================================
   SIMPLIFICAR FRAÇÃO
========================================================= */

function simplificar(numerador, denominador) {

    const divisor =
        mdc(numerador, denominador);

    return {

        numerador:
            numerador / divisor,

        denominador:
            denominador / divisor

    };

}


/* =========================================================
   GERAR QUESTÃO
   ADIÇÃO DE FRAÇÕES COM DENOMINADORES DIFERENTES
========================================================= */

function gerarQuestao() {

    let denominador1;
    let denominador2;

    /*
        Denominadores entre 2 e 7.
        Eles obrigatoriamente serão diferentes.
    */

    do {

        denominador1 =
            Math.floor(
                Math.random() * 6
            ) + 2;

        denominador2 =
            Math.floor(
                Math.random() * 6
            ) + 2;

    } while (
        denominador1 === denominador2
    );


    /*
        Numeradores aleatórios.
        Sempre menores que seus denominadores.
    */

    const numerador1 =
        Math.floor(
            Math.random() *
            (denominador1 - 1)
        ) + 1;

    const numerador2 =
        Math.floor(
            Math.random() *
            (denominador2 - 1)
        ) + 1;


    /*
        Soma:

        a/b + c/d

        = (a*d + c*b) / (b*d)
    */

    const numeradorResultado =
        numerador1 * denominador2 +
        numerador2 * denominador1;

    const denominadorResultado =
        denominador1 * denominador2;


    /*
        Simplifica o resultado.
    */

    const resultado =
        simplificar(
            numeradorResultado,
            denominadorResultado
        );


    return {

        numerador1,

        denominador1,

        numerador2,

        denominador2,

        numeradorResultado:
            resultado.numerador,

        denominadorResultado:
            resultado.denominador,

        resposta:
            `${resultado.numerador}/${resultado.denominador}`

    };

}


/* =========================================================
   GERAR ALTERNATIVAS
========================================================= */

function gerarAlternativas(questao) {

    const alternativas =
        new Set();


    /*
        Coloca primeiro a resposta correta.
    */

    alternativas.add(
        questao.resposta
    );


    /*
        Gera alternativas erradas.
    */

    while (
        alternativas.size < 3
    ) {

        let numero;
        let denominador;


        const tipoErro =
            Math.floor(
                Math.random() * 4
            );


        /*
            ERRO 1
            Soma numeradores e denominadores.
        */

        if (
            tipoErro === 0
        ) {

            numero =
                questao.numerador1 +
                questao.numerador2;

            denominador =
                questao.denominador1 +
                questao.denominador2;

        }


        /*
            ERRO 2
            Multiplica numeradores
            e denominadores.
        */

        else if (
            tipoErro === 1
        ) {

            numero =
                questao.numerador1 *
                questao.numerador2;

            denominador =
                questao.denominador1 *
                questao.denominador2;

        }


        /*
            ERRO 3
            Usa o primeiro numerador
            com o segundo denominador.
        */

        else if (
            tipoErro === 2
        ) {

            numero =
                questao.numerador1 *
                questao.denominador2;

            denominador =
                questao.denominador1 *
                questao.denominador2;

        }


        /*
            ERRO 4
            Cria uma fração aleatória.
        */

        else {

            denominador =
                Math.floor(
                    Math.random() * 20
                ) + 2;

            numero =
                Math.floor(
                    Math.random() *
                    (denominador - 1)
                ) + 1;

        }


        if (
            numero <= 0 ||
            denominador <= 0
        ) {
            continue;
        }


        /*
            Simplifica a alternativa.
        */

        const simplificada =
            simplificar(
                numero,
                denominador
            );


        const alternativa =
            `${simplificada.numerador}/${simplificada.denominador}`;


        /*
            Não permite repetir
            a resposta correta ou
            outra alternativa.
        */

        if (
            !alternativas.has(
                alternativa
            )
        ) {

            alternativas.add(
                alternativa
            );

        }

    }


    /*
        Embaralha as 3 alternativas.
    */

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

        tipo:
            "MATEMATICA",

        texto:
            `Quanto é ${questao.numerador1}/${questao.denominador1} + ${questao.numerador2}/${questao.denominador2}?`,

        alternativas:
            gerarAlternativas(
                questao
            ),

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

        tipo:
            "MATEMATICA",

        texto:
            `Quanto é ${questao.numerador1}/${questao.denominador1} + ${questao.numerador2}/${questao.denominador2}?`,

        alternativas:
            gerarAlternativas(
                questao
            ),

        respostaCorreta:
            questao.resposta

    };

}


/* =========================================================
   BÔNUS — ANJO / ASSASSINO
========================================================= */

function criarQuestaoBonusAcao(
    alvos,
    papel
) {

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
        Não mostramos o papel.

        A instrução continua discreta.
    */

    if (
        papel === "ANJO"
    ) {

        instrucao =
            `Escolha uma das pessoas abaixo para proteger nesta rodada. Antes de escolher, resolva mentalmente: ${questao.numerador1}/${questao.denominador1} + ${questao.numerador2}/${questao.denominador2}.`;

    }

    else {

        instrucao =
            `Escolha uma das pessoas abaixo para realizar sua ação nesta rodada. Antes de escolher, resolva mentalmente: ${questao.numerador1}/${questao.denominador1} + ${questao.numerador2}/${questao.denominador2}.`;

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
        "SALA02",

    nome:
        "Sala 02",

    descricao:
        "Soma de frações com denominadores diferentes",

    criarQuestaoDia,

    criarQuestaoBonusCidadao,

    criarQuestaoBonusAcao

};