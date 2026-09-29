const socket = io();

socket.on(
    "connect",
    function () {

        const clientToken =
            localStorage.getItem(
                "cidadeDormeClientToken"
            );

        const codigoSala =
            localStorage.getItem(
                "cidadeDormeSala"
            );

        if (
            clientToken &&
            codigoSala
        ) {

            console.log(
                "Conexão restabelecida. Tentando retomar a partida..."
            );

            socket.emit(
                "retomarSalaAluno",
                {
                    codigoAcesso:
                        codigoSala,

                    clientToken:
                        clientToken
                }
            );
        }
    }
);

let codigoSalaAtual = null;


/*
=========================================================
   CONTROLE DO JOGADOR
=========================================================
*/

let jogadorEliminado = false;


/*
=========================================================
   CONTROLE DAS ANIMAÇÕES
=========================================================
*/

let timerResultadoNoite = null;


/*
=========================================================
   CONTROLE DA VOTAÇÃO
=========================================================
*/

let votoSelecionadoID = null;
let votoSelecionadoNome = null;
let votoConfirmado = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const pontuacaoAluno = document.getElementById("pontuacaoAluno");
const nomeAluno = document.getElementById("nomeAluno");
const codigoSala = document.getElementById("codigoSala");
const btnEntrar = document.getElementById("btnEntrar");
const mensagemErro = document.getElementById("mensagemErro");

const telaEntrada = document.getElementById("telaEntrada");
const telaEspera = document.getElementById("telaEsperaAluno");
const telaJogo = document.getElementById("telaJogo");
const telaBonus = document.getElementById("telaBonusAluno");
const telaCidadeDorme = document.getElementById("telaCidadeDorme");
const telaCidadeAcorda = document.getElementById("telaCidadeAcorda");
const telaVotacao = document.getElementById("telaVotacaoAluno");
const telaEliminado = document.getElementById("telaEliminado");
const telaFim = document.getElementById("telaFim");

const cronometro = document.getElementById("cronometroAluno");
const questao = document.getElementById("questao");
const questaoBonus = document.getElementById("questaoBonus");

const listaVotacao = document.getElementById("listaVotacao");
const mensagemVotacao = document.getElementById("mensagemVotacao");

const mensagemFim = document.getElementById("mensagemFim");
const pontuacaoFinal = document.getElementById("pontuacaoFinal");



/* =========================================================
   ESCONDER TODAS AS TELAS
========================================================= */

function esconderTodasAsTelas() {

    if (telaEntrada) {
        telaEntrada.classList.add("escondido");
    }

    if (telaEspera) {
        telaEspera.classList.add("escondido");
    }

    if (telaJogo) {
        telaJogo.classList.add("escondido");
    }

    if (telaBonus) {
        telaBonus.classList.add("escondido");
    }

    if (telaCidadeDorme) {
        telaCidadeDorme.classList.add("escondido");
    }

    if (telaCidadeAcorda) {
        telaCidadeAcorda.classList.add("escondido");
    }

    if (telaVotacao) {
        telaVotacao.classList.add("escondido");
    }

    if (telaEliminado) {
        telaEliminado.classList.add("escondido");
    }

    if (telaFim) {
        telaFim.classList.add("escondido");
    }
}


/* =========================================================
   LIMPAR QUESTÕES
========================================================= */

function limparQuestoes() {

    if (questao) {
        questao.innerHTML = "";
    }

    if (questaoBonus) {
        questaoBonus.innerHTML = "";
    }

    if (listaVotacao) {
        listaVotacao.innerHTML = "";
    }
}


/* =========================================================
   MOSTRAR TELA DO ELIMINADO
========================================================= */

function mostrarTelaEliminado(mensagem) {

    jogadorEliminado = true;

    if (timerResultadoNoite) {

        clearTimeout(timerResultadoNoite);

        timerResultadoNoite = null;
    }

    limparQuestoes();

    esconderTodasAsTelas();

    if (telaEliminado) {
        telaEliminado.classList.remove("escondido");
    }

    const tituloEliminado =
        document.getElementById("tituloEliminado");

    const mensagemEliminado =
        document.getElementById("mensagemEliminado");

    if (tituloEliminado) {

        tituloEliminado.textContent =
            "VOCÊ FOI ELIMINADO";
    }

    if (mensagemEliminado) {

        mensagemEliminado.textContent =
            mensagem ||
            "Você foi uma vítima do terrível assassino que nos assombra.";
    }

    if (pontuacaoAluno) {

        pontuacaoAluno.textContent =
            "Eliminado";
    }
}


