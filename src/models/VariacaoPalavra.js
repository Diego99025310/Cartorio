const { db } = require('../database');

const findByBaseWord = (palavraBase) =>
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

const findExistingBaseWords = (palavrasBase) =>
  new Promise((resolve, reject) => {
    if (!palavrasBase || palavrasBase.length === 0) {
      resolve([]);
      return;
    }

    const placeholders = palavrasBase.map(() => '?').join(', ');
    const query = `
      SELECT palavra_base
        FROM variacoes_palavras
        WHERE palavra_base COLLATE BINARY IN (${placeholders})
    `;

    db.all(query, palavrasBase, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map((row) => row.palavra_base));
      }
    });
  });

module.exports = {
  findByBaseWord,
  findExistingBaseWords
};
