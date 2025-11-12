const fs = require('fs/promises');
const Declaracao = require('../models/Declaracao');
const Clausula = require('../models/Clausula');
const Escritura = require('../models/Escritura');
const { gerarDeclaracao } = require('../services/gerarDeclaracao');
const { verificarPlaceholdersNoTexto } = require('../services/validarPlaceholders');
const { importarVariacoes } = require('../services/importarVariacoes');

const normalizarGenero = (valor) => (valor && String(valor).toUpperCase() === 'F' ? 'F' : 'M');
const normalizarNumero = (valor) => (valor && String(valor).toUpperCase() === 'P' ? 'P' : 'S');

const montarContextoDeclaracoes = async ({
  selectedEscritura,
  selectedClausula,
  selectedDeclaracaoId,
  genero,
  numero
}) => {
  const [escrituras, clausulas, declaracoes] = await Promise.all([
    Escritura.findAll(),
    Clausula.findAll(selectedEscritura || null),
    Declaracao.findAll(selectedClausula || null)
  ]);

  const declaracoesRenderizadas = await Promise.all(
    declaracoes.map(async (item) => ({
      ...item,
      texto_renderizado: await gerarDeclaracao(item.texto, genero, numero)
    }))
  );

  let declaracaoVisualizada = null;
  if (selectedDeclaracaoId) {
    declaracaoVisualizada = declaracoesRenderizadas.find(
      (item) => item.id === Number(selectedDeclaracaoId)
    );

    if (!declaracaoVisualizada) {
      const declaracao = await Declaracao.findById(selectedDeclaracaoId);
      if (declaracao) {
        declaracaoVisualizada = {
          ...declaracao,
          texto_renderizado: await gerarDeclaracao(declaracao.texto, genero, numero)
        };
      }
    }
  }

  return {
    escrituras,
    clausulas,
    declaracoes: declaracoesRenderizadas,
    declaracaoVisualizada
  };
};

const list = async (req, res) => {
  const { escrituraId, clausulaId, declaracaoId, genero, numero } = req.query;

  const feedback = req.session.declaracoesFeedback || {};
  delete req.session.declaracoesFeedback;

  const selectedEscritura = escrituraId || feedback.selectedEscritura || '';
  const selectedClausula = clausulaId || feedback.selectedClausula || '';
  const selectedDeclaracaoId = declaracaoId || feedback.selectedDeclaracaoId || '';
  const selectedGenero = normalizarGenero(genero || feedback.genero);
  const selectedNumero = normalizarNumero(numero || feedback.numero);

  const mensagemErro = feedback.errorMessage || null;
  const mensagemSucesso = feedback.successMessage || null;
  const formData = feedback.formData || null;

  try {
    const { escrituras, clausulas, declaracoes, declaracaoVisualizada } =
      await montarContextoDeclaracoes({
        selectedEscritura,
        selectedClausula,
        selectedDeclaracaoId,
        genero: selectedGenero,
        numero: selectedNumero
      });

    res.render('declaracoes', {
      title: 'Declarações',
      user: req.session,
      escrituras,
      clausulas,
      declaracoes,
      selectedEscritura,
      selectedClausula,
      editingDeclaracao: null,
      selectedDeclaracaoId,
      declaracaoVisualizada,
      selectedGenero,
      selectedNumero,
      error: mensagemErro,
      success: mensagemSucesso,
      formData
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
      editingDeclaracao: null,
      selectedDeclaracaoId: '',
      declaracaoVisualizada: null,
      selectedGenero: normalizarGenero(),
      selectedNumero: normalizarNumero(),
      error: 'Não foi possível carregar as declarações.',
      success: null,
      formData: null
    });
  }
};

const create = async (req, res) => {
  const { clausula_id: clausulaId, titulo, texto, escritura_id: escrituraId } = req.body;
  const tituloLimpo = titulo ? titulo.trim() : '';
  const textoLimpo = texto ? texto.trim() : '';

  if (!clausulaId || !tituloLimpo || !textoLimpo) {
    return res.redirect('/declaracoes');
  }

  try {
    const { faltantes } = await verificarPlaceholdersNoTexto(textoLimpo);
    if (faltantes.length > 0) {
      req.session.declaracoesFeedback = {
        errorMessage: `Não foi possível salvar. Cadastre primeiro as variações para: ${faltantes.join(', ')}.`,
        formData: { titulo: tituloLimpo, texto: textoLimpo },
        selectedEscritura: escrituraId || '',
        selectedClausula: clausulaId || ''
      };
      return res.redirect('/declaracoes');
    }

    const novaDeclaracao = await Declaracao.create(
      clausulaId,
      tituloLimpo,
      textoLimpo,
      req.session.userId
    );
    res.redirect(
      `/declaracoes?clausulaId=${clausulaId}&declaracaoId=${novaDeclaracao.id}`
    );
  } catch (error) {
    console.error('Erro ao criar declaração:', error);
    res.redirect('/declaracoes');
  }
};

