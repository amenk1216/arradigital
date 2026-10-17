/**
 * ARRA DIGITAL - Main Application & SPA Router (js/app.js)
 * Clean, lightweight, zero-dependency, handles 13 routes, database API integration,
 * interactive AI tools, safe order workflow, and protected admin suite.
 */

// Global State
const STATE = {
  settings: {
    business_name: 'ARRA DIGITAL',
    tagline: 'Solusi Digital Cerdas untuk Bisnis dan Kreator Indonesia.',
    public_whatsapp: '6281317028494',
    public_contact_email: 'halo@arradigital.my.id',
    domain: 'arradigital.my.id',
    currency: 'IDR'
  },
  products: [],
  categories: ['Semua'],
  activeCategory: 'Semua',
  searchQuery: '',
  adminToken: localStorage.getItem('arra_admin_token') || null,
  adminUser: null,
  activeAdminTab: 'dashboard',
  selectedTool: 'affiliate_hooks',
  articles: []
};

// ============================================================================
// 1. ROUTING & NAVIGATION
// ============================================================================
const ROUTES = {
  '/': renderHomeView,
  '/produk': renderCatalogView,
  '/tools': renderToolsView,
  '/website': renderWebsiteServiceView,
  '/automation': renderAutomationServiceView,
  '/tutorial': renderTutorialListView,
  '/tentang': renderAboutView,
  '/kontak': renderContactView,
  '/kebijakan-privasi': renderPrivacyPolicyView,
  '/ketentuan': renderTermsView,
  '/refund': renderRefundView,
  '/admin': renderAdminView
};

