const { Transform } = require('stream');

class SimpleCsvParser extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.buffer = '';
    this.headers = null;
    this.options = options;
  }

  _applyHeaderMap(headers) {
    if (typeof this.options.mapHeaders === 'function') {
      return headers.map((header, index) =>
        this.options.mapHeaders({ header, index })
      );
    }
    return headers;
  }

  _parseLine(line) {
    // Basic CSV split that supports quoted values with commas.
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result.map((value) => value.trim());
  }

  _transform(chunk, encoding, callback) {
    try {
      this.buffer += chunk.toString();
      let indexOfNewLine;

      while ((indexOfNewLine = this.buffer.search(/\r?\n/)) >= 0) {
        const line = this.buffer.slice(0, indexOfNewLine);
        this.buffer = this.buffer.slice(indexOfNewLine + (this.buffer[indexOfNewLine] === '\r' ? 2 : 1));

        if (!line.trim() && !this.headers) {
          continue;
        }

        if (!this.headers) {
          this.headers = this._applyHeaderMap(this._parseLine(line));
          continue;
        }

        const values = this._parseLine(line);
        if (values.length === 1 && values[0] === '') {
          continue;
        }

        const record = {};
        this.headers.forEach((header, idx) => {
          if (header == null || header === '') {
            return;
          }
          record[header] = values[idx] != null ? values[idx] : '';
        });

        this.push(record);
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      const remaining = this.buffer.trim();
      if (remaining) {
        if (!this.headers) {
          this.headers = this._applyHeaderMap(this._parseLine(remaining));
        } else {
          const values = this._parseLine(remaining);
          const record = {};
          this.headers.forEach((header, idx) => {
            if (header == null || header === '') {
              return;
            }
            record[header] = values[idx] != null ? values[idx] : '';
          });
          this.push(record);
        }
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = function simpleCsvParser(options = {}) {
  return new SimpleCsvParser(options);
};
