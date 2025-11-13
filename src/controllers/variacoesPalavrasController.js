const { criarOuObterVariacao } = require('../services/variacoesPalavrasService');

const store = async (req, res, next) => {
  try {
    const resultado = await criarOuObterVariacao(req.body || {});
    const statusCode = resultado.criada ? 201 : 200;
    return res.status(statusCode).json(resultado.variacao);
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
};

module.exports = {
  store
};
