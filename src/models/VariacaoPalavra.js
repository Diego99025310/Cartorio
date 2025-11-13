const { db } = require('../database');

const toNullableText = (valor) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (typeof valor === 'string') {
    return valor;
  }

  return String(valor);
};

const findByKey = (mascSing) =>
  new Promise((resolve, reject) => {
    if (typeof mascSing !== 'string' || mascSing === '') {
      resolve(null);
      return;
    }

    db.get(
      `SELECT id, masc_sing, fem_sing, masc_plur, fem_plur
         FROM variacoes_palavras
         WHERE masc_sing = ? COLLATE BINARY`,
      [mascSing],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });

const exists = (mascSing) =>
  new Promise((resolve, reject) => {
    if (typeof mascSing !== 'string' || mascSing === '') {
      resolve(false);
      return;
    }

    db.get(
      'SELECT 1 FROM variacoes_palavras WHERE masc_sing = ? COLLATE BINARY',
      [mascSing],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(Boolean(row));
        }
      }
    );
  });

const findExistingKeys = (chaves) =>
  new Promise((resolve, reject) => {
    const chavesValidas = Array.from(
      new Set(
        (chaves || []).filter(
          (valor) => typeof valor === 'string' && valor !== ''
        )
      )
    );

    if (chavesValidas.length === 0) {
      resolve([]);
      return;
    }

    const placeholders = chavesValidas.map(() => '?').join(', ');

    db.all(
      `SELECT masc_sing
         FROM variacoes_palavras
         WHERE masc_sing COLLATE BINARY IN (${placeholders})`,
      chavesValidas,
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => row.masc_sing));
        }
      }
    );
  });

const create = ({ masc_sing: mascSing, fem_sing: femSing, masc_plur: mascPlur, fem_plur: femPlur }) =>
  new Promise((resolve, reject) => {
    if (typeof mascSing !== 'string' || mascSing === '') {
      reject(new Error('masc_sing é obrigatório.'));
      return;
    }

    const dados = [
      mascSing,
      toNullableText(femSing),
      toNullableText(mascPlur),
      toNullableText(femPlur)
    ];

    db.run(
      `INSERT INTO variacoes_palavras
         (masc_sing, fem_sing, masc_plur, fem_plur)
         VALUES (?, ?, ?, ?)`,
      dados,
      function callback(err) {
        if (err) {
          reject(err);
          return;
        }

        findByKey(mascSing)
          .then((variacao) => resolve(variacao))
          .catch((buscaErr) => reject(buscaErr));
      }
    );
  });

module.exports = {
  toNullableText,
  findByKey,
  exists,
  findExistingKeys,
  create
};
