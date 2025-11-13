const { extrairPlaceholders, obterPalavraBaseDoPlaceholder } = require('./gerarDeclaracao');
const { listarChavesExistentes } = require('./variacoesPalavrasService');

const verificarPlaceholdersNoTexto = async (texto) => {
  const placeholdersBrutos = [...new Set(extrairPlaceholders(texto))];
  if (placeholdersBrutos.length === 0) {
    return { placeholders: [], faltantes: [] };
  }

  const palavrasBase = [...new Set(placeholdersBrutos.map(obterPalavraBaseDoPlaceholder))];

  const existentes = await listarChavesExistentes(palavrasBase);
  const existentesSet = new Set(existentes);
  const faltantes = palavrasBase.filter((placeholder) => !existentesSet.has(placeholder));

  return {
    placeholders: palavrasBase,
    faltantes
  };
};

module.exports = { verificarPlaceholdersNoTexto };
