const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_master INTEGER NOT NULL DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS escrituras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        criado_por INTEGER NOT NULL,
        FOREIGN KEY (criado_por) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS clausulas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escritura_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        criado_por INTEGER NOT NULL,
        FOREIGN KEY (escritura_id) REFERENCES escrituras(id) ON DELETE CASCADE,
        FOREIGN KEY (criado_por) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS declaracoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clausula_id INTEGER NOT NULL,
        texto TEXT NOT NULL,
        criado_por INTEGER NOT NULL,
        FOREIGN KEY (clausula_id) REFERENCES clausulas(id) ON DELETE CASCADE,
        FOREIGN KEY (criado_por) REFERENCES users(id)
      )
    `);

    db.get('SELECT COUNT(*) as total FROM users WHERE is_master = 1', (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuários master:', err);
        return;
      }

      if (row.total === 0) {
        const defaultPassword = bcrypt.hashSync('master123', 10);
        db.run(
          'INSERT INTO users (username, password, is_master) VALUES (?, ?, 1)',
          ['master', defaultPassword],
          (insertErr) => {
            if (insertErr) {
              console.error('Erro ao criar usuário master padrão:', insertErr);
            } else {
              console.log('Usuário master padrão criado: master / master123');
            }
          }
        );
      }
    });

    db.get('SELECT COUNT(*) as total FROM users WHERE is_master = 0', (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuários operadores:', err);
        return;
      }

      if (row.total === 0) {
        const defaultPassword = bcrypt.hashSync('operador123', 10);
        db.run(
          'INSERT INTO users (username, password, is_master) VALUES (?, ?, 0)',
          ['operador', defaultPassword],
          (insertErr) => {
            if (insertErr) {
              console.error('Erro ao criar usuário operador padrão:', insertErr);
            } else {
              console.log('Usuário operador padrão criado: operador / operador123');
            }
          }
        );
      }
    });
  });
};

module.exports = {
  db,
  initializeDatabase
};
