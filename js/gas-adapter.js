/**
 * ==============================================================================
 * ARRA DIGITAL - GOOGLE APPS SCRIPT & DATABASE ADAPTER (js/gas-adapter.js)
 * Menghubungkan seluruh fungsi web dan Admin Panel ke Google Spreadsheet (GAS).
 * Mendukung mode Offline/Standalone jika GAS belum dideploy.
 * ==============================================================================
 */

(function () {
  // Inisialisasi Database Lokal / Seed Data jika belum ada
  initLocalStorageDb();

  // Patch window.fetch untuk mencegat rute /api/* dan mengarahkannya ke GAS
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (resource, init = {}) {
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      return handleApiRequest(resource, init);
    }
    return originalFetch(resource, init);
  };

  /**
   * Mengatur rute API ke Google Apps Script atau Database Lokal
   */
  async function handleApiRequest(endpoint, init) {
    const gasUrl = localStorage.getItem('arra_gas_url') || (window.CONFIG && CONFIG.gasApiUrl) || '';
    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    if (init.body) {
      try {
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch (e) {
        body = {};
      }
    }

    // 1. GENERATOR AI TOOLS (Berjalan instan di sisi browser)
    if (endpoint === '/api/tools/generate') {
      const toolType = body.toolType;
      const inputs = body.inputs || {};
      const result = generateClientSideContent(toolType, inputs);
      return mockJsonResponse({ success: true, result });
    }

    // 2. KONEKSI GOOGLE APPS SCRIPT (Jika URL Dikonfigurasi)
    if (gasUrl) {
      try {
        const gasResponse = await routeToGoogleAppsScript(gasUrl, endpoint, method, body, init);
        if (gasResponse) return gasResponse;
      } catch (gasErr) {
        console.warn('Gagal memanggil GAS, menggunakan database lokal:', gasErr);
      }
    }

    // 3. FALLBACK DATABASE LOKAL (Offline & Standalone Mode)
    return handleLocalDbRequest(endpoint, method, body, init);
  }

  /**
   * Router untuk Google Apps Script Web App
   */
  async function routeToGoogleAppsScript(gasUrl, endpoint, method, body, init) {
    const token = localStorage.getItem('arra_admin_token') || '';

    // GET Settings
    if (endpoint === '/api/settings') {
      const res = await originalFetch(`${gasUrl}?action=getSettings`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // GET Products
    if (endpoint === '/api/products') {
      const res = await originalFetch(`${gasUrl}?action=getProducts`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // GET Single Product
    if (endpoint.startsWith('/api/products/')) {
      const slug = endpoint.replace('/api/products/', '');
      const res = await originalFetch(`${gasUrl}?action=getProductBySlug&slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // GET Content Articles
    if (endpoint === '/api/content') {
      const res = await originalFetch(`${gasUrl}?action=getContent`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // POST Create Order
    if (endpoint === '/api/orders' && method === 'POST') {
      body.action = 'createOrder';
      const res = await originalFetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // POST Admin Login
    if (endpoint === '/api/admin/login' && method === 'POST') {
      const res = await originalFetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'adminLogin',
          username: body.username,
          password: body.password
        })
      });
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // GET Admin Me / Session Check
    if (endpoint === '/api/admin/me') {
      return mockJsonResponse({
        success: true,
        user: { username: 'admin', role: 'superadmin' }
      });
    }

    // GET Admin Dashboard Metrics
    if (endpoint === '/api/admin/dashboard') {
      const res = await originalFetch(`${gasUrl}?action=getAdminDashboard&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // Admin Products (GET & POST)
    if (endpoint === '/api/admin/products') {
      if (method === 'POST') {
        const res = await originalFetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'saveProduct', token, product: body })
        });
        const json = await res.json();
        return mockJsonResponse(json);
      } else {
        const res = await originalFetch(`${gasUrl}?action=getAdminProducts&token=${encodeURIComponent(token)}`);
        const json = await res.json();
        return mockJsonResponse(json);
      }
    }

    // Admin Orders
    if (endpoint === '/api/admin/orders') {
      const res = await originalFetch(`${gasUrl}?action=getAdminOrders&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // Admin Order Status Update
    if (endpoint.startsWith('/api/admin/orders/') && method === 'PATCH') {
      const orderId = endpoint.replace('/api/admin/orders/', '');
      const res = await originalFetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'updateOrderStatus',
          token,
          orderId: orderId,
          status: body.status,
          paymentReference: body.payment_reference,
          notes: body.notes
        })
      });
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // Admin Customers
    if (endpoint === '/api/admin/customers') {
      const res = await originalFetch(`${gasUrl}?action=getAdminCustomers&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      return mockJsonResponse(json);
    }

    // Admin Settings (GET & PUT)
    if (endpoint === '/api/admin/settings') {
      if (method === 'PUT' || method === 'POST') {
        const res = await originalFetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'saveSettings', token, settings: body })
        });
        const json = await res.json();
        return mockJsonResponse(json);
      } else {
        const res = await originalFetch(`${gasUrl}?action=getSettings`);
        const json = await res.json();
        return mockJsonResponse(json);
      }
    }

    return null;
  }

  /**
   * Router untuk Database Lokal (LocalStorage)
   */
  function handleLocalDbRequest(endpoint, method, body) {
    const db = getLocalDb();

    if (endpoint === '/api/settings') {
      return mockJsonResponse({ success: true, settings: db.settings });
    }

    if (endpoint === '/api/products') {
      const active = db.products.filter(p => p.status === 'active');
      return mockJsonResponse({ success: true, products: active });
    }

    if (endpoint.startsWith('/api/products/')) {
      const slug = endpoint.replace('/api/products/', '');
      const prod = db.products.find(p => p.slug === slug);
      if (prod) return mockJsonResponse({ success: true, product: prod });
      return mockJsonResponse({ success: false, error: 'Produk tidak ditemukan.' }, 404);
    }

    if (endpoint === '/api/content') {
      return mockJsonResponse({ success: true, articles: db.articles });
    }

    if (endpoint.startsWith('/api/content/')) {
      const slug = endpoint.replace('/api/content/', '');
      const art = db.articles.find(a => a.slug === slug);
      if (art) return mockJsonResponse({ success: true, article: art });
      return mockJsonResponse({ success: false, error: 'Artikel tidak ditemukan.' }, 404);
    }

    // Order Submission
    if (endpoint === '/api/orders' && method === 'POST') {
      const prod = db.products.find(p => p.id === body.product_id);
      if (!prod) return mockJsonResponse({ success: false, error: 'Produk tidak valid.' }, 400);

      const d = new Date();
      const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
      const orderId = `ARRA-${dateStr}-${rand}`;
      const nowIso = d.toISOString();

      const newOrder = {
        id: orderId,
        created_at: nowIso,
        product_id: prod.id,
        product_name: prod.name,
        amount: prod.price,
        customer_name: body.customer_name || 'Pelanggan',
        customer_whatsapp: body.customer_whatsapp || '-',
        customer_email: body.customer_email || '-',
        status: 'PENDING',
        payment_reference: '-',
        notes: body.notes || '-'
      };

      db.orders.unshift(newOrder);
      saveLocalDb(db);

      const waNumber = db.settings.public_whatsapp || '6281317028494';
      const waMsg = `Halo Arra Digital, saya sudah memesan:\n\n*ID Pesanan:* ${orderId}\n*Produk:* ${prod.name}\n*Harga:* Rp ${Number(prod.price).toLocaleString('id-ID')}\n*Nama:* ${body.customer_name}\n\nMohon konfirmasi rekening pembayaran & proses serah terima.`;
      const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`;

      return mockJsonResponse({
        success: true,
        order: newOrder,
        whatsappUrl: waUrl
      });
    }

    // Admin Login
    if (endpoint === '/api/admin/login' && method === 'POST') {
      const u = body.username;
      const p = body.password;
      if (u === 'admin' && (p === 'admin123' || p === 'ArraSecure2026!Admin')) {
        const token = btoa(`${u}:${Date.now()}:local`);
        return mockJsonResponse({ success: true, token, username: 'admin' });
      }
      return mockJsonResponse({ success: false, error: 'Username atau password salah.' }, 401);
    }

    if (endpoint === '/api/admin/me') {
      return mockJsonResponse({ success: true, user: { username: 'admin' } });
    }

    if (endpoint === '/api/admin/dashboard') {
      const orders = db.orders;
      const totalOrders = orders.length;
      let pendingOrders = 0;
      let paidOrders = 0;
      let verifiedRevenue = 0;
      const uniqueCust = {};

      orders.forEach(o => {
        if (o.status === 'PENDING') pendingOrders++;
        if (o.status === 'PAID' || o.status === 'COMPLETED') {
          paidOrders++;
          verifiedRevenue += Number(o.amount || 0);
        }
        if (o.customer_whatsapp) uniqueCust[o.customer_whatsapp] = true;
      });

      return mockJsonResponse({
        success: true,
        metrics: {
          totalOrders,
          pendingOrders,
          paidOrders,
          verifiedRevenue,
          totalProducts: db.products.length,
          totalCustomers: Object.keys(uniqueCust).length,
          recentOrders: orders.slice(0, 5)
        }
      });
    }

    if (endpoint === '/api/admin/products') {
      if (method === 'POST') {
        const prod = body;
        const idx = db.products.findIndex(p => p.id === prod.id);
        if (idx >= 0) {
          db.products[idx] = { ...db.products[idx], ...prod };
        } else {
          prod.id = prod.id || `prod_${Date.now()}`;
          db.products.push(prod);
        }
        saveLocalDb(db);
        return mockJsonResponse({ success: true, product: prod });
      }
      return mockJsonResponse({ success: true, products: db.products });
    }

    if (endpoint === '/api/admin/orders') {
      return mockJsonResponse({ success: true, orders: db.orders });
    }

    if (endpoint.startsWith('/api/admin/orders/') && method === 'PATCH') {
      const orderId = endpoint.replace('/api/admin/orders/', '');
      const ord = db.orders.find(o => o.id === orderId);
      if (ord) {
        if (body.status) ord.status = body.status;
        if (body.payment_reference) ord.payment_reference = body.payment_reference;
        if (body.notes) ord.notes = body.notes;
        saveLocalDb(db);
        return mockJsonResponse({ success: true, order: ord });
      }
      return mockJsonResponse({ success: false, error: 'Pesanan tidak ditemukan.' }, 404);
    }

    if (endpoint === '/api/admin/customers') {
      const custMap = {};
      db.orders.forEach(o => {
        const key = o.customer_whatsapp || o.customer_email || 'Anonim';
        if (!custMap[key]) {
          custMap[key] = {
            name: o.customer_name || 'Pelanggan',
            whatsapp: o.customer_whatsapp || '-',
            email: o.customer_email || '-',
            orderCount: 1,
            totalSpent: (o.status === 'PAID' || o.status === 'COMPLETED') ? Number(o.amount || 0) : 0,
            lastOrder: o.created_at
          };
        } else {
          custMap[key].orderCount++;
          if (o.status === 'PAID' || o.status === 'COMPLETED') {
            custMap[key].totalSpent += Number(o.amount || 0);
          }
        }
      });
      return mockJsonResponse({ success: true, customers: Object.values(custMap) });
    }

    if (endpoint === '/api/admin/settings') {
      if (method === 'PUT' || method === 'POST') {
        db.settings = { ...db.settings, ...body };
        saveLocalDb(db);
        return mockJsonResponse({ success: true, settings: db.settings });
      }
      return mockJsonResponse({ success: true, settings: db.settings });
    }

    return mockJsonResponse({ success: false, error: 'Endpoint tidak ditemukan.' }, 404);
  }

  /**
   * Helper response tiruan kompatibel fetch()
   */
  function mockJsonResponse(data, status = 200) {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  /**
   * Generator Heuristik AI Tools Client-Side
   */
  function generateClientSideContent(toolType, inputs) {
    const {
      product_name = 'Produk Digital',
      niche = 'Affiliate',
      audience = 'Kreator Indonesia',
      benefit = 'Meningkatkan konversi'
    } = inputs;

    switch (toolType) {
      case 'affiliate_hooks':
        return {
          tool: 'Affiliate Hooks & Scroll-Stoppers',
          disclaimer: 'Formula hook dioptimalkan untuk engagement FYP TikTok/Reels.',
          data: {
            summary: `5 Hook Penahan Scroll untuk ${product_name} (${niche})`,
            items: [
              {
                type: 'Negative / Shock Hook',
                text: `Stop beli ${niche} kalau Anda masih pakai cara manual yang bikin pusing seharian!`,
                angle: 'Menyadarkan inefisiensi yang sering dianggap wajar.'
              },
              {
                type: 'Direct Benefit Hook',
                text: `Cara paling simpel dapetin ${benefit} cuma modal satu tools ini.`,
                angle: 'Menyoroti kemudahan dan hasil cepat tanpa basa-basi.'
              },
              {
                type: 'Secret / Curiosity Hook',
                text: `Banyak kreator pemula belum tahu: ada cara otomatis buat beresin ${product_name} dalam 5 menit.`,
                angle: 'Memicu rasa penasaran dan takut ketinggalan (FOMO).'
              },
              {
                type: 'Before vs After Hook',
                text: `Dulu saya butuh 3 jam cuma buat urus ini, sekarang tinggal klik langsung kelar.`,
                angle: 'Social proof berbasis transformasi pribadi nyata.'
              },
              {
                type: 'Question / Relatable Hook',
                text: `Siapa di sini yang capek banget tiap mau bikin ${niche} harus mikir dari nol lagi?`,
                angle: 'Membangun empati instan dengan audiens spesifik.'
              }
            ]
          }
        };

      case 'video_script':
        return {
          tool: 'Product Video Script (60 Detik)',
          disclaimer: 'Struktur PAS (Problem-Agitate-Solve) standar industri video promosi.',
          data: {
            summary: `Skrip Video Format PAS untuk ${product_name}`,
            timeline: [
              {
                segment: '00:00 - 00:03 (The Hook)',
                visual: 'Tatap kamera ekspresif atau perlihatkan layar HP dengan masalah nyata.',
                audio: `"Kalau Anda masih ngabisin berjam-jam cuma buat urusan ${niche}, dengerin ini sebentar."`
              },
              {
                segment: '00:04 - 00:15 (Agitasi Masalah)',
                visual: 'Kamera beralih ke close-up catatan manual atau tumpukan file kusut.',
                audio: `"Masalahnya, banyak yang mikir kerja keras itu harus ribet manual. Padahal waktu Anda jauh lebih berharga buat closingan."`
              },
              {
                segment: '00:16 - 00:40 (Solusi & Demonstrasi Produk)',
                visual: `Screen-record layar mendemonstrasikan ${product_name} digunakan dengan rapi dan cepat.`,
                audio: `"Makanya sekarang saya pakai ${product_name}. Fiturnya udah dirancang otomatis buat ${benefit}. Tinggal pakai, beres dalam hitungan menit."`
              },
              {
                segment: '00:41 - 00:60 (Call to Action)',
                visual: 'Tunjuk ke arah tombol keranjang kuning atau link WhatsApp bio.',
                audio: `"Daripada buang waktu coba-coba sendiri, langsung klik link di bawah atau bio sekarang sebelum promonya selesai!"`
              }
            ]
          }
        };

      case 'caption_cta':
        return {
          tool: 'Caption & CTA Generator',
          disclaimer: 'Format caption siap salin dengan hashtag terarah.',
          data: {
            summary: `Caption Konversi Tinggi untuk ${product_name}`,
            captions: [
              {
                theme: 'Hard Selling (Promo Mendesak)',
                content: `Kerja cerdas bukan kerja capek 💡\n\nBuat Anda yang mau ${benefit} tanpa repot mulai dari nol, ${product_name} ini solusinya.\n\n🔥 Khusus hari ini ada harga promo terbatas.\n👉 Klik link di bio atau komen "MAU" biar kami kirimkan aksesnya sekarang juga!\n\n#${niche.replace(/\s+/g, '')} #ProdukDigital #ArraDigital #BisnisOnline`
              },
              {
                theme: 'Soft Selling (Edukasi & Solusi)',
                content: `Sering ngerasa waktu 24 jam kurang cuma buat ngurusin ${niche}?\n\nTernyata kuncinya ada di sistem dan tools yang Anda pakai. Begitu pakai ${product_name}, alur kerja jadi jauh lebih rapi dan santai.\n\nInfo lengkap & cara pakai langsung cek link di bio ya! 🚀\n\n#TipsKreator #Produktivitas #ToolsAI`
              }
            ]
          }
        };

      case 'content_calendar':
        return {
          tool: '7-Day Content Calendar',
          disclaimer: 'Rencana jadwal posting 7 hari terstruktur.',
          data: {
            summary: `Kalender Konten 7 Hari untuk Niche ${niche}`,
            days: [
              { day: 'Hari 1 (Senin)', theme: 'Edukasi / Masalah', topic: `3 Kesalahan umum saat memulai ${niche}` },
              { day: 'Hari 2 (Selasa)', theme: 'Studi Kasus / Transformasi', topic: `Bagaimana ${benefit} dicapai dalam waktu singkat` },
              { day: 'Hari 3 (Rabu)', theme: 'Behind the Scenes', topic: `Proses saya menyiapkan ${product_name}` },
              { day: 'Hari 4 (Kamis)', theme: 'Tips Cepat / Hacks', topic: `1 Shortcut praktis yang jarang dibagikan orang lain` },
              { day: 'Hari 5 (Jumat)', theme: 'Social Proof / Q&A', topic: `Menjawab pertanyaan paling sering seputar ${niche}` },
              { day: 'Hari 6 (Sabtu)', theme: 'Promosi Langsung / CTA', topic: `Alasan mengapa Anda butuh ${product_name} sekarang` },
              { day: 'Hari 7 (Minggu)', theme: 'Inspirasi & Refleksi', topic: `Mindset membangun aset digital jangka panjang` }
            ]
          }
        };

      case 'website_brief':
        return {
          tool: 'Website & App Project Brief',
          disclaimer: 'Template brief spesifikasi proyek siap kirim ke developer.',
          data: {
            summary: `Brief Proyek Pembuatan Website / Aplikasi`,
            sections: [
              { title: 'Nama Brand & Target', detail: `${product_name} — Target audiens: ${audience}` },
              { title: 'Tujuan Utama Website', detail: `Meningkatkan konversi penjualan, memberikan kredibilitas, dan ${benefit}` },
              { title: 'Fitur Wajib', detail: 'Desain Responsif Mobile, Tombol Chat WhatsApp Instan, Katalog Produk, Form Inquiry Cepat' },
              { title: 'Target Peluncuran', detail: '7 - 14 Hari Kerja' }
            ]
          }
        };

      default:
        return {
          tool: 'Generator Konten AI',
          disclaimer: 'Hasil konten terstruktur.',
          data: { summary: `Konten untuk ${product_name}`, text: `Konten siap pakai untuk ${product_name} (${niche}).` }
        };
    }
  }

  /**
   * Database Lokal di Browser (LocalStorage)
   */
  function initLocalStorageDb() {
    if (!localStorage.getItem('arra_db_v2')) {
      const initialDb = {
        settings: {
          business_name: 'ARRA DIGITAL',
          tagline: 'Solusi Digital Cerdas untuk Bisnis dan Kreator Indonesia.',
          public_whatsapp: '6281317028494',
          public_contact_email: 'halo@arradigital.my.id',
          domain: 'arradigital.my.id',
          currency: 'IDR'
        },
        products: [
          {
            id: 'prod_01',
            slug: 'ai-affiliate-starter-kit',
            name: 'AI Affiliate Starter Kit',
            category: 'AI & Affiliate',
            price: 29000,
            short_description: 'Paket prompt AI, hook video, dan caption teruji konversi untuk affiliate marketer.',
            description: 'Koleksi siap pakai berisi 50+ Hook Video FYP, formula prompt ChatGPT & Claude untuk skrip 60 detik, dan 30 template caption call-to-action.',
            features: ['50+ Hook Video FYP Teruji', 'Formula Prompt Skrip 60 Detik', '30 Template Caption & CTA Konversi', 'Akses Dokumen Google Docs Seumur Hidup'],
            status: 'active',
            delivery_type: 'digital_download'
          },
          {
            id: 'prod_02',
            slug: 'template-notion-freelance-os',
            name: 'Template Notion: Freelance OS',
            category: 'Template Bisnis',
            price: 49000,
            short_description: 'Workspace Notion terpadu untuk mengelola proyek klien, invoice, dan keuangan freelancer.',
            description: 'Kelola alur kerja freelance Anda tanpa pusing. Dilengkapi pelacak status proyek, CRM klien sederhana, generator invoice otomatis, dan kalender deadline.',
            features: ['Dashboard Proyek & Timeline', 'CRM Klien & Kontak Penting', 'Kalkulator Tarif & Invoice Generator', 'Panduan Video Duplikasi Notion 5 Menit'],
            status: 'active',
            delivery_type: 'digital_download'
          },
          {
            id: 'prod_03',
            slug: 'spreadsheet-laundry-pos-gas',
            name: 'Spreadsheet Kasir Laundry + WhatsApp Bot (GAS)',
            category: 'Jasa Otomasi',
            price: 99000,
            short_description: 'Aplikasi POS kasir laundry berbasis Google Sheets dan Google Apps Script tanpa biaya langganan bulanan.',
            description: 'Catat nota laundry kiloan & satuan, cetak struk PDF, simpan database pelanggan, dan kirim notifikasi otomatis saat cucian selesai via WhatsApp.',
            features: ['Tanpa Biaya Bulanan / Server', 'Database Google Sheets Milik Anda 100%', 'Cetak Nota PDF Otomatis', 'Kirim Update Status via WhatsApp'],
            status: 'active',
            delivery_type: 'digital_download'
          },
          {
            id: 'prod_04',
            slug: 'jasa-landing-page-umkm',
            name: 'Jasa Pembuatan Landing Page UMKM',
            category: 'Website',
            price: 750000,
            short_description: 'Website 1 halaman profesional berkecepatan tinggi, responsif, dan terintegrasi tombol WhatsApp.',
            description: 'Didesain khusus untuk konversi penjualan UMKM dan profil usaha. Ringan, cepat dimuat, optimasi SEO dasar, dan gratis panduan kelola konten.',
            features: ['Desain Modern & Responsif HP/Desktop', 'Integrasi Tombol WhatsApp & Peta Lokasi', 'Selesai dalam 7 Hari Kerja', 'Gratis 1x Revisi & Panduan Penggunaan'],
            status: 'active',
            delivery_type: 'service_delivery'
          }
        ],
        orders: [
          {
            id: 'ARRA-20261014-001',
            created_at: new Date().toISOString(),
            product_id: 'prod_01',
            product_name: 'AI Affiliate Starter Kit',
            amount: 29000,
            customer_name: 'Budi Santoso',
            customer_whatsapp: '6281234567890',
            customer_email: 'budi@example.com',
            status: 'PAID',
            payment_reference: 'BCA-847291',
            notes: 'Pembayaran sudah diverifikasi'
          },
          {
            id: 'ARRA-20261014-002',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            product_id: 'prod_04',
            product_name: 'Jasa Pembuatan Landing Page UMKM',
            amount: 750000,
            customer_name: 'Siti Rahma',
            customer_whatsapp: '6285712345678',
            customer_email: 'siti@example.com',
            status: 'PENDING',
            payment_reference: '-',
            notes: 'Menunggu transfer DP 50%'
          }
        ],
        articles: [
          {
            slug: 'cara-membuat-hook-video-fyp',
            title: 'Cara Membuat Hook Video FYP dalam 3 Detik Pertama dengan Bantuan AI',
            category: 'Tutorial AI',
            excerpt: 'Panduan praktis merancang hook video TikTok dan Reels yang memikat perhatian penonton menggunakan formula psikologi dan prompt AI.',
            content: 'Dalam dunia media sosial yang bergerak cepat, 3 detik pertama menentukan apakah audiens akan menonton konten Anda atau melakukan swipe. Untuk membuat hook yang kuat, Anda bisa memanfaatkan formula pertanyaan mengejutkan, pernyataan kontroversial yang relevan, atau langsung menampilkan hasil akhir...',
            read_time: '4 menit',
            published_at: '2026-10-10'
          },
          {
            slug: 'otomasi-google-sheets-apps-script-umkm',
            title: 'Mengapa UMKM Harus Mulai Menggunakan Google Apps Script untuk Otomasi Bisnis',
            category: 'Otomasi Bisnis',
            excerpt: 'Hemat jutaan rupiah biaya software bulanan dengan memanfaatkan kekuatan otomasi Google Sheets dan Apps Script gratis.',
            content: 'Banyak pemilik usaha kecil merasa bahwa otomatisasi sistem membutuhkan software ERP mahal. Padahal dengan Google Apps Script, Anda bisa membuat bot WhatsApp otomatis, cetak invoice PDF otomatis dari form input, dan menyusun rekap keuangan berkala tanpa biaya server bulanan sepeser pun...',
            read_time: '5 menit',
            published_at: '2026-10-12'
          }
        ]
      };
      saveLocalDb(initialDb);
    }
  }

  function getLocalDb() {
    try {
      return JSON.parse(localStorage.getItem('arra_db_v2'));
    } catch (e) {
      return {};
    }
  }

  function saveLocalDb(db) {
    localStorage.setItem('arra_db_v2', JSON.stringify(db));
  }
})();
