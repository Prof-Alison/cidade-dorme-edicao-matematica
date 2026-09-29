const socket = io();

let codigoSalaAtual = null;
let codigoAcessoAtual = null;


/* =========================================================
   ELEMENTOS
========================================================= */

const telaConfiguracao =
    document.getElementById("telaConfiguracao");

const telaEspera =
    document.getElementById("telaEspera");

const telaDia =
    document.getElementById("telaDia");

const telaBonus =
    document.getElementById("telaBonus");

const telaVotacaoProfessor =
    document.getElementById("telaVotacaoProfessor");

const telaNoiteProfessor =
    document.getElementById("telaNoiteProfessor");

const telaResultadoProfessor =
    document.getElementById("telaResultadoProfessor");


const nomeProfessor =
    document.getElementById("nomeProfessor");

const salaSelecionada =
    document.getElementById("salaSelecionada");

const duracaoDia =
    document.getElementById("duracaoDia");

const btnCriarSala =
    document.getElementById("btnCriarSala");

const btnIniciarDia =
    document.getElementById("btnIniciarDia");

const btnEncerrarPartida =
    document.getElementById("btnEncerrarPartida");

const btnNovaSala =
    document.getElementById("btnNovaSala");

const codigoAcesso =
    document.getElementById("codigoAcesso");

const quantidadeAlunos =
    document.getElementById("quantidadeAlunos");

const listaAlunos =
    document.getElementById("listaAlunos");

const nomeSala =
    document.getElementById("nomeSala");

const descricaoSala =
    document.getElementById("descricaoSala");

const cronometro =
    document.getElementById("cronometro");


const quantidadeVivosProfessor =
    document.getElementById("quantidadeVivosProfessor");

const quantidadeVivosBonus =
    document.getElementById("quantidadeVivosBonus");

const quantidadeVivosVotacao =
    document.getElementById("quantidadeVivosVotacao");

const quantidadeVivosNoite =
    document.getElementById("quantidadeVivosNoite");

const quantidadeVivosFinal =
    document.getElementById("quantidadeVivosFinal");


const statusDiaProfessor =
    document.getElementById("statusDiaProfessor");

const tituloBonusProfessor =
    document.getElementById("tituloBonusProfessor");

const statusBonusProfessor =
    document.getElementById("statusBonusProfessor");

const statusVotacaoProfessor =
    document.getElementById("statusVotacaoProfessor");


const resultadoVotacaoProfessor =
    document.getElementById("resultadoVotacaoProfessor");

const tituloNoiteProfessor =
    document.getElementById("tituloNoiteProfessor");

const mensagemNoiteProfessor =
    document.getElementById("mensagemNoiteProfessor");


const tituloResultadoProfessor =
    document.getElementById("tituloResultadoProfessor");

const resultadoProfessor =
    document.getElementById("resultadoProfessor");


const noticiasProfessorDia =
    document.getElementById("noticiasProfessorDia");

const noticiasProfessorBonus =
    document.getElementById("noticiasProfessorBonus");

const noticiasProfessorVotacao =
    document.getElementById("noticiasProfessorVotacao");

const noticiasProfessorFinal =
    document.getElementById("noticiasProfessorFinal");


/* =========================================================
   SALAS DISPONÍVEIS
========================================================= */

const SALAS = [

    {
        codigo: "SALA01",
        nome: "Sala 01",
        descricao:
            "Soma de frações com mesmo denominador"
    },

    {
        codigo: "SALA02",
        nome: "Sala 02",
        descricao:
            "Soma de frações com denominadores diferentes"
    }

];


SALAS.forEach(sala => {

    const option =
        document.createElement("option");

    option.value =
        sala.codigo;

    option.textContent =
        `${sala.nome} - ${sala.descricao}`;

    salaSelecionada.appendChild(option);

});


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function esconderTodasAsTelas() {

    telaConfiguracao.classList.add("escondido");
    telaEspera.classList.add("escondido");
    telaDia.classList.add("escondido");
    telaBonus.classList.add("escondido");
    telaVotacaoProfessor.classList.add("escondido");
    telaNoiteProfessor.classList.add("escondido");
    telaResultadoProfessor.classList.add("escondido");

}


