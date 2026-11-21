// Small loopback static server for the offline app.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 8080;

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = normalize(join(root, 'app', relative));
  if (!file.startsWith(join(root, 'app')) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': mime[extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Leonida Field Guide: http://127.0.0.1:${port}`);
});
