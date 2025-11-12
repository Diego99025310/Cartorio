const { findByBaseWord } = require('../models/VariacaoPalavra');

const COLUNAS = {
  M: { S: 'masc_sing', P: 'masc_plur' },
  F: { S: 'fem_sing', P: 'fem_plur' }
};

const PLACEHOLDER_REGEX = /\{([^{}]+)\}/g;
const PLACEHOLDER_ENTIDADE_REGEX = /^(transmitente|adquirente):(.+)$/i;

const extrairPlaceholders = (textoModelo) => {
  if (!textoModelo) {
    return [];
  }

  return Array.from(textoModelo.matchAll(PLACEHOLDER_REGEX)).map((match) => match[1].trim());
};

const selecionarColuna = (genero, numero) => {
  const generoNormalizado = genero && String(genero).toUpperCase() === 'F' ? 'F' : 'M';
  const numeroNormalizado = numero && String(numero).toUpperCase() === 'P' ? 'P' : 'S';
  return COLUNAS[generoNormalizado][numeroNormalizado];
};

const interpretarPlaceholder = (placeholderBruto) => {
  if (!placeholderBruto) {
    return { entidade: 'padrao', chave: '' };
  }

  const match = placeholderBruto.match(PLACEHOLDER_ENTIDADE_REGEX);
  if (!match) {
    return { entidade: 'padrao', chave: placeholderBruto.trim() };
  }

  const [, entidade, chave] = match;
  return { entidade: entidade.toLowerCase(), chave: chave.trim() };
};

const obterPalavraBaseDoPlaceholder = (placeholderBruto) =>
  interpretarPlaceholder(placeholderBruto).chave;

const normalizarConfiguracao = (entrada = {}, padrao = {}) => ({
  genero: entrada.genero !== undefined ? entrada.genero : padrao.genero,
  numero: entrada.numero !== undefined ? entrada.numero : padrao.numero
});

const prepararConfiguracoes = (entrada = {}) => {
  const basePadrao = normalizarConfiguracao(entrada.padrao || entrada.default || entrada, entrada);

  return {
    padrao: basePadrao,
    transmitente: normalizarConfiguracao(entrada.transmitente, basePadrao),
    adquirente: normalizarConfiguracao(entrada.adquirente, basePadrao)
  };
};

const gerarDeclaracao = async (textoModelo, generoOuConfiguracao, numero) => {
  if (!textoModelo) {
    return '';
  }

  const placeholdersBrutos = extrairPlaceholders(textoModelo);
  if (placeholdersBrutos.length === 0) {
    return textoModelo;
  }

  const configuracaoEntrada =
    generoOuConfiguracao && typeof generoOuConfiguracao === 'object'
      ? generoOuConfiguracao
      : {
          padrao: { genero: generoOuConfiguracao, numero },
          transmitente: { genero: generoOuConfiguracao, numero },
          adquirente: { genero: generoOuConfiguracao, numero }
        };

  const configuracoes = prepararConfiguracoes(configuracaoEntrada);
  const colunasPorEntidade = {
    padrao: selecionarColuna(configuracoes.padrao.genero, configuracoes.padrao.numero),
    transmitente: selecionarColuna(
      configuracoes.transmitente.genero,
      configuracoes.transmitente.numero
    ),
    adquirente: selecionarColuna(
      configuracoes.adquirente.genero,
      configuracoes.adquirente.numero
    )
  };

  const informacoesPlaceholders = placeholdersBrutos.map(interpretarPlaceholder);
  const unicos = [...new Set(informacoesPlaceholders.map((item) => item.chave))];

  const variacoes = await Promise.all(
    unicos.map(async (chave) => {
      const variacao = await findByBaseWord(chave);
      return [chave, variacao];
    })
  );

  const mapaVariacoes = new Map(variacoes);

  const resultado = textoModelo.replace(PLACEHOLDER_REGEX, (original, chaveBruta) => {
    const { entidade, chave } = interpretarPlaceholder(chaveBruta);
    const variacao = mapaVariacoes.get(chave);
    if (!variacao) {
      return original;
    }

    const coluna = colunasPorEntidade[entidade] || colunasPorEntidade.padrao;
    const substituto = variacao[coluna];
    if (substituto && substituto.trim() !== '') {
      return substituto;
    }

    const fallback =
      variacao.masc_sing ||
      variacao.fem_sing ||
      variacao.masc_plur ||
      variacao.fem_plur ||
      chave;

    return fallback;
  });

  return resultado;
};

module.exports = { gerarDeclaracao, extrairPlaceholders, obterPalavraBaseDoPlaceholder };
