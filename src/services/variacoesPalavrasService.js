const {
  limparChaveLiteral,
  limparFlexao,
  findByBaseWordExact,
  existsByBaseWord,
  findExistingBaseWordsExact,
  createVariation
} = require('../models/VariacaoPalavra');

const prepararDadosEntrada = (entrada = {}) => {
  const chaveLiteral = limparChaveLiteral(entrada.palavra_base);

  return {
    chaveLiteral,
    dados: {
      palavra_base: chaveLiteral,
      masc_sing: limparFlexao(entrada.masc_sing),
      fem_sing: limparFlexao(entrada.fem_sing),
      masc_plur: limparFlexao(entrada.masc_plur),
      fem_plur: limparFlexao(entrada.fem_plur)
    }
  };
};

const criarOuObterVariacao = async (entrada) => {
  const { chaveLiteral, dados } = prepararDadosEntrada(entrada);

  if (!chaveLiteral) {
    const erro = new Error('palavra_base é obrigatória.');
    erro.statusCode = 400;
    throw erro;
  }

  const existente = await findByBaseWordExact(chaveLiteral);
  if (existente) {
    return { criada: false, variacao: existente };
  }

  const variacao = await createVariation(dados);
  return { criada: true, variacao };
};

const buscarVariacaoLiteral = async (palavraBase) => {
  const chaveLiteral = limparChaveLiteral(palavraBase);
  if (!chaveLiteral) {
    return null;
  }

  return findByBaseWordExact(chaveLiteral);
};

const buscarVariacoesLiterais = async (palavrasBase) => {
  const chavesLiterais = Array.from(
    new Set(
      (palavrasBase || [])
        .filter((valor) => typeof valor === 'string')
        .map((valor) => valor.trim())
        .filter((valor) => valor)
    )
  );

  if (chavesLiterais.length === 0) {
    return new Map();
  }

  const pares = await Promise.all(
    chavesLiterais.map(async (chave) => {
      const variacao = await findByBaseWordExact(chave);
      return [chave, variacao];
    })
  );

  const mapa = new Map();
  pares.forEach(([chave, variacao]) => {
    if (variacao) {
      mapa.set(chave, variacao);
    }
  });

  return mapa;
};

const listarChavesExistentes = async (palavrasBase) => {
  const existentes = await findExistingBaseWordsExact(palavrasBase);
  return existentes;
};

const existeVariacaoLiteral = async (palavraBase) => {
  const chaveLiteral = limparChaveLiteral(palavraBase);
  if (!chaveLiteral) {
    return false;
  }

  return existsByBaseWord(chaveLiteral);
};

module.exports = {
  criarOuObterVariacao,
  buscarVariacaoLiteral,
  buscarVariacoesLiterais,
  listarChavesExistentes,
  existeVariacaoLiteral,
  limparChaveLiteral,
  limparFlexao
};
