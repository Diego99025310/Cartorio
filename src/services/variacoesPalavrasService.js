const {
  toNullableText,
  findByKey,
  exists,
  findExistingKeys,
  create
} = require('../models/VariacaoPalavra');

const ensureMascSing = (valor) => {
  if (typeof valor !== 'string' || valor === '') {
    const erro = new Error('masc_sing é obrigatório.');
    erro.statusCode = 400;
    throw erro;
  }

  return valor;
};

const createOrReturn = async (mascSing, femSing, mascPlur, femPlur) => {
  const chave = ensureMascSing(mascSing);

  const existente = await findByKey(chave);
  if (existente) {
    return { criada: false, variacao: existente };
  }

  const variacao = await create({
    masc_sing: chave,
    fem_sing: toNullableText(femSing),
    masc_plur: toNullableText(mascPlur),
    fem_plur: toNullableText(femPlur)
  });

  return { criada: true, variacao };
};

const getVariacaoParaChave = async (chaveLiteral) => {
  if (typeof chaveLiteral !== 'string' || chaveLiteral === '') {
    return null;
  }

  return findByKey(chaveLiteral);
};

const buscarVariacoesLiterais = async (chaves) => {
  const chavesUnicas = Array.from(
    new Set(
      (chaves || []).filter((valor) => typeof valor === 'string' && valor !== '')
    )
  );

  if (chavesUnicas.length === 0) {
    return new Map();
  }

  const resultados = await Promise.all(
    chavesUnicas.map(async (chave) => [chave, await findByKey(chave)])
  );

  const mapa = new Map();
  resultados.forEach(([chave, variacao]) => {
    if (variacao) {
      mapa.set(chave, variacao);
    }
  });

  return mapa;
};

const listarChavesExistentes = async (chaves) => findExistingKeys(chaves);

const existeVariacaoLiteral = async (chave) => exists(chave);

module.exports = {
  createOrReturn,
  getVariacaoParaChave,
  buscarVariacoesLiterais,
  listarChavesExistentes,
  existeVariacaoLiteral
};
