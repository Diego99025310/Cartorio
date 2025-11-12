const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { db } = require('../database');

let csvParser;
try {
  csvParser = require('csv-parser');
} catch (error) {
  // Fallback minimalista para ambientes sem a dependência instalada
  csvParser = require('../lib/simpleCsvParser');
}

const removerBom = (valor) =>
  typeof valor === 'string' ? valor.replace(/^\uFEFF/, '') : valor;

const normalizarCampo = (valor) => {
  if (valor == null) {
    return null;
  }
  const texto = removerBom(String(valor)).trim();
  return texto === '' ? null : texto;
};

const verificarExistencia = (palavraBase) =>
  new Promise((resolve, reject) => {
    db.get(
      'SELECT 1 FROM variacoes_palavras WHERE palavra_base = ? COLLATE BINARY',
      [palavraBase],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(Boolean(row));
        }
      }
    );
  });

const inserirVariacao = ({
  palavra_base: palavraBase,
  masc_sing: mascSing,
  fem_sing: femSing,
  masc_plur: mascPlur,
  fem_plur: femPlur
}) =>
  new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO variacoes_palavras
        (palavra_base, masc_sing, fem_sing, masc_plur, fem_plur)
        VALUES (?, ?, ?, ?, ?)`,
      [palavraBase, mascSing, femSing, mascPlur, femPlur],
      function callback(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      }
    );
  });

const processarRegistros = async (registros) => {
  let importadas = 0;
  let ignoradas = 0;

  for (const registro of registros) {
    const palavraBase = normalizarCampo(registro.palavra_base);
    if (!palavraBase) {
      ignoradas += 1;
      continue;
    }

    const dados = {
      palavra_base: palavraBase,
      masc_sing: normalizarCampo(registro.masc_sing),
      fem_sing: normalizarCampo(registro.fem_sing),
      masc_plur: normalizarCampo(registro.masc_plur),
      fem_plur: normalizarCampo(registro.fem_plur)
    };

    const existe = await verificarExistencia(palavraBase);
    if (existe) {
      ignoradas += 1;
      continue;
    }

    const inserida = await inserirVariacao(dados);
    if (inserida) {
      importadas += 1;
    } else {
      ignoradas += 1;
    }
  }

  console.log(
    `Importação concluída: ${importadas} inseridas, ${ignoradas} ignoradas.`
  );

  return { importadas, ignoradas };
};

const carregarRegistrosDoStream = (stream) =>
  new Promise((resolve, reject) => {
    const registros = [];

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => {
            if (!header) {
              return header;
            }
            return removerBom(header).trim();
          }
        })
      )
      .on('data', (row) => {
        registros.push(row);
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve(registros);
      });
  });

const importarVariacoesDeArquivo = async (arquivoCsv) => {
  const caminhoArquivo = path.resolve(arquivoCsv);
  const stream = fs.createReadStream(caminhoArquivo);

  const registros = await carregarRegistrosDoStream(stream);
  return processarRegistros(registros);
};

const importarVariacoesDeTexto = async (conteudoCsv) => {
  if (typeof conteudoCsv !== 'string') {
    throw new Error('O conteúdo para importação deve ser uma string.');
  }

  const linhasBrutas = conteudoCsv.split(/\r?\n/).map((linha) => removerBom(linha));
  const linhasNaoVazias = linhasBrutas.filter((linha) => linha.trim() !== '');

  const primeiraLinha = linhasNaoVazias[0] || '';
  const possuiCabecalho = /^palavra_base\s*,/i.test(primeiraLinha);

  const corpoTexto = linhasBrutas.join('\n');
  const textoComCabecalho = possuiCabecalho
    ? corpoTexto
    : `palavra_base,masc_sing,fem_sing,masc_plur,fem_plur\n${corpoTexto}`;

  const textoNormalizado = textoComCabecalho.endsWith('\n')
    ? textoComCabecalho
    : `${textoComCabecalho}\n`;

  const stream = Readable.from(textoNormalizado);
  const registros = await carregarRegistrosDoStream(stream);
  return processarRegistros(registros);
};

module.exports = {
  importarVariacoesDeArquivo,
  importarVariacoesDeTexto
};
