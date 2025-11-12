const fs = require('fs/promises');
const Declaracao = require('../models/Declaracao');
const Clausula = require('../models/Clausula');
const Escritura = require('../models/Escritura');
const { gerarDeclaracao } = require('../services/gerarDeclaracao');
const { verificarPlaceholdersNoTexto } = require('../services/validarPlaceholders');
const { importarVariacoesDeTexto } = require('../services/importarVariacoes');

const normalizarGenero = (valor) => (valor && String(valor).toUpperCase() === 'F' ? 'F' : 'M');
const normalizarNumero = (valor) => (valor && String(valor).toUpperCase() === 'P' ? 'P' : 'S');

const criarConfigPadrao = () => ({
  genero: normalizarGenero(),
  numero: normalizarNumero()
});

const interpretarValorCombinado = (valor, fallback = criarConfigPadrao()) => {
  if (typeof valor === 'string') {
    const texto = valor.trim().toUpperCase();
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
        genero: normalizarGenero(generoTexto || fallback.genero),
        numero: normalizarNumero(numeroTexto || fallback.numero)
      };
    }
  }

  return { genero: fallback.genero, numero: fallback.numero };
};

const montarConfiguracaoParte = ({ combinada, genero, numero, fallback }) => {
  const baseFallback = fallback
    ? {
        genero: normalizarGenero(fallback.genero),
        numero: normalizarNumero(fallback.numero)
      }
    : criarConfigPadrao();

  if (combinada) {
    return interpretarValorCombinado(combinada, baseFallback);
  }

  if (genero || numero) {
    return {
      genero: normalizarGenero(genero || baseFallback.genero),
      numero: normalizarNumero(numero || baseFallback.numero)
    };
  }

  return { genero: baseFallback.genero, numero: baseFallback.numero };
};

const obterValorCombinado = (configuracao) => {
  const genero = configuracao?.genero;
  const numero = configuracao?.numero;
  return `${normalizarGenero(genero)}${normalizarNumero(numero)}`;
};