/* =========================================================
   ENTRAR NA SALA
========================================================= */

if (btnEntrar) {

    btnEntrar.addEventListener(
        "click",
        function () {

            const nome =
                nomeAluno
                    ? nomeAluno.value.trim()
                    : "";

            const codigo =
                codigoSala
                    ? codigoSala.value.trim().toUpperCase()
                    : "";

            if (mensagemErro) {
                mensagemErro.textContent = "";
            }

            if (!nome) {

                if (mensagemErro) {
                    mensagemErro.textContent =
                        "Digite seu nome.";
                }

                return;
            }

            if (codigo.length !== 4) {

                if (mensagemErro) {
                    mensagemErro.textContent =
                        "Digite o código de 4 caracteres.";
                }

                return;
            }

            jogadorEliminado = false;

            let clientToken =
    localStorage.getItem(
        "cidadeDormeClientToken"
    );


if (
    !clientToken
) {

    clientToken =
        crypto.randomUUID();

    localStorage.setItem(
        "cidadeDormeClientToken",
        clientToken
    );

}


localStorage.setItem(
    "cidadeDormeNome",
    nome
);


localStorage.setItem(
    "cidadeDormeSala",
    codigo
);


socket.emit(
    "entrarComoAluno",
    {
        nome:
            nome,

        codigoAcesso:
            codigo,

        clientToken:
            clientToken
    }
);
        }
    );
}


/* =========================================================
   ALUNO ENTROU NA SALA
========================================================= */

socket.on(
    "alunoEntrou",
    function (dados) {

        codigoSalaAtual =
            dados.codigoSala;

        jogadorEliminado = false;

        // Guarda os dados da partida
        localStorage.setItem(
            "cidadeDormeSala",
            dados.codigoSala
        );

        if (dados.clientToken) {
            localStorage.setItem(
                "cidadeDormeClientToken",
                dados.clientToken
            );
        }

        esconderTodasAsTelas();

        if (telaEspera) {
            telaEspera.classList.remove("escondido");
        }
    }
);

/* =========================================================
   ERRO AO ENTRAR
========================================================= */

socket.on(
    "entradaErro",
    function (mensagem) {

        if (mensagemErro) {
            mensagemErro.textContent = mensagem;
        }
    }
);

socket.on(
    "salaRetomada",
    function (dados) {

        codigoSalaAtual =
            dados.codigoAcesso;

        jogadorEliminado =
            dados.eVivo !== true;

        esconderTodasAsTelas();

        if (telaEspera) {
            telaEspera.classList.remove("escondido");
        }

        console.log(
            "Partida retomada:",
            dados
        );
    }
);


socket.on(
    "retomadaErro",
    function (mensagem) {

        console.log(
            "Não foi possível retomar:",
            mensagem
        );

        // Remove os dados antigos da partida
        localStorage.removeItem(
            "cidadeDormeSala"
        );

        localStorage.removeItem(
            "cidadeDormeClientToken"
        );
    }
);


/* =========================================================
   ALUNO REMOVIDO DA SALA
========================================================= */

socket.on(
    "alunoRemovido",
    function () {

        codigoSalaAtual = null;

        jogadorEliminado = false;

        esconderTodasAsTelas();

        if (telaEntrada) {
            telaEntrada.classList.remove("escondido");
        }

        if (mensagemErro) {
            mensagemErro.textContent =
                "Você foi removido desta sala.";
        }
    }
);


/* =========================================================
   SESSÃO ENCERRADA PELO PROFESSOR
========================================================= */

