const { db } = require('../database');

const findByUsername = (username) =>
  new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const findById = (id) =>
  new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const createUser = (username, password, isMaster = 0) =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, password, is_master) VALUES (?, ?, ?)',
      [username, password, isMaster],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, username, is_master: isMaster });
      }
    );
  });

module.exports = {
  findByUsername,
  findById,
  createUser
};
