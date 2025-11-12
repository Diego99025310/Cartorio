const path = require('path');
const { initializeDatabase } = require('../src/database');
const { importarVariacoesDeArquivo } = require('../src/services/importarVariacoes');

const executar = async () => {
  try {
    initializeDatabase();
    const arquivo = process.argv[2] || path.join(__dirname, '..', 'data', 'variacoes_palavras.csv');
    const { importadas, ignoradas } = await importarVariacoesDeArquivo(arquivo);
    console.log(`Linhas importadas: ${importadas}. Ignoradas: ${ignoradas}.`);
    process.exit(0);
  } catch (error) {
    console.error('Falha ao importar variações:', error);
    process.exit(1);
  }
};

executar();
