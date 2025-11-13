const { createOrReturn } = require('../services/variacoesPalavrasService');

const store = async (req, res, next) => {
  try {
    const {
      masc_sing: mascSing,
      fem_sing: femSing,
      masc_plur: mascPlur,
      fem_plur: femPlur
    } = req.body || {};

    const resultado = await createOrReturn(mascSing, femSing, mascPlur, femPlur);
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
