/**
 * REST API Router & Controller for ARRA DIGITAL
 * Secure, clean, decoupled from HTTP server implementation
 */
const crypto = require('node:crypto');
const db = require('./db');
const { processToolRequest } = require('./aiTools');

const SESSION_SECRET = process.env.SESSION_SECRET || 'arra-digital-default-dev-secret-key-2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ArraSecure2026!Admin';

// Rate limiting sederhana berbasis memori untuk proteksi brute force login
const loginAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (now > record.resetAt) {
    loginAttempts.delete(ip);
    return false;
  }
  return record.count >= 5;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  record.count += 1;
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

/**
 * Pembuatan Token HMAC Terenkripsi untuk Sesi Admin
 */
function createAuthToken(username) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    user: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 Jam
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Verifikasi Token Admin
 */
function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token kedaluwarsa
    }
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Timing-safe string compare untuk kredensial
 */
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * API Handler Router
 */
async function handleApiRequest(req, res, parsedUrl, body) {
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const clientIp = req.socket.remoteAddress || 'unknown';

  const json = (statusCode, data) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
  };

  try {
    // PUBLIC ROUTES
    if (method === 'GET' && pathname === '/api/settings') {
      const settings = db.getPublicSettings();
      return json(200, { success: true, settings });
    }

    if (method === 'GET' && pathname === '/api/products') {
      const products = db.getActiveProducts();
      const category = parsedUrl.searchParams.get('category');
      const search = parsedUrl.searchParams.get('search');

      let filtered = products;
      if (category && category !== 'Semua') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(query) ||
          (p.short_description && p.short_description.toLowerCase().includes(query))
        );
      }
      return json(200, { success: true, count: filtered.length, products: filtered });
    }

    if (method === 'GET' && pathname.startsWith('/api/products/')) {
      const slug = pathname.replace('/api/products/', '');
      const product = db.getProductBySlug(slug);
      if (!product) {
        return json(404, { success: false, error: 'Produk tidak ditemukan.' });
      }
      return json(200, { success: true, product });
    }

    if (method === 'POST' && pathname === '/api/orders') {
      if (!body || !body.customer_name || !body.product_id) {
        return json(400, { success: false, error: 'Nama pelanggan dan produk wajib diisi.' });
      }

      const order = db.createOrder({
        customer_name: String(body.customer_name).trim(),
        customer_email: body.customer_email ? String(body.customer_email).trim() : null,
        customer_whatsapp: body.customer_whatsapp ? String(body.customer_whatsapp).trim() : null,
        product_id: String(body.product_id).trim(),
        admin_notes: body.notes ? String(body.notes).trim() : null
      });

      const settings = db.getPublicSettings();
      const waNumber = settings.public_whatsapp || '6281317028494';
      const formattedAmount = new Intl.NumberFormat('id-ID').format(order.amount);
      const waText = `Halo ${settings.business_name || 'Arra Digital'}, saya sudah memesan produk:\n\n*ID Pesanan:* ${order.orderId}\n*Produk:* ${order.product_name}\n*Total:* ${order.amount > 0 ? 'Rp ' + formattedAmount : 'Konsultasi Layanan'}\n*Nama:* ${order.customer_name}\n\nMohon petunjuk pembayaran & konfirmasi selanjutnya. Terima kasih.`;
      const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

      return json(201, {
        success: true,
        message: 'Pesanan berhasil dibuat dengan status PENDING.',
        order,
        whatsappUrl
      });
    }

    if (method === 'GET' && pathname.startsWith('/api/orders/')) {
      const orderId = pathname.replace('/api/orders/', '');
      const order = db.getOrderByIdPublic(orderId);
      if (!order) {
        return json(404, { success: false, error: 'Pesanan tidak ditemukan.' });
      }
      return json(200, { success: true, order });
    }

    if (method === 'GET' && pathname === '/api/content') {
      const articles = db.getAllPublishedContent();
      return json(200, { success: true, articles });
    }

    if (method === 'GET' && pathname.startsWith('/api/content/')) {
      const slug = pathname.replace('/api/content/', '');
      const article = db.getContentBySlug(slug);
      if (!article) {
        return json(404, { success: false, error: 'Artikel tutorial tidak ditemukan.' });
      }
      return json(200, { success: true, article });
    }

    if (method === 'POST' && pathname === '/api/tools/generate') {
      if (!body || !body.toolType) {
        return json(400, { success: false, error: 'toolType wajib diisi.' });
      }
      const result = await processToolRequest(body.toolType, body.inputs || {});
      return json(200, { success: true, result });
    }

    // ADMIN AUTHENTICATION
    if (method === 'POST' && pathname === '/api/admin/login') {
      if (isRateLimited(clientIp)) {
        return json(429, {
          success: false,
          error: 'Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam 15 menit.'
        });
      }

      const { username, password } = body || {};
      const validUser = safeCompare(username, ADMIN_USERNAME);
      const validPass = safeCompare(password, ADMIN_PASSWORD);

      if (!validUser || !validPass) {
        recordFailedLogin(clientIp);
        return json(401, { success: false, error: 'Username atau password admin salah.' });
      }

      clearLoginAttempts(clientIp);
      const token = createAuthToken(username);
      return json(200, {
        success: true,
        message: 'Login berhasil.',
        token,
        username
      });
    }

    // PROTECTED ADMIN ROUTES
    if (pathname.startsWith('/api/admin/')) {
      const authHeader = req.headers['authorization'];
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }

      const authUser = verifyAuthToken(token);
      if (!authUser) {
        return json(401, {
          success: false,
          error: 'Akses ditolak. Sesi tidak sah atau telah kedaluwarsa. Silakan masuk kembali.'
        });
      }

      if (method === 'GET' && pathname === '/api/admin/me') {
        return json(200, { success: true, user: authUser.user });
      }

      if (method === 'GET' && pathname === '/api/admin/dashboard') {
        const metrics = db.getDashboardMetrics();
        return json(200, { success: true, metrics });
      }

      if (method === 'GET' && pathname === '/api/admin/products') {
        const products = db.getAllProductsAdmin();
        return json(200, { success: true, products });
      }

      if (method === 'POST' && pathname === '/api/admin/products') {
        if (!body || !body.name || !body.category) {
          return json(400, { success: false, error: 'Nama dan kategori produk wajib diisi.' });
        }
        const saved = db.saveProduct(body);
        return json(200, { success: true, message: 'Produk berhasil disimpan.', product: saved });
      }

      if (method === 'GET' && pathname === '/api/admin/orders') {
        const status = parsedUrl.searchParams.get('status');
        const search = parsedUrl.searchParams.get('search');
        const orders = db.getAllOrdersAdmin({ status, search });
        return json(200, { success: true, orders });
      }

      if (method === 'PUT' && pathname.startsWith('/api/admin/orders/')) {
        const orderId = pathname.replace('/api/admin/orders/', '');
        const { status, admin_notes, payment_reference } = body || {};
        if (!status) {
          return json(400, { success: false, error: 'Status pesanan wajib diisi.' });
        }
        const updated = db.updateOrderStatusAdmin(orderId, status, admin_notes, payment_reference);
        return json(200, { success: true, message: 'Status pesanan diperbarui.', order: updated });
      }

      if (method === 'GET' && pathname === '/api/admin/customers') {
        const customers = db.getAllCustomersAdmin();
        return json(200, { success: true, customers });
      }

      if (method === 'GET' && pathname === '/api/admin/content') {
        const content = db.getAllContentAdmin();
        return json(200, { success: true, content });
      }

      if (method === 'POST' && pathname === '/api/admin/content') {
        if (!body || !body.title || !body.body) {
          return json(400, { success: false, error: 'Judul dan isi artikel wajib diisi.' });
        }
        const saved = db.saveContentAdmin(body);
        return json(200, { success: true, message: 'Konten berhasil disimpan.', article: saved });
      }

      if (method === 'GET' && pathname === '/api/admin/settings') {
        const settings = db.getAllSettingsAdmin();
        return json(200, { success: true, settings });
      }

      if (method === 'PUT' && pathname === '/api/admin/settings') {
        if (!body || typeof body !== 'object') {
          return json(400, { success: false, error: 'Data pengaturan tidak valid.' });
        }
        const updated = db.updateSettingsAdmin(body);
        return json(200, { success: true, message: 'Pengaturan berhasil diperbarui.', settings: updated });
      }
    }

    return json(404, { success: false, error: `Endpoint ${method} ${pathname} tidak ditemukan.` });

  } catch (err) {
    console.error('API Error:', err);
    return json(500, { success: false, error: err.message || 'Terjadi kesalahan internal server.' });
  }
}

module.exports = {
  handleApiRequest
};
