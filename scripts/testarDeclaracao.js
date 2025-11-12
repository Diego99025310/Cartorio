const { initializeDatabase } = require('../src/database');
const { gerarDeclaracao } = require('../src/services/gerarDeclaracao');

const executar = async () => {
  initializeDatabase();
  const texto =
    '{transmitente:O} {transmitente:VENDEDOR} {transmitente:vende} para {adquirente:o} {adquirente:COMPRADOR} o {IMÓVEL}.';

  const combinacoes = [
    {
      transmitente: { genero: 'M', numero: 'S' },
      adquirente: { genero: 'F', numero: 'S' }
    },
    {
      transmitente: { genero: 'F', numero: 'S' },
      adquirente: { genero: 'M', numero: 'P' }
    },
    {
      transmitente: { genero: 'M', numero: 'P' },
      adquirente: { genero: 'F', numero: 'P' }
    }
  ];

  for (const combinacao of combinacoes) {
    const configuracao = {
      padrao: combinacao.transmitente,
      transmitente: combinacao.transmitente,
      adquirente: combinacao.adquirente
    };

    const resultado = await gerarDeclaracao(texto, configuracao);
    console.log(
      `T: ${combinacao.transmitente.genero}/${combinacao.transmitente.numero} | ` +
        `A: ${combinacao.adquirente.genero}/${combinacao.adquirente.numero} => ${resultado}`
    );
  }
};

executar().catch((error) => {
  console.error('Erro ao testar geração de declaração:', error);
  process.exit(1);
});
