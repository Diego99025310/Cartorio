const { initializeDatabase } = require('../src/database');
const { gerarDeclaracao } = require('../src/services/gerarDeclaracao');

const executar = async () => {
  initializeDatabase();
  const texto = '{O} {VENDEDOR} {vende} para {o} {COMPRADOR} o {IMÓVEL}.';

  const combinacoes = [
    { genero: 'M', numero: 'S' },
    { genero: 'F', numero: 'S' },
    { genero: 'M', numero: 'P' },
    { genero: 'F', numero: 'P' }
  ];

  for (const { genero, numero } of combinacoes) {
    const resultado = await gerarDeclaracao(texto, genero, numero);
    console.log(`${genero}/${numero} => ${resultado}`);
  }
};

executar().catch((error) => {
  console.error('Erro ao testar geração de declaração:', error);
  process.exit(1);
});