function navigateTo(path, addToHistory = true) {
  if (addToHistory) {
    window.history.pushState({}, '', path);
  }
  handleRoute();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('popstate', () => {
  handleRoute();
});

function handleRoute() {
  const path = window.location.pathname;

  const mobilePanel = document.getElementById('mobile-nav-panel');
  if (mobilePanel) mobilePanel.classList.remove('open');

  document.querySelectorAll('[data-route]').forEach(link => {
    const route = link.getAttribute('data-route');
    if (route === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  if (path.startsWith('/produk/') && path.length > 8) {
    const slug = path.replace('/produk/', '');
    renderProductDetailView(slug);
    return;
  }

  if (path.startsWith('/tutorial/') && path.length > 10) {
    const slug = path.replace('/tutorial/', '');
    renderTutorialDetailView(slug);
    return;
  }

  const handler = ROUTES[path] || ROUTES['/'];
  handler();
}

// ============================================================================
// 2. DATA FETCHING (API INTEGRATION)
// ============================================================================
async function fetchInitialData() {
  try {
    const settingsRes = await fetch('/api/settings');
    const settingsData = await settingsRes.json();
    if (settingsData.success) {
      STATE.settings = { ...STATE.settings, ...settingsData.settings };
      updateGlobalBranding();
    }

    const productsRes = await fetch('/api/products');
    const productsData = await productsRes.json();
    if (productsData.success) {
      STATE.products = productsData.products;
      const cats = new Set(['Semua']);
      STATE.products.forEach(p => { if (p.category) cats.add(p.category); });
      STATE.categories = Array.from(cats);
    }

    const articlesRes = await fetch('/api/content');
    const articlesData = await articlesRes.json();
    if (articlesData.success) {
      STATE.articles = articlesData.articles;
    }
  } catch (err) {
    console.warn('Gagal memuat data API:', err);
  }
}

function updateGlobalBranding() {
  const brandNames = document.querySelectorAll('.bind-business-name');
  brandNames.forEach(el => el.textContent = STATE.settings.business_name);

  const taglines = document.querySelectorAll('.bind-tagline');
  taglines.forEach(el => el.textContent = STATE.settings.tagline);

  const emails = document.querySelectorAll('.bind-email');
  emails.forEach(el => {
    el.textContent = STATE.settings.public_contact_email;
    if (el.tagName === 'A') el.href = `mailto:${STATE.settings.public_contact_email}`;
  });

  const waNumber = STATE.settings.public_whatsapp || '6281317028494';
  const floatingWa = document.getElementById('floating-wa-btn');
  if (floatingWa) {
    const defaultMsg = `Halo ${STATE.settings.business_name}, saya ingin konsultasi.`;
    floatingWa.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMsg)}`;
  }
}

function formatIDR(amount) {
  if (!amount || amount === 0) return 'Hubungi Kami';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

// ============================================================================
// 3. VIEW RENDERERS
// ============================================================================

function renderHomeView() {
  document.title = `ARRA DIGITAL | Solusi Digital Cerdas & Tools AI Indonesia`;
  const app = document.getElementById('app-main');

  const featured = STATE.products.slice(0, 3);
  const featuredHtml = featured.map(renderProductCardHtml).join('');

  app.innerHTML = `
    <section class="section hero">
      <div class="hero-ambient-glow"></div>
      <div class="container hero-content animate-fade-in" style="position: relative; z-index: 1;">
        <div class="hero-badge animate-float">
          <span class="badge-pill badge-blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Solusi Digital Cerdas Indonesia
          </span>
        </div>
        <h1>Kembangkan Bisnismu dengan <span class="gradient-text gradient-text-animated">Kekuatan AI.</span></h1>
        <p class="hero-subtitle">
          Temukan produk digital, tools AI, website, dan solusi otomatisasi yang membantu pekerjaan menjadi lebih praktis.
        </p>
        <div class="hero-cta-group">
          <a href="/produk" data-route="/produk" class="btn btn-primary btn-lg">
            Jelajahi Produk
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="/kontak" data-route="/kontak" class="btn btn-secondary btn-lg">
            Konsultasi Gratis
          </a>
        </div>
        <div class="hero-trust-bar">
          <div class="trust-item">
            <span class="trust-icon">✓</span> 100% Produk Legal &amp; Teruji
          </div>
          <div class="trust-item">
            <span class="trust-icon">✓</span> Panduan Lengkap Bahasa Indonesia
          </div>
          <div class="trust-item">
            <span class="trust-icon">✓</span> Verifikasi &amp; Konsultasi WhatsApp Cepat
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Produk Digital Unggulan</h2>
          <p>Koleksi template prompt AI, spreadsheet bisnis, dan aset digital siap pakai untuk mendongkrak omzet.</p>
        </div>
        <div class="grid-3">
          ${featuredHtml || '<p class="text-center text-muted">Memuat produk...</p>'}
        </div>
        <div style="text-align: center; margin-top: 40px;">
          <a href="/produk" data-route="/produk" class="btn btn-secondary">
            Lihat Semua Produk Digital (${STATE.products.length}) &rarr;
          </a>
        </div>
      </div>
    </section>

    <section class="section section-secondary">
      <div class="container">
        <div class="section-header">
          <h2>Layanan Solusi Digital Terpadu</h2>
          <p>Membantu pelaku usaha dan kreator beralih ke cara kerja modern tanpa kerumitan teknis.</p>
        </div>
        <div class="grid-4">
          <article class="card service-card">
            <div class="service-icon-box">⚡</div>
            <h3>AI &amp; Konten Affiliate</h3>
            <p>Formula prompt AI, hook penahan scroll video FYP, dan generator skrip untuk mempermudah penjualan produk affiliate.</p>
            <div style="margin-top: 16px;">
              <a href="/tools" data-route="/tools" class="text-blue" style="font-weight: 600; font-size: 0.9rem;">Coba Tools AI &rarr;</a>
            </div>
          </article>

          <article class="card service-card">
            <div class="service-icon-box">🌐</div>
            <h3>Jasa Pembuatan Website</h3>
            <p>Landing page berkonversi tinggi dan company profile modern. Cepat dimuat, ramah mobile, dan hemat biaya hosting.</p>
            <div style="margin-top: 16px;">
              <a href="/website" data-route="/website" class="text-blue" style="font-weight: 600; font-size: 0.9rem;">Lihat Paket Web &rarr;</a>
            </div>
          </article>

          <article class="card service-card">
            <div class="service-icon-box">⚙️</div>
            <h3>Otomasi Google Apps Script</h3>
            <p>Digitalisasi alur spreadsheet, rekap transaksi otomatis, pembuatan PDF nota, dan bot notifikasi WhatsApp tanpa biaya server.</p>
            <div style="margin-top: 16px;">
              <a href="/automation" data-route="/automation" class="text-blue" style="font-weight: 600; font-size: 0.9rem;">Eksplorasi Otomasi &rarr;</a>
            </div>
          </article>

          <article class="card service-card">
            <div class="service-icon-box">📑</div>
            <h3>Template &amp; Asset Pack</h3>
            <p>Spreadsheet operasional, template sales tracker, dan materi panduan praktis siap pakai langsung ke akun Google Anda.</p>
            <div style="margin-top: 16px;">
              <a href="/produk" data-route="/produk" class="text-blue" style="font-weight: 600; font-size: 0.9rem;">Buka Katalog &rarr;</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Mengapa Memilih Arra Digital?</h2>
          <p>Prinsip kerja kami didasari pada kejujuran, kepraktisan, dan efisiensi biaya nyata bagi bisnis Anda.</p>
        </div>
        <div class="grid-3">
          <div class="card">
            <h3 style="margin-bottom: 12px; font-size: 1.2rem;">🎯 Hasil Nyata &amp; Konversi</h3>
            <p class="text-secondary">Kami fokus pada solusi yang langsung berdampak pada produktivitas dan alur penjualan Anda, bukan sekadar tampilan rumit yang sulit dioperasikan.</p>
          </div>
          <div class="card">
            <h3 style="margin-bottom: 12px; font-size: 1.2rem;">💰 Tanpa Biaya Bulanan Berat</h3>
            <p class="text-secondary">Kami memprioritaskan arsitektur hemat biaya seperti hosting statis gratis (Cloudflare/GitHub) dan Google Workspace gratis agar Anda bebas biaya langganan software mahal.</p>
          </div>
          <div class="card">
            <h3 style="margin-bottom: 12px; font-size: 1.2rem;">🤝 Pendampingan Bahasa Indonesia</h3>
            <p class="text-secondary">Setiap produk dan layanan dilengkapi panduan langkah demi langkah berbahasa Indonesia yang mudah dimengerti, plus dukungan konsultasi ramah.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-secondary">
      <div class="container">
        <div class="section-header">
          <h2>Pusat Edukasi &amp; Tutorial</h2>
          <p>Tingkatkan wawasan seputar pemanfaatan AI, website konversi, dan otomatisasi bisnis sehari-hari.</p>
        </div>
        <div class="grid-3">
          ${STATE.articles.map(a => `
            <article class="card">
              <span class="badge-pill badge-purple" style="margin-bottom: 12px;">${a.category}</span>
              <h3 style="font-size: 1.15rem; margin-bottom: 10px;">${a.title}</h3>
              <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 16px;">${a.excerpt}...</p>
              <a href="/tutorial/${a.slug}" data-route="/tutorial/${a.slug}" class="text-blue" style="font-weight: 600; font-size: 0.88rem;">Baca Selengkapnya &rarr;</a>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Pertanyaan yang Sering Diajukan</h2>
          <p>Jawaban transparan seputar alur pemesanan, produk sampel, dan pengerjaan jasa.</p>
        </div>
        <div class="faq-list">
          <div class="faq-item">
            <div class="faq-summary" onclick="toggleFaq(this)">
              <span>Bagaimana cara membeli dan mendapatkan produk digital?</span>
              <span>+</span>
            </div>
            <div class="faq-content">
              Cukup pilih produk, isi formulir pemesanan singkat, dan klik tombol WhatsApp. Anda akan menerima ID pesanan unik resmi (misal ARRA-20261014-XXXX). Tim kami akan mengonfirmasi pembayaran dan mengirimkan akses tautan produk langsung ke kontak Anda.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-summary" onclick="toggleFaq(this)">
              <span>Apakah produk yang berlabel "Sampel Demo" bisa dicoba?</span>
              <span>+</span>
            </div>
            <div class="faq-content">
              Label "Sampel Demo" menandakan produk awal yang disediakan sebagai percontohan spesifikasi dan alur pemesanan teruji. Anda dapat memesan untuk memverifikasi proses serah terima atau berkonsultasi untuk kustomisasi materi sesuai kebutuhan unik Anda.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-summary" onclick="toggleFaq(this)">
              <span>Berapa lama pengerjaan jasa website atau otomatisasi?</span>
              <span>+</span>
            </div>
            <div class="faq-content">
              Untuk landing page cepat rata-rata selesai dalam 5–7 hari kerja setelah materi diterima lengkap. Layanan otomasi Google Apps Script disesuaikan dengan alur kerja, umumnya berkisar 3–10 hari kerja.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-summary" onclick="toggleFaq(this)">
              <span>Apakah saya membutuhkan keahlian koding untuk memakai template?</span>
              <span>+</span>
            </div>
            <div class="faq-content">
              Sama sekali tidak. Semua template dan prompt pack dirancang untuk pengguna umum dengan panduan salin-tempel serta petunjuk video/dokumen dalam Bahasa Indonesia.
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-secondary" style="text-align: center;">
      <div class="container" style="max-width: 680px;">
        <h2 style="font-size: 2.2rem; margin-bottom: 16px;">Siap Mengembangkan Bisnis Anda?</h2>
        <p class="text-secondary" style="margin-bottom: 30px;">
          Diskusikan rencana digitalisasi Anda bersama Arra Digital. Kami siap memberikan masukan gratis dan solusi yang tepat sasaran.
        </p>
        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <a href="/produk" data-route="/produk" class="btn btn-primary btn-lg">Pilih Produk Digital</a>
          <a href="/kontak" data-route="/kontak" class="btn btn-secondary btn-lg">Hubungi via WhatsApp</a>
        </div>
      </div>
    </section>
  `;
}

function renderCatalogView() {
  document.title = `Katalog Produk Digital | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  let filtered = STATE.products;
  if (STATE.activeCategory && STATE.activeCategory !== 'Semua') {
    filtered = filtered.filter(p => p.category === STATE.activeCategory);
  }
  if (STATE.searchQuery) {
    const q = STATE.searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.short_description && p.short_description.toLowerCase().includes(q)));
  }

  const pillsHtml = STATE.categories.map(c => `
    <button class="filter-pill ${c === STATE.activeCategory ? 'active' : ''}" onclick="setProductCategory('${c}')">
      ${c}
    </button>
  `).join('');

  const gridHtml = filtered.length > 0
    ? filtered.map(renderProductCardHtml).join('')
    : `<div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
         <h3>Tidak ada produk yang cocok</h3>
         <p class="text-muted" style="margin-top: 8px;">Coba gunakan kata kunci pencarian lain atau pilih kategori "Semua".</p>
       </div>`;

  app.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Katalog Produk Digital &amp; Solusi</h2>
          <p>Jelajahi template AI, spreadsheet operasional, dan layanan kustom untuk mempercepat bisnis Anda.</p>
        </div>

        <div class="catalog-filters">
          <div class="filter-pills">
            ${pillsHtml}
          </div>
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="search-input" placeholder="Cari nama produk / template..." value="${escapeHtml(STATE.searchQuery)}" oninput="handleProductSearch(this.value)" />
          </div>
        </div>

        <div class="grid-3">
          ${gridHtml}
        </div>
      </div>
    </section>
  `;
}

async function renderProductDetailView(slug) {
  const app = document.getElementById('app-main');
  app.innerHTML = `<div class="container section text-center"><p class="text-muted">Memuat detail produk...</p></div>`;

  try {
    const res = await fetch(`/api/products/${slug}`);
    const data = await res.json();
    if (!data.success || !data.product) {
      app.innerHTML = `
        <div class="container section text-center">
          <h2>Produk Tidak Ditemukan</h2>
          <p class="text-muted" style="margin: 16px 0 24px;">Produk yang Anda cari tidak tersedia atau sudah dinonaktifkan.</p>
          <a href="/produk" data-route="/produk" class="btn btn-primary">Kembali ke Katalog</a>
        </div>
      `;
      return;
    }

    const prod = data.product;
    document.title = `${prod.name} | ARRA DIGITAL`;

    const isQuote = prod.price === 0;
    const isSample = prod.name.includes('Sampel Demo');
    const waNumber = STATE.settings.public_whatsapp || '6281317028494';
    const waInquiryText = `Halo Arra Digital, saya ingin menanyakan tentang produk *${prod.name}*. Boleh minta informasi lebih lanjut?`;
    const waInquiryUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waInquiryText)}`;

    const featuresListHtml = (prod.features || []).map(f => `
      <div class="feature-item-card">
        <div class="feature-item-icon">✓</div>
        <div>${escapeHtml(f)}</div>
      </div>
    `).join('');

    const descParagraphs = (prod.description || '')
      .split(/\n\s*\n/)
      .map(p => `<p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 14px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('');

    const detailImgUrl = getProductThumbnailUrl(prod);
    const mediaHtml = `
      <div class="product-media-container">
        <div class="product-media-preview-box" onclick="openImageZoom('${detailImgUrl}', '${escapeHtml(prod.name)}')" title="Klik untuk memperbesar gambar pratinjau dalam resolusi penuh">
          <img src="${detailImgUrl}" alt="${escapeHtml(prod.name)}" class="product-media-main-img" id="product-main-image" onerror="this.onerror=null;this.src='/assets/products/website-starter-kit.jpg';" />
          <div class="image-zoom-indicator">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            Klik untuk Memperbesar Gambar (Resolusi Penuh)
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <span style="font-size: 0.82rem; color: var(--text-muted);">📸 Pratinjau Desain Asli Produk</span>
          <button type="button" class="btn btn-secondary btn-xs" onclick="openImageZoom('${detailImgUrl}', '${escapeHtml(prod.name)}')" style="font-size: 0.78rem; padding: 4px 10px;">
            🔍 Perbesar Gambar
          </button>
        </div>

        <div class="product-trust-chips" style="margin-top: 14px;">
          <div class="trust-chip"><span class="trust-chip-icon">⚡</span> Akses Cepat &amp; Instan</div>
          <div class="trust-chip"><span class="trust-chip-icon">🔒</span> 100% File Aman &amp; Teruji</div>
          <div class="trust-chip"><span class="trust-chip-icon">💬</span> Konsultasi &amp; Panduan WA</div>
          <div class="trust-chip"><span class="trust-chip-icon">🔄</span> Pembaruan Template Berkala</div>
        </div>
      </div>
    `;

    app.innerHTML = `
      <section class="section">
        <div class="container" style="max-width: 1040px;">
          <!-- Breadcrumbs -->
          <nav style="margin-bottom: 24px; font-size: 0.88rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <a href="/" data-route="/" class="text-muted">Beranda</a> &rsaquo;
            <a href="/produk" data-route="/produk" class="text-muted">Katalog Produk</a> &rsaquo;
            <span class="badge-pill badge-purple" style="font-size: 0.75rem; padding: 2px 8px;">${escapeHtml(prod.category)}</span> &rsaquo;
            <span class="text-blue" style="font-weight: 600;">${escapeHtml(prod.name)}</span>
          </nav>

          <!-- 2-Column Hero Showcase -->
          <div class="product-detail-hero-grid">
            <!-- Left: Visual Media -->
            ${mediaHtml}

            <!-- Right: Product Overview & Buy Box -->
            <div class="product-info-panel">
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <span class="badge-pill badge-purple">${escapeHtml(prod.category)}</span>
                ${isSample ? '<span class="badge-pill badge-sample">Sampel Demo Terverifikasi</span>' : ''}
                <span class="badge-pill badge-blue">${prod.delivery_type === 'digital_download' ? 'Akses Digital Instan' : 'Layanan Kustom Profesional'}</span>
              </div>

              <h1 style="font-size: 2.1rem; font-weight: 850; line-height: 1.25; margin-top: 4px;">
                ${escapeHtml(prod.name)}
              </h1>

              <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6;">
                ${escapeHtml(prod.short_description || '')}
              </p>

              <!-- Quick Specs -->
              <div class="product-specs-box">
                <div class="spec-item">
                  <span class="spec-label">Format Distribusi</span>
                  <span class="spec-value">${prod.delivery_type === 'digital_download' ? 'Cloud Drive &amp; File Digital' : 'Sesi Konsultasi &amp; Pengerjaan'}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Akses &amp; Lisensi</span>
                  <span class="spec-value">Akses Seumur Hidup (Pribadi/Bisnis)</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Bahasa Panduan</span>
                  <span class="spec-value">Bahasa Indonesia Lengkap</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">Dukungan Pengguna</span>
                  <span class="spec-value">Pendampingan via WhatsApp</span>
                </div>
              </div>

              <!-- Pricing Card & Buy CTA -->
              <div class="product-pricing-card">
                <div class="pricing-card-top">
                  <div>
                    <span style="display: block; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Investasi Transparan</span>
                    <span class="pricing-amount-large">${formatIDR(prod.price)}</span>
                  </div>
                  <span class="badge-pill badge-blue" style="font-size: 0.8rem;">${isQuote ? 'Konsultasi Bebas Biaya' : 'Sekali Bayar &middot; Tanpa Langganan'}</span>
                </div>

                <div class="order-actions-group">
                  <button onclick="openOrderModal('${prod.id}', '${escapeHtml(prod.name)}', ${prod.price})" class="btn btn-primary btn-lg" style="width: 100%; justify-content: center; font-size: 1.05rem; font-weight: 700;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    ${isQuote ? 'Konsultasikan Layanan Sekarang' : 'Pesan & Dapatkan Akses Sekarang'}
                  </button>

                  <a href="${waInquiryUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-md" style="width: 100%; justify-content: center;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.09 7.4 8.87 7.65C8.64 7.89 8 8.49 8 9.72C8 10.95 8.89 12.13 9.01 12.3C9.14 12.46 10.77 14.97 13.25 16.05C13.84 16.31 14.3 16.46 14.66 16.58C15.26 16.77 15.8 16.74 16.24 16.68C16.73 16.6 17.74 16.06 17.95 15.47C18.16 14.88 18.16 14.38 18.1 14.28C18.03 14.17 17.86 14.11 17.61 13.98C17.36 13.86 16.14 13.26 15.91 13.18C15.69 13.09 15.52 13.05 15.36 13.3C15.19 13.55 14.71 14.11 14.56 14.28C14.41 14.45 14.27 14.47 14.02 14.34C13.77 14.22 12.97 13.96 12.02 13.11C11.28 12.45 10.78 11.63 10.63 11.38C10.49 11.13 10.61 11 10.74 10.87C10.85 10.76 10.99 10.58 11.12 10.43C11.24 10.29 11.28 10.18 11.37 10.01C11.45 9.85 11.41 9.7 11.35 9.58C11.28 9.45 10.78 8.23 10.58 7.73C10.37 7.24 10.17 7.31 10.01 7.31C9.87 7.31 9.7 7.34 9.53 7.34Z"/></svg>
                    Tanya Admin via WhatsApp
                  </a>
                </div>

                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>🔒</span> Transaksi terhubung langsung ke WhatsApp Resmi Arra Digital
                </div>
              </div>
            </div>
          </div>

          <!-- Structured Tabs & Sections -->
          <div class="card" style="padding: 36px; margin-bottom: 32px;">
            <div style="margin-bottom: 36px;">
              <h2 style="font-size: 1.45rem; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <span>📖</span> Deskripsi Lengkap &amp; Solusi
              </h2>
              <div style="font-size: 1.02rem;">
                ${descParagraphs}
              </div>
            </div>

            <!-- Features & Deliverables -->
            <div style="margin-bottom: 36px;">
              <h2 style="font-size: 1.45rem; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <span>✨</span> Apa Saja yang Anda Dapatkan?
              </h2>
              <div class="features-grid-list">
                ${featuresListHtml}
              </div>
            </div>

            <!-- Target Audience -->
            <div style="margin-bottom: 36px;">
              <h2 style="font-size: 1.45rem; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <span>🎯</span> Untuk Siapa Produk Ini Cocok?
              </h2>
              <div class="audience-grid">
                <div class="audience-card">
                  <span style="font-size: 1.8rem;">🚀</span>
                  <h4>Kreator Konten &amp; Pemasar</h4>
                  <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Ingin membuat materi konten dan promosi berkonversi tinggi tanpa kehabisan ide setiap hari.</p>
                </div>
                <div class="audience-card">
                  <span style="font-size: 1.8rem;">💼</span>
                  <h4>Pemilik Bisnis &amp; UMKM</h4>
                  <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Mencari otomasi alur kerja, laporan keuangan otomatis, dan website profesional dengan biaya hemat.</p>
                </div>
                <div class="audience-card">
                  <span style="font-size: 1.8rem;">⚡</span>
                  <h4>Freelancer &amp; Praktisi</h4>
                  <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">Membutuhkan template standar industri siap pakai untuk mempercepat pengerjaan proyek klien.</p>
                </div>
              </div>
            </div>

            <!-- 3 Easy Steps to Buy -->
            <div style="margin-bottom: 36px;">
              <h2 style="font-size: 1.45rem; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <span>🛒</span> Alur Pemesanan &amp; Pengiriman (3 Langkah Cepat)
              </h2>
              <div class="order-steps-grid">
                <div class="order-step-card">
                  <div class="step-num-badge">1</div>
                  <h4 style="font-size: 1rem; margin-bottom: 8px;">Pilih Produk &amp; Formulir</h4>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Klik tombol Pesan Sekarang dan isi nama serta nomor WhatsApp Anda.</p>
                </div>
                <div class="order-step-card">
                  <div class="step-num-badge">2</div>
                  <h4 style="font-size: 1rem; margin-bottom: 8px;">Konfirmasi WhatsApp</h4>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Sistem mengarahkan Anda ke WhatsApp resmi Arra Digital untuk verifikasi otomatis.</p>
                </div>
                <div class="order-step-card">
                  <div class="step-num-badge">3</div>
                  <h4 style="font-size: 1rem; margin-bottom: 8px;">Akses File Langsung</h4>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">Link file, spreadsheet, atau jadwal konsultasi dikirimkan secara instan.</p>
                </div>
              </div>
            </div>

            ${isSample ? `
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 20px 24px; border-radius: var(--radius-md); font-size: 0.9rem; color: #FCD34D;">
                <strong style="display: block; margin-bottom: 6px;">Catatan Transparansi Produk:</strong>
                Produk ini adalah katalog resmi Arra Digital. Seluruh aset digital, formula prompt, maupun source code template dapat disesuaikan secara bebas sesuai kebutuhan spesifik usaha Anda.
              </div>
            ` : ''}
          </div>
        </div>
      </section>
    `;
  } catch (err) {
    app.innerHTML = `<div class="container section text-center"><p class="text-muted">Gagal mengambil data produk.</p></div>`;
  }
}

function renderToolsView() {
  document.title = `Direktori Tools AI Interaktif & Nalar Gemini | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  const userGeminiKey = localStorage.getItem('arra_gemini_api_key') || '';
  const isGeminiConnected = Boolean(userGeminiKey.trim());

  const toolsList = [
    { id: 'affiliate_hooks', name: 'Hook Video AI Affiliate', icon: '⚡' },
    { id: 'video_script', name: 'Skrip Video 60 Detik', icon: '🎬' },
    { id: 'caption_cta', name: 'Caption & CTA Konversi', icon: '✍️' },
    { id: 'content_calendar', name: 'Kalender Konten 7 Hari', icon: '📅' },
    { id: 'website_brief', name: 'Brief Proyek Website', icon: '📋' }
  ];

  const tabsHtml = toolsList.map(t => `
    <button class="tools-tab-btn ${t.id === STATE.selectedTool ? 'active' : ''}" onclick="switchToolTab('${t.id}')">
      ${t.icon} ${t.name}
    </button>
  `).join('');

  app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 980px;">
        <div class="section-header">
          <span class="badge-pill badge-purple" style="margin-bottom: 12px;">Didukung Google Gemini AI 2.5 / 1.5 Flash</span>
          <h2>Tools AI Kreatif, Nalar Strategis &amp; Otomasi</h2>
          <p>Ditenagai analisis psikologi audiens Indonesia. Hasil tidak kaku, bernalar tajam, dan siap mendorong konversi penjualan.</p>
        </div>

        <!-- Gemini Engine Status Banner -->
        <div class="gemini-engine-banner">
          <div class="gemini-engine-info">
            <span class="gemini-pulse-dot ${isGeminiConnected ? '' : 'fallback'}"></span>
            <div>
              <div class="gemini-engine-title">
                ${isGeminiConnected ? 'Google Gemini 2.5 / 1.5 Flash Terhubung' : 'Mesin Strategi Cerdas Arra (Mode Standby)'}
                <span class="badge-pill badge-blue" style="font-size: 0.72rem; padding: 2px 7px;">${isGeminiConnected ? 'API Key Pribadi Aktif' : 'Nalar Heuristik Lokal'}</span>
              </div>
              <div class="gemini-engine-desc">
                ${isGeminiConnected
                  ? 'Prompt dialirkan langsung ke Google Gemini dengan nalar adaptif penuh dan gaya bahasa alami.'
                  : 'Gunakan kunci API Gemini Anda sendiri (100% gratis dari Google AI Studio) untuk variasi kreatif tanpa batas.'}
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openGeminiApiKeyModal()" style="font-size: 0.82rem;">
            ⚙️ ${isGeminiConnected ? 'Kelola Kunci Gemini' : 'Hubungkan API Gemini Gratis'}
          </button>
        </div>

        <div class="tools-tabs">
          ${tabsHtml}
        </div>

        <div class="tool-workspace" id="tool-workspace-content">
          ${renderToolFormHtml(STATE.selectedTool)}
        </div>
      </div>
    </section>
  `;
}

function renderToolFormHtml(toolId) {
  STATE.selectedTone = STATE.selectedTone || 'viral_casual';

  let formFields = '';
  if (toolId === 'affiliate_hooks' || toolId === 'video_script') {
    formFields = `
      <div class="grid-2">
        <div class="form-group">
          <label>Nama Produk / Alat *</label>
          <input type="text" id="tool_product_name" class="form-control" value="Mini Tripod Bluetooth Lipat" placeholder="contoh: Microphone Wireless, Skincare Serum" required />
        </div>
        <div class="form-group">
          <label>Kategori / Niche *</label>
          <input type="text" id="tool_niche" class="form-control" value="Gadget & Konten Kreator" placeholder="contoh: Fashion, Kuliner, Home Living" required />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Target Audiens Spesifik</label>
          <input type="text" id="tool_audience" class="form-control" value="Kreator TikTok Pemula yang suka rekam video sendiri" placeholder="siapa yang paling membutuhkan produk ini?" />
        </div>
        <div class="form-group">
          <label>Manfaat Utama (Core Benefit)</label>
          <input type="text" id="tool_benefit" class="form-control" value="Bisa rekam video stabil tanpa minta bantuan orang lain" placeholder="apa transformasi terbesar yang didapat?" />
        </div>
      </div>
    `;
  } else if (toolId === 'caption_cta') {
    formFields = `
      <div class="grid-2">
        <div class="form-group">
          <label>Nama Produk / Program *</label>
          <input type="text" id="tool_product_name" class="form-control" value="Business Template Pack" required />
        </div>
        <div class="form-group">
          <label>Niche Bisnis *</label>
          <input type="text" id="tool_niche" class="form-control" value="Manajemen Usaha UMKM" required />
        </div>
      </div>
      <div class="form-group">
        <label>Manfaat / Penawaran Utama</label>
        <input type="text" id="tool_benefit" class="form-control" value="Rekap penjualan dan omzet harian otomatis tanpa rumus rumit" />
      </div>
      <div class="form-group">
        <label>Target Audiens</label>
        <input type="text" id="tool_audience" class="form-control" value="Pemilik toko online & UMKM yang lelah rekap manual" />
      </div>
    `;
  } else if (toolId === 'content_calendar') {
    formFields = `
      <div class="grid-2">
        <div class="form-group">
          <label>Topik / Niche Utama *</label>
          <input type="text" id="tool_niche" class="form-control" value="Tips Affiliate Pemula" required />
        </div>
        <div class="form-group">
          <label>Produk yang Dipromosikan *</label>
          <input type="text" id="tool_product_name" class="form-control" value="AI Affiliate Starter Kit" required />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Target Followers</label>
          <input type="text" id="tool_audience" class="form-control" value="Karyawan atau ibu rumah tangga yang ingin dapat komisi sampingan" />
        </div>
        <div class="form-group">
          <label>Manfaat Utama Produk</label>
          <input type="text" id="tool_benefit" class="form-control" value="Mulai bikin konten tanpa pusing mikir skrip dari nol" />
        </div>
      </div>
    `;
  } else {
    formFields = `
      <div class="grid-2">
        <div class="form-group">
          <label>Nama Usaha / Brand *</label>
          <input type="text" id="tool_product_name" class="form-control" value="Kopi Senja Nusantara" required />
        </div>
        <div class="form-group">
          <label>Jenis Bisnis &amp; Niche *</label>
          <input type="text" id="tool_niche" class="form-control" value="Kedai Kopi & Roastery Lokal" required />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Target Pengunjung Website</label>
          <input type="text" id="tool_audience" class="form-control" value="Pecinta kopi specialty & komunitas work-from-cafe di kota besar" />
        </div>
        <div class="form-group">
          <label>Tujuan Website &amp; Keunggulan Produk</label>
          <input type="text" id="tool_benefit" class="form-control" value="Tampilkan menu signature, petunjuk lokasi Google Maps, dan reservasi meja via WhatsApp" />
        </div>
      </div>
    `;
  }

  return `
    <form onsubmit="handleExecuteTool(event, '${toolId}')">
      ${formFields}

      <!-- Tone / Gaya Bahasa Selector -->
      <div class="tone-selector-wrap">
        <label>Pilih Gaya Bahasa (Tone of Voice):</label>
        <div class="tone-chip-group">
          <button type="button" class="tone-chip-btn ${STATE.selectedTone === 'viral_casual' ? 'active' : ''}" onclick="selectToolTone('viral_casual')">
            🚀 Santai &amp; Viral (FYP TikTok/Reels)
          </button>
          <button type="button" class="tone-chip-btn ${STATE.selectedTone === 'high_conversion' ? 'active' : ''}" onclick="selectToolTone('high_conversion')">
            🔥 Persuasif &amp; Closing Cepat (Promo)
          </button>
          <button type="button" class="tone-chip-btn ${STATE.selectedTone === 'story_authority' ? 'active' : ''}" onclick="selectToolTone('story_authority')">
            🎓 Storytelling &amp; Edukatif (Otoritas)
          </button>
          <button type="button" class="tone-chip-btn ${STATE.selectedTone === 'professional_clean' ? 'active' : ''}" onclick="selectToolTone('professional_clean')">
            💼 Elegan &amp; Profesional (B2B/Jasa)
          </button>
        </div>
      </div>

      <!-- Custom Angle / Instruction (Optional) -->
      <div class="form-group" style="margin-top: 14px;">
        <label>Instruksi Khusus / Angle Unik (Opsional)</label>
        <input type="text" id="tool_custom_instruction" class="form-control" placeholder="contoh: Soroti garansi tanpa resiko, atau gunakan punchline humor di pembuka" />
      </div>

      <div style="margin-top: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <span class="text-muted" style="font-size: 0.85rem;">🧠 Nalar AI mendalam &middot; Bahasa mengalir bebas kaku</span>
        <button type="submit" class="btn btn-primary" id="btn-generate-tool">
          ⚡ Generate Konten Bernalar
        </button>
      </div>
    </form>
    <div id="tool-output-container"></div>
  `;
}

function selectToolTone(tone) {
  STATE.selectedTone = tone;
  document.querySelectorAll('.tone-chip-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const currentBtn = event && event.target ? event.target.closest('.tone-chip-btn') : null;
  if (currentBtn) currentBtn.classList.add('active');
}

function switchToolTab(toolId) {
  STATE.selectedTool = toolId;
  renderToolsView();
}

async function handleExecuteTool(e, toolId, extraInstruction = '') {
  if (e && e.preventDefault) e.preventDefault();
  const btn = document.getElementById('btn-generate-tool');
  const outContainer = document.getElementById('tool-output-container');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Memproses Nalar AI...';
  }

  const customInputVal = document.getElementById('tool_custom_instruction')?.value || '';
  const finalCustomInstruction = extraInstruction ? `${customInputVal} ${extraInstruction}`.trim() : customInputVal;
  const clientApiKey = localStorage.getItem('arra_gemini_api_key') || '';

  const inputs = {
    product_name: document.getElementById('tool_product_name')?.value || 'Produk Digital',
    niche: document.getElementById('tool_niche')?.value || 'Affiliate',
    audience: document.getElementById('tool_audience')?.value || 'Kreator Indonesia',
    benefit: document.getElementById('tool_benefit')?.value || 'Meningkatkan konversi',
    tone: STATE.selectedTone || 'viral_casual',
    custom_instruction: finalCustomInstruction,
    apiKey: clientApiKey,
    user_gemini_key: clientApiKey
  };

  try {
    const res = await fetch('/api/tools/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientApiKey ? { 'x-gemini-key': clientApiKey } : {})
      },
      body: JSON.stringify({ toolType: toolId, inputs })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Gagal menghasilkan konten');

    const result = json.result;
    STATE.lastToolResult = { toolId, result, inputs };
    renderToolOutputDisplay(outContainer, toolId, result);
  } catch (err) {
    outContainer.innerHTML = `<div class="card" style="margin-top: 20px; color: #F87171; border-color: #EF4444;">Error: ${escapeHtml(err.message)}</div>`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ Generate Konten Bernalar';
    }
  }
}

function renderToolOutputDisplay(outContainer, toolId, result) {
  const data = result.data || {};
  const formattedText = formatToolOutputToText(toolId, data);
  const reasoning = data.ai_reasoning;

  let reasoningHtml = '';
  if (reasoning) {
    reasoningHtml = `
      <div class="ai-reasoning-card">
        <div class="ai-reasoning-card-header">
          <div class="ai-reasoning-card-title">
            <span>🧠</span> Nalar &amp; Analisis Strategi AI
          </div>
          <span class="badge-pill badge-purple" style="font-size: 0.76rem;">${escapeHtml(data.tone || 'Strategi Terarah')}</span>
        </div>

        <div class="ai-reasoning-grid">
          ${reasoning.audience_psychology ? `
            <div class="ai-reasoning-item">
              <div class="ai-reasoning-item-label">Psikologi Audiens Target</div>
              <div class="ai-reasoning-item-text">${escapeHtml(reasoning.audience_psychology)}</div>
            </div>
          ` : ''}
          ${reasoning.strategic_angle ? `
            <div class="ai-reasoning-item">
              <div class="ai-reasoning-item-label">Nalar Sudut Pandang (Angle)</div>
              <div class="ai-reasoning-item-text">${escapeHtml(reasoning.strategic_angle)}</div>
            </div>
          ` : ''}
          ${(reasoning.conversion_trigger || reasoning.conversion_driver) ? `
            <div class="ai-reasoning-item">
              <div class="ai-reasoning-item-label">Pemicu Konversi Utama</div>
              <div class="ai-reasoning-item-text">${escapeHtml(reasoning.conversion_trigger || reasoning.conversion_driver)}</div>
            </div>
          ` : ''}
        </div>

        ${reasoning.director_notes ? `
          <div class="ai-director-box">
            <span style="font-size: 1.25rem;">🎬</span>
            <div>
              <strong>Arahan Sutradara &amp; Eksekusi:</strong> ${escapeHtml(reasoning.director_notes)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  let specificContentHtml = '';
  if (toolId === 'affiliate_hooks' && Array.isArray(data.items)) {
    specificContentHtml = `
      <div class="ai-hooks-list">
        ${data.items.map((it, idx) => `
          <div class="ai-hook-card">
            <div class="ai-hook-top">
              <span class="badge-pill badge-blue" style="font-size: 0.74rem;">${escapeHtml(it.type || `Hook #${idx + 1}`)}</span>
              <button type="button" class="btn btn-secondary btn-xs" onclick="copyToClipboard(this, \`${escapeJs(it.text)}\`)" title="Salin hook ini">
                📋 Salin
              </button>
            </div>
            <div class="ai-hook-text">"${escapeHtml(it.text)}"</div>
            ${it.angle ? `<div class="ai-hook-angle">💡 <strong>Sudut Pandang:</strong> ${escapeHtml(it.angle)}</div>` : ''}
            ${it.psychology ? `<div class="ai-hook-angle" style="color: #A78BFA;">🎯 <strong>Psikologi:</strong> ${escapeHtml(it.psychology)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else if (toolId === 'video_script' && Array.isArray(data.timeline)) {
    specificContentHtml = `
      <div class="ai-script-timeline">
        ${data.timeline.map(seg => `
          <div class="ai-script-segment">
            <div class="ai-script-segment-time">⏱️ ${escapeHtml(seg.segment || seg.time || '')}</div>
            <div style="font-size: 0.92rem; margin-bottom: 6px;"><strong style="color: #CBD5E1;">Visual:</strong> ${escapeHtml(seg.visual || '')}</div>
            <div style="font-size: 0.98rem; font-weight: 600; color: #FFFFFF; margin-bottom: 6px;"><strong style="color: #60A5FA;">Audio:</strong> ${escapeHtml(seg.audio || '')}</div>
            ${seg.on_screen_text ? `<div style="font-size: 0.85rem; color: #FCD34D;"><strong>Teks Layar:</strong> ${escapeHtml(seg.on_screen_text)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    specificContentHtml = `
      <div class="tool-output-content">${escapeHtml(formattedText)}</div>
    `;
  }

  const modelBadge = result.source === 'gemini_api'
    ? `<span class="badge-pill badge-blue">✨ Powered by Google Gemini (${result.model || 'Flash'})</span>`
    : `<span class="badge-pill badge-purple">⚡ Mesin Strategis Arra Digital</span>`;

  outContainer.innerHTML = `
    <div class="tool-output-box">
      <div class="tool-output-header">
        <div>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
            <h4 style="font-weight: 750; font-size: 1.15rem;">Hasil Konten &amp; Nalar Strategis</h4>
            ${modelBadge}
          </div>
          <span class="text-muted" style="font-size: 0.82rem;">${escapeHtml(data.summary || 'Generated Content')}</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="copyToClipboard(this, \`${escapeJs(formattedText)}\`)">
          📋 Salin Seluruh Teks
        </button>
      </div>

      ${reasoningHtml}

      <div style="margin-top: 18px;">
        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <span>💡</span> Materi Siap Pakai:
        </h4>
        ${specificContentHtml}
      </div>

      <!-- Quick AI Refinements -->
      <div class="ai-refinement-bar">
        <span style="font-size: 0.84rem; color: var(--text-muted); font-weight: 600;">Eksplorasi Nalar Lanjutan:</span>
        <div class="ai-refinement-chips">
          <button type="button" class="btn btn-secondary btn-xs" onclick="refineCurrentTool('alternatif')">🔄 5 Variasi Lain</button>
          <button type="button" class="btn btn-secondary btn-xs" onclick="refineCurrentTool('deep_dive')">🧠 Bedah Psikologi Lebih Dalam</button>
          <button type="button" class="btn btn-secondary btn-xs" onclick="refineCurrentTool('shorter')">⚡ Buat Lebih Singkat &amp; Padat</button>
        </div>
      </div>

      <p class="text-muted" style="font-size: 0.78rem; margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
        *${result.disclaimer}
      </p>
    </div>
  `;
}

function refineCurrentTool(action) {
  if (!STATE.lastToolResult) return;
  const { toolId } = STATE.lastToolResult;

  let extra = '';
  if (action === 'alternatif') extra = 'Berikan 5 variasi alternatif yang sama sekali berbeda dengan sudut pandang unik.';
  if (action === 'deep_dive') extra = 'Bongkar lebih detail psikologi audiens target dan alasan alam bawah sadar yang memicu konversi.';
  if (action === 'shorter') extra = 'Buat versi yang jauh lebih ringkas, padat, to the point, dan cocok untuk video 30 detik.';

  const customInput = document.getElementById('tool_custom_instruction');
  if (customInput) customInput.value = extra;

  handleExecuteTool(new Event('submit'), toolId, extra);
}

function formatToolOutputToText(toolId, data) {
  if (!data) return '';

  if (toolId === 'affiliate_hooks') {
    let txt = `=== 5 HOOK PENAHAN SCROLL ===\n\n`;
    if (data.ai_reasoning) {
      txt += `[ANALISIS NALAR AI]\n`;
      txt += `Psikologi Audiens: ${data.ai_reasoning.audience_psychology || '-'}\n`;
      txt += `Nalar Angle: ${data.ai_reasoning.strategic_angle || '-'}\n`;
      txt += `Pemicu Konversi: ${data.ai_reasoning.conversion_trigger || '-'}\n\n`;
    }
    (data.items || []).forEach((it, idx) => {
      txt += `${idx + 1}. [${it.type}]\n   "${it.text}"\n   (Nalar: ${it.angle || it.psychology || '-'})\n\n`;
    });
    return txt.trim();
  }

  if (toolId === 'video_script') {
    let txt = `=== SKRIP VIDEO 60 DETIK ===\n\n`;
    if (data.ai_reasoning) {
      txt += `[ANALISIS NALAR AI]\n`;
      txt += `Strategi Alur: ${data.ai_reasoning.strategic_angle || '-'}\n`;
      txt += `Catatan Sutradara: ${data.ai_reasoning.director_notes || '-'}\n\n`;
    }
    (data.timeline || []).forEach(seg => {
      txt += `[${seg.segment || seg.time}]\nVisual     : ${seg.visual}\nAudio/Kata : ${seg.audio}\n${seg.on_screen_text ? `Teks Layar : ${seg.on_screen_text}\n` : ''}\n`;
    });
    return txt.trim();
  }

  if (toolId === 'caption_cta') {
    let txt = `${data.caption || ''}\n\nHashtags:\n${data.hashtags || ''}\n\nVariasi CTA Pilihan:\n`;
    (data.cta_variations || []).forEach((c, idx) => { txt += `${idx + 1}. ${c}\n`; });
    return txt.trim();
  }

  if (toolId === 'content_calendar') {
    let txt = `=== KALENDER KONTEN 7 HARI ===\n\n`;
    (data.schedule || []).forEach(s => {
      txt += `• ${s.day} (${s.theme}) | Format: ${s.format}\n  Topik: "${s.topic}"\n  CTA: ${s.cta || '-'}\n\n`;
    });
    return txt.trim();
  }

  if (toolId === 'website_brief') {
    let txt = `=== BRIEF SPESIFIKASI WEBSITE ===\n\n`;
    if (data.project_overview) {
      txt += `Niche Klien : ${data.project_overview.client_niche || '-'}\nTarget     : ${data.project_overview.target_audience || '-'}\nTujuan     : ${data.project_overview.primary_goal || '-'}\n\n`;
    }
    txt += `Rekomendasi Struktur Halaman:\n`;
    (data.recommended_structure || []).forEach((st, i) => { txt += `${i + 1}. ${st}\n`; });
    if (data.tech_recommendation) txt += `\nRekomendasi Hosting Hemat: ${data.tech_recommendation}`;
    return txt.trim();
  }

  return JSON.stringify(data, null, 2);
}

// Modal Kunci API Gemini
window.openGeminiApiKeyModal = function() {
  const modal = document.getElementById('order-modal');
  const modalBody = document.getElementById('order-modal-body');
  const existingKey = localStorage.getItem('arra_gemini_api_key') || '';

  modalBody.innerHTML = `
    <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
      <span>⚙️</span> Pengaturan API Google Gemini
    </h3>
    <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
      Hubungkan kunci API pribadi Anda dari Google AI Studio. Dengan kunci ini, seluruh generator AI beroperasi menggunakan model <strong>Gemini 2.5 Flash / 1.5 Flash</strong> dengan nalar adaptif tanpa batas.
    </p>

    <div style="background: rgba(71, 120, 255, 0.08); border: 1px solid rgba(71, 120, 255, 0.25); padding: 14px 18px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 0.88rem;">
      <div style="font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">💡 Cara Mendapatkan Kunci API Gratis:</div>
      <ol style="margin-left: 18px; color: var(--text-secondary); line-height: 1.6; list-style: decimal;">
        <li>Buka <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="text-blue" style="text-decoration: underline;">Google AI Studio (aistudio.google.com)</a></li>
        <li>Login dengan akun Google Anda</li>
        <li>Klik tombol <strong>"Create API Key"</strong> dan salin kuncinya ke kolom di bawah ini</li>
      </ol>
    </div>

    <form onsubmit="handleSaveGeminiKey(event)">
      <div class="form-group">
        <label>Google Gemini API Key *</label>
        <input type="password" id="input_gemini_key" class="form-control" value="${escapeHtml(existingKey)}" placeholder="AIzaSy..." required style="letter-spacing: 1px;" />
      </div>

      <div id="gemini-key-status" style="font-size: 0.85rem; margin-bottom: 14px; display: none;"></div>

      <div style="display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">Batal</button>
        ${existingKey ? `<button type="button" class="btn btn-secondary" onclick="handleClearGeminiKey()" style="color: #EF4444;">Hapus Kunci</button>` : ''}
        <button type="submit" class="btn btn-primary" id="btn-save-gemini-key" style="flex: 1;">
          Simpan Kunci API
        </button>
      </div>
    </form>
  `;

  modal.classList.add('open');
};

window.handleSaveGeminiKey = function(e) {
  e.preventDefault();
  const input = document.getElementById('input_gemini_key');
  const statusEl = document.getElementById('gemini-key-status');
  const key = input ? input.value.trim() : '';

  if (!key) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#EF4444';
    statusEl.textContent = 'Kunci API tidak boleh kosong.';
    return;
  }

  localStorage.setItem('arra_gemini_api_key', key);
  closeOrderModal();
  renderToolsView();
};

window.handleClearGeminiKey = function() {
  localStorage.removeItem('arra_gemini_api_key');
  closeOrderModal();
  renderToolsView();
};

function renderWebsiteServiceView() {
  document.title = `Jasa Pembuatan Website Kustom | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  app.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <span class="badge-pill badge-blue" style="margin-bottom: 12px;">Solusi Web Modern &amp; Cepat</span>
          <h2>Jasa Pembuatan Website Profesional</h2>
          <p>Hadirkan kredibilitas online bagi usaha Anda tanpa biaya bulanan yang membengkak.</p>
        </div>

        <div class="grid-3" style="margin-bottom: 60px;">
          <div class="card pricing-card">
            <h3 style="font-size: 1.3rem;">Paket Starter</h3>
            <p class="text-muted" style="margin: 8px 0 16px; font-size: 0.9rem;">Cocok untuk UMKM pemula yang ingin segera hadir online.</p>
            <div style="font-size: 1.8rem; font-weight: 800; margin-bottom: 20px;">Rp 750.000</div>
            <ul style="margin-bottom: 24px; font-size: 0.92rem; color: var(--text-secondary);">
              <li style="margin-bottom: 8px;">✓ Landing Page 1 Halaman Responsif</li>
              <li style="margin-bottom: 8px;">✓ Tombol Chat WhatsApp Otomatis</li>
              <li style="margin-bottom: 8px;">✓ Integrasi Google Maps &amp; Lokasi</li>
              <li style="margin-bottom: 8px;">✓ Bebas Biaya Hosting (Cloudflare Pages)</li>
              <li style="margin-bottom: 8px;">✓ 1x Revisi &amp; Garansi 14 Hari</li>
            </ul>
            <a href="/kontak" data-route="/kontak" class="btn btn-secondary btn-full">Konsultasi Paket</a>
          </div>

          <div class="card pricing-card" style="border-color: var(--accent-blue); background: linear-gradient(180deg, #1A2C4E 0%, #15223C 100%);">
            <span class="badge-pill badge-blue" style="margin-bottom: 12px;">Paling Direkomendasikan</span>
            <h3 style="font-size: 1.3rem;">Paket Bisnis Pro</h3>
            <p class="text-muted" style="margin: 8px 0 16px; font-size: 0.9rem;">Untuk usaha berkembang yang membutuhkan kredibilitas lengkap.</p>
            <div style="font-size: 1.8rem; font-weight: 800; margin-bottom: 20px;">Rp 2.500.000</div>
            <ul style="margin-bottom: 24px; font-size: 0.92rem; color: var(--text-secondary);">
              <li style="margin-bottom: 8px;">✓ Company Profile hingga 5 Halaman</li>
              <li style="margin-bottom: 8px;">✓ Desain Eksklusif Sesuai Brand Identity</li>
              <li style="margin-bottom: 8px;">✓ Optimasi SEO On-Page Lokal</li>
              <li style="margin-bottom: 8px;">✓ Galeri Portofolio &amp; Katalog Dinamis</li>
              <li style="margin-bottom: 8px;">✓ 3x Revisi &amp; Support Prioritas 1 Bulan</li>
            </ul>
            <a href="/kontak" data-route="/kontak" class="btn btn-primary btn-full">Pilih Paket Bisnis</a>
          </div>

          <div class="card pricing-card">
            <h3 style="font-size: 1.3rem;">Custom Web App</h3>
            <p class="text-muted" style="margin: 8px 0 16px; font-size: 0.9rem;">Untuk alur bisnis unik, sistem order khusus, dan integrasi API.</p>
            <div style="font-size: 1.8rem; font-weight: 800; margin-bottom: 20px;">Mulai Rp 5.000.000</div>
            <ul style="margin-bottom: 24px; font-size: 0.92rem; color: var(--text-secondary);">
              <li style="margin-bottom: 8px;">✓ Sistem Web Sesuai Alur Bisnis Unik</li>
              <li style="margin-bottom: 8px;">✓ Dashboard Internal &amp; Laporan Rekap</li>
              <li style="margin-bottom: 8px;">✓ Multi-Role Hak Akses Admin &amp; Staff</li>
              <li style="margin-bottom: 8px;">✓ Pelatihan Penggunaan Lengkap</li>
              <li style="margin-bottom: 8px;">✓ Maintenance &amp; Pendampingan 3 Bulan</li>
            </ul>
            <a href="/kontak" data-route="/kontak" class="btn btn-secondary btn-full">Ajukan Spesifikasi</a>
          </div>
        </div>

        <div class="card" style="padding: 36px; text-align: center; max-width: 780px; margin: 0 auto;">
          <h3>Butuh Penyesuaian Fitur Tertentu?</h3>
          <p class="text-secondary" style="margin: 12px 0 24px;">
            Setiap bisnis memiliki keunikan masing-masing. Diskusikan kebutuhan spesifik Anda bersama tim teknis kami secara langsung.
          </p>
          <a href="/kontak" data-route="/kontak" class="btn btn-whatsapp">
            Hubungi via WhatsApp Resmi
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderAutomationServiceView() {
  document.title = `Jasa Otomasi Google Apps Script & Workflow | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  app.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <span class="badge-pill badge-purple" style="margin-bottom: 12px;">Tanpa Biaya Server Tambahan</span>
          <h2>Layanan Otomasi Google Apps Script</h2>
          <p>Ubah Google Sheets dan Google Workspace Anda menjadi mesin operasional otomatis yang bekerja 24/7.</p>
        </div>

        <div class="grid-3" style="margin-bottom: 48px;">
          <div class="card">
            <div class="service-icon-box">📊</div>
            <h3>Otomasi Rekap Transaksi</h3>
            <p class="text-secondary">Pencatatan omzet harian, laporan laba rugi, dan kalkulasi komisi otomatis tanpa perlu rumus Excel yang rumit.</p>
          </div>
          <div class="card">
            <div class="service-icon-box">🧾</div>
            <h3>Generate PDF Invoice Instan</h3>
            <p class="text-secondary">Dari form input pemesanan langsung terbit nota / kwitansi resmi format PDF rapi yang dikirim ke pelanggan.</p>
          </div>
          <div class="card">
            <div class="service-icon-box">💬</div>
            <h3>Notifikasi Bot WhatsApp / Email</h3>
            <p class="text-secondary">Peringatan otomatis saat stok barang menipis, konfirmasi pesanan baru masuk, atau pengingat jatuh tempo.</p>
          </div>
        </div>

        <div class="card" style="padding: 36px; margin-bottom: 40px;">
          <h3 style="font-size: 1.3rem; margin-bottom: 16px;">Mengapa Google Apps Script Pilihan Terbaik untuk UMKM?</h3>
          <div class="grid-2">
            <div>
              <p class="text-secondary" style="margin-bottom: 14px;">
                <strong>1. Nol Biaya Hosting:</strong> Berjalan langsung di infrastruktur cloud Google secara gratis menggunakan akun Google reguler atau Workspace Anda.
              </p>
              <p class="text-secondary">
                <strong>2. Data Aman di Akun Anda Sendiri:</strong> Anda memegang 100% kepemilikan data spreadsheet tanpa khawatir data bocor ke platform pihak ketiga.
              </p>
            </div>
            <div>
              <p class="text-secondary" style="margin-bottom: 14px;">
                <strong>3. Terintegrasi Penuh:</strong> Tersambung langsung dengan Google Sheets, Forms, Docs, Gmail, dan Google Drive.
              </p>
              <p class="text-secondary">
                <strong>4. Mudah Dipelihara:</strong> Tim internal Anda tetap bisa mengedit tabel seperti menggunakan Excel biasa.
              </p>
            </div>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="/kontak" data-route="/kontak" class="btn btn-primary btn-lg">
            Konsultasikan Alur Usaha Anda Sekarang
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderTutorialListView() {
  document.title = `Tutorial & Artikel Digital | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  const listHtml = STATE.articles.map(a => `
    <article class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <span class="badge-pill badge-purple" style="margin-bottom: 12px;">${escapeHtml(a.category)}</span>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 10px;">${escapeHtml(a.title)}</h3>
        <p class="text-secondary" style="font-size: 0.92rem; margin-bottom: 18px; line-height: 1.6;">${escapeHtml(a.excerpt)}...</p>
      </div>
      <div>
        <a href="/tutorial/${a.slug}" data-route="/tutorial/${a.slug}" class="btn btn-outline btn-sm">
          Baca Tutorial Lengkap &rarr;
        </a>
      </div>
    </article>
  `).join('');

  app.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Pusat Edukasi &amp; Panduan Praktis</h2>
          <p>Kumpulan artikel dan tutorial bermanfaat untuk kreator affiliate, pemilik bisnis online, dan pegiat otomatisasi.</p>
        </div>
        <div class="grid-3">
          ${listHtml || '<p class="text-muted">Belum ada artikel yang dipublikasikan.</p>'}
        </div>
      </div>
    </section>
  `;
}

async function renderTutorialDetailView(slug) {
  const app = document.getElementById('app-main');
  app.innerHTML = `<div class="container section text-center"><p class="text-muted">Memuat artikel...</p></div>`;

  try {
    const res = await fetch(`/api/content/${slug}`);
    const data = await res.json();
    if (!data.success || !data.article) {
      app.innerHTML = `
        <div class="container section text-center">
          <h2>Tutorial Tidak Ditemukan</h2>
          <a href="/tutorial" data-route="/tutorial" class="btn btn-primary" style="margin-top: 16px;">Kembali ke Tutorial</a>
        </div>
      `;
      return;
    }

    const art = data.article;
    document.title = `${art.title} | ARRA DIGITAL`;

    app.innerHTML = `
      <section class="section">
        <div class="container" style="max-width: 800px;">
          <nav style="margin-bottom: 24px; font-size: 0.9rem; color: var(--text-muted);">
            <a href="/" data-route="/" class="text-muted">Beranda</a> &rsaquo;
            <a href="/tutorial" data-route="/tutorial" class="text-muted">Tutorial</a> &rsaquo;
            <span class="text-blue">${escapeHtml(art.category)}</span>
          </nav>

          <article class="card" style="padding: 40px;">
            <span class="badge-pill badge-purple" style="margin-bottom: 14px;">${escapeHtml(art.category)}</span>
            <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 16px; line-height: 1.25;">
              ${escapeHtml(art.title)}
            </h1>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 28px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
              Dipublikasikan oleh Tim Arra Digital &middot; Diperbarui ${art.published_at.slice(0, 10)}
            </div>

            <div style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.8; white-space: pre-wrap;">
              ${escapeHtml(art.body)}
            </div>

            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <a href="/tutorial" data-route="/tutorial" class="text-blue" style="font-weight: 600;">&larr; Kembali ke Semua Tutorial</a>
              <a href="/produk" data-route="/produk" class="btn btn-primary btn-sm">Lihat Produk Pendukung</a>
            </div>
          </article>
        </div>
      </section>
    `;
  } catch (err) {
    app.innerHTML = `<div class="container section text-center"><p class="text-muted">Gagal memuat artikel.</p></div>`;
  }
}

function renderAboutView() {
  document.title = `Tentang Kami | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 860px;">
        <div class="section-header">
          <h2>Tentang Arra Digital</h2>
          <p>Membantu pelaku bisnis dan kreator konten Indonesia mengadopsi teknologi digital secara cerdas, jujur, dan terjangkau.</p>
        </div>

        <div class="card" style="padding: 36px; margin-bottom: 30px;">
          <h3 style="font-size: 1.3rem; margin-bottom: 14px;">Visi Kami</h3>
          <p class="text-secondary" style="line-height: 1.7; margin-bottom: 20px;">
            Arra Digital lahir dari pemahaman nyata bahwa banyak UMKM dan kreator lokal menghadapi kendala biaya dan teknis saat ingin beralih ke digital. Kami hadir sebagai jembatan yang menyediakan produk digital siap pakai, template prompt AI aplikatif, dan solusi otomasi tanpa membebani biaya langganan yang mahal.
          </p>

          <h3 style="font-size: 1.3rem; margin-bottom: 14px;">Komitmen Etika &amp; Transparansi</h3>
          <ul style="color: var(--text-secondary); line-height: 1.8;">
            <li>✓ <strong>Nol Klaim Palsu:</strong> Kami tidak pernah membuat testimoni rekayasa, angka penjualan buatan, atau janji kekayaan instan.</li>
            <li>✓ <strong>Produk Orisinal &amp; Legal:</strong> Kami tidak menjual akun ilegal pihak ketiga. Layanan kami berfokus pada edukasi, implementasi, template karya orisinal, dan otomasi resmi.</li>
            <li>✓ <strong>Harga Transparan:</strong> Semua biaya dijelaskan di awal tanpa biaya tersembunyi.</li>
          </ul>
        </div>

        <div class="card" style="padding: 36px; text-align: center;">
          <h3>Ingin Berkolaborasi Bersama Kami?</h3>
          <p class="text-secondary" style="margin: 10px 0 24px;">Hubungi tim kami untuk konsultasi ide proyek website atau sistem otomatisasi bisnis Anda.</p>
          <a href="/kontak" data-route="/kontak" class="btn btn-primary">Halaman Kontak Resmi</a>
        </div>
      </div>
    </section>
  `;
}

function renderContactView() {
  document.title = `Kontak Resmi | ARRA DIGITAL`;
  const app = document.getElementById('app-main');
  const wa = STATE.settings.public_whatsapp || '6281317028494';
  const email = STATE.settings.public_contact_email || 'halo@arradigital.my.id';

  app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 900px;">
        <div class="section-header">
          <h2>Hubungi Arra Digital</h2>
          <p>Diskusikan kebutuhan produk digital, jasa website, atau otomatisasi langsung bersama tim kami.</p>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 style="font-size: 1.25rem; margin-bottom: 16px;">Saluran Komunikasi Resmi</h3>
            <div style="margin-bottom: 24px;">
              <span class="text-muted" style="font-size: 0.85rem; display: block; text-transform: uppercase;">WhatsApp Bisnis</span>
              <div style="font-size: 1.2rem; font-weight: 700; margin: 4px 0 12px; color: #FFFFFF;">+${escapeHtml(wa)}</div>
              <a href="https://wa.me/${wa}?text=${encodeURIComponent('Halo Arra Digital, saya ingin konsultasi layanan.')}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">
                Chat Langsung via WhatsApp
              </a>
            </div>

            <div style="margin-bottom: 24px;">
              <span class="text-muted" style="font-size: 0.85rem; display: block; text-transform: uppercase;">Email Dukungan</span>
              <div style="font-size: 1.1rem; font-weight: 600; margin: 4px 0 8px; color: #FFFFFF;">${escapeHtml(email)}</div>
              <a href="mailto:${email}" class="text-blue" style="font-size: 0.9rem;">Kirim Pesan Email &rarr;</a>
            </div>

            <div>
              <span class="text-muted" style="font-size: 0.85rem; display: block; text-transform: uppercase;">Domain Resmi</span>
              <div style="font-size: 1.05rem; font-weight: 600; margin-top: 4px; color: #FFFFFF;">https://${STATE.settings.domain || 'arradigital.my.id'}</div>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size: 1.25rem; margin-bottom: 16px;">Kirim Pesan Inquiry</h3>
            <form onsubmit="handleContactInquiry(event)">
              <div class="form-group">
                <label>Nama Lengkap</label>
                <input type="text" id="inq_name" class="form-control" required placeholder="Nama Anda" />
              </div>
              <div class="form-group">
                <label>Nomor WhatsApp</label>
                <input type="tel" id="inq_wa" class="form-control" required placeholder="08xxxxxxxxxx" />
              </div>
              <div class="form-group">
                <label>Topik Kebutuhan</label>
                <select id="inq_topic" class="form-control">
                  <option value="Produk Digital / Template">Produk Digital / Template</option>
                  <option value="Pembuatan Website">Pembuatan Website</option>
                  <option value="Otomasi Google Apps Script">Otomasi Google Apps Script</option>
                  <option value="Konsultasi Solusi AI">Konsultasi Solusi AI</option>
                  <option value="Lainnya">Pertanyaan Lainnya</option>
                </select>
              </div>
              <div class="form-group">
                <label>Pesan Singkat</label>
                <textarea id="inq_msg" class="form-control" placeholder="Ceritakan rencana atau kebutuhan bisnis Anda..." rows="3"></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-full">Kirim via WhatsApp</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
}

function handleContactInquiry(e) {
  e.preventDefault();
  const name = document.getElementById('inq_name').value.trim();
  const wa = document.getElementById('inq_wa').value.trim();
  const topic = document.getElementById('inq_topic').value;
  const msg = document.getElementById('inq_msg').value.trim();

  const businessWa = STATE.settings.public_whatsapp || '6281317028494';
  const text = `Halo Arra Digital,\n\nNama: ${name}\nNo WA: ${wa}\nTopik: ${topic}\nPesan: ${msg || '-'}\n\nSaya ingin konsultasi lebih lanjut. Terima kasih!`;
  window.open(`https://wa.me/${businessWa}?text=${encodeURIComponent(text)}`, '_blank');
}

function renderPrivacyPolicyView() {
  document.title = `Kebijakan Privasi | ARRA DIGITAL`;
  const app = document.getElementById('app-main');
  app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 800px;">
        <div class="card" style="padding: 40px;">
          <span class="badge-pill badge-sample" style="margin-bottom: 12px;">Draft Dokumen Kebijakan (Perlu Tinjauan Pemilik)</span>
          <h1 style="font-size: 2rem; margin-bottom: 20px;">Kebijakan Privasi</h1>
          <p class="text-secondary" style="line-height: 1.7; margin-bottom: 18px;">
            Di <strong>ARRA DIGITAL</strong> (tersedia di <code>arradigital.my.id</code>), privasi pengunjung dan pelanggan adalah prioritas utama kami. Dokumen kebijakan privasi ini menguraikan jenis informasi yang kami kumpulkan dan cara kami menggunakannya.
          </p>

          <h3 style="margin: 24px 0 10px;">1. Data yang Kami Kumpulkan</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Kami hanya mengumpulkan data yang benar-benar dibutuhkan untuk memproses pemesanan dan komunikasi layanan, yaitu nama pelanggan, nomor WhatsApp, alamat email (opsional), dan catatan pesanan. Kami tidak menyimpan data kartu kredit atau kredensial perbankan Anda.
          </p>

          <h3 style="margin: 24px 0 10px;">2. Penggunaan Data</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Informasi yang dikumpulkan digunakan semata-mata untuk verifikasi pesanan, pengiriman tautan produk digital, penyelesaian dukungan teknis, dan komunikasi terkait layanan yang Anda minta. Kami tidak pernah menjual atau menyewakan data pribadi Anda kepada pihak ketiga.
          </p>

          <h3 style="margin: 24px 0 10px;">3. Hak Pengguna</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Anda memiliki hak untuk meminta rincian data Anda yang tersimpan di sistem kami atau meminta penghapusan riwayat kontak kapan saja dengan menghubungi tim kami melalui <code>${STATE.settings.public_contact_email}</code>.
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderTermsView() {
  document.title = `Syarat & Ketentuan | ARRA DIGITAL`;
  const app = document.getElementById('app-main');
  app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 800px;">
        <div class="card" style="padding: 40px;">
          <span class="badge-pill badge-sample" style="margin-bottom: 12px;">Draft Dokumen Kebijakan (Perlu Tinjauan Pemilik)</span>
          <h1 style="font-size: 2rem; margin-bottom: 20px;">Syarat &amp; Ketentuan Layanan</h1>
          
          <h3 style="margin: 20px 0 10px;">1. Ketentuan Umum</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Dengan mengakses website <code>arradigital.my.id</code> atau melakukan pemesanan produk dan layanan kami, Anda menyetujui syarat dan ketentuan yang berlaku.
          </p>

          <h3 style="margin: 20px 0 10px;">2. Lisensi Produk Digital</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Seluruh template, prompt pack, dan dokumen digital yang dibeli di Arra Digital diberikan hak guna pakai untuk operasional pribadi atau bisnis pembeli. Dilarang mendistribusikan ulang, menjual kembali secara massal, atau membagikan file unduhan tanpa izin tertulis dari Arra Digital.
          </p>

          <h3 style="margin: 20px 0 10px;">3. Ketentuan Jasa Website &amp; Otomasi</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Pengerjaan jasa berbasis kesepakatan ruang lingkup (scope of work) transparan. Skema pembayaran menggunakan Down Payment (DP) 50% di awal sebelum pengerjaan dan pelunasan 50% setelah pengujian selesai.
          </p>

          <h3 style="margin: 20px 0 10px;">4. Batasan Tanggung Jawab</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Solusi dan tools AI disajikan sebagai alat bantu efisiensi kerja. Kinerja pemasaran, omzet, dan algoritma media sosial pihak ketiga (TikTok, Meta, Google) sepenuhnya berada di luar kendali langsung Arra Digital.
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderRefundView() {
  document.title = `Kebijakan Pengembalian & Refund | ARRA DIGITAL`;
  const app = document.getElementById('app-main');
  app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 800px;">
        <div class="card" style="padding: 40px;">
          <span class="badge-pill badge-sample" style="margin-bottom: 12px;">Draft Dokumen Kebijakan (Perlu Tinjauan Pemilik)</span>
          <h1 style="font-size: 2rem; margin-bottom: 20px;">Kebijakan Pengembalian Dana (Refund)</h1>

          <h3 style="margin: 20px 0 10px;">1. Produk Digital yang Dapat Diunduh</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Mengingat sifat produk digital yang langsung dapat diakses dan disalin seketika setelah tautan diberikan, pembelian produk digital bersifat final dan tidak dapat dibatalkan setelah akses tautan dibuka. Namun jika file terbukti rusak atau tidak sesuai deskripsi, kami wajib menggantinya atau memberikan pengembalian dana 100%.
          </p>

          <h3 style="margin: 20px 0 10px;">2. Layanan Jasa Website &amp; Otomasi</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Jika pembatalan dilakukan sebelum pengerjaan dimulai, DP akan dikembalikan dikurangi biaya konsultasi awal yang disepakati (maksimal 20%). Jika pengerjaan telah berjalan melewati tahap desain atau koding, DP tidak dapat ditarik kembali karena telah dialokasikan untuk waktu kerja tim pengembang.
          </p>

          <h3 style="margin: 20px 0 10px;">3. Cara Mengajukan Pertanyaan Refund</h3>
          <p class="text-secondary" style="line-height: 1.7;">
            Silakan hubungi WhatsApp resmi kami dengan menyertakan Nomor ID Pesanan (misal ARRA-YYYYMMDD-XXXX) dan bukti transaksi untuk ditinjau oleh manajemen dalam waktu 1x24 jam kerja.
          </p>
        </div>
      </div>
    </section>
  `;
}

async function renderAdminView() {
  document.title = `Admin Dashboard | ARRA DIGITAL`;
  const app = document.getElementById('app-main');

  if (!STATE.adminToken) {
    renderAdminLoginScreen(app);
    return;
  }

  try {
    const res = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${STATE.adminToken}` }
    });
    const data = await res.json();
    if (!data.success) {
      STATE.adminToken = null;
      localStorage.removeItem('arra_admin_token');
      renderAdminLoginScreen(app);
      return;
    }
    STATE.adminUser = data.user;
    renderAdminDashboardScreen(app);
  } catch (err) {
    STATE.adminToken = null;
    renderAdminLoginScreen(app);
  }
}

function renderAdminLoginScreen(container) {
  container.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 440px;">
        <div class="card" style="padding: 36px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">🔒</div>
            <h2 style="font-size: 1.6rem; font-weight: 800;">Portal Administrator</h2>
            <p class="text-muted" style="font-size: 0.9rem; margin-top: 4px;">Akses terproteksi sisi server ARRA DIGITAL</p>
          </div>

          <form onsubmit="handleAdminLogin(event)">
            <div class="form-group">
              <label>Username</label>
              <input type="text" id="admin_login_user" class="form-control" required autocomplete="username" placeholder="Masukkan username" />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="admin_login_pass" class="form-control" required autocomplete="current-password" placeholder="••••••••" />
            </div>
            <div id="admin-login-error" style="color: #F87171; font-size: 0.88rem; margin-bottom: 14px; display: none;"></div>
            <button type="submit" class="btn btn-primary btn-full" id="btn-admin-login">
              Masuk ke Dashboard
            </button>
          </form>
        </div>
      </div>
    </section>
  `;
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-admin-login');
  const errBox = document.getElementById('admin-login-error');
  const user = document.getElementById('admin_login_user').value.trim();
  const pass = document.getElementById('admin_login_pass').value;

  btn.disabled = true;
  btn.textContent = 'Memverifikasi...';
  errBox.style.display = 'none';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (!data.success) {
      errBox.textContent = data.error || 'Username atau password salah.';
      errBox.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Masuk ke Dashboard';
      return;
    }

    STATE.adminToken = data.token;
    STATE.adminUser = data.username;
    localStorage.setItem('arra_admin_token', data.token);
    renderAdminView();
  } catch (err) {
    errBox.textContent = 'Gagal terhubung ke server.';
    errBox.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Masuk ke Dashboard';
  }
}

function handleAdminLogout() {
  STATE.adminToken = null;
  STATE.adminUser = null;
  localStorage.removeItem('arra_admin_token');
  renderAdminView();
}

async function renderAdminDashboardScreen(container) {
  container.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div style="padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle);">
          <div style="font-weight: 800; font-size: 1.1rem; color: #FFFFFF;">ARRA ADMIN</div>
          <div class="text-muted" style="font-size: 0.8rem;">User: ${escapeHtml(STATE.adminUser || 'admin')}</div>
        </div>
        <nav class="admin-nav-list">
          <button class="admin-nav-item ${STATE.activeAdminTab === 'dashboard' ? 'active' : ''}" onclick="switchAdminTab('dashboard')">📊 Ringkasan</button>
          <button class="admin-nav-item ${STATE.activeAdminTab === 'products' ? 'active' : ''}" onclick="switchAdminTab('products')">📦 Kelola Produk</button>
          <button class="admin-nav-item ${STATE.activeAdminTab === 'orders' ? 'active' : ''}" onclick="switchAdminTab('orders')">🛒 Kelola Pesanan</button>
          <button class="admin-nav-item ${STATE.activeAdminTab === 'customers' ? 'active' : ''}" onclick="switchAdminTab('customers')">👥 Pelanggan</button>
          <button class="admin-nav-item ${STATE.activeAdminTab === 'settings' ? 'active' : ''}" onclick="switchAdminTab('settings')">⚙️ Pengaturan</button>
          <button class="admin-nav-item" style="color: #F87171; margin-top: 20px;" onclick="handleAdminLogout()">🚪 Keluar</button>
        </nav>
      </aside>

      <main class="admin-content" id="admin-main-area">
        <div class="text-muted">Memuat data panel admin...</div>
      </main>
    </div>
  `;

  loadAdminTabData(STATE.activeAdminTab);
}

function switchAdminTab(tab) {
  STATE.activeAdminTab = tab;
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
  });
  loadAdminTabData(tab);
}

async function loadAdminTabData(tab) {
  const mainArea = document.getElementById('admin-main-area');
  const headers = { Authorization: `Bearer ${STATE.adminToken}` };

  if (tab === 'dashboard') {
    try {
      const res = await fetch('/api/admin/dashboard', { headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const m = data.metrics;
      const recentHtml = (m.recentOrders || []).map(o => `
        <tr>
          <td><code>${o.id}</code></td>
          <td>${escapeHtml(o.customer_name)}</td>
          <td>${escapeHtml(o.product_name)}</td>
          <td><strong>${formatIDR(o.amount)}</strong></td>
          <td><span class="badge-pill ${o.status === 'PAID' || o.status === 'COMPLETED' ? 'badge-success' : 'badge-pending'}">${o.status}</span></td>
          <td>${o.created_at.slice(0, 10)}</td>
        </tr>
      `).join('') || `<tr><td colspan="6" class="text-center text-muted">Belum ada pesanan masuk.</td></tr>`;

      mainArea.innerHTML = `
        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 24px;">Ringkasan Usaha Real-Time</h2>
        
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-title">Total Pesanan</div>
            <div class="stat-number">${m.totalOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Menunggu Verifikasi (Pending)</div>
            <div class="stat-number" style="color: var(--color-warning);">${m.pendingOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Omzet Terverifikasi</div>
            <div class="stat-number" style="color: var(--color-success);">${formatIDR(m.totalRevenue)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Produk Aktif</div>
            <div class="stat-number">${m.totalProducts}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Pelanggan</div>
            <div class="stat-number">${m.totalCustomers}</div>
          </div>
        </div>

        <h3 style="font-size: 1.3rem; margin: 32px 0 16px;">Pesanan Terbaru Masuk</h3>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Nama Pelanggan</th>
                <th>Produk</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${recentHtml}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      mainArea.innerHTML = `<div class="card" style="color: #F87171;">Gagal memuat ringkasan: ${escapeHtml(e.message)}</div>`;
    }
  } else if (tab === 'products') {
    try {
      const res = await fetch('/api/admin/products', { headers });
      const data = await res.json();
      const products = data.products || [];

      const rows = products.map(p => `
        <tr>
          <td>
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${escapeHtml(p.name)}" class="admin-table-product-thumb" onclick="openImageZoom('${p.image_url}', '${escapeHtml(p.name)}')" title="Klik untuk pratinjau zoom" />`
              : `<div class="admin-table-product-nothumb" title="Belum ada gambar">📦</div>`
            }
          </td>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td><span class="badge-pill badge-purple">${escapeHtml(p.category)}</span></td>
          <td>${formatIDR(p.price)}</td>
          <td><span class="badge-pill ${p.status === 'active' ? 'badge-success' : 'badge-pending'}">${p.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openAdminEditProductModal('${p.id}')">Edit &amp; Foto</button>
          </td>
        </tr>
      `).join('');

      mainArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.8rem; font-weight: 800;">Manajemen Produk &amp; Layanan</h2>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">Kelola produk, upload gambar sampul produk dipasarkan, deskripsi, dan harga.</p>
          </div>
          <button class="btn btn-primary" onclick="openAdminEditProductModal(null)">+ Tambah Produk Baru</button>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 72px;">Sampul</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga (IDR)</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (e) {
      mainArea.innerHTML = `<div class="card" style="color: #F87171;">Error: ${escapeHtml(e.message)}</div>`;
    }
  } else if (tab === 'orders') {
    try {
      const res = await fetch('/api/admin/orders', { headers });
      const data = await res.json();
      const orders = data.orders || [];

      const rows = orders.map(o => `
        <tr>
          <td><code>${o.id}</code></td>
          <td>${escapeHtml(o.customer_name)}<br><small class="text-muted">${escapeHtml(o.customer_whatsapp || '-')}</small></td>
          <td>${escapeHtml(o.product_name)}</td>
          <td><strong>${formatIDR(o.amount)}</strong></td>
          <td><span class="badge-pill ${o.status === 'PAID' || o.status === 'COMPLETED' ? 'badge-success' : 'badge-pending'}">${o.status}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openAdminEditOrderModal('${o.id}')">Kelola</button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" class="text-center text-muted">Belum ada pesanan terdaftar.</td></tr>`;

      mainArea.innerHTML = `
        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 24px;">Daftar Pesanan &amp; Verifikasi</h2>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Pelanggan</th>
                <th>Produk</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (e) {
      mainArea.innerHTML = `<div class="card" style="color: #F87171;">Error: ${escapeHtml(e.message)}</div>`;
    }
  } else if (tab === 'customers') {
    try {
      const res = await fetch('/api/admin/customers', { headers });
      const data = await res.json();
      const customers = data.customers || [];

      const rows = customers.map(c => `
        <tr>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.whatsapp || '-')}</td>
          <td>${escapeHtml(c.email || '-')}</td>
          <td>${c.total_orders} Pesanan</td>
          <td>${c.created_at.slice(0, 10)}</td>
        </tr>
      `).join('') || `<tr><td colspan="5" class="text-center text-muted">Belum ada data pelanggan tercatat.</td></tr>`;

      mainArea.innerHTML = `
        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 24px;">Direktori Pelanggan</h2>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Nama Pelanggan</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Total Order</th>
                <th>Terdaftar</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (e) {
      mainArea.innerHTML = `<div class="card" style="color: #F87171;">Error: ${escapeHtml(e.message)}</div>`;
    }
  } else if (tab === 'settings') {
    try {
      const res = await fetch('/api/admin/settings', { headers });
      const data = await res.json();
      const s = data.settings || {};

      mainArea.innerHTML = `
        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 24px;">Pengaturan Sistem &amp; Database</h2>
        
        <!-- Integrasi Google Apps Script (Spreadsheet) -->
        <div class="card" style="max-width: 680px; padding: 24px; margin-bottom: 24px; border: 1px solid var(--accent-blue);">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">🔗 Integrasi Google Apps Script (Spreadsheet DB)</h3>
          <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 16px;">
            Hubungkan website ini langsung ke Google Spreadsheet Anda. Seluruh produk, pesanan, dan pengaturan akan tersinkronisasi otomatis tanpa biaya server bulanan.
          </p>
          <div class="form-group">
            <label>Google Apps Script Web App URL (berakhiran /exec)</label>
            <input type="url" id="set_gas_url" class="form-control" value="${escapeHtml(localStorage.getItem('arra_gas_url') || '')}" placeholder="https://script.google.com/macros/s/AKfycb.../exec" />
            <small class="text-muted" style="font-size: 0.78rem; display: block; margin-top: 4px;">Kode script lengkap tersedia di file <code>google-apps-script/Code.gs</code>.</small>
          </div>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleTestGasConnection()">⚡ Uji &amp; Simpan Koneksi Sheets</button>
            <span id="gas-test-result" style="font-size: 0.85rem;"></span>
          </div>
        </div>

        <div class="card" style="max-width: 680px; padding: 32px;">
          <form onsubmit="handleAdminSaveSettings(event)">
            <div class="form-group">
              <label>Nama Bisnis (Brand)</label>
              <input type="text" id="set_business_name" class="form-control" value="${escapeHtml(s.business_name || '')}" required />
            </div>
            <div class="form-group">
              <label>Tagline</label>
              <input type="text" id="set_tagline" class="form-control" value="${escapeHtml(s.tagline || '')}" required />
            </div>
            <div class="form-group">
              <label>Nomor WhatsApp Bisnis (Format 628xxxxxxxx)</label>
              <input type="text" id="set_public_whatsapp" class="form-control" value="${escapeHtml(s.public_whatsapp || '')}" required />
            </div>
            <div class="form-group">
              <label>Email Kontak Publik</label>
              <input type="email" id="set_public_contact_email" class="form-control" value="${escapeHtml(s.public_contact_email || '')}" required />
            </div>
            <div class="form-group">
              <label>Domain Resmi</label>
              <input type="text" id="set_domain" class="form-control" value="${escapeHtml(s.domain || 'arradigital.my.id')}" required />
            </div>
            <div id="settings-save-feedback" style="margin-bottom: 14px; font-size: 0.9rem; display: none;"></div>
            <button type="submit" class="btn btn-primary" id="btn-save-settings">Simpan Pengaturan</button>
          </form>
        </div>
      `;
    } catch (e) {
      mainArea.innerHTML = `<div class="card" style="color: #F87171;">Error: ${escapeHtml(e.message)}</div>`;
    }
  }
}

window.handleTestGasConnection = async function() {
  const urlEl = document.getElementById('set_gas_url');
  const resEl = document.getElementById('gas-test-result');
  if (!urlEl || !resEl) return;
  const url = urlEl.value.trim();

  if (!url) {
    localStorage.removeItem('arra_gas_url');
    resEl.innerHTML = '<span style="color: #FBBF24;">Mode Standalone (Database Lokal) Aktif.</span>';
    return;
  }

  resEl.innerHTML = '<span style="color: #94A3B8;">Menguji koneksi ke Google Spreadsheet...</span>';
  try {
    const res = await fetch(`${url}?action=ping`);
    const json = await res.json();
    if (json.success || json.status === 'ok') {
      localStorage.setItem('arra_gas_url', url);
      resEl.innerHTML = '<span style="color: #34D399; font-weight: 600;">✓ Berhasil Terhubung ke Google Spreadsheet!</span>';
    } else {
      resEl.innerHTML = '<span style="color: #F87171;">Respons tidak sesuai dari script.</span>';
    }
  } catch (err) {
    resEl.innerHTML = '<span style="color: #F87171;">Gagal menghubungi URL. Pastikan akses Web App disetel ke "Anyone".</span>';
  }
};

async function handleAdminSaveSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-settings');
  const fb = document.getElementById('settings-save-feedback');
  btn.disabled = true;

  const gasUrlInput = document.getElementById('set_gas_url');
  if (gasUrlInput) {
    const gUrl = gasUrlInput.value.trim();
    if (gUrl) localStorage.setItem('arra_gas_url', gUrl);
    else localStorage.removeItem('arra_gas_url');
  }

  const newSettings = {
    business_name: document.getElementById('set_business_name').value.trim(),
    tagline: document.getElementById('set_tagline').value.trim(),
    public_whatsapp: document.getElementById('set_public_whatsapp').value.trim(),
    public_contact_email: document.getElementById('set_public_contact_email').value.trim(),
    domain: document.getElementById('set_domain').value.trim()
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STATE.adminToken}`
      },
      body: JSON.stringify(newSettings)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    fb.textContent = '✓ Pengaturan berhasil disimpan!';
    fb.style.color = '#34D399';
    fb.style.display = 'block';
    STATE.settings = { ...STATE.settings, ...newSettings };
    updateGlobalBranding();
  } catch (err) {
    fb.textContent = 'Gagal menyimpan pengaturan: ' + err.message;
    fb.style.color = '#F87171';
    fb.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}

// ============================================================================
// 4. ORDER MODAL & SAFE CHECKOUT
// ============================================================================
let currentOrderProduct = null;

function openOrderModal(productId, productName, productPrice) {
  currentOrderProduct = { id: productId, name: productName, price: productPrice };
  const modal = document.getElementById('order-modal');
  const modalBody = document.getElementById('order-modal-body');

  modalBody.innerHTML = `
    <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">Pemesanan Produk</h3>
    <div style="background-color: var(--bg-surface); padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 20px;">
      <div style="font-weight: 700; font-size: 1.05rem;">${escapeHtml(productName)}</div>
      <div style="color: var(--accent-blue); font-weight: 800; margin-top: 4px;">${formatIDR(productPrice)}</div>
    </div>

    <form onsubmit="handleOrderSubmit(event)">
      <div class="form-group">
        <label>Nama Lengkap Anda *</label>
        <input type="text" id="ord_cust_name" class="form-control" required placeholder="Budi Santoso" />
      </div>
      <div class="form-group">
        <label>Nomor WhatsApp (Aktif) *</label>
        <input type="tel" id="ord_cust_wa" class="form-control" required placeholder="08xxxxxxxxxx" />
      </div>
      <div class="form-group">
        <label>Alamat Email (Opsional)</label>
        <input type="email" id="ord_cust_email" class="form-control" placeholder="nama@email.com" />
      </div>
      <div class="form-group">
        <label>Catatan / Permintaan Khusus (Opsional)</label>
        <textarea id="ord_cust_notes" class="form-control" rows="2" placeholder="Catatan tambahan..."></textarea>
      </div>

      <div id="order-error-feedback" style="color: #F87171; font-size: 0.88rem; margin-bottom: 12px; display: none;"></div>

      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">Batal</button>
        <button type="submit" class="btn btn-primary" id="btn-submit-order" style="flex: 1;">
          Konfirmasi &amp; Lanjut WhatsApp
        </button>
      </div>
    </form>
  `;

  modal.classList.add('open');
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) modal.classList.remove('open');
}

async function handleOrderSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-order');
  const errBox = document.getElementById('order-error-feedback');
  btn.disabled = true;
  btn.textContent = 'Membuat Pesanan...';
  errBox.style.display = 'none';

  const payload = {
    product_id: currentOrderProduct.id,
    customer_name: document.getElementById('ord_cust_name').value.trim(),
    customer_whatsapp: document.getElementById('ord_cust_wa').value.trim(),
    customer_email: document.getElementById('ord_cust_email').value.trim() || null,
    notes: document.getElementById('ord_cust_notes').value.trim() || null
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal membuat pesanan');

    const order = data.order;
    const waUrl = data.whatsappUrl;

    const modalBody = document.getElementById('order-modal-body');
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 12px 0;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
        <h3 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">Pesanan Berhasil Dicatat!</h3>
        <p class="text-secondary" style="font-size: 0.95rem; margin-bottom: 20px;">
          Pesanan Anda telah resmi dibuat dengan status <strong>PENDING</strong> di server kami.
        </p>

        <div style="background-color: var(--bg-surface); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 24px; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span class="text-muted">ID Pesanan:</span>
            <code style="font-weight: 700; color: var(--accent-blue);">${order.orderId}</code>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span class="text-muted">Produk:</span>
            <span>${escapeHtml(order.product_name)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-muted">Total Pembayaran:</span>
            <strong>${formatIDR(order.amount)}</strong>
          </div>
        </div>

        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 24px;">
          Silakan klik tombol di bawah ini untuk mengirim detail pesanan langsung ke WhatsApp Arra Digital guna petunjuk pembayaran resmi &amp; serah terima aset.
        </p>

        <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-full btn-lg" onclick="closeOrderModal()">
          Lanjutkan ke WhatsApp Sekarang &rarr;
        </a>
      </div>
    `;
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Konfirmasi & Lanjut WhatsApp';
  }
}

// ============================================================================
// 5. HELPER COMPONENTS & UTILS
// ============================================================================
function getProductThumbnailUrl(p) {
  if (p && p.image_url && typeof p.image_url === 'string' && p.image_url.trim()) {
    return p.image_url.trim();
  }
  const slug = (p && p.slug ? p.slug : '').toLowerCase();
  const name = (p && p.name ? p.name : '').toLowerCase();

  if (slug.includes('affiliate') || name.includes('affiliate')) {
    return '/assets/products/ai-affiliate-starter-kit.jpg';
  }
  if (slug.includes('business') || slug.includes('template') || name.includes('business')) {
    return '/assets/products/business-template-pack.jpg';
  }
  if (slug.includes('website-starter') || name.includes('starter kit') || name.includes('landing page template')) {
    return '/assets/products/website-starter-kit.jpg';
  }
  if (slug.includes('jasa-pembuatan-website') || name.includes('jasa pembuatan website')) {
    return '/assets/products/jasa-pembuatan-website.svg';
  }
  if (slug.includes('otomasi') || slug.includes('apps-script') || name.includes('otomasi')) {
    return '/assets/products/jasa-otomasi-google-apps-script.svg';
  }
  if (slug.includes('laundry') || name.includes('laundry')) {
    return '/assets/products/spreadsheet-laundry-pos-gas.svg';
  }
  if (slug.includes('notion') || name.includes('notion')) {
    return '/assets/products/template-notion-freelance-os.svg';
  }
  return '/assets/products/website-starter-kit.jpg';
}

function renderProductCardHtml(p) {
  const isQuote = p.price === 0;
  const isSample = p.name.includes('Sampel Demo');
  const imgUrl = getProductThumbnailUrl(p);
  const previewFeatures = (p.features || []).slice(0, 3).map(f => `
    <li>
      <span class="feature-check">✓</span>
      <span>${escapeHtml(f)}</span>
    </li>
  `).join('');

  return `
    <article class="card product-card">
      <div class="product-thumb-container">
        <a href="/produk/${p.slug}" data-route="/produk/${p.slug}" class="product-thumb-link" aria-label="Lihat detail ${escapeHtml(p.name)}">
          <img src="${imgUrl}" alt="${escapeHtml(p.name)}" class="product-card-thumb" loading="lazy" onerror="this.onerror=null;this.src='/assets/products/website-starter-kit.jpg';">
        </a>
        <div class="product-thumb-badge-overlay">
          <span class="badge-pill badge-purple">${escapeHtml(p.category)}</span>
          ${isSample ? '<span class="badge-pill badge-sample">Sampel Demo</span>' : ''}
        </div>
        <button type="button" class="product-thumb-zoom-trigger" onclick="event.stopPropagation(); openImageZoom('${imgUrl}', '${escapeJs(p.name)}')" title="Lihat gambar produk dengan jelas (Perbesar)" aria-label="Perbesar gambar ${escapeHtml(p.name)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <span>Perbesar</span>
        </button>
      </div>
      <div class="product-card-body">
        <div class="product-top">
          <h3 class="product-title">
            <a href="/produk/${p.slug}" data-route="/produk/${p.slug}">${escapeHtml(p.name)}</a>
          </h3>
          <p class="product-desc">${escapeHtml(p.short_description || '')}</p>
          <ul class="product-features-preview">
            ${previewFeatures}
          </ul>
        </div>
        <div class="product-bottom">
          <div>
            <span class="product-price-label">Investasi</span>
            <div class="product-price-val">${formatIDR(p.price)}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="/produk/${p.slug}" data-route="/produk/${p.slug}" class="btn btn-secondary btn-sm">Detail</a>
            <button onclick="openOrderModal('${p.id}', '${escapeHtml(p.name)}', ${p.price})" class="btn btn-primary btn-sm">
              ${isQuote ? 'Tanya' : 'Beli'}
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function setProductCategory(cat) {
  STATE.activeCategory = cat;
  renderCatalogView();
}

function handleProductSearch(query) {
  STATE.searchQuery = query;
  renderCatalogView();
}

function toggleFaq(summaryEl) {
  const content = summaryEl.nextElementSibling;
  const isOpen = content.style.display === 'block';
  content.style.display = isOpen ? 'none' : 'block';
  summaryEl.querySelector('span:last-child').textContent = isOpen ? '+' : '−';
}

function copyToClipboard(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '✓ Tersalin!';
    btn.style.color = '#34D399';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
    }, 2000);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

// ============================================================================
// 6. ADMIN MODAL HELPERS (PRODUCTS & ORDERS)
// ============================================================================
let currentEditProductId = null;

function openAdminEditProductModal(productId) {
  currentEditProductId = productId;
  const modal = document.getElementById('order-modal');
  const modalBody = document.getElementById('order-modal-body');

  let prod = {
    id: '',
    name: '',
    slug: '',
    category: 'AI & Affiliate',
    price: 0,
    status: 'active',
    short_description: '',
    description: '',
    image_url: '',
    features: ['Fitur 1', 'Fitur 2'],
    delivery_type: 'digital_download',
    asset_reference: ''
  };

  if (productId) {
    const found = STATE.products.find(p => p.id === productId);
    if (found) prod = { ...prod, ...found };
  }

  const featuresText = Array.isArray(prod.features) ? prod.features.join('\n') : '';

  modalBody.innerHTML = `
    <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 16px;">
      ${productId ? 'Edit Produk' : 'Tambah Produk Baru'}
    </h3>

    <form onsubmit="handleAdminSaveProduct(event)">
      <!-- 1. Foto / Sampul Produk Upload -->
      <div class="form-group" style="margin-bottom: 20px;">
        <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700;">Foto / Sampul Produk Dipasarkan</span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">Format: WebP, PNG, JPG, SVG (Maks. 8MB)</span>
        </label>
        
        <input type="file" id="adm_prod_file_input" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" style="display: none;" />

        <div id="adm_prod_dropzone" class="product-upload-dropzone">
          <!-- Placeholder saat belum ada gambar -->
          <div id="adm_prod_upload_placeholder" style="${prod.image_url ? 'display: none;' : 'display: block;'}">
            <div class="upload-icon">📸</div>
            <div class="upload-title">
              Tarik &amp; lepas gambar ke sini, atau 
              <button type="button" class="btn btn-secondary btn-sm" id="btn-browse-image" style="margin-left: 4px;">Pilih File</button>
            </div>
            <div class="upload-subtitle">Gambar langsung dioptimasi otomatis untuk kecepatan loading web maksimal.</div>
          </div>

          <!-- Preview saat gambar sudah dipilih / ada -->
          <div id="adm_prod_upload_preview" style="${prod.image_url ? 'display: block;' : 'display: none;'}">
            <div class="upload-preview-wrapper">
              <img id="adm_prod_preview_img" src="${escapeHtml(prod.image_url || '')}" alt="Pratinjau Sampul Produk" />
              <div class="upload-preview-overlay">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-change-image">Ganti Foto</button>
                <button type="button" class="btn btn-danger btn-sm" id="btn-remove-image">Hapus</button>
              </div>
            </div>
          </div>
        </div>

        <div id="adm_prod_upload_status" class="upload-status-badge">
          ${prod.image_url ? '✅ Sampul produk aktif' : ''}
        </div>

        <input type="hidden" id="adm_prod_image_url" value="${escapeHtml(prod.image_url || '')}" />

        <details style="margin-top: 8px; font-size: 0.82rem; color: var(--text-muted);">
          <summary style="cursor: pointer; user-select: none;">Gunakan URL / Path manual (Opsional)</summary>
          <div style="margin-top: 6px;">
            <input type="text" id="adm_prod_manual_url" class="form-control" style="font-size: 0.85rem;" placeholder="/assets/products/nama-file.jpg atau https://..." value="${escapeHtml(prod.image_url || '')}" />
          </div>
        </details>
      </div>

      <div class="form-group">
        <label>Nama Produk *</label>
        <input type="text" id="adm_prod_name" class="form-control" value="${escapeHtml(prod.name)}" required />
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>Kategori *</label>
          <input type="text" id="adm_prod_category" class="form-control" value="${escapeHtml(prod.category)}" required />
        </div>
        <div class="form-group">
          <label>Harga (IDR) *</label>
          <input type="number" id="adm_prod_price" class="form-control" value="${prod.price}" required min="0" />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Status</label>
          <select id="adm_prod_status" class="form-control">
            <option value="active" ${prod.status === 'active' ? 'selected' : ''}>Active (Tampil)</option>
            <option value="draft" ${prod.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="inactive" ${prod.status === 'inactive' ? 'selected' : ''}>Inactive (Arsip)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipe Pengiriman</label>
          <select id="adm_prod_delivery" class="form-control">
            <option value="digital_download" ${prod.delivery_type === 'digital_download' ? 'selected' : ''}>Digital Download</option>
            <option value="consultation_service" ${prod.delivery_type === 'consultation_service' ? 'selected' : ''}>Jasa / Konsultasi</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Ringkasan Singkat</label>
        <input type="text" id="adm_prod_short" class="form-control" value="${escapeHtml(prod.short_description)}" />
      </div>
      <div class="form-group">
        <label>Deskripsi Lengkap</label>
        <textarea id="adm_prod_desc" class="form-control" rows="3">${escapeHtml(prod.description)}</textarea>
      </div>
      <div class="form-group">
        <label>Fitur Produk (1 baris per fitur)</label>
        <textarea id="adm_prod_features" class="form-control" rows="3">${escapeHtml(featuresText)}</textarea>
      </div>
      <div class="form-group">
        <label>Referensi Asset / File Privat (Hanya Terlihat di Admin)</label>
        <input type="text" id="adm_prod_asset" class="form-control" value="${escapeHtml(prod.asset_reference || '')}" placeholder="assets/products/... atau link privat" />
      </div>

      <div id="adm-prod-error" style="color: #F87171; font-size: 0.88rem; margin-bottom: 12px; display: none;"></div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">Batal</button>
        <button type="submit" class="btn btn-primary" id="btn-save-adm-prod" style="flex: 1;">Simpan Produk</button>
      </div>
    </form>
  `;

  // Hubungkan Image Uploader Component
  bindProductImageUploader({
    dropzoneEl: document.getElementById('adm_prod_dropzone'),
    fileInputEl: document.getElementById('adm_prod_file_input'),
    placeholderEl: document.getElementById('adm_prod_upload_placeholder'),
    previewEl: document.getElementById('adm_prod_upload_preview'),
    previewImgEl: document.getElementById('adm_prod_preview_img'),
    statusEl: document.getElementById('adm_prod_upload_status'),
    hiddenUrlEl: document.getElementById('adm_prod_image_url'),
    manualUrlEl: document.getElementById('adm_prod_manual_url'),
    browseBtnEl: document.getElementById('btn-browse-image'),
    changeBtnEl: document.getElementById('btn-change-image'),
    removeBtnEl: document.getElementById('btn-remove-image'),
    getSlug: () => document.getElementById('adm_prod_name')?.value || 'produk'
  });

  modal.classList.add('open');
}

/**
 * Utilitas Kompresi & Upload Gambar Produk di Browser
 */
function compressImageFile(file, maxWidth = 1280, maxHeight = 720, quality = 0.85) {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, isOptimized: false });
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (_) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({ dataUrl, isOptimized: true, width, height });
      };
      img.onerror = () => {
        resolve({ dataUrl: e.target.result, isOptimized: false });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function bindProductImageUploader({
  dropzoneEl,
  fileInputEl,
  placeholderEl,
  previewEl,
  previewImgEl,
  statusEl,
  hiddenUrlEl,
  manualUrlEl,
  browseBtnEl,
  changeBtnEl,
  removeBtnEl,
  getSlug
}) {
  if (!dropzoneEl || !fileInputEl) return;

  const triggerBrowse = () => fileInputEl.click();
  if (browseBtnEl) browseBtnEl.addEventListener('click', (e) => { e.stopPropagation(); triggerBrowse(); });
  if (changeBtnEl) changeBtnEl.addEventListener('click', (e) => { e.stopPropagation(); triggerBrowse(); });

  dropzoneEl.addEventListener('click', (e) => {
    if (e.target.closest('#btn-remove-image') || e.target.closest('#btn-change-image')) return;
    if (!hiddenUrlEl.value) triggerBrowse();
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('dragover');
    });
  });

  dropzoneEl.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInputEl.addEventListener('change', () => {
    if (fileInputEl.files && fileInputEl.files.length > 0) {
      handleFileSelected(fileInputEl.files[0]);
    }
  });

  if (removeBtnEl) {
    removeBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      hiddenUrlEl.value = '';
      if (manualUrlEl) manualUrlEl.value = '';
      fileInputEl.value = '';
      previewImgEl.src = '';
      previewEl.style.display = 'none';
      placeholderEl.style.display = 'block';
      statusEl.className = 'upload-status-badge';
      statusEl.textContent = 'Gambar telah dihapus.';
    });
  }

  if (manualUrlEl) {
    manualUrlEl.addEventListener('input', () => {
      const val = manualUrlEl.value.trim();
      hiddenUrlEl.value = val;
      if (val) {
        previewImgEl.src = val;
        placeholderEl.style.display = 'none';
        previewEl.style.display = 'block';
        statusEl.className = 'upload-status-badge';
        statusEl.textContent = 'Menggunakan link URL manual.';
      } else {
        previewImgEl.src = '';
        previewEl.style.display = 'none';
        placeholderEl.style.display = 'block';
      }
    });
  }

  async function handleFileSelected(file) {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (WebP, PNG, JPG, SVG, GIF).');
      return;
    }

    statusEl.className = 'upload-status-badge loading';
    statusEl.textContent = 'Mengompresi & mengunggah gambar...';
    placeholderEl.style.display = 'none';
    previewEl.style.display = 'block';

    try {
      const { dataUrl } = await compressImageFile(file);
      previewImgEl.src = dataUrl;

      // Coba upload ke server jika token admin tersedia
      const token = STATE.adminToken || sessionStorage.getItem('arra_admin_token') || localStorage.getItem('arra_admin_token');
      let uploadedUrl = null;

      if (token) {
        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              image: dataUrl,
              filename: file.name,
              slug: typeof getSlug === 'function' ? getSlug() : 'product'
            })
          });

          const data = await res.json();
          if (data.success && data.url) {
            uploadedUrl = data.url;
          }
        } catch (serverErr) {
          console.warn('Gagal upload ke server API, fallback ke Data URL:', serverErr);
        }
      }

      // Gunakan URL server jika tersedia, atau fallback ke Data URL terkompresi
      const finalUrl = uploadedUrl || dataUrl;
      hiddenUrlEl.value = finalUrl;
      if (manualUrlEl) manualUrlEl.value = finalUrl;

      statusEl.className = 'upload-status-badge';
      statusEl.textContent = uploadedUrl
        ? `✅ Gambar tersimpan di server (${uploadedUrl})`
        : '✅ Gambar siap disimpan (Optimasi selesai)';
    } catch (err) {
      statusEl.className = 'upload-status-badge error';
      statusEl.textContent = 'Gagal memproses gambar: ' + err.message;
    }
  }
}

