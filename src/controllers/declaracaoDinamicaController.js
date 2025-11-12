const { gerarDeclaracao } = require('../services/gerarDeclaracao');

const testarDeclaracao = async (req, res) => {
  const {
    texto,
    genero,
    numero,
    generoTransmitente,
    numeroTransmitente,
    generoAdquirente,
    numeroAdquirente
  } = req.body;

  if (typeof texto !== 'string' || !texto.trim()) {
    return res.status(400).json({ error: 'O texto do modelo é obrigatório.' });
  }

  try {
    const generoBase = generoTransmitente || genero;
    const numeroBase = numeroTransmitente || numero;

    const configuracao = {
      padrao: { genero: generoBase, numero: numeroBase },
      transmitente: { genero: generoBase, numero: numeroBase },
      adquirente: {
        genero: generoAdquirente || generoBase,
        numero: numeroAdquirente || numeroBase
      }
    };

    const resultado = await gerarDeclaracao(texto, configuracao);
    return res.json({ resultado });
  } catch (error) {
    console.error('Erro ao gerar declaração dinâmica:', error);
    return res.status(500).json({ error: 'Não foi possível gerar a declaração.' });
  }
};

module.exports = { testarDeclaracao };