socket.on(
    "sessaoEncerrada",
    function (dados) {

        console.log(
            "Sessão encerrada:",
            dados
        );

        /* Cancela animações pendentes */
        if (timerResultadoNoite) {

            clearTimeout(
                timerResultadoNoite
            );

            timerResultadoNoite = null;
        }

        /* Limpa os dados da partida */
        localStorage.removeItem(
            "cidadeDormeSala"
        );

        localStorage.removeItem(
            "cidadeDormeClientToken"
        );

        localStorage.removeItem(
            "cidadeDormeNome"
        );

        /* Limpa controles da partida */
        codigoSalaAtual = null;
        jogadorEliminado = false;
        votoSelecionadoID = null;
        votoSelecionadoNome = null;
        votoConfirmado = false;

        /* Limpa as questões */
        limparQuestoes();

        /* Esconde todas as telas */
        esconderTodasAsTelas();

        /* Volta para a entrada */
        if (telaEntrada) {

            telaEntrada.classList.remove(
                "escondido"
            );

        }

        /* Mostra a mensagem */
        if (mensagemErro) {

            mensagemErro.textContent =
                dados &&
                dados.mensagem
                    ? dados.mensagem
                    : "A partida foi encerrada pelo professor.";

        }

    }
);

/* =========================================================
   FASE ATUALIZADA
========================================================= */

socket.on(
    "faseAtualizada",
    function (dados) {

        if (!dados) {
            return;
        }

        if (jogadorEliminado) {

            if (dados.fase === "FIM") {
                return;
            }

            mostrarTelaEliminado();

            return;
        }


        /* -------------------------
           DIA
        ------------------------- */

        if (dados.fase === "DIA") {

            if (telaEspera) {
                telaEspera.classList.add("escondido");
            }

            if (telaBonus) {
                telaBonus.classList.add("escondido");
            }

            if (telaCidadeDorme) {
                telaCidadeDorme.classList.add("escondido");
            }

            if (telaCidadeAcorda) {
                telaCidadeAcorda.classList.add("escondido");
            }

            if (telaVotacao) {
                telaVotacao.classList.add("escondido");
            }

            if (telaEliminado) {
                telaEliminado.classList.add("escondido");
            }

            if (telaFim) {
                telaFim.classList.add("escondido");
            }

            if (telaJogo) {
                telaJogo.classList.remove("escondido");
            }
        }


        /* -------------------------
           BÔNUS
        ------------------------- */

        if (dados.fase === "BONUS") {

            if (telaJogo) {
                telaJogo.classList.add("escondido");
            }

            if (telaCidadeDorme) {
                telaCidadeDorme.classList.add("escondido");
            }

            if (telaCidadeAcorda) {
                telaCidadeAcorda.classList.add("escondido");
            }

            if (telaVotacao) {
                telaVotacao.classList.add("escondido");
            }

            if (telaEliminado) {
                telaEliminado.classList.add("escondido");
            }

            if (telaFim) {
                telaFim.classList.add("escondido");
            }

            if (telaBonus) {
                telaBonus.classList.remove("escondido");
            }
        }


        /* -------------------------
           CIDADE DORMINDO
        ------------------------- */

        if (
            dados.fase === "DORMINDO" ||
            dados.fase === "DORME"
        ) {

            if (telaJogo) {
                telaJogo.classList.add("escondido");
            }

            if (telaBonus) {
                telaBonus.classList.add("escondido");
            }

            if (telaCidadeAcorda) {
                telaCidadeAcorda.classList.add("escondido");
            }

            if (telaVotacao) {
                telaVotacao.classList.add("escondido");
            }

            if (telaCidadeDorme) {
                telaCidadeDorme.classList.remove("escondido");
            }
        }


        /* -------------------------
           VOTAÇÃO
        ------------------------- */

        if (dados.fase === "VOTACAO") {

            if (telaJogo) {
                telaJogo.classList.add("escondido");
            }

            if (telaBonus) {
                telaBonus.classList.add("escondido");
            }

            if (telaCidadeDorme) {
                telaCidadeDorme.classList.add("escondido");
            }

            if (telaCidadeAcorda) {
                telaCidadeAcorda.classList.add("escondido");
            }

            if (telaEliminado) {
                telaEliminado.classList.add("escondido");
            }

            if (telaVotacao) {
                telaVotacao.classList.remove("escondido");
            }
        }
    }
);


/* =========================================================
   CIDADE DORME
========================================================= */

socket.on(
    "cidadeDorme",
    function () {

        if (jogadorEliminado) {
            return;
        }

        if (timerResultadoNoite) {

            clearTimeout(timerResultadoNoite);

            timerResultadoNoite = null;
        }

        esconderTodasAsTelas();

        if (telaCidadeDorme) {

            telaCidadeDorme.classList.remove(
                "escondido"
            );
        }
    }
);


