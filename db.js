/**
 * Database Module for ARRA DIGITAL
 * Uses built-in node:sqlite (Zero external C++ compilation required)
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'arra_digital.db');

// Pastikan direktori data ada
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Aktifkan foreign key & optimasi SQLite WAL mode
db.exec('PRAGMA foreign_keys = ON;');
try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {
  // Jika WAL tidak didukung di filesystem tertentu, fallback default aman
}

/**
 * Inisialisasi Skema Tabel
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      short_description TEXT,
      description TEXT,
      features TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      delivery_type TEXT NOT NULL DEFAULT 'instant_link',
      asset_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_whatsapp TEXT,
      product_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      payment_reference TEXT,
      admin_notes TEXT,
      delivered_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      whatsapp TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      published_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
  `);
}

/**
 * Seed data default jika tabel kosong
 */
function seedInitialData() {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const now = new Date().toISOString();
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, slug, name, category, price, short_description, description,
        features, status, delivery_type, asset_reference, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialProducts = [
      {
        id: 'prod_ai_affiliate_01',
        slug: 'ai-affiliate-starter-kit',
        name: 'AI Affiliate Starter Kit (Sampel Demo)',
        category: 'AI & Affiliate',
        price: 29000,
        short_description: 'Paket formula prompt AI, 50+ hook video FYP, caption konversi, dan panduan praktis kreator affiliate.',
        description: 'AI Affiliate Starter Kit dirancang khusus bagi kreator konten dan pemasar affiliate di TikTok, Instagram Reels, dan YouTube Shorts. Berisi koleksi prompt ChatGPT/Gemini siap pakai untuk menyusun skrip video produk dalam 60 detik, 50+ hook pembuka video penahan scroll, pola copywriting Problem-Agitate-Solve, template perencanaan konten mingguan, serta SOP riset produk berpotensi komisi tinggi.',
        features: JSON.stringify([
          '50+ Hook Video Produk Penahan Scroll & Siap Pakai',
          'Template Prompt AI untuk Skrip Video 60 Detik',
          'Formula Caption & CTA Konversi Tinggi',
          'Spreadsheet Perencanaan Konten Mingguan',
          'Panduan Lengkap Format PDF & Notula Praktis',
          'Label Sampel Demo: Bebas disesuaikan pemilik toko'
        ]),
        status: 'active',
        delivery_type: 'digital_download',
        asset_reference: 'assets/products/ai-affiliate-starter-pack.zip'
      },
      {
        id: 'prod_business_template_02',
        slug: 'business-template-pack',
        name: 'Business Template Pack (Sampel Demo)',
        category: 'Template Bisnis',
        price: 39000,
        short_description: 'Koleksi Google Sheets otomatis: sales tracker harian, kalkulator profit bersih, database CRM, dan kalender konten.',
        description: 'Paket komprehensif template operasional bisnis berbasis Google Sheets. Otomatisasi perhitungan laba rugi, pemantauan stok barang, pencatatan leads pelanggan WhatsApp, serta manajemen jadwal posting media sosial tanpa perlu berlangganan software bulanan yang mahal.',
        features: JSON.stringify([
          'Google Sheets Sales Tracker Otomatis dengan Grafik',
          'Kalkulator Profit Bersih & Margin Usaha Otomatis',
          'CRM Sederhana Pencatatan Data Kontak Pelanggan',
          'Kalender Konten Media Sosial Bulanan Siap Pakai',
          'Video / Dokumen Panduan Duplikasi ke Akun Google Anda',
          'Lisensi Penggunaan Bisnis Mandiri'
        ]),
        status: 'active',
        delivery_type: 'digital_download',
        asset_reference: 'assets/products/business-template-pack.zip'
      },
      {
        id: 'prod_website_starter_03',
        slug: 'website-starter-kit',
        name: 'Website Starter Kit (Sampel Demo)',
        category: 'Website',
        price: 99000,
        short_description: 'Template landing page modern, responsive, ultra-cepat, siap pasang dengan formulir WhatsApp dan panduan kustomisasi.',
        description: 'Template website landing page siap pakai dengan desain premium, ramah mobile, skor performa tinggi, dan struktur penjualan berkonversi tinggi. Dilengkapi dokumentasi pengaturan domain custom (.id / .my.id), integrasi tombol pemesanan WhatsApp otomatis, dan panduan hosting gratis.',
        features: JSON.stringify([
          'Source Code Lengkap HTML5, CSS3, & JS Bersih',
          'Desain Responsif, Mobile-First & Kecepatan Tinggi',
          'Tombol WhatsApp Otomatis dengan Format Pesan Dinamis',
          'Panduan Setup & Hubung Domain arradigital.my.id',
          'Bebas Biaya Hosting Bulanan (Panduan Free Host Termasuk)',
          'Lisensi Penggunaan Pribadi & Klien'
        ]),
        status: 'active',
        delivery_type: 'digital_download',
        asset_reference: 'assets/products/website-starter-kit.zip'
      },
      {
        id: 'prod_service_web_04',
        slug: 'jasa-pembuatan-website',
        name: 'Jasa Pembuatan Website Kustom',
        category: 'Jasa Website',
        price: 0,
        short_description: 'Layanan pembuatan website profesional dari landing page konversi hingga company profile lengkap, cepat, dan ramah SEO.',
        description: 'Layanan pengerjaan website profesional oleh tim Arra Digital. Kami merancang desain khusus yang memikat calon pelanggan Anda, mengoptimalkan kecepatan akses, memastikan tampilan sempurna di layar smartphone, dan mengintegrasikan WhatsApp serta analytics bisnis.',
        features: JSON.stringify([
          'Desain Kustom Eksklusif Sesuai Identitas Brand',
          'Optimasi Kecepatan Loading & Mobile-First',
          'Integrasi Tombol WhatsApp & Form Konsultasi',
          'Setup Google Analytics & Google Search Console',
          'Bantuan Setup Domain & Hosting',
          'Garansi Revisi & Pendampingan Paska Peluncuran'
        ]),
        status: 'active',
        delivery_type: 'consultation_service',
        asset_reference: 'internal_service_booking'
      },
      {
        id: 'prod_service_gas_05',
        slug: 'jasa-otomasi-google-apps-script',
        name: 'Jasa Otomasi Google Apps Script & Workflow',
        category: 'Jasa Otomasi',
        price: 0,
        short_description: 'Digitalisasi alur kerja spreadsheet, bot notifikasi WhatsApp/Telegram, laporan otomatis, dan web app internal tanpa biaya server.',
        description: 'Solusi otomasi alur bisnis menggunakan Google Apps Script, Google Sheets, Forms, dan Gmail. Kurangi pekerjaan manual yang memakan waktu hingga berjam-jam setiap harinya dengan integrasi otomatis: rekap transaksi, pembuatan PDF nota otomatis, dan dashboard internal perusahaan.',
        features: JSON.stringify([
          'Otomasi Google Sheets, Docs, Slides, & Gmail',
          'Pembuatan Nota / Invoice Digital Otomatis ke PDF',
          'Sinkronisasi Data Real-Time Multi-Sheet',
          'Webhook & Integrasi Notifikasi Pesan',
          'Tanpa Biaya Server Tambahan (Berjalan di Google Cloud)',
          'Dokumentasi & Video Pelatihan Tim'
        ]),
        status: 'active',
        delivery_type: 'consultation_service',
        asset_reference: 'internal_service_booking'
      }
    ];

    for (const p of initialProducts) {
      insertProduct.run(
        p.id, p.slug, p.name, p.category, p.price, p.short_description,
        p.description, p.features, p.status, p.delivery_type, p.asset_reference,
        now, now
      );
    }
  }

  // Seed default settings jika belum ada
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const now = new Date().toISOString();
    const insertSetting = db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
    const defaultSettings = [
      ['business_name', process.env.PUBLIC_BUSINESS_NAME || 'ARRA DIGITAL'],
      ['tagline', process.env.PUBLIC_TAGLINE || 'Solusi Digital Cerdas untuk Bisnis dan Kreator Indonesia.'],
      ['public_contact_email', process.env.PUBLIC_EMAIL || 'halo@arradigital.my.id'],
      ['public_whatsapp', process.env.PUBLIC_WHATSAPP || '6281317028494'],
      ['currency', 'IDR'],
      ['domain', process.env.PUBLIC_DOMAIN || 'arradigital.my.id']
    ];
    for (const [key, value] of defaultSettings) {
      insertSetting.run(key, value, now);
    }
  }

  // Seed initial content jika belum ada
  const contentCount = db.prepare('SELECT COUNT(*) as count FROM content').get().count;
  if (contentCount === 0) {
    const now = new Date().toISOString();
    const insertContent = db.prepare(`
      INSERT INTO content (id, slug, title, category, body, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const initialArticles = [
      {
        id: 'art_01',
        slug: 'panduan-prompts-ai-affiliate-pemula',
        title: 'Panduan Praktis Membuat Skrip Video Affiliate 60 Detik dengan AI',
        category: 'AI & Konten',
        body: `Kunci keberhasilan video affiliate di media sosial seperti TikTok Reels dan Shorts bertumpu pada 3 detik pertama (The Hook). Jika penonton tidak tertarik dalam 3 detik, mereka akan segera scroll ke video lain.\n\n### Struktur Skrip 60 Detik Berkonversi:\n1. **Detik 0–3 (Hook):** Sentil masalah nyata atau hasil mengejutkan.\n2. **Detik 4–15 (Agitasi):** Jelaskan kenapa cara lama merepotkan atau bikin rugi waktu.\n3. **Detik 16–45 (Solusi Produk):** Tunjukkan produk beraksi, fokus pada manfaat bukan sekadar fitur teknis.\n4. **Detik 46–60 (Call to Action):** Instruksikan penonton secara spesifik, misal 'Klik keranjang kuning di pojok kiri bawah' atau 'Link di bio profil'.\n\nDengan memanfaatkan template AI dari Arra Digital, Anda dapat meriset 10 variasi hook dalam hitungan menit tanpa kebuntuan ide!`
      },
      {
        id: 'art_02',
        slug: 'strategi-website-bisnis-tanpa-biaya-bulanan',
        title: 'Strategi Membangun Website Bisnis Tanpa Beban Biaya Hosting Bulanan',
        category: 'Website & Digital',
        body: `Banyak UMKM ragu membuat website karena khawatir terbebani biaya langganan hosting bulanan yang mahal. Padahal di era sekarang, website berbasis teknologi modern (Jamstack / Static) dapat dihosting dengan reliabilitas 99.9% secara gratis melalui penyedia seperti Cloudflare Pages atau GitHub Pages.\n\n### Yang Anda Butuhkan:\n- **Domain Resmi:** Cukup beli domain dengan ekstensi terjangkau seperti \`.my.id\` atau \`.id\`.\n- **Frontend Cepat & Ringan:** Kode HTML/CSS/JS murni tanpa sistem database server yang berat.\n- **Koneksi Checkout WhatsApp:** Calon pembeli langsung diarahkan ke chat WhatsApp untuk bertransaksi secara personal.\n\nArra Digital membantu Anda menyusun aset web berkualitas tanpa jebakan biaya langganan berulang.`
      },
      {
        id: 'art_03',
        slug: 'otomasi-google-sheets-apps-script',
        title: 'Mengubah Google Sheets Menjadi Sistem Operasional & Nota Otomatis',
        category: 'Otomasi & Workflow',
        body: `Google Sheets bukan sekadar tabel data statis. Dengan Google Apps Script (GAS), spreadsheet Anda bisa berubah menjadi sistem operasional mandiri tanpa perlu menyewa server VPS atau database SQL yang rumit.\n\n### Apa Saja yang Bisa Diotomasi?\n- Cetak nota atau invoice berformat PDF langsung dikirim ke email atau link WhatsApp.\n- Rekapitulasi omzet dan pengeluaran harian otomatis setiap pukul 21.00 WIB.\n- Sinkronisasi stok barang multi-gudang dan form pendaftaran pelanggan.\n\nPelajari modul kami atau konsultasikan kebutuhan kustom alur bisnis Anda bersama tim Arra Digital.`
      }
    ];

    for (const art of initialArticles) {
      insertContent.run(art.id, art.slug, art.title, art.category, art.body, 'published', now);
    }
  }
}