function mostrarTela(tela) {

    esconderTodasAsTelas();

    tela.classList.remove("escondido");

}


function atualizarQuantidadeVivos(quantidade) {

    const valor =
        Number.isFinite(Number(quantidade))
            ? Number(quantidade)
            : 0;

    quantidadeVivosProfessor.textContent =
        valor;

    quantidadeVivosBonus.textContent =
        valor;

    quantidadeVivosVotacao.textContent =
        valor;

    quantidadeVivosNoite.textContent =
        valor;

    quantidadeVivosFinal.textContent =
        valor;

}


function limparNoticias() {

    noticiasProfessorDia.innerHTML = "";
    noticiasProfessorBonus.innerHTML = "";
    noticiasProfessorVotacao.innerHTML = "";
    noticiasProfessorFinal.innerHTML = "";

}


function adicionarNoticia(
    mensagem,
    tipo = "info",
    container = noticiasProfessorDia
) {

    if (!mensagem) {
        return;
    }

    const noticia =
        document.createElement("div");

    noticia.className =
        "noticia";


    if (tipo) {
        noticia.classList.add(tipo);
    }


    const titulo =
        document.createElement("strong");

    titulo.textContent =
        obterTituloNoticia(tipo);


    const texto =
        document.createElement("span");

    texto.textContent =
        mensagem;


    noticia.appendChild(titulo);
    noticia.appendChild(texto);


    container.prepend(noticia);

}


function obterTituloNoticia(tipo) {

    switch (tipo) {

        case "noite":
            return "🌙 NOITE";

        case "destaque":
            return "⚠️ ACONTECIMENTO";

        case "sucesso":
            return "✅ RESULTADO";

        case "votacao":
            return "🗳️ VOTAÇÃO";

        case "final":
            return "🏆 FIM DE JOGO";

        default:
            return "📢 AVISO";

    }

}


function adicionarNoticiaEmTodas(
    mensagem,
    tipo = "info"
) {

    adicionarNoticia(
        mensagem,
        tipo,
        noticiasProfessorDia
    );

    adicionarNoticia(
        mensagem,
        tipo,
        noticiasProfessorBonus
    );

    adicionarNoticia(
        mensagem,
        tipo,
        noticiasProfessorVotacao
    );

    adicionarNoticia(
        mensagem,
        tipo,
        noticiasProfessorFinal
    );

}


function atualizarDadosSala(dados) {

    if (!dados) {
        return;
    }

    if (
    codigoAcessoAtual &&
    dados.codigoAcesso &&
    dados.codigoAcesso !== codigoAcessoAtual
) {
    console.log(
        "Ignorando estado de outra sala:",
        dados.codigoAcesso
    );

    return;
}

    if (dados.codigoSala) {

        codigoSalaAtual =
            dados.codigoSala;

    }


    if (dados.codigoAcesso) {

        codigoAcesso.textContent =
            dados.codigoAcesso;

    }


    if (dados.nomeSala) {

        nomeSala.textContent =
            dados.nomeSala;

    }


    if (dados.descricao) {

        descricaoSala.textContent =
            dados.descricao;

    }


    if (
        dados.quantidadeVivos !== undefined
    ) {

        atualizarQuantidadeVivos(
            dados.quantidadeVivos
        );

    }
    else if (
        dados.jogadoresVivos !== undefined
    ) {

        atualizarQuantidadeVivos(
            dados.jogadoresVivos
        );

    }


    if (
        dados.quantidadeAlunos !== undefined
    ) {

        quantidadeAlunos.textContent =
            dados.quantidadeAlunos;

    }


    if (Array.isArray(dados.alunos)) {

        atualizarAlunos(
            dados.alunos
        );

    }

}


