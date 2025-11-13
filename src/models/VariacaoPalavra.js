const { db } = require('../database');

const limparChaveLiteral = (palavraBase) => {
  if (typeof palavraBase !== 'string') {
    return '';
  }

  const chave = palavraBase.trim();
  return chave;
};

const limparFlexao = (valor) => {
  if (valor == null) {
    return null;
  }

  const texto = String(valor).trim();
  return texto === '' ? null : texto;
};

const findByBaseWordExact = (palavraBase) =>
  new Promise((resolve, reject) => {
    const chaveLiteral = limparChaveLiteral(palavraBase);
    if (!chaveLiteral) {
      resolve(null);
      return;
    }

    db.get(
      `SELECT id, palavra_base, masc_sing, fem_sing, masc_plur, fem_plur
         FROM variacoes_palavras
         WHERE palavra_base = ? COLLATE BINARY`,
      [chaveLiteral],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });

const existsByBaseWord = (palavraBase) =>
  new Promise((resolve, reject) => {
    const chaveLiteral = limparChaveLiteral(palavraBase);
    if (!chaveLiteral) {
      resolve(false);
      return;
    }

    db.get(
      'SELECT 1 FROM variacoes_palavras WHERE palavra_base = ? COLLATE BINARY',
      [chaveLiteral],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(Boolean(row));
        }
      }
    );
  });

const findExistingBaseWordsExact = (palavrasBase) =>
  new Promise((resolve, reject) => {
    const chavesLiterais = (palavrasBase || [])
      .filter((valor) => typeof valor === 'string')
      .map((valor) => valor.trim())
      .filter((valor) => valor);

    if (chavesLiterais.length === 0) {
      resolve([]);
      return;
    }

    const placeholders = chavesLiterais.map(() => '?').join(', ');

    db.all(
      `SELECT palavra_base
         FROM variacoes_palavras
         WHERE palavra_base COLLATE BINARY IN (${placeholders})`,
      chavesLiterais,
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => row.palavra_base));
        }
      }
    );
  });

const createVariation = ({
  palavra_base: palavraBase,
  masc_sing: mascSing,
  fem_sing: femSing,
  masc_plur: mascPlur,
  fem_plur: femPlur
}) =>
  new Promise((resolve, reject) => {
    const chaveLiteral = limparChaveLiteral(palavraBase);
    if (!chaveLiteral) {
      reject(new Error('palavra_base é obrigatória.'));
      return;
    }

    const dados = [
      chaveLiteral,
      limparFlexao(mascSing),
      limparFlexao(femSing),
      limparFlexao(mascPlur),
      limparFlexao(femPlur)
    ];

    db.run(
      `INSERT INTO variacoes_palavras
         (palavra_base, masc_sing, fem_sing, masc_plur, fem_plur)
         VALUES (?, ?, ?, ?, ?)`,
      dados,
      function callback(err) {
        if (err) {
          reject(err);
          return;
        }

        findByBaseWordExact(chaveLiteral)
          .then((variacao) => resolve(variacao))
          .catch((buscaErr) => reject(buscaErr));
      }
    );
  });

module.exports = {
  limparChaveLiteral,
  limparFlexao,
  findByBaseWordExact,
  existsByBaseWord,
  findExistingBaseWordsExact,
  createVariation
};