// Inisialisasi awal
initSchema();
seedInitialData();

/**
 * Generator ID Pesanan Unik: ARRA-YYYYMMDD-XXXX
 */
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ARRA-${dateStr}-${randomPart}`;
}

// Helper Queries
module.exports = {
  db,

  // --- Products ---
  getActiveProducts() {
    // Keamanan: asset_reference TIDAK disajikan di query publik
    return db.prepare(`
      SELECT id, slug, name, category, price, short_description, description,
             features, status, delivery_type, created_at, updated_at
      FROM products
      WHERE status = 'active'
      ORDER BY price ASC
    `).all().map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));
  },

  getProductBySlug(slug) {
    const product = db.prepare(`
      SELECT id, slug, name, category, price, short_description, description,
             features, status, delivery_type, created_at, updated_at
      FROM products
      WHERE slug = ? AND status = 'active'
    `).get(slug);

    if (!product) return null;
    return {
      ...product,
      features: product.features ? JSON.parse(product.features) : []
    };
  },

  getProductById(id) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  getAllProductsAdmin() {
    return db.prepare(`
      SELECT id, slug, name, category, price, short_description, description,
             features, status, delivery_type, asset_reference, created_at, updated_at
      FROM products
      ORDER BY created_at DESC
    `).all().map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));
  },

  saveProduct(productData) {
    const now = new Date().toISOString();
    const existing = productData.id ? this.getProductById(productData.id) : null;

    const featuresJson = Array.isArray(productData.features)
      ? JSON.stringify(productData.features)
      : (productData.features || '[]');

    if (existing) {
      db.prepare(`
        UPDATE products SET
          name = ?, category = ?, price = ?, short_description = ?,
          description = ?, features = ?, status = ?, delivery_type = ?,
          asset_reference = ?, updated_at = ?
        WHERE id = ?
      `).run(
        productData.name, productData.category, parseInt(productData.price, 10) || 0,
        productData.short_description, productData.description, featuresJson,
        productData.status || 'active', productData.delivery_type || 'digital_download',
        productData.asset_reference || null, now, productData.id
      );
      return this.getProductById(productData.id);
    } else {
      const id = productData.id || `prod_${Date.now()}`;
      const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      db.prepare(`
        INSERT INTO products (
          id, slug, name, category, price, short_description, description,
          features, status, delivery_type, asset_reference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, slug, productData.name, productData.category, parseInt(productData.price, 10) || 0,
        productData.short_description, productData.description, featuresJson,
        productData.status || 'active', productData.delivery_type || 'digital_download',
        productData.asset_reference || null, now, now
      );
      return this.getProductById(id);
    }
  },

  // --- Orders ---
  createOrder({ customer_name, customer_email, customer_whatsapp, product_id, admin_notes }) {
    // ATURAN KRUSIAL: Ambil harga ASLI dari database, jangan percaya harga dari browser!
    const product = this.getProductById(product_id);
    if (!product) {
      throw new Error('Produk tidak ditemukan.');
    }
    if (product.status !== 'active') {
      throw new Error('Produk tidak tersedia untuk dipesan.');
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const authoritativePrice = product.price;

    db.exec('BEGIN TRANSACTION;');
    try {
      // Masukkan pesanan dengan status PENDING
      db.prepare(`
        INSERT INTO orders (
          id, created_at, customer_name, customer_email, customer_whatsapp,
          product_id, amount, status, admin_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(
        orderId, now, customer_name, customer_email || null,
        customer_whatsapp || null, product.id, authoritativePrice, admin_notes || null
      );

      // Simpan / perbarui direktori pelanggan
      if (customer_email || customer_whatsapp) {
        const customerId = `cust_${crypto.createHash('md5').update((customer_email || customer_whatsapp).toLowerCase().trim()).digest('hex').slice(0, 10)}`;
        const existingCust = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId);
        if (!existingCust) {
          db.prepare(`
            INSERT INTO customers (id, name, email, whatsapp, created_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(customerId, customer_name, customer_email || null, customer_whatsapp || null, now);
        }
      }

      db.exec('COMMIT;');

      return {
        orderId,
        product_name: product.name,
        amount: authoritativePrice,
        customer_name,
        customer_email,
        customer_whatsapp,
        status: 'PENDING',
        created_at: now
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  getOrderByIdPublic(id) {
    // Publik hanya melihat status dasar, TANPA informasi pribadi sensitif
    const order = db.prepare(`
      SELECT o.id, o.created_at, o.amount, o.status, p.name as product_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `).get(id);
    return order || null;
  },

  getOrderByIdAdmin(id) {
    const order = db.prepare(`
      SELECT o.*, p.name as product_name, p.slug as product_slug, p.delivery_type
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `).get(id);
    return order || null;
  },

  getAllOrdersAdmin({ status, search } = {}) {
    let sql = `
      SELECT o.*, p.name as product_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
    `;
    const params = [];
    const conditions = [];

    if (status && status !== 'ALL') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(o.id LIKE ? OR o.customer_name LIKE ? OR o.customer_whatsapp LIKE ? OR o.customer_email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY o.created_at DESC';
    return db.prepare(sql).all(...params);
  },

  updateOrderStatusAdmin(orderId, status, admin_notes, payment_reference) {
    const now = new Date().toISOString();
    let delivered_at = null;
    if (status === 'COMPLETED' || status === 'PAID') {
      delivered_at = now;
    }

    db.prepare(`
      UPDATE orders SET
        status = ?,
        admin_notes = COALESCE(?, admin_notes),
        payment_reference = COALESCE(?, payment_reference),
        delivered_at = COALESCE(?, delivered_at)
      WHERE id = ?
    `).run(status, admin_notes || null, payment_reference || null, delivered_at, orderId);

    return this.getOrderByIdAdmin(orderId);
  },

  // --- Customers ---
  getAllCustomersAdmin() {
    return db.prepare(`
      SELECT id, name, email, whatsapp, created_at,
             (SELECT COUNT(*) FROM orders WHERE customer_email = customers.email OR customer_whatsapp = customers.whatsapp) as total_orders
      FROM customers
      ORDER BY created_at DESC
    `).all();
  },

  // --- Content ---
  getAllPublishedContent() {
    return db.prepare(`
      SELECT id, slug, title, category, substr(body, 1, 200) as excerpt, published_at
      FROM content
      WHERE status = 'published'
      ORDER BY published_at DESC
    `).all();
  },

  getContentBySlug(slug) {
    return db.prepare('SELECT * FROM content WHERE slug = ? AND status = "published"').get(slug);
  },

  getAllContentAdmin() {
    return db.prepare('SELECT * FROM content ORDER BY published_at DESC').all();
  },

  saveContentAdmin(data) {
    const now = new Date().toISOString();
    const existing = data.id ? db.prepare('SELECT * FROM content WHERE id = ?').get(data.id) : null;
    if (existing) {
      db.prepare(`
        UPDATE content SET title = ?, category = ?, body = ?, status = ?
        WHERE id = ?
      `).run(data.title, data.category, data.body, data.status || 'published', data.id);
      return db.prepare('SELECT * FROM content WHERE id = ?').get(data.id);
    } else {
      const id = data.id || `art_${Date.now()}`;
      const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      db.prepare(`
        INSERT INTO content (id, slug, title, category, body, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, slug, data.title, data.category, data.body, data.status || 'published', now);
      return db.prepare('SELECT * FROM content WHERE id = ?').get(id);
    }
  },

  // --- Settings ---
  getPublicSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const r of rows) {
      // Hanya kunci publik yang diizinkan keluar
      if (['business_name', 'tagline', 'public_contact_email', 'public_whatsapp', 'currency', 'domain'].includes(r.key)) {
        result[r.key] = r.value;
      }
    }
    return result;
  },

  getAllSettingsAdmin() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  },

  updateSettingsAdmin(newSettings) {
    const now = new Date().toISOString();
    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const [key, value] of Object.entries(newSettings)) {
        upsert.run(key, String(value), now);
      }
      db.exec('COMMIT;');
      return this.getAllSettingsAdmin();
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  // --- Dashboard Metrics (Real DB Records) ---
  getDashboardMetrics() {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'").get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('PAID', 'COMPLETED')").get().count;
    const revenueRow = db.prepare("SELECT SUM(amount) as revenue FROM orders WHERE status IN ('PAID', 'COMPLETED')").get();
    const totalRevenue = revenueRow && revenueRow.revenue ? revenueRow.revenue : 0;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;

    const recentOrders = db.prepare(`
      SELECT o.id, o.created_at, o.customer_name, o.customer_whatsapp, o.amount, o.status, p.name as product_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `).all();

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders
    };
  }
};
