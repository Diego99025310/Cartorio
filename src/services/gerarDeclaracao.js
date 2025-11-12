const { findByBaseWord, normalizarPalavraBase } = require('../models/VariacaoPalavra');

const COLUNAS = {
  M: { S: 'masc_sing', P: 'masc_plur' },
  F: { S: 'fem_sing', P: 'fem_plur' }
};

const PLACEHOLDER_REGEX = /\{([^{}]+)\}|([12])\{([^{}]+)\}/g;
const PLACEHOLDER_ENTIDADE_REGEX = /^(transmitente|adquirente|1|2):(.+)$/i;

const criarRegexPlaceholders = () =>
  new RegExp(PLACEHOLDER_REGEX.source, PLACEHOLDER_REGEX.flags);

const extrairPlaceholders = (textoModelo) => {
  if (!textoModelo) {
    return [];
  }

  const regex = criarRegexPlaceholders();
  const encontrados = [];
  let match;

  while ((match = regex.exec(textoModelo)) !== null) {
    if (match[2]) {
      const chave = match[3] ? match[3].trim() : '';
      if (chave) {
        encontrados.push(`${match[2]}:${chave}`);
      }
    } else if (match[1]) {
      const chave = match[1].trim();
      if (chave) {
        encontrados.push(chave);
      }
    }
  }

  return encontrados;
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

  const [, entidadeCapturada, chave] = match;
  const entidadeNormalizada = entidadeCapturada.toLowerCase();

  let entidadeFinal;
  if (entidadeNormalizada === '1') {
    entidadeFinal = 'transmitente';
  } else if (entidadeNormalizada === '2') {
    entidadeFinal = 'adquirente';
  } else {
    entidadeFinal = entidadeNormalizada;
  }

  return { entidade: entidadeFinal, chave: chave.trim() };
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

  const informacoesPlaceholders = placeholdersBrutos
    .map((placeholderBruto) => {
      const interpretado = interpretarPlaceholder(placeholderBruto);
      return {
        ...interpretado,
        chaveNormalizada: normalizarPalavraBase(interpretado.chave)
      };
    })
    .filter((item) => item.chaveNormalizada);

  const chavesNormalizadas = [
    ...new Set(informacoesPlaceholders.map((item) => item.chaveNormalizada))
  ];

  const variacoes = await Promise.all(
    chavesNormalizadas.map(async (chaveNormalizada) => {
      const variacao = await findByBaseWord(chaveNormalizada);
      return [chaveNormalizada, variacao];
    })
  );

  const mapaVariacoes = new Map(variacoes);

  const resultado = textoModelo.replace(
    criarRegexPlaceholders(),
    (original, placeholderPadrao, prefixoNumerico, placeholderNumerico) => {
      let entidade;
      let chave;

      if (prefixoNumerico) {
        entidade = prefixoNumerico === '1' ? 'transmitente' : 'adquirente';
        chave = (placeholderNumerico || '').trim();
      } else {
        const interpretado = interpretarPlaceholder(placeholderPadrao);
        entidade = interpretado.entidade;
        chave = interpretado.chave;
      }

      if (!chave) {
        return original;
      }

      const chaveNormalizada = normalizarPalavraBase(chave);
      if (!chaveNormalizada) {
        return original;
      }

      const variacao = mapaVariacoes.get(chaveNormalizada);
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
    }
  );

  return resultado;
};

module.exports = { gerarDeclaracao, extrairPlaceholders, obterPalavraBaseDoPlaceholder };
