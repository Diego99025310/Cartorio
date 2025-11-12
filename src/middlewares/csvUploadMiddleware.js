const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const extractBoundary = (contentType) => {
  if (!contentType) {
    return null;
  }
  const match = contentType.match(/boundary=(?:(?:"([^\"]+)")|([^;]+))/i);
  if (!match) {
    return null;
  }
  return match[1] || match[2];
};

const csvUploadMiddleware = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const boundaryKey = extractBoundary(contentType);

  if (!contentType.startsWith('multipart/form-data') || !boundaryKey) {
    req.file = null;
    return next();
  }

  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('error', (error) => {
    next(error);
  });

  req.on('end', () => {
    (async () => {
      const buffer = Buffer.concat(chunks);
      const raw = buffer.toString('utf8');
      const boundary = `--${boundaryKey}`;
      const sections = raw.split(boundary);

      req.body = req.body || {};
      req.file = null;

      for (const section of sections) {
        if (!section || section === '--' || section === '--\r\n') {
          continue;
        }

        const trimmedSection = section.replace(/^\r\n/, '');
        const headerEndIndex = trimmedSection.indexOf('\r\n\r\n');
        if (headerEndIndex === -1) {
          continue;
        }

        const rawHeaders = trimmedSection.slice(0, headerEndIndex);
        let body = trimmedSection.slice(headerEndIndex + 4);

        if (body.endsWith('\r\n')) {
          body = body.slice(0, -2);
        }
        if (body.endsWith('--')) {
          body = body.slice(0, -2);
        }

        const headers = rawHeaders.split('\r\n');
        const disposition = headers.find((line) =>
          line.toLowerCase().startsWith('content-disposition')
        );

        if (!disposition) {
          continue;
        }

        const nameMatch = disposition.match(/name="([^"]+)"/);
        if (!nameMatch) {
          continue;
        }

        const fieldName = nameMatch[1];
        const filenameMatch = disposition.match(/filename="([^"]*)"/);

        if (filenameMatch && filenameMatch[1]) {
          const originalName = path.basename(filenameMatch[1]) || 'upload.csv';
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName}`;
          const tempPath = path.join(uploadDir, uniqueName);
          await fsPromises.writeFile(tempPath, body, 'utf8');
          req.file = {
            fieldname: fieldName,
            originalname: originalName,
            path: tempPath,
            size: Buffer.byteLength(body, 'utf8')
          };
        } else {
          req.body[fieldName] = body;
        }
      }

      next();
    })().catch(next);
  });
};

module.exports = csvUploadMiddleware;
