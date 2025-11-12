const { extrairPlaceholders } = require('./gerarDeclaracao');
const { findExistingBaseWords } = require('../models/VariacaoPalavra');

const verificarPlaceholdersNoTexto = async (texto) => {
  const placeholders = [...new Set(extrairPlaceholders(texto))];
  if (placeholders.length === 0) {
    return { placeholders: [], faltantes: [] };
  }

  const existentes = await findExistingBaseWords(placeholders);
  const existentesSet = new Set(existentes);
  const faltantes = placeholders.filter((placeholder) => !existentesSet.has(placeholder));

  return {
    placeholders,
    faltantes
  };
};

module.exports = { verificarPlaceholdersNoTexto };