function atualizarAlunos(jogadores) {

    const alunos =
        jogadores.filter(
            jogador =>
                !jogador.eProfessor
        );


    const vivos =
        alunos.filter(
            jogador =>
                jogador.eVivo !== false
        );


    quantidadeAlunos.textContent =
        vivos.length;


    listaAlunos.innerHTML = "";


    if (alunos.length === 0) {

        const vazio =
            document.createElement("p");

        vazio.textContent =
            "Aguardando alunos entrarem...";

        listaAlunos.appendChild(vazio);

        return;
    }


    alunos.forEach(aluno => {

        const div =
            document.createElement("div");


        div.className =
            "aluno";


        if (aluno.eVivo === false) {

            div.classList.add("morto");

            div.innerHTML = `
                <span>
                    💀 ${aluno.nome}
                </span>
            `;

        }
        else {

            div.innerHTML = `
                <span>
                    ✓ ${aluno.nome}
                </span>

                <button
                    class="btnRemover"
                    data-id="${aluno.id}"
                >
                    REMOVER
                </button>
            `;


            const btnRemover =
                div.querySelector(".btnRemover");


            btnRemover.addEventListener(
                "click",
                () => {

                    const confirmar =
                        confirm(
                            `Deseja remover ${aluno.nome} da sala?`
                        );


                    if (!confirmar) {
                        return;
                    }


                    socket.emit(
                        "removerAluno",
                        {
                            codigoSala:
                                codigoSalaAtual,

                            jogadorID:
                                aluno.id
                        }
                    );

                }
            );

        }


        listaAlunos.appendChild(div);

    });

}


/* =========================================================
   PROGRESSO DA VOTAÇÃO
========================================================= */

function criarPainelProgressoVotacao() {

    let painel =
        document.getElementById(
            "progressoVotacaoProfessor"
        );


    if (painel) {
        return painel;
    }


    painel =
        document.createElement("div");


    painel.id =
        "progressoVotacaoProfessor";


    painel.innerHTML = `

        <div class="cabecalho-progresso-votacao">

            <strong>
                🗳️ ACOMPANHAMENTO DA VOTAÇÃO
            </strong>

            <span
                id="contadorVotosProfessor"
            >
                0 de 0 votos registrados
            </span>

        </div>

        <div
            id="listaProgressoVotacaoProfessor"
            class="lista-progresso-votacao"
        ></div>

    `;


    statusVotacaoProfessor.insertAdjacentElement(
        "afterend",
        painel
    );


    return painel;

}


function atualizarProgressoVotacao(dados) {

    if (!dados) {
        return;
    }


    const painel =
        criarPainelProgressoVotacao();


    const contador =
        document.getElementById(
            "contadorVotosProfessor"
        );


    const lista =
        document.getElementById(
            "listaProgressoVotacaoProfessor"
        );


    if (!contador || !lista) {
        return;
    }


    const jogadores =
        Array.isArray(dados.jogadores)
            ? dados.jogadores
            : [];


    const vivos =
        jogadores.filter(
            jogador =>
                jogador.eVivo !== false
        );


    const total =
        dados.quantidadeVivos !== undefined
            ? Number(dados.quantidadeVivos)
            : vivos.length;


    const votos =
        dados.votosRegistrados !== undefined
            ? Number(dados.votosRegistrados)
            : vivos.filter(
                jogador =>
                    jogador.votou === true
            ).length;


    contador.textContent =
        `${votos} de ${total} votos registrados`;


    lista.innerHTML = "";


    vivos.forEach(jogador => {

        const item =
            document.createElement("div");


        item.className =
            "item-progresso-votacao";


        const nome =
            document.createElement("span");


        nome.className =
            "nome-progresso-votacao";


        nome.textContent =
            jogador.nome;


        const status =
            document.createElement("span");


        status.className =
            jogador.votou
                ? "status-votou"
                : "status-aguardando";


        if (jogador.votou) {

            status.textContent =
                "✓ VOTOU";

        }
        else {

            status.textContent =
                "⏳ AGUARDANDO";

        }


        item.appendChild(nome);
        item.appendChild(status);


        lista.appendChild(item);

    });


    if (vivos.length === 0) {

        lista.innerHTML = `
            <div class="votacao-sem-jogadores">
                Não há jogadores vivos para votar.
            </div>
        `;

    }

}


function esconderProgressoVotacao() {

    const painel =
        document.getElementById(
            "progressoVotacaoProfessor"
        );


    if (painel) {

        painel.remove();

    }

}


