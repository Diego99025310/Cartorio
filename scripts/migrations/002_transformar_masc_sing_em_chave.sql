BEGIN TRANSACTION;

CREATE TABLE variacoes_palavras_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  masc_sing TEXT UNIQUE,
  fem_sing TEXT,
  masc_plur TEXT,
  fem_plur TEXT
);

INSERT INTO variacoes_palavras_new (id, masc_sing, fem_sing, masc_plur, fem_plur)
SELECT id, masc_sing, fem_sing, masc_plur, fem_plur FROM variacoes_palavras;

DROP TABLE variacoes_palavras;

ALTER TABLE variacoes_palavras_new RENAME TO variacoes_palavras;

COMMIT;
