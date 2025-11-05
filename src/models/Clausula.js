const { db } = require('../database');

const findAll = (escrituraId = null) =>
  new Promise((resolve, reject) => {
    const query = `
      SELECT c.*, e.nome AS escritura_nome, u.username AS autor
      FROM clausulas c
      LEFT JOIN escrituras e ON e.id = c.escritura_id
      LEFT JOIN users u ON u.id = c.criado_por
      ${escrituraId ? 'WHERE c.escritura_id = ?' : ''}
      ORDER BY c.nome ASC
    `;
    const params = escrituraId ? [escrituraId] : [];
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const findById = (id) =>
  new Promise((resolve, reject) => {
    db.get('SELECT * FROM clausulas WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const create = (escrituraId, nome, userId) =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO clausulas (escritura_id, nome, criado_por) VALUES (?, ?, ?)',
      [escrituraId, nome, userId],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, escritura_id: escrituraId, nome, criado_por: userId });
      }
    );
  });

const update = (id, nome) =>
  new Promise((resolve, reject) => {
    db.run('UPDATE clausulas SET nome = ? WHERE id = ?', [nome, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });

const remove = (id) =>
  new Promise((resolve, reject) => {
    db.run('DELETE FROM clausulas WHERE id = ?', [id], function (err) {
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
