const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 17354;
const stateByChannel = new Map();
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function writeFileResponse(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      writeJson(res, 404, { ok: false, error: 'file_not_found' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
}

function safeResolveRequestPath(rawPathname) {
  let pathname = rawPathname || '/';
  if (pathname === '/') pathname = '/index.html';
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const absolutePath = path.resolve(ROOT_DIR, `.${normalized}`);
  if (!absolutePath.startsWith(ROOT_DIR)) return null;
  return absolutePath;
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const channel = url.searchParams.get('channel') || 'default';

  if (req.method === 'GET' && url.pathname === '/health') {
    writeJson(res, 200, { ok: true, port: PORT });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/state') {
    writeJson(res, 200, stateByChannel.get(channel) || { payload: null, ts: 0 });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/state') {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        const payload = parsed && typeof parsed === 'object' ? parsed.payload : null;
        const ts = Number(parsed?.ts) || Date.now();
        stateByChannel.set(channel, { payload, ts });
        writeJson(res, 200, { ok: true, channel, ts });
      } catch (error) {
        writeJson(res, 400, { ok: false, error: 'invalid_json' });
      }
    });
    return;
  }

  if (req.method === 'GET') {
    const filePath = safeResolveRequestPath(url.pathname);
    if (!filePath) {
      writeJson(res, 403, { ok: false, error: 'invalid_path' });
      return;
    }
    writeFileResponse(res, filePath);
    return;
  }

  writeJson(res, 404, { ok: false, error: 'not_found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Control-Obs sync server listening on http://127.0.0.1:${PORT}`);
});