/* =========================================================
   CIDADE ACORDA
========================================================= */

socket.on(
    "cidadeAcorda",
    function () {

        if (jogadorEliminado) {
            return;
        }

        esconderTodasAsTelas();

        if (telaCidadeAcorda) {

            telaCidadeAcorda.classList.remove(
                "escondido"
            );
        }
    }
);


/* =========================================================
   CRONÔMETRO
========================================================= */

socket.on(
    "cronometroAtualizado",
    function (segundos) {

        if (!cronometro) {
            return;
        }

        const valor =
            Number(segundos) || 0;

        const minutos =
            Math.floor(valor / 60);

        const segundosRestantes =
            valor % 60;

        cronometro.textContent =
            String(minutos).padStart(2, "0") +
            ":" +
            String(segundosRestantes).padStart(2, "0");
    }
);


/* =========================================================
   NOVA QUESTÃO DO DIA
========================================================= */

socket.on(
    "novaQuestaoDia",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (!questao || !dados) {
            return;
        }

        if (telaJogo) {
            telaJogo.classList.remove("escondido");
        }

        if (telaBonus) {
            telaBonus.classList.add("escondido");
        }

        if (telaCidadeDorme) {
            telaCidadeDorme.classList.add("escondido");
        }

        if (telaCidadeAcorda) {
            telaCidadeAcorda.classList.add("escondido");
        }

        if (telaVotacao) {
            telaVotacao.classList.add("escondido");
        }

        questao.innerHTML = "";

        const titulo =
            document.createElement("h2");

        titulo.textContent =
            dados.texto || "Questão";

        questao.appendChild(titulo);

        const alternativas =
            Array.isArray(dados.alternativas)
                ? dados.alternativas
                : [];

        alternativas.forEach(
            function (alternativa) {

                const botao =
                    document.createElement("button");

                botao.className =
                    "btn principal";

                botao.textContent =
                    alternativa;

                botao.addEventListener(
                    "click",
                    function () {

                        if (jogadorEliminado) {
                            return;
                        }

                        socket.emit(
                            "responderQuestaoDia",
                            {
                                codigoSala:
                                    codigoSalaAtual,

                                resposta:
                                    alternativa
                            }
                        );
                    }
                );

                questao.appendChild(botao);
            }
        );
    }
);


/* =========================================================
   RESULTADO DA QUESTÃO DO DIA
========================================================= */

socket.on(
    "resultadoQuestaoDia",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (!questao || !dados) {
            return;
        }

        questao.innerHTML = "";

        const resultado =
            document.createElement("div");

        resultado.style.textAlign = "center";
        resultado.style.padding = "20px";

        if (dados.correta === true) {

            resultado.innerHTML =

                "<h2 style='color:green;font-size:28px;'>" +
                    "✓ CORRETO!" +
                "</h2>" +

                "<p>" +
                    "Você ganhou <strong>10 pontos</strong>." +
                "</p>" +

                "<p>" +
                    "Resposta: " +
                    "<strong style='color:green;'>" +
                        (dados.respostaEscolhida ||
                         dados.respostaCorreta ||
                         "") +
                    "</strong>" +
                "</p>";

        } else {

            resultado.innerHTML =

                "<h2 style='color:red;font-size:28px;'>" +
                    "✗ INCORRETO!" +
                "</h2>" +

                "<p>" +
                    "Sua resposta: " +
                    "<strong style='color:red;'>" +
                        (dados.respostaEscolhida || "") +
                    "</strong>" +
                "</p>" +

                "<p>" +
                    "A resposta correta era: " +
                    "<strong style='color:green;'>" +
                        (dados.respostaCorreta || "") +
                    "</strong>" +
                "</p>" +

                "<p>" +
                    "Você perdeu <strong>5 pontos</strong>." +
                "</p>";
        }

        resultado.innerHTML +=

            "<h3>" +
                "Pontuação: " +
                (dados.pontuacao ?? 0) +
            "</h3>";

        questao.appendChild(resultado);
    }
);


/* =========================================================
   QUESTÃO BÔNUS
========================================================= */

