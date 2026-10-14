/**
 * Production-ready Native HTTP Server for ARRA DIGITAL
 * Serves API, Static Assets, SEO files (robots.txt, sitemap.xml) and SPA HTML5 Routing
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

// Muat variabel lingkungan dari .env secara manual
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { handleApiRequest } = require('./server/api');
const db = require('./server/db');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function generateRobotsTxt() {
  const domain = process.env.PUBLIC_DOMAIN || 'arradigital.my.id';
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin/

Sitemap: https://${domain}/sitemap.xml
`;
}

function generateSitemapXml() {
  const domain = process.env.PUBLIC_DOMAIN || 'arradigital.my.id';
  const baseUrl = `https://${domain}`;
  const now = new Date().toISOString().slice(0, 10);

  const staticRoutes = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/produk', changefreq: 'daily', priority: '0.9' },
    { loc: '/tools', changefreq: 'weekly', priority: '0.8' },
    { loc: '/website', changefreq: 'weekly', priority: '0.8' },
    { loc: '/automation', changefreq: 'weekly', priority: '0.8' },
    { loc: '/tutorial', changefreq: 'weekly', priority: '0.7' },
    { loc: '/tentang', changefreq: 'monthly', priority: '0.6' },
    { loc: '/kontak', changefreq: 'monthly', priority: '0.7' },
    { loc: '/kebijakan-privasi', changefreq: 'monthly', priority: '0.3' },
    { loc: '/ketentuan', changefreq: 'monthly', priority: '0.3' },
    { loc: '/refund', changefreq: 'monthly', priority: '0.3' }
  ];

  const products = db.getActiveProducts();
  const articles = db.getAllPublishedContent();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const r of staticRoutes) {
    xml += `  <url>\n    <loc>${baseUrl}${r.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
  }

  for (const p of products) {
    xml += `  <url>\n    <loc>${baseUrl}/produk/${p.slug}</loc>\n    <lastmod>${p.updated_at ? p.updated_at.slice(0, 10) : now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  for (const a of articles) {
    xml += `  <url>\n    <loc>${baseUrl}/tutorial/${a.slug}</loc>\n    <lastmod>${a.published_at ? a.published_at.slice(0, 10) : now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (pathname === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(generateRobotsTxt());
  }

  if (pathname === '/sitemap.xml') {
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    return res.end(generateSitemapXml());
  }

  if (pathname.startsWith('/api/')) {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      let body = null;
      if (bodyData) {
        try {
          body = JSON.parse(bodyData);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'JSON payload tidak valid.' }));
        }
      }
      await handleApiRequest(req, res, parsedUrl, body);
    });
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (path.extname(filePath)) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File Not Found');
    }
  }

  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Internal Server Error: index.html not found');
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`=================================================`);
    console.log(`🚀 ARRA DIGITAL Production Server running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌐 Public Domain: ${process.env.PUBLIC_DOMAIN || 'arradigital.my.id'}`);
    console.log(`🔒 Admin Route: http://localhost:${PORT}/admin`);
    console.log(`=================================================`);
  });
}

module.exports = server;
