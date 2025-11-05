const Escritura = require('../models/Escritura');

const list = async (req, res) => {
  try {
    const escrituras = await Escritura.findAll();
    res.render('escrituras', {
      title: 'Tipos de Escritura',
      user: req.session,
      escrituras,
      selectedEscritura: null
    });
  } catch (error) {
    console.error('Erro ao listar escrituras:', error);
    res.status(500).render('escrituras', {
      title: 'Tipos de Escritura',
      user: req.session,
      escrituras: [],
      error: 'Não foi possível carregar os tipos de escritura.'
    });
  }
};

const create = async (req, res) => {
  const { nome } = req.body;
  if (!nome) {
    return res.redirect('/escrituras');
  }

  try {
    await Escritura.create(nome, req.session.userId);
    res.redirect('/escrituras');
  } catch (error) {
    console.error('Erro ao criar escritura:', error);
    res.status(500).render('escrituras', {
      title: 'Tipos de Escritura',
      user: req.session,
      escrituras: await Escritura.findAll(),
      error: 'Não foi possível criar o tipo de escritura.'
    });
  }
};

const edit = async (req, res) => {
  try {
    const escrituras = await Escritura.findAll();
    const escritura = await Escritura.findById(req.params.id);
    if (!escritura) {
      return res.redirect('/escrituras');
    }

    res.render('escrituras', {
      title: 'Editar Tipo de Escritura',
      user: req.session,
      escrituras,
      selectedEscritura: escritura
    });
  } catch (error) {
    console.error('Erro ao carregar edição de escritura:', error);
    res.redirect('/escrituras');
  }
};

const update = async (req, res) => {
  const { nome } = req.body;
  try {
    await Escritura.update(req.params.id, nome);
    res.redirect('/escrituras');
  } catch (error) {
    console.error('Erro ao atualizar escritura:', error);
    res.redirect('/escrituras');
  }
};

const remove = async (req, res) => {
  try {
    await Escritura.remove(req.params.id);
    res.redirect('/escrituras');
  } catch (error) {
    console.error('Erro ao remover escritura:', error);
    res.redirect('/escrituras');
  }
};

module.exports = {
  list,
  create,
  edit,
  update,
  remove
};
