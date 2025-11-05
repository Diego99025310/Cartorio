const { db } = require('../database');

const findAll = () =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT e.*, u.username AS autor
       FROM escrituras e
       LEFT JOIN users u ON u.id = e.criado_por
       ORDER BY e.nome ASC`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });

const findById = (id) =>
  new Promise((resolve, reject) => {
    db.get('SELECT * FROM escrituras WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const create = (nome, userId) =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO escrituras (nome, criado_por) VALUES (?, ?)',
      [nome, userId],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, nome, criado_por: userId });
      }
    );
  });

const update = (id, nome) =>
  new Promise((resolve, reject) => {
    db.run('UPDATE escrituras SET nome = ? WHERE id = ?', [nome, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });

const remove = (id) =>
  new Promise((resolve, reject) => {
    db.run('DELETE FROM escrituras WHERE id = ?', [id], function (err) {
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
