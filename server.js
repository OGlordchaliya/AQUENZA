const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Handle API mock endpoint
  if (pathname === '/api/enquiry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        // Validate required fields
        if (!data.name || !data.phone || !data.bottleSize || !data.quantity) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            message: 'Please fill in all mandatory fields: Name, Phone, Bottle Size, and Quantity.'
          }));
        }

        // Return clear status acknowledging client submission
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Enquiry received in demonstration mode.',
          note: 'Backend email dispatch is pending Gmail/SMTP configuration by the owner. You can also connect directly via the WhatsApp instant link.',
          referenceId: 'AQZ-' + Math.floor(100000 + Math.random() * 900000),
          receivedData: data
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON request payload.' }));
      }
    });
    return;
  }

  // Normalize path
  if (pathname === '/') {
    pathname = '/index.html';
  } else if (!path.extname(pathname)) {
    // If no extension, try looking for pathname + '.html'
    if (fs.existsSync(path.join(PUBLIC_DIR, pathname + '.html'))) {
      pathname = pathname + '.html';
    }
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Check if file exists within public directory
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 handler
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Page Not Found - AQUENZA</title>
          <link rel="stylesheet" href="/css/style.css">
          <style>
            .nf-box { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
          </style>
        </head>
        <body>
          <div class="nf-box">
            <h1 style="color: #0052CC; font-size: 3rem; margin-bottom: 0.5rem;">404</h1>
            <h2>Page Not Found</h2>
            <p style="color: #475569; margin: 1rem 0 2rem;">The page you are looking for does not exist.</p>
            <a href="/" class="btn btn-primary">Return to Homepage</a>
          </div>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  AQUENZA — YOUR BRAND. OUR BOTTLE.`);
  console.log(`  Web Server running at: http://localhost:${PORT}`);
  console.log(`  Serving files from: ${PUBLIC_DIR}`);
  console.log(`====================================================`);
});
