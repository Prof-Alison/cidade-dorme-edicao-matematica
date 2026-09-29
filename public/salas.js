const SALAS_DISPONIVEIS = [
    {
        codigo: "SALA01",
        nome: "Sala 01",
        descricao: "Soma de frações com mesmo denominador",
        arquivo: "./salas/sala01.js"
    },
    {
        codigo: "SALA02",
        nome: "Sala 02",
        descricao: "Soma de frações com denominadores diferentes",
        arquivo: "./salas/sala02.js"
    }
];

if (typeof module !== "undefined") {
    module.exports = SALAS_DISPONIVEIS;
}