socket.on(
    "questaoBonus",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (!questaoBonus || !dados) {
            return;
        }

        if (telaJogo) {
            telaJogo.classList.add("escondido");
        }

        if (telaCidadeDorme) {
            telaCidadeDorme.classList.add("escondido");
        }

        if (telaCidadeAcorda) {
            telaCidadeAcorda.classList.add("escondido");
        }

        if (telaVotacao) {
            telaVotacao.classList.add("escondido");
        }

        if (telaBonus) {
            telaBonus.classList.remove("escondido");
        }

        questaoBonus.innerHTML = "";

        const titulo =
            document.createElement("h2");

        titulo.textContent =
            dados.texto || "Bônus";

        questaoBonus.appendChild(titulo);

        const alternativas =
            Array.isArray(dados.alternativas)
                ? dados.alternativas
                : [];

        alternativas.forEach(
            function (alternativa) {

                const botao =
                    document.createElement("button");

                botao.className =
                    "btn principal";

                if (
                    typeof alternativa === "string"
                ) {

                    botao.textContent =
                        alternativa;

                } else {

                    botao.textContent =
                        alternativa.nome || "Jogador";
                }

                botao.addEventListener(
                    "click",
                    function () {

                        if (jogadorEliminado) {
                            return;
                        }

                        socket.emit(
                            "responderBonus",
                            {
                                codigoSala:
                                    codigoSalaAtual,

                                alternativa:
                                    alternativa
                            }
                        );
                    }
                );

                questaoBonus.appendChild(botao);
            }
        );
    }
);


/* =========================================================
   RESULTADO DA QUESTÃO BÔNUS
========================================================= */

socket.on(
    "resultadoBonusQuestao",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (!questaoBonus || !dados) {
            return;
        }

        const correta =
            dados.correta === true;

        const respostaEscolhida =
            dados.respostaEscolhida || "";

        const respostaCorreta =
            dados.respostaCorreta || "";

        questaoBonus.innerHTML = "";

        const resultado =
            document.createElement("div");

        resultado.style.textAlign = "center";
        resultado.style.padding = "20px";

        if (correta) {

            resultado.innerHTML =

                "<h2 style='color:green;font-size:28px;'>" +
                    "✓ CORRETO!" +
                "</h2>" +

                "<p>" +
                    "Você ganhou <strong>10 pontos</strong>." +
                "</p>" +

                "<p>" +
                    "Resposta: " +
                    "<strong style='color:green;'>" +
                        (respostaEscolhida || respostaCorreta) +
                    "</strong>" +
                "</p>";

        } else {

            resultado.innerHTML =

                "<h2 style='color:red;font-size:28px;'>" +
                    "✗ INCORRETO!" +
                "</h2>" +

                "<p>" +
                    "Sua resposta: " +
                    "<strong style='color:red;'>" +
                        respostaEscolhida +
                    "</strong>" +
                "</p>" +

                "<p>" +
                    "Resposta correta: " +
                    "<strong style='color:green;'>" +
                        respostaCorreta +
                    "</strong>" +
                "</p>" +

                "<p>" +
                    "Você perdeu <strong>5 pontos</strong>." +
                "</p>";
        }

        resultado.innerHTML +=

            "<h3>" +
                "Pontuação: " +
                (dados.pontuacao ?? 0) +
            "</h3>" +

            "<p>" +
                "Aguardando os outros jogadores..." +
            "</p>";

        questaoBonus.appendChild(resultado);
    }
);


/* =========================================================
   AÇÃO BÔNUS REGISTRADA
========================================================= */

socket.on(
    "acaoBonusRegistrada",
    function () {

        if (jogadorEliminado) {
            return;
        }

        if (!questaoBonus) {
            return;
        }

        questaoBonus.innerHTML =

            "<div style='text-align:center;padding:30px;'>" +

                "<h2>" +
                    "✓ Escolha registrada" +
                "</h2>" +

                "<p>" +
                    "Aguarde os outros jogadores..." +
                "</p>" +

            "</div>";
    }
);


/* =========================================================
   RESULTADO DO BÔNUS / RESULTADO DA NOITE
========================================================= */