/* =========================================================
   CRIAR SALA
========================================================= */

btnCriarSala.addEventListener(
    "click",
    () => {

        const nome =
            nomeProfessor.value.trim();

        const codigo =
            salaSelecionada.value;

        const duracao =
            Number(duracaoDia.value);


        if (!nome) {

            alert(
                "Digite seu nome."
            );

            return;
        }


        socket.emit(
            "criarSalaProfessor",
            {
                nome,
                codigoSala: codigo,
                duracaoSegundos: duracao
            }
        );

    }
);


/* =========================================================
   SALA CRIADA
========================================================= */

socket.on(
    "salaCriada",
    dados => {

        codigoSalaAtual =
            dados.codigoSala;

        codigoAcessoAtual =
    dados.codigoAcesso;

        localStorage.setItem(
    "cidadeDormeProfessorSala",
    dados.codigoAcesso
);

if (dados.professorToken) {

    localStorage.setItem(
        "cidadeDormeProfessorToken",
        dados.professorToken
    );

}


        mostrarTela(telaEspera);


        nomeSala.textContent =
            dados.nomeSala;


        descricaoSala.textContent =
            dados.descricao;


        codigoAcesso.textContent =
            dados.codigoAcesso;


        atualizarQuantidadeVivos(
            dados.quantidadeVivos || 0
        );


        atualizarAlunos(
            dados.jogadores || dados.alunos || []
        );


        limparNoticias();

        esconderProgressoVotacao();


        adicionarNoticia(
            "Sala criada. Aguardando os alunos entrarem.",
            "info",
            noticiasProfessorDia
        );

    }
);


/* =========================================================
   LISTA DE ALUNOS
========================================================= */

socket.on(
    "listaAlunosAtualizada",
    jogadores => {

        atualizarAlunos(
            jogadores || []
        );

    }
);


/* =========================================================
   INICIAR DIA
========================================================= */

btnIniciarDia.addEventListener(
    "click",
    () => {

        const confirmar =
            confirm(
                "Deseja iniciar o DIA agora?\n\nNovos alunos não poderão entrar depois que o jogo começar."
            );


        if (!confirmar) {
            return;
        }


        socket.emit(
            "iniciarDia",
            {
                codigoSala:
                    codigoSalaAtual
            }
        );

    }
);

/* =========================================================
   ENCERRAR PARTIDA MANUALMENTE
========================================================= */

btnEncerrarPartida.addEventListener(
    "click",
    () => {

        const confirmar =
            confirm(
                "Deseja realmente encerrar esta partida?\n\nOs resultados serão mantidos e a partida não continuará."
            );

        if (!confirmar) {
            return;
        }

        socket.emit(
            "encerrarPartida"
        );

    }
);

/* =========================================================
   CRIAR NOVA SALA
========================================================= */

btnNovaSala.addEventListener(
    "click",
    () => {

        const confirmar =
            confirm(
                "Deseja sair desta partida e criar uma nova sala?"
            );

        if (!confirmar) {
            return;
        }

        socket.emit("sairDaSalaProfessor");

        /* Limpa a sala anterior */
        localStorage.removeItem(
            "cidadeDormeProfessorSala"
        );

        localStorage.removeItem(
            "cidadeDormeProfessorToken"
        );

        /* Limpa a referência da sala atual */
        /* Limpa a referência da sala atual */
            codigoSalaAtual = null;
            codigoAcessoAtual = null;

        /* Limpa dados da tela */
        nomeProfessor.value = "";
        salaSelecionada.selectedIndex = 0;

        /* Volta para a tela inicial */
        mostrarTela(
            telaConfiguracao
        );

    }
);

/* =========================================================
   FASE ATUALIZADA
========================================================= */