const edit = async (req, res) => {
  const { id } = req.params;
  const { escrituraId, clausulaId, genero, numero } = req.query;

  try {
    const declaracao = await Declaracao.findById(id);
    if (!declaracao) {
      return res.redirect('/declaracoes');
    }

    const clausulaSelecionada = clausulaId || declaracao.clausula_id;
    const clausulaRegistro = await Clausula.findById(clausulaSelecionada);
    const escrituraSelecionada = escrituraId || (clausulaRegistro ? clausulaRegistro.escritura_id : '');

    const selectedGenero = normalizarGenero(genero);
    const selectedNumero = normalizarNumero(numero);

    const { escrituras, clausulas, declaracoes, declaracaoVisualizada } =
      await montarContextoDeclaracoes({
        selectedEscritura: escrituraSelecionada || '',
        selectedClausula: clausulaSelecionada || '',
        selectedDeclaracaoId: id,
        genero: selectedGenero,
        numero: selectedNumero
      });

    res.render('declaracoes', {
      title: 'Editar Declaração',
      user: req.session,
      escrituras,
      clausulas,
      declaracoes,
      selectedEscritura: escrituraSelecionada || '',
      selectedClausula: clausulaSelecionada || '',
      editingDeclaracao: declaracao,
      selectedDeclaracaoId: declaracao.id,
      declaracaoVisualizada: declaracaoVisualizada,
      selectedGenero,
      selectedNumero,
      error: null,
      success: null,
      formData: null
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

    const { faltantes } = await verificarPlaceholdersNoTexto(textoLimpo);
    if (faltantes.length > 0) {
      const clausulaRegistro = await Clausula.findById(declaracao.clausula_id);
      const escrituraSelecionada = clausulaRegistro ? clausulaRegistro.escritura_id : '';

      const selectedGenero = normalizarGenero(req.query.genero);
      const selectedNumero = normalizarNumero(req.query.numero);

      const contexto = await montarContextoDeclaracoes({
        selectedEscritura: escrituraSelecionada || '',
        selectedClausula: declaracao.clausula_id,
        selectedDeclaracaoId: id,
        genero: selectedGenero,
        numero: selectedNumero
      });

      return res.status(400).render('declaracoes', {
        title: 'Editar Declaração',
        user: req.session,
        escrituras: contexto.escrituras,
        clausulas: contexto.clausulas,
        declaracoes: contexto.declaracoes,
        selectedEscritura: escrituraSelecionada || '',
        selectedClausula: declaracao.clausula_id,
        editingDeclaracao: { ...declaracao, titulo: tituloLimpo, texto: textoLimpo },
        selectedDeclaracaoId: id,
        declaracaoVisualizada: contexto.declaracaoVisualizada,
        selectedGenero,
        selectedNumero,
        error: `Não foi possível salvar. Cadastre primeiro as variações para: ${faltantes.join(', ')}.`,
        success: null,
        formData: null
      });
    }

    await Declaracao.update(id, tituloLimpo, textoLimpo);
    res.redirect(
      `/declaracoes?clausulaId=${declaracao.clausula_id}&declaracaoId=${id}`
    );
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

const importarVariacoesCsv = async (req, res) => {
  if (!req.file) {
    req.session.declaracoesFeedback = {
      errorMessage: 'Selecione um arquivo CSV para realizar a importação.'
    };
    return res.redirect('/declaracoes');
  }

  try {
    const resultado = await importarVariacoes(req.file.path);
    req.session.declaracoesFeedback = {
      successMessage: `Importação concluída: ${resultado.importadas} registradas, ${resultado.ignoradas} ignoradas.`
    };
  } catch (error) {
    console.error('Erro ao importar variações por upload:', error);
    req.session.declaracoesFeedback = {
      errorMessage:
        'Não foi possível importar o arquivo CSV. Verifique o formato e tente novamente.'
    };
  } finally {
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      if (cleanupError && cleanupError.code !== 'ENOENT') {
        console.warn('Não foi possível remover o arquivo temporário:', cleanupError);
      }
    }
  }

  res.redirect('/declaracoes');
};

module.exports = {
  list,
  create,
  edit,
  update,
  remove,
  importarVariacoesCsv
};
