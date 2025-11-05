const Declaracao = require('../models/Declaracao');
const Clausula = require('../models/Clausula');
const Escritura = require('../models/Escritura');

const list = async (req, res) => {
  const { escrituraId, clausulaId } = req.query;

  try {
    const escrituras = await Escritura.findAll();
    const clausulas = await Clausula.findAll(escrituraId || null);
    const declaracoes = await Declaracao.findAll(clausulaId || null);

    res.render('declaracoes', {
      title: 'Declarações',
      user: req.session,
      escrituras,
      clausulas,
      declaracoes,
      selectedEscritura: escrituraId || '',
      selectedClausula: clausulaId || '',
      selectedDeclaracao: null,
      error: null
    });
  } catch (error) {
    console.error('Erro ao listar declarações:', error);
    res.status(500).render('declaracoes', {
      title: 'Declarações',
      user: req.session,
      escrituras: [],
      clausulas: [],
      declaracoes: [],
      selectedEscritura: '',
      selectedClausula: '',
      selectedDeclaracao: null,
      error: 'Não foi possível carregar as declarações.'
    });
  }
};

const create = async (req, res) => {
  const { clausula_id: clausulaId, titulo, texto } = req.body;
  const tituloLimpo = titulo ? titulo.trim() : '';
  const textoLimpo = texto ? texto.trim() : '';

  if (!clausulaId || !tituloLimpo || !textoLimpo) {
    return res.redirect('/declaracoes');
  }

  try {
    await Declaracao.create(clausulaId, tituloLimpo, textoLimpo, req.session.userId);
    res.redirect(`/declaracoes?clausulaId=${clausulaId}`);
  } catch (error) {
    console.error('Erro ao criar declaração:', error);
    res.redirect('/declaracoes');
  }
};

const edit = async (req, res) => {
  const { id } = req.params;
  const { escrituraId, clausulaId } = req.query;

  try {
    const declaracao = await Declaracao.findById(id);
    if (!declaracao) {
      return res.redirect('/declaracoes');
    }

    const clausulaSelecionada = clausulaId || declaracao.clausula_id;
    const clausulaRegistro = await Clausula.findById(clausulaSelecionada);
    const escrituraSelecionada = escrituraId || (clausulaRegistro ? clausulaRegistro.escritura_id : '');

    const [escrituras, clausulas, declaracoes] = await Promise.all([
      Escritura.findAll(),
      Clausula.findAll(escrituraSelecionada || null),
      Declaracao.findAll(clausulaSelecionada || null)
    ]);

    res.render('declaracoes', {
      title: 'Editar Declaração',
      user: req.session,
      escrituras,
      clausulas,
      declaracoes,
      selectedEscritura: escrituraSelecionada || '',
      selectedClausula: clausulaSelecionada || '',
      selectedDeclaracao: declaracao,
      error: null
    });
  } catch (error) {
    console.error('Erro ao carregar edição de declaração:', error);
    res.redirect('/declaracoes');
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { titulo, texto } = req.body;
  const tituloLimpo = titulo ? titulo.trim() : '';
  const textoLimpo = texto ? texto.trim() : '';

  try {
    const declaracao = await Declaracao.findById(id);
    if (!declaracao) {
      return res.redirect('/declaracoes');
    }

    if (!tituloLimpo || !textoLimpo) {
      return res.redirect(`/declaracoes/${id}/edit?clausulaId=${declaracao.clausula_id}`);
    }

    await Declaracao.update(id, tituloLimpo, textoLimpo);
    res.redirect(`/declaracoes?clausulaId=${declaracao.clausula_id}`);
  } catch (error) {
    console.error('Erro ao atualizar declaração:', error);
    res.redirect('/declaracoes');
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const declaracao = await Declaracao.findById(id);
    if (!declaracao) {
      return res.redirect('/declaracoes');
    }

    await Declaracao.remove(id);
    res.redirect(`/declaracoes?clausulaId=${declaracao.clausula_id}`);
  } catch (error) {
    console.error('Erro ao remover declaração:', error);
    res.redirect('/declaracoes');
  }
};

module.exports = {
  list,
  create,
  edit,
  update,
  remove
};