socket.on(
    "resultadoBonus",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (timerResultadoNoite) {

            clearTimeout(timerResultadoNoite);
        }

        timerResultadoNoite =
            setTimeout(
                function () {

                    timerResultadoNoite = null;

                    if (jogadorEliminado) {
                        return;
                    }

                    if (telaCidadeAcorda) {
                        telaCidadeAcorda.classList.add(
                            "escondido"
                        );
                    }

                    if (telaCidadeDorme) {
                        telaCidadeDorme.classList.add(
                            "escondido"
                        );
                    }

                    if (telaJogo) {
                        telaJogo.classList.add(
                            "escondido"
                        );
                    }

                    if (telaVotacao) {
                        telaVotacao.classList.add(
                            "escondido"
                        );
                    }

                    if (telaBonus) {
                        telaBonus.classList.remove(
                            "escondido"
                        );
                    }

                    if (!questaoBonus) {
                        return;
                    }

                    questaoBonus.innerHTML =

                        "<div style='text-align:center;padding:30px;'>" +

                            "<h2>" +
                                "☀️ A CIDADE ACORDOU" +
                            "</h2>" +

                            "<p style='font-size:22px;margin-top:25px;'>" +
                                (dados && dados.mensagem
                                    ? dados.mensagem
                                    : "") +
                            "</p>" +

                            "<p style='margin-top:25px;opacity:.8;'>" +
                                "Prepare-se para a votação..." +
                            "</p>" +

                        "</div>";

                },

                2500
            );
    }
);


/* =========================================================
   VOTAÇÃO INICIADA
========================================================= */

socket.on(
    "iniciarVotacao",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (timerResultadoNoite) {

            clearTimeout(timerResultadoNoite);

            timerResultadoNoite = null;
        }

        votoSelecionadoID = null;
        votoSelecionadoNome = null;
        votoConfirmado = false;

        if (telaJogo) {
            telaJogo.classList.add("escondido");
        }

        if (telaBonus) {
            telaBonus.classList.add("escondido");
        }

        if (telaCidadeDorme) {
            telaCidadeDorme.classList.add("escondido");
        }

        if (telaCidadeAcorda) {
            telaCidadeAcorda.classList.add("escondido");
        }

        if (telaEliminado) {
            telaEliminado.classList.add("escondido");
        }

        if (telaVotacao) {
            telaVotacao.classList.remove("escondido");
        }

        if (listaVotacao) {
            listaVotacao.innerHTML = "";
        }

        if (mensagemVotacao) {
            mensagemVotacao.innerHTML = "";
        }

        if (
            !dados ||
            !Array.isArray(dados.jogadores)
        ) {

            if (mensagemVotacao) {
                mensagemVotacao.textContent =
                    "Não há jogadores disponíveis para votar.";
            }

            return;
        }

        const jogadoresDisponiveis =
            dados.jogadores.filter(
                function (jogador) {

                    return jogador.jogadorID !== socket.id &&
                           jogador.eVivo !== false;
                }
            );

        if (jogadoresDisponiveis.length === 0) {

            if (mensagemVotacao) {
                mensagemVotacao.textContent =
                    "Não há jogadores disponíveis para votar.";
            }

            return;
        }


        /*
        =====================================================
        CRIA AS CARTAS DOS JOGADORES
        =====================================================
        */

        jogadoresDisponiveis.forEach(
            function (jogador) {

                const carta =
                    document.createElement("div");

                carta.className =
                    "carta-votacao";

                carta.dataset.jogadorID =
                    jogador.jogadorID;

                const nome =
                    document.createElement("div");

                nome.className =
                    "nome-carta-votacao";

                nome.textContent =
                    jogador.nome;

                const check =
                    document.createElement("div");

                check.className =
                    "check-votacao";

                check.textContent =
                    "✓";

                carta.appendChild(nome);
                carta.appendChild(check);


                carta.addEventListener(
                    "click",
                    function () {

                        if (jogadorEliminado) {
                            return;
                        }

                        if (votoConfirmado) {
                            return;
                        }


                        /*
                        Se clicar na carta que já está
                        selecionada, ela é desmarcada.
                        */

                        if (
                            votoSelecionadoID ===
                            jogador.jogadorID
                        ) {

                            votoSelecionadoID = null;
                            votoSelecionadoNome = null;

                            carta.classList.remove(
                                "selecionada"
                            );

                            atualizarBotaoConfirmarVoto();

                            return;
                        }


                        /*
                        Remove seleção anterior.
                        */

                        const cartas =
                            document.querySelectorAll(
                                ".carta-votacao"
                            );

                        cartas.forEach(
                            function (outraCarta) {

                                outraCarta.classList.remove(
                                    "selecionada"
                                );
                            }
                        );


                        /*
                        Seleciona a nova carta.
                        */

                        votoSelecionadoID =
                            jogador.jogadorID;

                        votoSelecionadoNome =
                            jogador.nome;

                        carta.classList.add(
                            "selecionada"
                        );

                        atualizarBotaoConfirmarVoto();
                    }
                );


                if (listaVotacao) {
                    listaVotacao.appendChild(carta);
                }
            }
        );


        /*
        =====================================================
        BOTÃO CONFIRMAR VOTO
        =====================================================
        */

        const botaoConfirmar =
            document.createElement("button");

        botaoConfirmar.id =
            "btnConfirmarVoto";

        botaoConfirmar.textContent =
            "CONFIRMAR VOTO";

        botaoConfirmar.disabled =
            true;

        botaoConfirmar.addEventListener(
            "click",
            function () {

                if (jogadorEliminado) {
                    return;
                }

                if (votoConfirmado) {
                    return;
                }

                if (!votoSelecionadoID) {

                    if (mensagemVotacao) {
                        mensagemVotacao.textContent =
                            "Escolha um jogador antes de confirmar.";
                    }

                    return;
                }


                votoConfirmado = true;


                socket.emit(
                    "votarAssassino",
                    {
                        codigoSala:
                            codigoSalaAtual,

                        alvoID:
                            votoSelecionadoID
                    }
                );


                /*
                Bloqueia todas as cartas.
                */

                const cartas =
                    document.querySelectorAll(
                        ".carta-votacao"
                    );

                cartas.forEach(
                    function (carta) {

                        carta.style.pointerEvents =
                            "none";

                        carta.style.opacity =
                            ".65";
                    }
                );


                botaoConfirmar.disabled =
                    true;

                botaoConfirmar.textContent =
                    "✓ VOTO CONFIRMADO";


                if (mensagemVotacao) {

                    mensagemVotacao.innerHTML =

                        "<div class='voto-confirmado'>" +

                            "✓ VOTO REGISTRADO" +

                            "<br><br>" +

                            "<span style='font-weight:normal;'>" +
                                "Você votou em " +
                                "<strong>" +
                                    votoSelecionadoNome +
                                "</strong>." +
                            "</span>" +

                            "<br><br>" +

                            "<span style='font-weight:normal;'>" +
                                "Aguarde os outros jogadores..." +
                            "</span>" +

                        "</div>";
                }
            }
        );

        if (telaVotacao) {

            telaVotacao.appendChild(
                botaoConfirmar
            );
        }
    }
);


