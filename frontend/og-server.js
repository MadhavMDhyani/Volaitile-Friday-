import http from 'http';
import fs from 'fs';
import path from 'path';

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(process.cwd(), urlPath === '/' ? 'og-throwaway.html' : urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html');
    if (filePath.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2');
    if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(4567, () => {
  console.log('OG server running on http://localhost:4567');
});