async function handleAdminSaveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-adm-prod');
  const errBox = document.getElementById('adm-prod-error');
  btn.disabled = true;

  const rawFeatures = document.getElementById('adm_prod_features').value.split('\n').map(f => f.trim()).filter(Boolean);
  const imageUrlInput = document.getElementById('adm_prod_image_url');
  const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

  const payload = {
    id: currentEditProductId || undefined,
    name: document.getElementById('adm_prod_name').value.trim(),
    category: document.getElementById('adm_prod_category').value.trim(),
    price: parseInt(document.getElementById('adm_prod_price').value, 10) || 0,
    status: document.getElementById('adm_prod_status').value,
    delivery_type: document.getElementById('adm_prod_delivery').value,
    short_description: document.getElementById('adm_prod_short').value.trim(),
    description: document.getElementById('adm_prod_desc').value.trim(),
    features: rawFeatures,
    image_url: imageUrl || null,
    asset_reference: document.getElementById('adm_prod_asset').value.trim() || null
  };

  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STATE.adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    closeOrderModal();
    await fetchInitialData();
    switchAdminTab('products');
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = 'block';
    btn.disabled = false;
  }
}

function openAdminEditOrderModal(orderId) {
  const modal = document.getElementById('order-modal');
  const modalBody = document.getElementById('order-modal-body');

  modalBody.innerHTML = `
    <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 12px;">Kelola Pesanan: <code>${orderId}</code></h3>
    <form onsubmit="handleAdminSaveOrder(event, '${orderId}')">
      <div class="form-group">
        <label>Perbarui Status Pesanan *</label>
        <select id="adm_ord_status" class="form-control">
          <option value="PENDING">PENDING (Menunggu Pembayaran / Verifikasi)</option>
          <option value="PAID">PAID (Pembayaran Terverifikasi)</option>
          <option value="COMPLETED">COMPLETED (Produk / Akses Telah Diserahkan)</option>
          <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Referensi Pembayaran / No Mutasi Bank</label>
        <input type="text" id="adm_ord_ref" class="form-control" placeholder="misal: TF-BCA-876251" />
      </div>
      <div class="form-group">
        <label>Catatan Admin Internal</label>
        <textarea id="adm_ord_notes" class="form-control" rows="3" placeholder="Catatan admin (tidak terlihat oleh pembeli)..."></textarea>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">Batal</button>
        <button type="submit" class="btn btn-primary" style="flex: 1;">Update Pesanan</button>
      </div>
    </form>
  `;

  modal.classList.add('open');
}