const montarContextoDeclaracoes = async ({
  selectedEscritura,
  selectedClausula,
  selectedDeclaracaoId,
  configuracaoTransmitente,
  configuracaoAdquirente
}) => {
  const configuracaoTransmitenteNormalizada = configuracaoTransmitente
    ? {
        genero: normalizarGenero(configuracaoTransmitente.genero),
        numero: normalizarNumero(configuracaoTransmitente.numero)
      }
    : criarConfigPadrao();

  const configuracaoAdquirenteNormalizada = configuracaoAdquirente
    ? {
        genero: normalizarGenero(configuracaoAdquirente.genero),
        numero: normalizarNumero(configuracaoAdquirente.numero)
      }
    : criarConfigPadrao();

  const [escrituras, clausulas, declaracoes] = await Promise.all([
    Escritura.findAll(),
    Clausula.findAll(selectedEscritura || null),
    Declaracao.findAll(selectedClausula || null)
  ]);

  const configuracaoGenero = {
    padrao: configuracaoTransmitenteNormalizada,
    transmitente: configuracaoTransmitenteNormalizada,
    adquirente: configuracaoAdquirenteNormalizada
  };

  const declaracoesRenderizadas = await Promise.all(
    declaracoes.map(async (item) => ({
      ...item,
      texto_renderizado: await gerarDeclaracao(item.texto, configuracaoGenero)
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
          texto_renderizado: await gerarDeclaracao(
            declaracao.texto,
            configuracaoGenero
          )
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
  const {
    escrituraId,
    clausulaId,
    declaracaoId,
    configTransmitente,
    configAdquirente,
    generoTransmitente,
    numeroTransmitente,
    generoAdquirente,
    numeroAdquirente
  } = req.query;

  const feedback = req.session.declaracoesFeedback || {};
  delete req.session.declaracoesFeedback;

  const selectedEscritura = escrituraId || feedback.selectedEscritura || '';
  const selectedClausula = clausulaId || feedback.selectedClausula || '';
  const selectedDeclaracaoId = declaracaoId || feedback.selectedDeclaracaoId || '';
  const fallbackTransmitente = montarConfiguracaoParte({
    combinada: feedback.configTransmitente,
    genero: feedback.generoTransmitente || feedback.genero,
    numero: feedback.numeroTransmitente || feedback.numero,
    fallback: criarConfigPadrao()
  });

  const fallbackAdquirente = montarConfiguracaoParte({
    combinada: feedback.configAdquirente,
    genero: feedback.generoAdquirente || feedback.genero,
    numero: feedback.numeroAdquirente || feedback.numero,
    fallback: criarConfigPadrao()
  });

  const selectedTransmitenteConfig = montarConfiguracaoParte({
    combinada: configTransmitente,
    genero: generoTransmitente,
    numero: numeroTransmitente,
    fallback: fallbackTransmitente
  });

  const selectedAdquirenteConfig = montarConfiguracaoParte({
    combinada: configAdquirente,
    genero: generoAdquirente,
    numero: numeroAdquirente,
    fallback: fallbackAdquirente
  });

  const selectedGeneroTransmitente = selectedTransmitenteConfig.genero;
  const selectedNumeroTransmitente = selectedTransmitenteConfig.numero;
  const selectedGeneroAdquirente = selectedAdquirenteConfig.genero;
  const selectedNumeroAdquirente = selectedAdquirenteConfig.numero;
  const selectedConfiguracaoTransmitente = obterValorCombinado(selectedTransmitenteConfig);
  const selectedConfiguracaoAdquirente = obterValorCombinado(selectedAdquirenteConfig);

  const mensagemErro = feedback.errorMessage || null;
  const mensagemSucesso = feedback.successMessage || null;
  const formData = feedback.formData || null;

  try {
    const { escrituras, clausulas, declaracoes, declaracaoVisualizada } =
      await montarContextoDeclaracoes({
        selectedEscritura,
        selectedClausula,
        selectedDeclaracaoId,
        configuracaoTransmitente: selectedTransmitenteConfig,
        configuracaoAdquirente: selectedAdquirenteConfig
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
      selectedConfiguracaoTransmitente,
      selectedGeneroTransmitente,
      selectedNumeroTransmitente,
      selectedConfiguracaoAdquirente,
      selectedGeneroAdquirente,
      selectedNumeroAdquirente,
      error: mensagemErro,
      success: mensagemSucesso,
      formData
    });
  } catch (error) {
    console.error('Erro ao listar declarações:', error);
    const configPadraoTransmitente = criarConfigPadrao();
    const configPadraoAdquirente = criarConfigPadrao();
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
      selectedConfiguracaoTransmitente: obterValorCombinado(configPadraoTransmitente),
      selectedGeneroTransmitente: configPadraoTransmitente.genero,
      selectedNumeroTransmitente: configPadraoTransmitente.numero,
      selectedConfiguracaoAdquirente: obterValorCombinado(configPadraoAdquirente),
      selectedGeneroAdquirente: configPadraoAdquirente.genero,
      selectedNumeroAdquirente: configPadraoAdquirente.numero,
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
  const {
    escrituraId,
    clausulaId,
    configTransmitente,
    configAdquirente,
    generoTransmitente,
    numeroTransmitente,
    generoAdquirente,
    numeroAdquirente
  } = req.query;

  try {
    const declaracao = await Declaracao.findById(id);
    if (!declaracao) {
      return res.redirect('/declaracoes');
    }

    const clausulaSelecionada = clausulaId || declaracao.clausula_id;
    const clausulaRegistro = await Clausula.findById(clausulaSelecionada);
    const escrituraSelecionada = escrituraId || (clausulaRegistro ? clausulaRegistro.escritura_id : '');

    const selectedTransmitenteConfig = montarConfiguracaoParte({
      combinada: configTransmitente,
      genero: generoTransmitente,
      numero: numeroTransmitente,
      fallback: criarConfigPadrao()
    });

    const selectedAdquirenteConfig = montarConfiguracaoParte({
      combinada: configAdquirente,
      genero: generoAdquirente,
      numero: numeroAdquirente,
      fallback: criarConfigPadrao()
    });

    const selectedGeneroTransmitente = selectedTransmitenteConfig.genero;
    const selectedNumeroTransmitente = selectedTransmitenteConfig.numero;
    const selectedGeneroAdquirente = selectedAdquirenteConfig.genero;
    const selectedNumeroAdquirente = selectedAdquirenteConfig.numero;
    const selectedConfiguracaoTransmitente = obterValorCombinado(selectedTransmitenteConfig);
    const selectedConfiguracaoAdquirente = obterValorCombinado(selectedAdquirenteConfig);

    const { escrituras, clausulas, declaracoes, declaracaoVisualizada } =
      await montarContextoDeclaracoes({
        selectedEscritura: escrituraSelecionada || '',
        selectedClausula: clausulaSelecionada || '',
        selectedDeclaracaoId: id,
        configuracaoTransmitente: selectedTransmitenteConfig,
        configuracaoAdquirente: selectedAdquirenteConfig
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
      selectedConfiguracaoTransmitente,
      selectedGeneroTransmitente,
      selectedNumeroTransmitente,
      selectedConfiguracaoAdquirente,
      selectedGeneroAdquirente,
      selectedNumeroAdquirente,
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

      const selectedTransmitenteConfig = montarConfiguracaoParte({
        combinada: req.query.configTransmitente,
        genero: req.query.generoTransmitente || req.query.genero,
        numero: req.query.numeroTransmitente || req.query.numero,
        fallback: criarConfigPadrao()
      });

      const selectedAdquirenteConfig = montarConfiguracaoParte({
        combinada: req.query.configAdquirente,
        genero: req.query.generoAdquirente || req.query.genero,
        numero: req.query.numeroAdquirente || req.query.numero,
        fallback: criarConfigPadrao()
      });

      const contexto = await montarContextoDeclaracoes({
        selectedEscritura: escrituraSelecionada || '',
        selectedClausula: declaracao.clausula_id,
        selectedDeclaracaoId: id,
        configuracaoTransmitente: selectedTransmitenteConfig,
        configuracaoAdquirente: selectedAdquirenteConfig
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
        selectedConfiguracaoTransmitente: obterValorCombinado(selectedTransmitenteConfig),
        selectedGeneroTransmitente: selectedTransmitenteConfig.genero,
        selectedNumeroTransmitente: selectedTransmitenteConfig.numero,
        selectedConfiguracaoAdquirente: obterValorCombinado(selectedAdquirenteConfig),
        selectedGeneroAdquirente: selectedAdquirenteConfig.genero,
        selectedNumeroAdquirente: selectedAdquirenteConfig.numero,
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
  const { conteudo_variacoes: conteudoVariacoes } = req.body;

  if (typeof conteudoVariacoes !== 'string' || !conteudoVariacoes.trim()) {
    req.session.declaracoesFeedback = {
      errorMessage:
        'Informe as variações no formato CSV (palavra_base, masc_sing, fem_sing, masc_plur, fem_plur).'
    };
    return res.redirect('/declaracoes');
  }

  try {
    const resultado = await importarVariacoesDeTexto(conteudoVariacoes);
    req.session.declaracoesFeedback = {
      successMessage: `Importação concluída: ${resultado.importadas} registradas, ${resultado.ignoradas} ignoradas.`
    };
  } catch (error) {
    console.error('Erro ao importar variações a partir do conteúdo informado:', error);
    req.session.declaracoesFeedback = {
      errorMessage:
        'Não foi possível processar as variações informadas. Verifique o formato e tente novamente.'
    };
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
