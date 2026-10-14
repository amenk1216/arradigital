/**
 * Comprehensive Automated Test Suite for ARRA DIGITAL
 * Uses built-in node:test and node:assert
 * Run via: npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'TestPassword123!';
process.env.SESSION_SECRET = 'test-secret-suite-key-2026';

const server = require('../server');
const db = require('../server/db');

const BASE_URL = 'http://localhost:3099';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
}

before(done => {
  server.listen(3099, '127.0.0.1', done);
});

after(done => {
  server.close(done);
});

test('1. GET /api/settings returns public business info without secrets', async () => {
  const res = await request('/api/settings');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.settings.business_name);
  assert.ok(res.body.settings.public_whatsapp);
  assert.equal(res.body.settings.admin_password, undefined);
  assert.equal(res.body.settings.session_secret, undefined);
});

test('2. GET /api/products returns active products and hides asset_reference', async () => {
  const res = await request('/api/products');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.products.length >= 3);

  for (const prod of res.body.products) {
    assert.equal(prod.status, 'active');
    assert.ok(Array.isArray(prod.features));
    assert.equal(prod.asset_reference, undefined);
  }
});

test('3. GET /api/products/:slug returns detail for valid product and 404 for invalid', async () => {
  const resValid = await request('/api/products/ai-affiliate-starter-kit');
  assert.equal(resValid.status, 200);
  assert.equal(resValid.body.product.slug, 'ai-affiliate-starter-kit');

  const resInvalid = await request('/api/products/slug-produk-palsu-123');
  assert.equal(resInvalid.status, 404);
  assert.equal(resInvalid.body.success, false);
});

test('4. POST /api/orders enforces authoritative server-side price (Never trust browser price!)', async () => {
  const product = db.getProductBySlug('ai-affiliate-starter-kit');
  assert.ok(product);
  assert.equal(product.price, 29000);

  const fakePriceAttempt = {
    customer_name: 'Budi Santoso',
    customer_whatsapp: '081298765432',
    customer_email: 'budi@example.com',
    product_id: product.id,
    amount: 100
  };

  const res = await request('/api/orders', {
    method: 'POST',
    body: fakePriceAttempt
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.order.amount, 29000);
  assert.equal(res.body.order.status, 'PENDING');
  assert.ok(res.body.order.orderId.startsWith('ARRA-'));
  assert.ok(res.body.whatsappUrl.includes('ARRA-'));
  assert.ok(res.body.whatsappUrl.includes('29.000'));
});

test('5. GET /api/orders/:id returns public tracking without leaking email/whatsapp', async () => {
  const product = db.getProductBySlug('business-template-pack');
  const created = db.createOrder({
    customer_name: 'Siti Rahma',
    customer_email: 'siti.secret@email.com',
    customer_whatsapp: '081999888777',
    product_id: product.id
  });

  const res = await request(`/api/orders/${created.orderId}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.order.id, created.orderId);
  assert.equal(res.body.order.status, 'PENDING');
  assert.equal(res.body.order.customer_email, undefined);
  assert.equal(res.body.order.customer_whatsapp, undefined);
});

test('6. Admin Authentication & Protected Endpoints', async () => {
  const badLogin = await request('/api/admin/login', {
    method: 'POST',
    body: { username: 'testadmin', password: 'WrongPassword!' }
  });
  assert.equal(badLogin.status, 401);
  assert.equal(badLogin.body.success, false);

  const unauthorized = await request('/api/admin/dashboard');
  assert.equal(unauthorized.status, 401);

  const goodLogin = await request('/api/admin/login', {
    method: 'POST',
    body: { username: 'testadmin', password: 'TestPassword123!' }
  });
  assert.equal(goodLogin.status, 200);
  assert.ok(goodLogin.body.token);

  const adminToken = goodLogin.body.token;
  const authHeaders = { Authorization: `Bearer ${adminToken}` };

  const dash = await request('/api/admin/dashboard', { headers: authHeaders });
  assert.equal(dash.status, 200);
  assert.ok(dash.body.metrics.totalOrders >= 1);
  assert.ok(dash.body.metrics.totalProducts >= 3);

  const ordersList = await request('/api/admin/orders', { headers: authHeaders });
  assert.equal(ordersList.status, 200);
  const targetOrder = ordersList.body.orders[0];

  const updateRes = await request(`/api/admin/orders/${targetOrder.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: {
      status: 'PAID',
      admin_notes: 'Pembayaran telah diverifikasi via transfer BCA',
      payment_reference: 'TRX-BCA-987654'
    }
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.order.status, 'PAID');
  assert.equal(updateRes.body.order.admin_notes, 'Pembayaran telah diverifikasi via transfer BCA');
});

test('7. POST /api/tools/generate produces high-quality AI tool outputs', async () => {
  const tools = ['affiliate_hooks', 'video_script', 'caption_cta', 'content_calendar', 'website_brief'];

  for (const t of tools) {
    const res = await request('/api/tools/generate', {
      method: 'POST',
      body: {
        toolType: t,
        inputs: {
          product_name: 'AI Affiliate Starter Kit',
          niche: 'Digital Affiliate',
          audience: 'Kreator Pemula',
          benefit: 'Bikin skrip FYP dalam 60 detik'
        }
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.result.data);
    assert.ok(res.body.result.disclaimer);
  }
});

test('8. SEO & Static Routes (robots.txt & sitemap.xml)', async () => {
  const robots = await request('/robots.txt');
  assert.equal(robots.status, 200);
  assert.ok(robots.body.includes('Disallow: /admin'));
  assert.ok(robots.body.includes('Sitemap:'));

  const sitemap = await request('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.ok(sitemap.body.includes('<urlset'));
  assert.ok(sitemap.body.includes('/produk'));
  assert.ok(sitemap.body.includes('/tools'));
});