/* =========================================================
   ATUALIZAR BOTÃO DE CONFIRMAÇÃO
========================================================= */

function atualizarBotaoConfirmarVoto() {

    const botao =
        document.getElementById(
            "btnConfirmarVoto"
        );

    if (!botao) {
        return;
    }

    if (votoSelecionadoID) {

        botao.disabled = false;

        botao.textContent =
            "CONFIRMAR VOTO EM " +
            (votoSelecionadoNome || "JOGADOR");

        if (mensagemVotacao) {

            mensagemVotacao.textContent =
                "Você selecionou " +
                (votoSelecionadoNome || "este jogador") +
                ". Confirme seu voto.";
        }

    } else {

        botao.disabled = true;

        botao.textContent =
            "CONFIRMAR VOTO";

        if (mensagemVotacao) {

            mensagemVotacao.textContent =
                "Escolha um jogador para votar.";
        }
    }
}


/* =========================================================
   VOTO REGISTRADO
========================================================= */

socket.on(
    "votoRegistrado",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        /*
        Se o servidor confirmar o voto,
        mantemos a tela bloqueada.
        */

        votoConfirmado = true;

        const botao =
            document.getElementById(
                "btnConfirmarVoto"
            );

        if (botao) {

            botao.disabled = true;

            botao.textContent =
                "✓ VOTO CONFIRMADO";
        }

        const cartas =
            document.querySelectorAll(
                ".carta-votacao"
            );

        cartas.forEach(
            function (carta) {

                carta.style.pointerEvents =
                    "none";

                carta.style.opacity =
                    ".65";
            }
        );

        if (mensagemVotacao) {

            mensagemVotacao.innerHTML =

                "<div class='voto-confirmado'>" +

                    "✓ VOTO REGISTRADO" +

                    "<br><br>" +

                    "<span style='font-weight:normal;'>" +
                        "Aguarde os outros jogadores..." +
                    "</span>" +

                "</div>";
        }
    }
);


