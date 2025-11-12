const { db } = require('../database');

const normalizarPalavraBase = (palavraBase = '') =>
  palavraBase ? palavraBase.trim().toLowerCase() : '';

const findByBaseWord = (palavraBase) =>
  new Promise((resolve, reject) => {
    const chaveNormalizada = normalizarPalavraBase(palavraBase);
    if (!chaveNormalizada) {
      resolve(null);
      return;
    }

    db.get(
      `SELECT palavra_base, masc_sing, fem_sing, masc_plur, fem_plur
        FROM variacoes_palavras
        WHERE LOWER(TRIM(palavra_base)) = ?`,
      [chaveNormalizada],
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
    const normalizados = (palavrasBase || [])
      .map(normalizarPalavraBase)
      .filter((valor) => valor);

    if (normalizados.length === 0) {
      resolve([]);
      return;
    }

    const placeholders = normalizados.map(() => '?').join(', ');
    const query = `
      SELECT LOWER(TRIM(palavra_base)) AS chave_normalizada
        FROM variacoes_palavras
        WHERE LOWER(TRIM(palavra_base)) IN (${placeholders})
    `;

    db.all(query, normalizados, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map((row) => row.chave_normalizada));
      }
    });
  });

module.exports = {
  findByBaseWord,
  findExistingBaseWords,
  normalizarPalavraBase
};
