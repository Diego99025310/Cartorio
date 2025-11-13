const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { createOrReturn } = require('./variacoesPalavrasService');

let csvParser;
try {
  csvParser = require('csv-parser');
} catch (error) {
  // Fallback minimalista para ambientes sem a dependência instalada
  csvParser = require('../lib/simpleCsvParser');
}

const removerBom = (valor) =>
  typeof valor === 'string' ? valor.replace(/^\uFEFF/, '') : valor;

const lerLiteral = (valor) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (typeof valor === 'string') {
    return removerBom(valor);
  }

  return removerBom(String(valor));
};

const processarRegistros = async (registros) => {
  let importadas = 0;
  let ignoradas = 0;

  for (const registro of registros) {
    const mascSing = lerLiteral(registro.masc_sing);
    if (mascSing === null || mascSing === '') {
      ignoradas += 1;
      continue;
    }

    const femSing = lerLiteral(registro.fem_sing);
    const mascPlur = lerLiteral(registro.masc_plur);
    const femPlur = lerLiteral(registro.fem_plur);

    try {
      const { criada } = await createOrReturn(mascSing, femSing, mascPlur, femPlur);
      if (criada) {
        importadas += 1;
      } else {
        ignoradas += 1;
      }
    } catch (error) {
      console.error('Erro ao importar variação:', error.message || error);
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
  const possuiCabecalho = /^masc_sing\s*,/i.test(primeiraLinha);

  const corpoTexto = linhasBrutas.join('\n');
  const textoComCabecalho = possuiCabecalho
    ? corpoTexto
    : `masc_sing,fem_sing,masc_plur,fem_plur\n${corpoTexto}`;

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
