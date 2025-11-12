const { db } = require('../database');

const COLUNAS = {
  M: { S: 'masc_sing', P: 'masc_plur' },
  F: { S: 'fem_sing', P: 'fem_plur' }
};

const obterVariacao = (palavraBase) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT palavra_base, masc_sing, fem_sing, masc_plur, fem_plur
        FROM variacoes_palavras
        WHERE palavra_base = ? COLLATE BINARY`,
      [palavraBase],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });

const selecionarColuna = (genero, numero) => {
  const generoNormalizado = genero && String(genero).toUpperCase() === 'F' ? 'F' : 'M';
  const numeroNormalizado = numero && String(numero).toUpperCase() === 'P' ? 'P' : 'S';
  return COLUNAS[generoNormalizado][numeroNormalizado];
};

const gerarDeclaracao = async (textoModelo, genero, numero) => {
  if (!textoModelo) {
    return '';
  }

  const placeholders = Array.from(textoModelo.matchAll(/\{([^{}]+)\}/g)).map((match) => match[1]);
  if (placeholders.length === 0) {
    return textoModelo;
  }

  const unicos = [...new Set(placeholders)];
  const variacoes = await Promise.all(
    unicos.map(async (chave) => {
      const variacao = await obterVariacao(chave);
      return [chave, variacao];
    })
  );

  const mapaVariacoes = new Map(variacoes);
  const colunaEscolhida = selecionarColuna(genero, numero);

  const resultado = textoModelo.replace(/\{([^{}]+)\}/g, (original, chave) => {
    const variacao = mapaVariacoes.get(chave);
    if (!variacao) {
      return original;
    }

    const substituto = variacao[colunaEscolhida];
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

module.exports = { gerarDeclaracao };
