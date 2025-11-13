const { gerarDeclaracao } = require('../services/gerarDeclaracao');

const normalizarGenero = (valor) =>
  valor && String(valor).toUpperCase() === 'F' ? 'F' : 'M';

const normalizarNumero = (valor) =>
  valor && String(valor).toUpperCase() === 'P' ? 'P' : 'S';

const obterConfiguracaoParte = (combinada, genero, numero, fallback) => {
  const base = fallback
    ? {
        genero: normalizarGenero(fallback.genero),
        numero: normalizarNumero(fallback.numero)
      }
    : { genero: normalizarGenero(genero), numero: normalizarNumero(numero) };

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

const construirConfiguracao = (body) => {
  if (body && typeof body.configuracao === 'object' && body.configuracao !== null) {
    return body.configuracao;
  }

  const genero = body ? body.genero : undefined;
  const numero = body ? body.numero : undefined;

  const configuracaoTransmitente = obterConfiguracaoParte(
    body ? body.configTransmitente : undefined,
    body ? body.generoTransmitente || genero : genero,
    body ? body.numeroTransmitente || numero : numero
  );

  const configuracaoAdquirente = obterConfiguracaoParte(
    body ? body.configAdquirente : undefined,
    body ? body.generoAdquirente || configuracaoTransmitente.genero : configuracaoTransmitente.genero,
    body ? body.numeroAdquirente || configuracaoTransmitente.numero : configuracaoTransmitente.numero,
    configuracaoTransmitente
  );

  return {
    padrao: configuracaoTransmitente,
    transmitente: configuracaoTransmitente,
    adquirente: configuracaoAdquirente
  };
};

const substituirVariacoesMiddleware = (opcoes = {}) => {
  const {
    campoTexto = 'texto',
    chaveResultado = 'declaracaoSubstituida'
  } = opcoes;

  return async (req, res, next) => {
    try {
      const body = req.body || {};
      const texto = body[campoTexto];

      if (typeof texto !== 'string' || !texto.trim()) {
        return res.status(400).json({ error: 'O texto do modelo é obrigatório.' });
      }

      const configuracao = construirConfiguracao(body);
      const resultado = await gerarDeclaracao(texto, configuracao);

      res.locals[chaveResultado] = resultado;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = {
  substituirVariacoesMiddleware
};
