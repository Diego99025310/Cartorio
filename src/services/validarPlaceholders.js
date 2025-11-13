const { extrairPlaceholders, obterChaveDoPlaceholder } = require('./gerarDeclaracao');
const { listarChavesExistentes } = require('./variacoesPalavrasService');

const verificarPlaceholdersNoTexto = async (texto) => {
  const placeholdersBrutos = [...new Set(extrairPlaceholders(texto))];
  if (placeholdersBrutos.length === 0) {
    return { placeholders: [], faltantes: [] };
  }

  const chavesLiterais = [...new Set(placeholdersBrutos.map(obterChaveDoPlaceholder))];

  const existentes = await listarChavesExistentes(chavesLiterais);
  const existentesSet = new Set(existentes);
  const faltantes = chavesLiterais.filter((placeholder) => !existentesSet.has(placeholder));

  return {
    placeholders: chavesLiterais,
    faltantes
  };
};

module.exports = { verificarPlaceholdersNoTexto };
