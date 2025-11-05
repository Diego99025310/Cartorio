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
      ORDER BY d.titulo COLLATE NOCASE ASC, d.id DESC
    `;
    const params = clausulaId ? [clausulaId] : [];
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const findById = (id) =>
  new Promise((resolve, reject) => {
    const query = `
      SELECT d.*, c.nome AS clausula_nome, e.nome AS escritura_nome, u.username AS autor
      FROM declaracoes d
      LEFT JOIN clausulas c ON c.id = d.clausula_id
      LEFT JOIN escrituras e ON e.id = c.escritura_id
      LEFT JOIN users u ON u.id = d.criado_por
      WHERE d.id = ?
    `;

    db.get(query, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const create = (clausulaId, titulo, texto, userId) =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO declaracoes (clausula_id, titulo, texto, criado_por) VALUES (?, ?, ?, ?)',
      [clausulaId, titulo, texto, userId],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, clausula_id: clausulaId, titulo, texto, criado_por: userId });
      }
    );
  });

const update = (id, titulo, texto) =>
  new Promise((resolve, reject) => {
    db.run('UPDATE declaracoes SET titulo = ?, texto = ? WHERE id = ?', [titulo, texto, id], function (err) {
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
