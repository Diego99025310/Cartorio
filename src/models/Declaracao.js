const { db } = require('../database');

const findAll = (clausulaId = null) =>
  new Promise((resolve, reject) => {
    const query = `
      SELECT d.*, c.nome AS clausula_nome, e.nome AS escritura_nome, u.username AS autor
      FROM declaracoes d
      LEFT JOIN clausulas c ON c.id = d.clausula_id
      LEFT JOIN escrituras e ON e.id = c.escritura_id
      LEFT JOIN users u ON u.id = d.criado_por
      ${clausulaId ? 'WHERE d.clausula_id = ?' : ''}
      ORDER BY d.id DESC
    `;
    const params = clausulaId ? [clausulaId] : [];
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const findById = (id) =>
  new Promise((resolve, reject) => {
    db.get('SELECT * FROM declaracoes WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const create = (clausulaId, texto, userId) =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO declaracoes (clausula_id, texto, criado_por) VALUES (?, ?, ?)',
      [clausulaId, texto, userId],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, clausula_id: clausulaId, texto, criado_por: userId });
      }
    );
  });

const update = (id, texto) =>
  new Promise((resolve, reject) => {
    db.run('UPDATE declaracoes SET texto = ? WHERE id = ?', [texto, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });

const remove = (id) =>
  new Promise((resolve, reject) => {
    db.run('DELETE FROM declaracoes WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