/* =========================================================
   ERRO NA VOTAÇÃO
========================================================= */

socket.on(
    "erroVotacao",
    function (mensagem) {

        if (jogadorEliminado) {
            return;
        }

        /*
        Se o servidor rejeitar o voto,
        permitimos uma nova tentativa.
        */

        votoConfirmado = false;

        const botao =
            document.getElementById(
                "btnConfirmarVoto"
            );

        if (botao) {
            botao.disabled = !votoSelecionadoID;

            botao.textContent =
                "CONFIRMAR VOTO";
        }

        if (mensagemVotacao) {

            mensagemVotacao.textContent =
                mensagem;
        }
    }
);


/* =========================================================
   RESULTADO DA VOTAÇÃO
========================================================= */

socket.on(
    "resultadoVotacao",
    function (dados) {

        if (jogadorEliminado) {
            return;
        }

        if (telaVotacao) {
            telaVotacao.classList.remove("escondido");
        }

        if (telaCidadeDorme) {
            telaCidadeDorme.classList.add("escondido");
        }

        if (telaCidadeAcorda) {
            telaCidadeAcorda.classList.add("escondido");
        }

        if (listaVotacao) {
            listaVotacao.innerHTML = "";
        }

        const botaoConfirmar =
            document.getElementById(
                "btnConfirmarVoto"
            );

        if (botaoConfirmar) {
            botaoConfirmar.remove();
        }

        if (!mensagemVotacao) {
            return;
        }

        mensagemVotacao.innerHTML =

            "<div style='text-align:center;padding:20px;'>" +

                "<h2>" +
                    "Resultado da votação" +
                "</h2>" +

                "<p style='font-size:20px;margin-top:20px;'>" +
                    (dados.mensagem || "") +
                "</p>" +

            "</div>";
    }
);


/* =========================================================
   JOGADOR ELIMINADO
========================================================= */

socket.on(
    "jogadorEliminado",
    function (dados) {

        mostrarTelaEliminado(
            dados && dados.mensagem
                ? dados.mensagem
                : "Você foi uma vítima do terrível assassino que nos assombra."
        );
    }
);


/* =========================================================
   FIM DE JOGO
========================================================= */

socket.on(
    "fimDeJogo",
    function (dados) {

        if (timerResultadoNoite) {

            clearTimeout(timerResultadoNoite);

            timerResultadoNoite = null;
        }

        esconderTodasAsTelas();

        if (telaFim) {
            telaFim.classList.remove("escondido");
        }

        if (mensagemFim) {

            mensagemFim.textContent =
                dados.mensagem ||
                "O jogo terminou.";
        }

        if (pontuacaoFinal && pontuacaoAluno) {

            pontuacaoFinal.textContent =
                pontuacaoAluno.textContent;
        }
    }
);


/* =========================================================
   ATUALIZAÇÃO DA SALA / PONTUAÇÃO
========================================================= */

socket.on(
    "estadoSala",
    function (dados) {

        if (!dados || !pontuacaoAluno) {
            return;
        }

        const lista =
            Array.isArray(dados.jogadores)
                ? dados.jogadores
                : (
                    Array.isArray(dados.alunos)
                        ? dados.alunos
                        : []
                );

        const aluno =
            lista.find(
                function (jogador) {

                    return jogador.id === socket.id;
                }
            );

        if (!aluno) {
            return;
        }

        if (aluno.eVivo === false) {

            if (!jogadorEliminado) {

                mostrarTelaEliminado(
                    "Você foi uma vítima do terrível assassino que nos assombra."
                );
            }

            pontuacaoAluno.textContent =
                "Eliminado";

        } else {

            if (!jogadorEliminado) {

                pontuacaoAluno.textContent =
                    "Pontuação: " +
                    (aluno.pontuacao ?? 0);
            }
        }
    }
);