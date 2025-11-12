const { gerarDeclaracao } = require('../services/gerarDeclaracao');

const normalizarGenero = (valor) => (valor && String(valor).toUpperCase() === 'F' ? 'F' : 'M');
const normalizarNumero = (valor) => (valor && String(valor).toUpperCase() === 'P' ? 'P' : 'S');

const obterConfiguracaoParte = (combinada, genero, numero, fallback) => {
  const base = fallback
    ? {
        genero: normalizarGenero(fallback.genero),
        numero: normalizarNumero(fallback.numero)
      }
    : { genero: normalizarGenero(), numero: normalizarNumero() };

  if (typeof combinada === 'string') {
    const texto = combinada.trim().toUpperCase();
    if (texto) {
      let generoTexto;
      let numeroTexto;

      if (texto.includes('-') || texto.includes('_')) {
        const partes = texto.split(/[-_]/).filter(Boolean);
        [generoTexto, numeroTexto] = partes;
      } else {
        generoTexto = texto[0];
        numeroTexto = texto[1];
      }

      return {
        genero: normalizarGenero(generoTexto || base.genero),
        numero: normalizarNumero(numeroTexto || base.numero)
      };
    }
  }

  if (genero || numero) {
    return {
      genero: normalizarGenero(genero || base.genero),
      numero: normalizarNumero(numero || base.numero)
    };
  }

  return base;
};

const testarDeclaracao = async (req, res) => {
  const {
    texto,
    genero,
    numero,
    configTransmitente,
    configAdquirente,
    generoTransmitente,
    numeroTransmitente,
    generoAdquirente,
    numeroAdquirente
  } = req.body;

  if (typeof texto !== 'string' || !texto.trim()) {
    return res.status(400).json({ error: 'O texto do modelo é obrigatório.' });
  }

  try {
    const configuracaoTransmitente = obterConfiguracaoParte(
      configTransmitente,
      generoTransmitente || genero,
      numeroTransmitente || numero
    );

    const configuracaoAdquirente = obterConfiguracaoParte(
      configAdquirente,
      generoAdquirente || configuracaoTransmitente.genero,
      numeroAdquirente || configuracaoTransmitente.numero,
      configuracaoTransmitente
    );

    const configuracao = {
      padrao: configuracaoTransmitente,
      transmitente: configuracaoTransmitente,
      adquirente: configuracaoAdquirente
    };

    const resultado = await gerarDeclaracao(texto, configuracao);
    return res.json({ resultado });
  } catch (error) {
    console.error('Erro ao gerar declaração dinâmica:', error);
    return res.status(500).json({ error: 'Não foi possível gerar a declaração.' });
  }
};

module.exports = { testarDeclaracao };
