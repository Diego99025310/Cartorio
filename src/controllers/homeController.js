const Escritura = require('../models/Escritura');
const Clausula = require('../models/Clausula');
const Declaracao = require('../models/Declaracao');

const dashboard = async (req, res) => {
  try {
    const [escrituras, clausulas, declaracoes] = await Promise.all([
      Escritura.findAll(),
      Clausula.findAll(),
      Declaracao.findAll()
    ]);

    res.render('home', {
      title: 'Painel',
      user: req.session,
      contagem: {
        escrituras: escrituras.length,
        clausulas: clausulas.length,
        declaracoes: declaracoes.length
      }
    });
  } catch (error) {
    console.error('Erro ao carregar painel:', error);
    res.status(500).render('home', {
      title: 'Painel',
      user: req.session,
      contagem: {
        escrituras: 0,
        clausulas: 0,
        declaracoes: 0
      },
      error: 'Não foi possível carregar os dados.'
    });
  }
};

module.exports = {
  dashboard
};