socket.on(
    "faseAtualizada",
    dados => {

        if (!dados) {
            return;
        }


        if (
    codigoAcessoAtual &&
    dados.codigoAcesso &&
    dados.codigoAcesso !== codigoAcessoAtual
) {
    console.log(
        "Fase ignorada: pertence a outra sala."
    );

    return;
}

        atualizarDadosSala(dados);


        if (dados.fase !== "VOTACAO") {

            esconderProgressoVotacao();

        }


        if (dados.fase === "DIA") {

            mostrarTela(telaDia);

            statusDiaProfessor.textContent =
                "Os alunos estão respondendo às questões.";

            adicionarNoticiaEmTodas(
                "O DIA começou. Os alunos estão respondendo às questões.",
                "info"
            );

        }


        if (dados.fase === "BONUS") {

            mostrarTela(telaBonus);

            tituloBonusProfessor.textContent =
                "FASE BÔNUS EM ANDAMENTO";

            statusBonusProfessor.textContent =
                "Os alunos estão realizando suas ações.";

            adicionarNoticiaEmTodas(
                "A FASE BÔNUS começou.",
                "destaque"
            );

        }


        if (dados.fase === "VOTACAO") {

            mostrarTela(telaVotacaoProfessor);


            statusVotacaoProfessor.textContent =
                "Os alunos estão votando em quem acreditam ser o Assassino.";


            criarPainelProgressoVotacao();


            adicionarNoticiaEmTodas(
                "A votação começou. Os jogadores vivos devem votar em quem acreditam ser o Assassino.",
                "votacao"
            );

        }


        if (
            dados.fase === "DORMINDO" ||
            dados.fase === "NOITE"
        ) {

            mostrarTela(telaNoiteProfessor);

        }


        if (dados.fase === "FIM") {

            mostrarTela(
                telaResultadoProfessor
            );

        }

    }
);


/* =========================================================
   ESTADO DA SALA
========================================================= */

socket.on(
    "estadoSala",
    dados => {

        if (!dados) {
            return;
        }

        if (
            codigoAcessoAtual &&
            dados.codigoAcesso &&
            dados.codigoAcesso !== codigoAcessoAtual
        ) {
            console.log(
                "Estado ignorado: pertence a outra sala."
            );

            return;
        }

        atualizarDadosSala(
            dados
        );

    }
);


/* =========================================================
   CRONÔMETRO
========================================================= */

