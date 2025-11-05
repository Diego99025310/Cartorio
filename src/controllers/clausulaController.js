const Clausula = require('../models/Clausula');
const Escritura = require('../models/Escritura');

const list = async (req, res) => {
  const { escrituraId } = req.query;

  try {
    const [escrituras, clausulas] = await Promise.all([
      Escritura.findAll(),
      Clausula.findAll(escrituraId || null)
    ]);

    res.render('clausulas', {
      title: 'Cláusulas',
      user: req.session,
      escrituras,
      clausulas,
      selectedEscritura: escrituraId || '',
      selectedClausula: null,
      error: null
    });
  } catch (error) {
    console.error('Erro ao listar cláusulas:', error);
    res.status(500).render('clausulas', {
      title: 'Cláusulas',
      user: req.session,
      escrituras: [],
      clausulas: [],
      selectedEscritura: '',
      selectedClausula: null,
      error: 'Não foi possível carregar as cláusulas.'
    });
  }
};

const create = async (req, res) => {
  const { escritura_id: escrituraId, nome } = req.body;

  if (!escrituraId || !nome) {
    return res.redirect('/clausulas');
  }

  try {
    await Clausula.create(escrituraId, nome, req.session.userId);
    res.redirect(`/clausulas?escrituraId=${escrituraId}`);
  } catch (error) {
    console.error('Erro ao criar cláusula:', error);
    res.redirect('/clausulas');
  }
};

const edit = async (req, res) => {
  const { id } = req.params;
  const { escrituraId } = req.query;

  try {
    const [escrituras, clausulas, clausula] = await Promise.all([
      Escritura.findAll(),
      Clausula.findAll(escrituraId || null),
      Clausula.findById(id)
    ]);

    if (!clausula) {
      return res.redirect('/clausulas');
    }

    res.render('clausulas', {
      title: 'Editar Cláusula',
      user: req.session,
      escrituras,
      clausulas,
      selectedEscritura: escrituraId || clausula.escritura_id,
      selectedClausula: clausula,
      error: null
    });
  } catch (error) {
    console.error('Erro ao carregar edição de cláusula:', error);
    res.redirect('/clausulas');
  }
};

const update = async (req, res) => {
  const { nome } = req.body;
  const { id } = req.params;

  try {
    const clausula = await Clausula.findById(id);
    if (!clausula) {
      return res.redirect('/clausulas');
    }

    await Clausula.update(id, nome);
    res.redirect(`/clausulas?escrituraId=${clausula.escritura_id}`);
  } catch (error) {
    console.error('Erro ao atualizar cláusula:', error);
    res.redirect('/clausulas');
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const clausula = await Clausula.findById(id);
    if (!clausula) {
      return res.redirect('/clausulas');
    }

    await Clausula.remove(id);
    res.redirect(`/clausulas?escrituraId=${clausula.escritura_id}`);
  } catch (error) {
    console.error('Erro ao remover cláusula:', error);
    res.redirect('/clausulas');
  }
};

module.exports = {
  list,
  create,
  edit,
  update,
  remove
};