async function handleAdminSaveOrder(e, orderId) {
  e.preventDefault();
  const status = document.getElementById('adm_ord_status').value;
  const payment_reference = document.getElementById('adm_ord_ref').value.trim() || null;
  const admin_notes = document.getElementById('adm_ord_notes').value.trim() || null;

  try {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STATE.adminToken}`
      },
      body: JSON.stringify({ status, payment_reference, admin_notes })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    closeOrderModal();
    switchAdminTab('orders');
  } catch (err) {
    alert(`Gagal memperbarui pesanan: ${err.message}`);
  }
}

// ============================================================================
// 6. IMAGE LIGHTBOX MODAL HANDLERS
// ============================================================================
window.openImageZoom = function(src, caption) {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-modal-img');
  const cap = document.getElementById('lightbox-modal-caption');
  if (modal && img) {
    img.src = src;
    img.alt = caption || 'Pratinjau Gambar Produk';
    if (cap) cap.textContent = caption || '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeImageZoom = function(e) {
  if (e && e.target && e.target.closest('.lightbox-content') && !e.target.closest('.lightbox-close-btn')) {
    return;
  }
  const modal = document.getElementById('image-lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    window.closeImageZoom();
    if (typeof closeOrderModal === 'function') closeOrderModal();
  }
});

// ============================================================================
// 7. THEME SYSTEM (DUAL LIGHT & DARK MODE)
// ============================================================================
function initThemeSystem() {
  const root = document.documentElement;
  const desktopBtn = document.getElementById('theme-toggle-desktop');
  const mobileBtn = document.getElementById('theme-toggle-mobile');
  const buttons = [desktopBtn, mobileBtn].filter(Boolean);

  function getActiveTheme() {
    return root.getAttribute('data-theme') || localStorage.getItem('arra_theme') || 'light';
  }

  function renderThemeIcons(theme) {
    const isDark = theme === 'dark';
    const sunIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    buttons.forEach(btn => {
      btn.innerHTML = isDark ? sunIcon : moonIcon;
      btn.setAttribute('aria-label', isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap');
      btn.setAttribute('title', isDark ? 'Mode Terang' : 'Mode Gelap');
    });
  }

  function setTheme(theme) {
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', theme);
    localStorage.setItem('arra_theme', theme);
    renderThemeIcons(theme);
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 320);
  }

  const initialTheme = getActiveTheme();
  setTheme(initialTheme);

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = getActiveTheme();
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
    });
  });
}

// ============================================================================
// 8. INITIALIZATION & GLOBAL LISTENERS
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initThemeSystem();

  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-route]');
    if (link) {
      e.preventDefault();
      const route = link.getAttribute('data-route');
      navigateTo(route);
    }
  });

  const hamburger = document.getElementById('hamburger-btn');
  const mobilePanel = document.getElementById('mobile-nav-panel');
  if (hamburger && mobilePanel) {
    hamburger.addEventListener('click', () => {
      mobilePanel.classList.toggle('open');
    });
  }

  await fetchInitialData();
  handleRoute();
});
