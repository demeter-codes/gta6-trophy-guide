// A loopback-only static server for the Leonida Field Guide.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = normalize(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));
const args = process.argv.slice(2);
const portOption = args.indexOf('--port');
const port = portOption >= 0 ? Number(args[portOption + 1]) : 8080;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Choose a numeric port from 1 through 65535.');
}

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const preview = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const relative = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  const file = normalize(join(site, decodeURIComponent(relative)));

  if (!file.startsWith(site + '/') || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Page not found.');
    return;
  }

  response.writeHead(200, {
    'content-type': contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
});

preview.listen(port, '127.0.0.1', () => {
  console.log(`Leonida Field Guide is at http://127.0.0.1:${port}`);
});
