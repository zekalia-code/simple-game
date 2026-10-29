import { createServer } from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

/**
 * Minimal static dev server for this no-build site: serves the working tree
 * with `no-store` so every reload shows the current files.
 */
const ROOT = resolve(process.argv[2] || process.cwd());
const PORT = Number(process.argv[3] || 3000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, 'http://localhost');
    const decoded = decodeURIComponent(pathname);
    let filePath = normalize(join(ROOT, decoded));

    if (filePath !== ROOT && !filePath.startsWith(ROOT + '/')) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden');
      return;
    }

    let info = await fs.stat(filePath).catch(() => null);

    if (info && info.isDirectory()) {
      if (!decoded.endsWith('/')) {
        response.writeHead(301, { Location: `${decoded}/` }).end();
        return;
      }
      filePath = join(filePath, 'index.html');
      info = await fs.stat(filePath).catch(() => null);
    }

    if (!info || !info.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    createReadStream(filePath)
      .on('error', () => response.destroy())
      .pipe(response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`RELIC AR dev server: ${ROOT} on http://0.0.0.0:${PORT}`);
});