socket.on(
    "cronometroAtualizado",
    segundos => {

        const valor =
            Math.max(
                0,
                Number(segundos) || 0
            );


        const minutos =
            Math.floor(
                valor / 60
            );


        const segundosRestantes =
            valor % 60;


        cronometro.textContent =
            `${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;

    }
);


/* =========================================================
   NOTÍCIA DO JOGO
========================================================= */

socket.on(
    "noticiaJogo",
    dados => {

        if (!dados) {
            return;
        }


        const mensagem =
            dados.mensagem ||
            dados.texto ||
            "";


        if (!mensagem) {
            return;
        }


        const tipo =
            dados.tipo ||
            "info";


        adicionarNoticiaEmTodas(
            mensagem,
            tipo
        );

    }
);


/* =========================================================
   CIDADE DORME
========================================================= */

socket.on(
    "cidadeDormiu",
    dados => {

        esconderProgressoVotacao();


        mostrarTela(
            telaNoiteProfessor
        );


        tituloNoiteProfessor.textContent =
            "🌙 CIDADE DORME";


        mensagemNoiteProfessor.textContent =
            dados?.mensagem ||
            "A cidade está dormindo...";


        atualizarQuantidadeVivos(
            dados?.quantidadeVivos
        );


        adicionarNoticiaEmTodas(
            dados?.mensagem ||
            "A CIDADE DORMIU. Aguarde o resultado da noite.",
            "noite"
        );

    }
);


/* =========================================================
   CIDADE ACORDA
========================================================= */

socket.on(
    "cidadeAcordou",
    dados => {

        mostrarTela(
            telaNoiteProfessor
        );


        tituloNoiteProfessor.textContent =
            "☀️ CIDADE ACORDA";


        mensagemNoiteProfessor.textContent =
            dados?.mensagem ||
            "A cidade acordou.";


        atualizarQuantidadeVivos(
            dados?.quantidadeVivos
        );


        adicionarNoticiaEmTodas(
            dados?.mensagem ||
            "A CIDADE ACORDOU.",
            "sucesso"
        );

    }
);


/* =========================================================
   RESULTADO DO BÔNUS
========================================================= */

socket.on(
    "resultadoBonus",
    dados => {

        if (!dados) {
            return;
        }


        const mensagem =
            dados.mensagem ||
            "A rodada bônus terminou.";


        if (
            dados.nomeVitima
        ) {

            adicionarNoticiaEmTodas(
                mensagem,
                "destaque"
            );

        }
        else {

            adicionarNoticiaEmTodas(
                mensagem,
                "sucesso"
            );

        }


        if (
            dados.quantidadeVivos !== undefined
        ) {

            atualizarQuantidadeVivos(
                dados.quantidadeVivos
            );

        }

    }
);


/* =========================================================
   INÍCIO DA VOTAÇÃO
========================================================= */

socket.on(
    "iniciarVotacao",
    dados => {

        mostrarTela(
            telaVotacaoProfessor
        );


        const vivos =
            dados?.jogadores?.length ||
            dados?.jogadoresVivos?.length ||
            dados?.quantidadeVivos ||
            0;


        atualizarQuantidadeVivos(
            vivos
        );


        statusVotacaoProfessor.textContent =
            "Aguardando os votos dos jogadores.";


        criarPainelProgressoVotacao();


        adicionarNoticiaEmTodas(
            "A votação está acontecendo entre os jogadores vivos.",
            "votacao"
        );

    }
);


/* =========================================================
   ACOMPANHAMENTO DOS VOTOS
========================================================= */

socket.on(
    "estadoVotacaoProfessor",
    dados => {

        if (!dados) {
            return;
        }


        if (
            dados.fase &&
            dados.fase !== "VOTACAO"
        ) {

            esconderProgressoVotacao();

            return;

        }


        mostrarTela(
            telaVotacaoProfessor
        );


        atualizarProgressoVotacao(
            dados
        );


        atualizarQuantidadeVivos(
            dados.quantidadeVivos
        );


        const votos =
            Number(
                dados.votosRegistrados
            ) || 0;


        const total =
            Number(
                dados.quantidadeVivos
            ) || 0;


        if (votos >= total && total > 0) {

            statusVotacaoProfessor.textContent =
                "Todos os jogadores vivos já registraram seus votos.";

        }
        else {

            statusVotacaoProfessor.textContent =
                "Aguardando os votos dos jogadores vivos.";

        }

    }
);


/* =========================================================
   RESULTADO DA VOTAÇÃO
========================================================= */

socket.on(
    "resultadoVotacao",
    dados => {

        if (!dados) {
            return;
        }


        esconderProgressoVotacao();


        mostrarTela(
            telaVotacaoProfessor
        );


        resultadoVotacaoProfessor.innerHTML =
            "";


        let mensagem =
            dados.mensagem ||
            "A votação terminou.";


        statusVotacaoProfessor.textContent =
            mensagem;


        const bloco =
            document.createElement("div");


        bloco.className =
            "noticia destaque";


        const titulo =
            document.createElement("strong");


        titulo.textContent =
            "RESULTADO DA VOTAÇÃO";


        const texto =
            document.createElement("span");


        let resultadoTexto =
            mensagem;


        if (
            dados.nome
        ) {

            resultadoTexto +=
                ` ${dados.nome}`;

        }


        if (
            dados.votos !== undefined
        ) {

            resultadoTexto +=
                ` recebeu ${dados.votos} voto(s).`;

        }


        texto.textContent =
            resultadoTexto;


        bloco.appendChild(
            titulo
        );

        bloco.appendChild(
            texto
        );


        resultadoVotacaoProfessor.appendChild(
            bloco
        );


        let tipo =
            "votacao";


        if (
            dados.tipo ===
            "ASSASSINO_ELIMINADO"
        ) {

            tipo =
                "sucesso";

        }


        if (
            dados.tipo ===
            "INOCENTE_ELIMINADO"
        ) {

            tipo =
                "destaque";

        }


        if (
            dados.tipo ===
            "EMPATE"
        ) {

            tipo =
                "info";

        }


        adicionarNoticiaEmTodas(
            resultadoTexto,
            tipo
        );


        if (
            dados.quantidadeVivos !== undefined
        ) {

            atualizarQuantidadeVivos(
                dados.quantidadeVivos
            );

        }

    }
);


/* =========================================================
   JOGADOR ELIMINADO
========================================================= */

socket.on(
    "jogadorEliminado",
    dados => {

        if (!dados) {
            return;
        }


        if (
            dados.quantidadeVivos !== undefined
        ) {

            atualizarQuantidadeVivos(
                dados.quantidadeVivos
            );

        }


        if (
            dados.nome
        ) {

            adicionarNoticiaEmTodas(
                `${dados.nome} foi eliminado.`,
                "destaque"
            );

        }

    }
);


/* =========================================================
   NOVO DIA
========================================================= */

socket.on(
    "novoDia",
    dados => {

        esconderProgressoVotacao();


        mostrarTela(
            telaDia
        );


        if (
            dados?.quantidadeVivos !== undefined
        ) {

            atualizarQuantidadeVivos(
                dados.quantidadeVivos
            );

        }


        statusDiaProfessor.textContent =
            "Um novo dia começou. Os jogadores vivos estão respondendo às questões.";


        adicionarNoticiaEmTodas(
            "Um novo DIA começou.",
            "info"
        );

    }
);


/* =========================================================
   FIM DE JOGO
========================================================= */

socket.on(
    "fimDeJogo",
    dados => {

        esconderProgressoVotacao();


        mostrarTela(
            telaResultadoProfessor
        );


        const mensagem =
            dados?.mensagem ||
            "O jogo terminou.";


        tituloResultadoProfessor.textContent =
            "🏆 FIM DE JOGO";


        if (
            dados &&
            Array.isArray(
                dados.resultados
            )
        ) {

            let html =
                "<div class='tabelaResultadosFinal'>";

            html +=
                "<table>";

            html +=
                "<thead>" +
                "<tr>" +
                "<th>Aluno</th>" +
                "<th>Pontuação</th>" +
                "<th>Acertos</th>" +
                "<th>Erros</th>" +
                "<th>Questões</th>" +
                "<th>% Acertos</th>" +
                "<th>Situação</th>" +
                "</tr>" +
                "</thead>";

            html +=
                "<tbody>";


            dados.resultados.forEach(
                jogador => {

                    const situacao =
                        jogador.eVivo
                            ? "🟢 Vivo"
                            : "🔴 Eliminado";


                    html +=
                        "<tr>" +

                        "<td>" +
                        jogador.nome +
                        "</td>" +

                        "<td>" +
                        jogador.pontuacao +
                        "</td>" +

                        "<td>" +
                        jogador.acertos +
                        "</td>" +

                        "<td>" +
                        jogador.erros +
                        "</td>" +

                        "<td>" +
                        jogador.questoesRespondidas +
                        "</td>" +

                        "<td>" +
                        jogador.porcentagemAcertos +
                        "%" +
                        "</td>" +

                        "<td>" +
                        situacao +
                        "</td>" +

                        "</tr>";

                }
            );


            html +=
                "</tbody>";

            html +=
                "</table>";

            html +=
                "</div>";


            html +=
                "<div class='resultadoFinalMensagem'>" +
                mensagem +
                "</div>";


            resultadoProfessor.innerHTML =
                html;

        }

        else {

            resultadoProfessor.textContent =
                mensagem;

        }


        resultadoProfessor.classList.add(
            "resultadoGrande"
        );


        if (
            dados?.quantidadeVivos !== undefined
        ) {

            atualizarQuantidadeVivos(
                dados.quantidadeVivos
            );

        }


        adicionarNoticia(
            mensagem,
            "final",
            noticiasProfessorFinal
        );


        adicionarNoticia(
            mensagem,
            "final",
            noticiasProfessorDia
        );


        adicionarNoticia(
            mensagem,
            "final",
            noticiasProfessorBonus
        );


        adicionarNoticia(
            mensagem,
            "final",
            noticiasProfessorVotacao
        );

    }
);


socket.on(
    "resultadosFinaisProfessor",
    dados => {

        if (
            !dados ||
            !Array.isArray(dados.resultados)
        ) {
            return;
        }


        mostrarTela(
            telaResultadoProfessor
        );


        tituloResultadoProfessor.textContent =
            "🏆 RESULTADO FINAL DA PARTIDA";


        let html =
            "<div class='tabelaResultadosFinal'>";

        html +=
            "<table>";

        html +=
            "<thead>" +
            "<tr>" +
            "<th>Aluno</th>" +
            "<th>Pontuação</th>" +
            "<th>Acertos</th>" +
            "<th>Erros</th>" +
            "<th>Questões</th>" +
            "<th>% Acertos</th>" +
            "<th>Situação</th>" +
            "</tr>" +
            "</thead>";

        html +=
            "<tbody>";


        dados.resultados.forEach(
            jogador => {

                const situacao =
                    jogador.eVivo
                        ? "🟢 Vivo"
                        : "🔴 Eliminado";


                html +=
                    "<tr>" +

                    "<td>" +
                    jogador.nome +
                    "</td>" +

                    "<td>" +
                    jogador.pontuacao +
                    "</td>" +

                    "<td>" +
                    jogador.acertos +
                    "</td>" +

                    "<td>" +
                    jogador.erros +
                    "</td>" +

                    "<td>" +
                    jogador.questoesRespondidas +
                    "</td>" +

                    "<td>" +
                    jogador.porcentagemAcertos +
                    "%" +
                    "</td>" +

                    "<td>" +
                    situacao +
                    "</td>" +

                    "</tr>";
            }
        );


        html +=
            "</tbody>" +
            "</table>" +
            "</div>";


        resultadoProfessor.innerHTML =
            html;


        adicionarNoticia(
            dados.mensagem ||
            "O jogo terminou.",
            "final",
            noticiasProfessorFinal
        );

    }
);

/* =========================================================
   ERROS
========================================================= */

socket.on(
    "erro",
    dados => {

        const mensagem =
            typeof dados === "string"
                ? dados
                : dados?.mensagem ||
                  dados?.erro ||
                  "Ocorreu um erro.";

        alert(
            mensagem
        );

    }
);


/* =========================================================
   CONEXÃO
========================================================= */

socket.on(
    "connect",
    () => {

        console.log(
            "Professor conectado:",
            socket.id
        );

        const salaSalva =
            localStorage.getItem(
                "cidadeDormeProfessorSala"
            );

        const tokenSalvo =
            localStorage.getItem(
                "cidadeDormeProfessorToken"
            );

        if (
            salaSalva &&
            tokenSalvo
        ) {

            console.log(
                "Tentando retomar sala do professor..."
            );

            socket.emit(
                "retomarSalaProfessor",
                {
                    codigoAcesso:
                        salaSalva,

                    professorToken:
                        tokenSalvo
                }
            );

        }

    }
);

socket.on(
    "salaRetomada",
    dados => {

        console.log(
            "Sala do professor retomada:",
            dados.codigoAcesso
        );

        codigoSalaAtual =
            dados.codigoSala;

        codigoAcessoAtual =
            dados.codigoAcesso;

        localStorage.setItem(
            "cidadeDormeProfessorSala",
            dados.codigoAcesso
        );

        localStorage.setItem(
            "cidadeDormeProfessorToken",
            dados.professorToken
        );

    }
);

/* =========================================================
   ERRO AO RETOMAR SALA
========================================================= */

socket.on(
    "retomarErro",
    mensagem => {

        console.log(
            "Não foi possível retomar a sala:",
            mensagem
        );

        localStorage.removeItem(
            "cidadeDormeProfessorSala"
        );

        localStorage.removeItem(
            "cidadeDormeProfessorToken"
        );

        codigoSalaAtual = null;
        codigoAcessoAtual = null;

        mostrarTela(
            telaConfiguracao
        );

    }
);


/* =========================================================
   DESCONEXÃO
========================================================= */

socket.on(
    "disconnect",
    () => {

        console.log(
            "Professor desconectado."
        );

    }
);

socket.on(
    "disconnect",
    () => {

        console.log(
            "Professor desconectado."
        );

    }
);