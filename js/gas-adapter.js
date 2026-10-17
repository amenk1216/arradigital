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

    // 1. GENERATOR AI TOOLS (Berjalan fleksibel: Server Backend jika aktif, atau Client-Side Gemini / Nalar Heuristik)
    if (endpoint === '/api/tools/generate') {
      try {
        const serverRes = await originalFetch(endpoint, init);
        if (serverRes.ok) {
          const json = await serverRes.json();
          return mockJsonResponse(json);
        }
      } catch (e) {
        // Fallback ke pemrosesan client-side jika server offline/static
      }

      const toolType = body.toolType;
      const inputs = body.inputs || {};
      const geminiKey = inputs.apiKey || inputs.user_gemini_key || localStorage.getItem('arra_gemini_api_key') || '';

      if (geminiKey) {
        try {
          const geminiResult = await executeClientGeminiApi(geminiKey, toolType, inputs);
          return mockJsonResponse({ success: true, result: geminiResult });
        } catch (geminiErr) {
          console.warn('Client Gemini call failed, falling back to smart local heuristic:', geminiErr);
        }
      }

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

    if (endpoint === '/api/admin/upload' && method === 'POST') {
      const dataUrl = body.image || body.data;
      return mockJsonResponse({
        success: true,
        message: 'Gambar produk berhasil diunggah (Adapter Mode).',
        url: dataUrl,
        filename: body.filename || 'uploaded-product.webp'
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
   * Eksekutor Client-Side Gemini API (Jika berjalan statis di Vercel / GitHub Pages)
   */
  async function executeClientGeminiApi(apiKey, toolType, inputs) {
    const fallback = generateClientSideContent(toolType, inputs);
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError = null;

    const {
      product_name = 'Produk Digital',
      niche = 'Affiliate',
      audience = 'Kreator Indonesia',
      benefit = 'Meningkatkan konversi',
      tone = 'viral_casual',
      custom_instruction = ''
    } = inputs;

    const prompt = `
PERAN ANDA:
Anda adalah Chief Creative Strategist & Master Direct-Response Copywriter Indonesia kelas dunia. Anda sangat memahami psikologi konsumen lokal, perilaku scrolling media sosial (TikTok, Reels, IG), dan cara menyusun pesan yang persuasif tanpa terkesan kaku atau seperti terjemahan robot.

TUGAS ANDA:
Hasilkan konten kreatif mendalam untuk tools: "${toolType}"
Data Input:
- Produk: "${product_name}"
- Niche: "${niche}"
- Target Audiens: "${audience}"
- Manfaat: "${benefit}"
- Gaya Bahasa: "${tone}"
${custom_instruction ? `- Instruksi Khusus: "${custom_instruction}"` : ''}

PRINSIP WAJIB:
1. TIDAK KAKU: Gunakan bahasa Indonesia percakapan yang mengalir, alami, hidup, dan relevan dengan audiens Indonesia.
2. NALAR AI JALAN: Sertakan analisis psikologi audiens target dan nalar strategi di balik setiap materi.
3. KELUARKAN FORMAT JSON MURNI sesuai template dasar:
${JSON.stringify(fallback.data, null, 2)}
`.trim();

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await originalFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Model ${model} HTTP ${response.status}: ${errText}`);
        }

        const json = await response.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Respons kosong');

        const cleanJson = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();

        const parsed = JSON.parse(cleanJson);
        return {
          source: 'gemini_api',
          model: model,
          data: parsed,
          disclaimer: `Dihasilkan langsung via Google Gemini (${model}) dengan nalar strategi pemasaran adaptif.`
        };
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Gagal memanggil model Gemini');
  }

  /**
   * Generator Heuristik AI Tools Client-Side (Dengan Nalar Strategis Mendalam)
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
          source: 'local_engine',
          disclaimer: 'Dihasilkan oleh mesin heuristik strategi pemasaran Arra Digital. Hubungkan kunci API Gemini untuk variasi tanpa batas.',
          data: {
            summary: `5 Hook Penahan Scroll Berbasis Nalar Psikologi untuk ${product_name} (${niche})`,
            ai_reasoning: {
              audience_psychology: `Target audiens (${audience}) scrolling dengan cepat dan kebal terhadap promosi klise. Kunci penahan scroll adalah "Pattern Interrupt" (kebalikan ekspektasi) dan empati pada rasa lelah mereka.`,
              strategic_angle: `Menyoroti efisiensi waktu dan hasil nyata agar audiens merasa rugi jika tidak menonton video sampai selesai.`,
              conversion_trigger: `FOMO (takut ketinggalan trik praktis) dan rasa lega karena menemukan solusi instan.`,
              director_notes: `Gunakan jeda 0.5 detik di pembuka kalimat, tatap langsung lensa kamera, dan tampilkan ekspresi penasaran pada 3 detik pertama.`
            },
            items: [
              {
                type: 'Negative Pattern Interrupt (Shock Value)',
                text: `Tolong jangan beli ${product_name} dulu kalau Anda belum siap alur kerja yang biasanya seharian tiba-tiba beres cuma 10 menit!`,
                angle: 'Membalik ekspektasi peringatan menjadi bukti keunggulan instan.',
                psychology: 'Rasa penasaran alami terhadap larangan (Reverse Psychology).'
              },
              {
                type: 'Relatable Pain Point (Validasi Masalah)',
                text: `Capek nggak sih tiap hari mau bikin konten ${niche} tapi setengah hari habis cuma buat mikir ide dari nol?`,
                angle: 'Menyentuh titik lelah terdalam audiens secara jujur dan bersahabat.',
                psychology: 'Membangun empati instan tanpa menghakimi penonton.'
              },
              {
                type: 'Secret Shortcut (FOMO & Rasa Penasaran)',
                text: `Bocoran rahasia yang jarang dibongkar affiliate senior: ada 1 formula simpel buat bikin ${benefit} tanpa modal ribet.`,
                angle: 'Menawarkan keunggulan kompetitif eksklusif yang memicu rasa ingin tahu.',
                psychology: 'Takut ketinggalan rahasia yang sudah diketahui orang lain.'
              },
              {
                type: 'Before vs After (Transformasi Nyata)',
                text: `Dulu saya butuh berjam-jam berkutat di depan laptop sampai pusing. Semenjak pakai ${product_name}, semua otomatis rapi tinggal sekali klik.`,
                angle: 'Social proof berbasis transformasi pengalaman personal nyata.',
                psychology: 'Memberikan harapan konkret bahwa masalah mereka ada jalan keluarnya.'
              },
              {
                type: 'Direct High-Value Benefit (Solusi To the Point)',
                text: `Kalau Anda lagi cari cara paling realistis buat ${benefit}, video ini nggak boleh Anda skip.`,
                angle: 'Penawaran langsung tanpa basa-basi untuk audiens yang butuh solusi cepat.',
                psychology: 'Daya tarik manfaat langsung (What Is In It For Me).'
              }
            ]
          }
        };

      case 'video_script':
        return {
          tool: 'Product Video Script (60 Detik)',
          source: 'local_engine',
          disclaimer: 'Struktur PAS (Problem-Agitate-Solve) standar industri video promosi.',
          data: {
            summary: `Skrip Video Format PAS untuk ${product_name}`,
            ai_reasoning: {
              audience_psychology: `Dalam 3 detik pertama otak penonton memutuskan apakah konten ini bernilai. Skrip dibuka dengan hook tajam, diikuti agitasi masalah, demonstrasi solusi, dan CTA yang mempermudah tindakan.`,
              strategic_angle: `Menghindari gaya jualan kaku; mengedepankan percakapan teman sejawat yang membagikan shortcut ampuh.`,
              conversion_trigger: `Mengurangi persepsi resiko dengan solusi yang siap pakai dan terbukti.`,
              director_notes: `Ganti sudut kamera atau lakukan zoom cut setiap 4-6 detik agar ritme visual tetap dinamis.`
            },
            timeline: [
              {
                segment: '00:00 - 00:03 (The Hook)',
                visual: 'Tatap kamera ekspresif atau perlihatkan layar kerja dengan masalah nyata.',
                audio: `"Kalau Anda masih ngabisin berjam-jam cuma buat urusan ${niche}, dengerin ini sebentar sebelum Anda nyesel buang waktu."`,
                on_screen_text: '⚠️ Stop Bikin Konten Manual Yang Bikin Boncos Waktu!'
              },
              {
                segment: '00:04 - 00:15 (Agitasi Masalah & Empati)',
                visual: 'Kamera beralih ke close-up catatan manual atau tumpukan file kusut.',
                audio: `"Masalahnya, banyak yang mikir kerja keras itu harus ribet manual. Padahal waktu Anda jauh lebih berharga buat mikirin strategi dan closingan."`,
                on_screen_text: 'Kerja keras ≠ Harus repot manual seharian'
              },
              {
                segment: '00:16 - 00:42 (Solusi & Demonstrasi Produk Nyata)',
                visual: `Screen-record layar mendemonstrasikan ${product_name} digunakan dengan rapi dan cepat.`,
                audio: `"Makanya sekarang saya pakai ${product_name}. Fiturnya udah dirancang otomatis buat ${benefit}. Formatnya siap pakai dan langsung bisa Anda gunakan hari ini."`,
                on_screen_text: `Solusi Cerdas: ${product_name} ✨`
              },
              {
                segment: '00:43 - 00:60 (Call to Action Berurgensi Jelas)',
                visual: 'Tunjuk ke arah tombol keranjang kuning atau link WhatsApp bio sambil tersenyum ramah.',
                audio: `"Daripada buang waktu coba-coba sendiri dari nol, langsung amankan aksesnya sekarang di link bio atau keranjang bawah sebelum promonya ditutup!"`,
                on_screen_text: '👉 Amankan Akses & Bonus di Bio Sekarang!'
              }
            ]
          }
        };

      case 'caption_cta':
        return {
          tool: 'Caption & CTA Generator',
          source: 'local_engine',
          disclaimer: 'Format caption siap salin dengan hashtag terarah.',
          data: {
            summary: `Caption Konversi Tinggi untuk ${product_name}`,
            ai_reasoning: {
              audience_psychology: `Caption media sosial dibaca cepat dengan pola skimming. Format bullet point dan variasi CTA membuat pesan mudah dicerna dan ditindaklanjuti.`,
              strategic_angle: `Menghilangkan persepsi bahwa perubahan itu sulit; memposisikan produk sebagai jalan pintas berfaedah.`,
              conversion_trigger: `Urgensi batas waktu promo yang masuk akal dan social validation.`
            },
            caption: `Masih sering ngerasa waktu 24 jam kurang cuma gara-gara urusan ${niche} yang ribet?\n\nKabar baiknya: bukan Anda yang kurang pintar, tapi sistem yang Anda pakai belum otomatis.\n\nKenalin ${product_name}—solusi cerdas yang dirancang khusus buat Anda yang mau ${benefit} tanpa perlu pusing setup dari nol lagi.\n\n✨ Kenapa ini wajib Anda miliki:\n• Langsung bisa dipakai hari ini tanpa butuh keahlian teknis ribet\n• Dilengkapi panduan langkah demi langkah bahasa Indonesia yang runtut\n• Teruji menghemat waktu kerja hingga 70% lebih cepat\n• Dirancang spesifik untuk kebutuhan ${audience}\n\nInvestasi kecil untuk hasil yang berkali-kali lipat lebih tenang dan teratur.`,
            hashtags: `#${niche.replace(/[^a-zA-Z0-9]/g, '')} #ProdukDigital #${product_name.replace(/[^a-zA-Z0-9]/g, '')} #TipsKreator #SolusiBisnis #ArraDigital #KerjaCerdas`,
            cta_variations: [
              '🔥 Opsi Urgent: "Harga promo khusus batch ini segera berakhir. Klik link di bio profil sekarang sebelum harga normal kembali!"',
              '💬 Opsi Soft/Interaktif: "Ketik kata \"MAU\" di kolom komentar, nanti tim kami kirimkan tautan akses lengkapnya langsung ke DM Anda!"',
              '📌 Opsi Edukasi/Simpan: "Simpan (Bookmark) postingan ini sekarang juga, biar gampang Anda cari pas lagi butuh nanti!"'
            ]
          }
        };

      case 'content_calendar':
        return {
          tool: '7-Day Content Calendar',
          source: 'local_engine',
          disclaimer: 'Rencana jadwal posting 7 hari terstruktur.',
          data: {
            summary: `Kalender Konten 7 Hari untuk Niche ${niche}`,
            ai_reasoning: {
              audience_psychology: `Pola 80% Value (Edukasi, Relatable, Studi Kasus) dan 20% Direct Conversion membangun kepercayaan sebelum mengajak membeli.`,
              strategic_angle: `Funnel 7 hari: Awareness (Senin-Selasa), Consideration (Rabu-Kamis), Conversion (Jumat-Minggu).`
            },
            schedule: [
              { day: 'Hari 1 (Senin)', theme: 'Edukasi / Mindset', format: 'Carousel Infografis', topic: `3 Kesalahan fatal saat memulai ${niche}`, cta: 'Simpan postingan ini untuk checklist Anda' },
              { day: 'Hari 2 (Selasa)', theme: 'Problem & Agitasi Empatik', format: 'Short Video (Reels/TikTok)', topic: 'Kenapa cara lama bikin Anda rugi waktu', cta: 'Tulis di komentar kendala terbesar Anda' },
              { day: 'Hari 3 (Rabu)', theme: 'Tutorial Singkat & Shortcut', format: 'Screen Recording', topic: `Cara dapat ${benefit} dalam 3 langkah mudah`, cta: 'Share ke teman seperjuangan Anda' },
              { day: 'Hari 4 (Kamis)', theme: 'Studi Kasus & Transformasi', format: 'Storytelling Post', topic: 'Hasil nyata sebelum dan sesudah pakai sistem otomatis', cta: 'Cek link di bio untuk detail metodenya' },
              { day: 'Hari 5 (Jumat)', theme: 'Produk Showcase', format: 'Video Demo Singkat', topic: `Review fitur favorit di ${product_name}`, cta: 'Ketik "INFO" untuk akses preview' },
              { day: 'Hari 6 (Sabtu)', theme: 'Q&A & Pembongkaran Keraguan', format: 'Story Q&A', topic: 'Menjawab pertanyaan paling sering seputar produk', cta: 'Konsultasi gratis via WhatsApp resmi' },
              { day: 'Hari 7 (Minggu)', theme: 'Promosi Langsung & Urgensi', format: 'Direct Video CTA', topic: 'Pengingat penawaran harga promo minggu ini', cta: 'Amankan kuota promo di bio sekarang' }
            ]
          }
        };

      case 'website_brief':
        return {
          tool: 'Website & App Project Brief',
          source: 'local_engine',
          disclaimer: 'Template brief spesifikasi proyek siap kirim ke developer.',
          data: {
            summary: `Brief Proyek Pembuatan Website / Aplikasi`,
            ai_reasoning: {
              audience_psychology: `Pengunjung memutuskan lanjut atau keluar dalam 5 detik. Struktur website harus memandu mata dari masalah utama ke WhatsApp.`,
              strategic_angle: `Kecepatan ultra-ringan dengan desain modern dark tech elegan.`
            },
            project_overview: {
              client_niche: niche,
              target_audience: audience,
              primary_goal: `Meningkatkan konversi penjualan ${product_name} dan menangkap leads WhatsApp.`
            },
            recommended_structure: [
              'Sticky Header dengan tombol aksi WhatsApp cepat',
              'Hero Section dengan Value Proposition jelas dan bukti sosial',
              'Katalog / Showcase Produk dengan harga transparan',
              'Kenapa Memilih Kami (Benefit dibanding kompetitor)',
              'Alur Pemesanan 3 Langkah Praktis',
              'FAQ seputar produk dan garansi',
              'Footer lengkap dengan link legal & kontak resmi'
            ],
            tech_recommendation: 'Static HTML5 + CSS Modern (Biaya hosting Rp 0/bulan, Skor PageSpeed 95+).'
          }
        };

      default:
        return {
          tool: 'Generator Konten AI',
          source: 'local_engine',
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
            image_url: '/assets/products/ai-affiliate-starter-kit.jpg',
            short_description: 'Paket formula prompt AI, 50+ hook video FYP penahan scroll, caption konversi, dan panduan praktis monetisasi affiliate.',
            description: 'Koleksi siap pakai berisi 50+ Hook Video FYP, formula prompt ChatGPT & Claude untuk skrip 60 detik, 30 template caption call-to-action, dan spreadsheet jadwal konten.',
            features: ['50+ Hook Video FYP Teruji', 'Formula Prompt Skrip 60 Detik', '30 Template Caption & CTA Konversi', 'Akses Dokumen Google Docs Seumur Hidup'],
            status: 'active',
            delivery_type: 'digital_download'
          },
          {
            id: 'prod_02',
            slug: 'business-template-pack',
            name: 'Business Template Pack & Financial OS',
            category: 'Template Bisnis',
            price: 39000,
            image_url: '/assets/products/business-template-pack.jpg',
            short_description: 'Koleksi Google Sheets otomatis: sales tracker harian, kalkulator profit bersih, database CRM, dan kalender konten bisnis.',
            description: 'Paket komprehensif template operasional bisnis berbasis Google Sheets cerdas. Otomatisasi perhitungan laba rugi, pemantauan stok barang, pencatatan leads pelanggan WhatsApp.',
            features: ['Google Sheets Sales Tracker Otomatis', 'Kalkulator Profit Bersih & Margin Usaha', 'CRM Sederhana Pencatatan Leads', 'Kalender Konten Siap Pakai'],
            status: 'active',
            delivery_type: 'digital_download'
          },
          {
            id: 'prod_03',
            slug: 'website-starter-kit',
            name: 'Website Starter Kit & Landing Page Template',
            category: 'Website',
            price: 99000,
            image_url: '/assets/products/website-starter-kit.jpg',
            short_description: 'Template landing page modern, responsive, ultra-cepat (skor 100), siap pasang dengan formulir WhatsApp dan panduan kustomisasi.',
            description: 'Source code landing page siap pakai dengan standar modern web development: HTML5 semantik, CSS murni tanpa bloatware, dan JavaScript responsif yang sangat ringan.',
            features: ['Source Code Lengkap HTML5, CSS3, & JS', 'Skor Kecepatan PageSpeed 95-100', 'Tombol WhatsApp Otomatis', 'Panduan Setup & Domain Kustom'],
            status: 'active',
            delivery_type: 'digital_download'
          },
          {
            id: 'prod_04',
            slug: 'jasa-pembuatan-website',
            name: 'Jasa Pembuatan Website Kustom',
            category: 'Jasa Website',
            price: 750000,
            image_url: '/assets/products/jasa-pembuatan-website.svg',
            short_description: 'Layanan pengerjaan website profesional dari landing page konversi hingga company profile lengkap, cepat, dan ramah SEO.',
            description: 'Didesain khusus untuk konversi penjualan UMKM dan profil usaha. Ringan, cepat dimuat, optimasi SEO dasar, gratis domain & hosting setup.',
            features: ['Desain Kustom Responsif HP/Desktop', 'Integrasi Tombol WhatsApp & Analytics', 'Selesai dalam 7 Hari Kerja', 'Garansi Revisi & Pendampingan'],
            status: 'active',
            delivery_type: 'service_delivery'
          },
          {
            id: 'prod_05',
            slug: 'jasa-otomasi-google-apps-script',
            name: 'Jasa Otomasi Google Apps Script & Workflow',
            category: 'Jasa Otomasi',
            price: 0,
            image_url: '/assets/products/jasa-otomasi-google-apps-script.svg',
            short_description: 'Digitalisasi alur kerja spreadsheet, bot notifikasi WhatsApp/Telegram, laporan otomatis, dan web app internal tanpa biaya server.',
            description: 'Solusi otomasi alur bisnis menggunakan Google Apps Script, Google Sheets, Forms, dan Gmail. Kurangi pekerjaan manual dengan integrasi otomatis tanpa biaya server bulanan.',
            features: ['Otomasi Google Sheets, Docs, & Gmail', 'Pembuatan Nota / Invoice Digital Otomatis ke PDF', 'Notifikasi WhatsApp Real-Time', 'Dokumentasi & Video Pelatihan Tim'],
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
    } else {
      // Backfill & migrasi otomatis: pastikan seluruh produk di LocalStorage memiliki image_url
      try {
        const db = JSON.parse(localStorage.getItem('arra_db_v2'));
        const DEFAULT_IMAGES = {
          'ai-affiliate-starter-kit': '/assets/products/ai-affiliate-starter-kit.jpg',
          'business-template-pack': '/assets/products/business-template-pack.jpg',
          'website-starter-kit': '/assets/products/website-starter-kit.jpg',
          'jasa-pembuatan-website': '/assets/products/jasa-pembuatan-website.svg',
          'jasa-otomasi-google-apps-script': '/assets/products/jasa-otomasi-google-apps-script.svg',
          'spreadsheet-laundry-pos-gas': '/assets/products/spreadsheet-laundry-pos-gas.svg',
          'template-notion-freelance-os': '/assets/products/template-notion-freelance-os.svg'
        };

        let updated = false;
        if (db && Array.isArray(db.products)) {
          db.products.forEach(p => {
            if (!p.image_url || p.image_url.trim() === '') {
              p.image_url = DEFAULT_IMAGES[p.slug] || '/assets/products/website-starter-kit.jpg';
              updated = true;
            }
          });
        }
        if (updated) {
          saveLocalDb(db);
        }
      } catch (migErr) {
        // Abaikan jika parsing gagal
      }
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
