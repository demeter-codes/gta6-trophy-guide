// Leonida static server (Node 22, standard library only): `node serve.ts` listens on http://localhost:8080,
// `node serve.ts --port 8099` elsewhere. It stays on loopback, answers only for files under app/, and sets the
// content types a browser insists on. It is a development convenience, nothing more.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort(argv: string[]): number {
  const at = argv.indexOf('--port');
  const n = at === -1 ? 8080 : Number(argv[at + 1]);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function resolveRequest(rawUrl: string | undefined): string | null {
  let path: string;
  try {
    path = decodeURIComponent(new URL(rawUrl ?? '/', 'http://localhost').pathname);
  } catch {
    return null;
  }
  if (path.endsWith('/')) path += 'index.html';
  const target = resolve(join(appDir, normalize(path)));
  return target === appDir || target.startsWith(appDir + sep) ? target : null;
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'allow': 'GET, HEAD' }).end('method not allowed');
    return;
  }
  const target = resolveRequest(req.url);
  if (target === null) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let size: number;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(target).pipe(res);
});

const port = pickPort(process.argv.slice(2));
server.listen(port, '127.0.0.1', () => console.log(`Serving app/ at http://localhost:${port}`));
