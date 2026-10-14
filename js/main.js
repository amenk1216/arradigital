/**
 * Arra Digital - Interaktivitas & Perenderan Dinamis (main.js)
 * Merender konten dari CONFIG (config.js), mengelola tema, navigasi mobile,
 * animasi scroll, dan integrasi WhatsApp.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Terapkan konfigurasi tersimpan dari Admin (jika ada)
  applySavedAdminConfig();

  // 2. Inisialisasi Tema (Terang / Gelap)
  initTheme();

  // 3. Render Semua Komponen Dinamis dari CONFIG
  renderServices();
  renderPricing();
  renderProducts();
  renderPortfolio();
  renderSteps();
  renderFaq();
  updateStaticWhatsAppLinks();
  updateFooterInfo();
  injectJsonLd();

  // 4. Navigasi Mobile & Interaksi Menu
  initMobileNav();

  // 5. Floating WhatsApp Button & CTA Observer
  initFloatingWhatsApp();

  // 6. Animasi Scroll Masuk Viewport
  initScrollAnimations();

  // 7. Sinkronisasi Asinkron dari Google Apps Script Database (jika terhubung)
  syncDataFromGas();

  // 8. Pencatatan Lead / Konsultasi Masuk
  initInquiryTracker();
});

/**
 * Membentuk URL WhatsApp lengkap dari nomor dan pesan yang di-encode
 */
function getWhatsAppUrl(message) {
  const number = (CONFIG.whatsapp && CONFIG.whatsapp.number) || "6281317028494";
  const text = message || (CONFIG.whatsapp && CONFIG.whatsapp.defaultMessage) || "Halo Arra Digital, saya ingin konsultasi.";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Format harga ke format Rupiah standar Indonesia
 */
function formatPrice(pkg) {
  const formatted = new Intl.NumberFormat("id-ID").format(pkg.price);
  const prefix = pkg.pricePrefix || "";
  return `${prefix}Rp ${formatted}`;
}

/**
 * 1. Manajemen Tema (Terang / Gelap)
 */
function initTheme() {
  const root = document.documentElement;
  const toggleBtns = document.querySelectorAll(".theme-toggle-btn");

  // Periksa preferensi tersimpan atau gunakan default dari CONFIG
  const savedTheme = localStorage.getItem("arra_theme");
  let currentTheme = savedTheme || CONFIG.theme.default || "auto";

  applyTheme(currentTheme);

  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      let activeTheme = root.getAttribute("data-theme");
      if (!activeTheme) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        activeTheme = prefersDark ? "dark" : "light";
      }
      const newTheme = activeTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("arra_theme", newTheme);
    });
  });

  function applyTheme(theme) {
    if (theme === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    updateThemeToggleIcons(theme);
  }

  function updateThemeToggleIcons(theme) {
    let isDark = false;
    if (theme === "dark") {
      isDark = true;
    } else if (theme === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    toggleBtns.forEach(btn => {
      btn.setAttribute("aria-label", isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap");
      btn.innerHTML = isDark
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    });
  }
}

/**
 * 2. Render Layanan (#layanan)
 */
function renderServices() {
  const container = document.getElementById("services-container");
  if (!container || !CONFIG.services) return;

  container.innerHTML = CONFIG.services.map(svc => `
    <article class="card service-card animate-on-scroll">
      <div class="service-icon" aria-hidden="true">${svc.icon}</div>
      <h3>${svc.title}</h3>
      <p>${svc.description}</p>
    </article>
  `).join("");
}

/**
 * 3. Render Paket Harga (#harga)
 */
function renderPricing() {
  const container = document.getElementById("pricing-container");
  if (!container || !CONFIG.packages) return;

  container.innerHTML = CONFIG.packages.map(pkg => {
    const waMsg = `Halo Arra Digital, saya tertarik paket ${pkg.name}.`;
    const waUrl = getWhatsAppUrl(waMsg);
    const popularBadge = pkg.popular
      ? `<span class="card-top-badge badge-pill badge-popular">Paling Laris</span>`
      : "";

    const featuresHtml = pkg.features.map(feat => `
      <li class="feature-item">
        <svg class="feature-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M4 10.5l4 4 8-8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>${feat}</span>
      </li>
    `).join("");

    return `
      <article class="card pricing-card ${pkg.popular ? 'popular' : ''} animate-on-scroll">
        ${popularBadge}
        <div class="package-header">
          <h3>${pkg.name}</h3>
          <p class="package-target">${pkg.target}</p>
          <div class="package-price-wrap">
            <span class="package-price">${formatPrice(pkg)}</span>
            <span class="package-unit">${pkg.unit || "/ proyek"}</span>
          </div>
        </div>
        <ul class="package-features">
          ${featuresHtml}
        </ul>
        <div class="package-meta">
          <span><strong>Revisi:</strong> ${pkg.revisions}</span>
          <span><strong>Support:</strong> ${pkg.support}</span>
        </div>
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn ${pkg.popular ? 'btn-primary' : 'btn-secondary'} btn-full" aria-label="Pilih paket ${pkg.name} via WhatsApp">
          Pilih Paket
        </a>
      </article>
    `;
  }).join("");
}

/**
 * 4. Render Produk Digital (#produk)
 */
function renderProducts() {
  const container = document.getElementById("products-container");
  if (!container || !CONFIG.products) return;

  container.innerHTML = CONFIG.products.map(prod => {
    const isAiPremium = prod.id === "ai-premium";
    const disclaimerHtml = isAiPremium
      ? `<p class="product-disclaimer">Ketersediaan dan harga dapat berubah. Hubungi kami untuk info terbaru.</p>`
      : "";

    return `
      <article class="card product-card animate-on-scroll">
        <div class="product-icon" aria-hidden="true">${prod.icon}</div>
        <h3>${prod.name}</h3>
        <p>${prod.description}</p>
        ${disclaimerHtml}
      </article>
    `;
  }).join("");

  // Update tombol Tanya Produk
  const productWaBtn = document.getElementById("btn-product-wa");
  if (productWaBtn) {
    productWaBtn.href = getWhatsAppUrl("Halo Arra Digital, saya ingin tanya produk digital.");
  }
}

/**
 * 5. Render Portofolio (#portofolio)
 */
function renderPortfolio() {
  const container = document.getElementById("portfolio-container");
  if (!container || !CONFIG.portfolio) return;

  // Icon ilustrasi berbasis emoji per contoh
  const previewIcons = {
    "Sistem Manajemen Laundry (Google Apps Script)": "🧺",
    "Landing Page Kuliner Sehat": "🥗",
    "Company Profile Jasa Konstruksi": "🏗️"
  };

  container.innerHTML = CONFIG.portfolio.map(item => {
    const icon = previewIcons[item.title] || "💼";
    const sampleLabel = item.isSample
      ? `<span class="portfolio-sample-badge">Contoh</span>`
      : "";

    const tagsHtml = item.tags.map(t => `<span class="portfolio-tag">${t}</span>`).join("");

    return `
      <article class="card portfolio-card animate-on-scroll">
        <div class="portfolio-preview" aria-hidden="true">
          ${icon}
          ${sampleLabel}
        </div>
        <div class="portfolio-info">
          <span class="portfolio-type">${item.type}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="portfolio-tags">
            ${tagsHtml}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/**
 * 6. Render Langkah / Cara Kerja (#proses)
 */
function renderSteps() {
  const container = document.getElementById("steps-container");
  if (!container || !CONFIG.steps) return;

  container.innerHTML = CONFIG.steps.map(step => `
    <article class="card step-card animate-on-scroll">
      <div class="step-number" aria-hidden="true"></div>
      <h3>${step.title}</h3>
      <p>${step.description}</p>
    </article>
  `).join("");
}

/**
 * 7. Render FAQ (#faq) memakai <details>/<summary> tanpa JS tambahan untuk accordion
 */
function renderFaq() {
  const container = document.getElementById("faq-container");
  if (!container || !CONFIG.faq) return;

  container.innerHTML = CONFIG.faq.map(item => `
    <details class="faq-item animate-on-scroll">
      <summary>
        <span>${item.q}</span>
        <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <div class="faq-content">
        <p>${item.a}</p>
      </div>
    </details>
  `).join("");
}

/**
 * Perbarui semua tautan WhatsApp statis di halaman
 */
function updateStaticWhatsAppLinks() {
  const defaultUrl = getWhatsAppUrl(CONFIG.whatsapp.defaultMessage);

  document.querySelectorAll("[data-wa-link]").forEach(el => {
    const customMessage = el.getAttribute("data-wa-message");
    el.href = customMessage ? getWhatsAppUrl(customMessage) : defaultUrl;
    el.target = "_blank";
    el.rel = "noopener";
  });
}

/**
 * Perbarui informasi footer (Tahun & Domain)
 */
function updateFooterInfo() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = (CONFIG.brand && CONFIG.brand.year) || new Date().getFullYear();
  }
}

/**
 * Injeksi metadata JSON-LD Schema.org tipe ProfessionalService
 */
function injectJsonLd() {
  if (!window.CONFIG) return;
  const minPrice = CONFIG.packages && CONFIG.packages[0] ? CONFIG.packages[0].price : 750000;
  const maxPrice = CONFIG.packages && CONFIG.packages[CONFIG.packages.length - 1] ? CONFIG.packages[CONFIG.packages.length - 1].price : 5000000;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": CONFIG.brand ? CONFIG.brand.name : "Arra Digital",
    "url": `https://${CONFIG.brand ? CONFIG.brand.domain : "arradigital.my.id"}/`,
    "description": CONFIG.brand ? CONFIG.brand.tagline : "Studio Website & Produk Digital",
    "telephone": `+${CONFIG.whatsapp ? CONFIG.whatsapp.number : "6281317028494"}`,
    "priceRange": `Rp ${new Intl.NumberFormat("id-ID").format(minPrice)} - Rp ${new Intl.NumberFormat("id-ID").format(maxPrice)}`,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ID"
    }
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

/**
 * Navigasi Mobile Hamburger Menu
 */
function initMobileNav() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobilePanel = document.getElementById("mobile-nav-panel");
  if (!hamburgerBtn || !mobilePanel) return;

  function openMenu() {
    hamburgerBtn.setAttribute("aria-expanded", "true");
    mobilePanel.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    hamburgerBtn.setAttribute("aria-expanded", "false");
    mobilePanel.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  hamburgerBtn.addEventListener("click", () => {
    const isOpen = hamburgerBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Tutup saat link menu diklik
  mobilePanel.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Tutup saat klik di luar (pada backdrop)
  mobilePanel.addEventListener("click", (e) => {
    if (e.target === mobilePanel) {
      closeMenu();
    }
  });

  // Tutup saat menekan tombol Escape (aksesibilitas)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobilePanel.classList.contains("is-open")) {
      closeMenu();
      hamburgerBtn.focus();
    }
  });
}

/**
 * Floating WhatsApp Button:
 * Sembunyi ketika bagian CTA penutup (#cta) terlihat di layar
 */
function initFloatingWhatsApp() {
  const floatingBtn = document.getElementById("floating-wa-btn");
  const ctaSection = document.getElementById("cta");
  if (!floatingBtn) return;

  if (ctaSection && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          floatingBtn.classList.add("is-hidden");
        } else {
          floatingBtn.classList.remove("is-hidden");
        }
      });
    }, {
      threshold: 0.15
    });

    observer.observe(ctaSection);
  }
}

/**
 * Animasi Scroll Masuk Viewport (IntersectionObserver)
 * Otomatis dinonaktifkan jika prefers-reduced-motion: reduce
 */
function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = document.querySelectorAll(".animate-on-scroll");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: "0px 0px -40px 0px",
    threshold: 0.1
  });

  elements.forEach(el => observer.observe(el));
}

/**
 * Menerapkan konfigurasi yang diedit melalui Admin Panel (jika ada di localStorage)
 */
function applySavedAdminConfig() {
  try {
    const saved = localStorage.getItem("arra_custom_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.packages && parsed.packages.length > 0) CONFIG.packages = parsed.packages;
      if (parsed.products && parsed.products.length > 0) CONFIG.products = parsed.products;
      if (parsed.whatsapp && parsed.whatsapp.number) CONFIG.whatsapp = parsed.whatsapp;
      if (parsed.brand && parsed.brand.name) CONFIG.brand = parsed.brand;
    }
  } catch (e) {
    console.warn("Gagal membaca konfigurasi admin lokal:", e);
  }
}

/**
 * Sinkronisasi data terkini langsung dari Google Apps Script / Google Sheets
 */
async function syncDataFromGas() {
  const gasUrl = localStorage.getItem("arra_gas_url") || (window.CONFIG && CONFIG.gasApiUrl);
  if (!gasUrl) return;

  try {
    const res = await fetch(`${gasUrl}?action=getData`);
    const json = await res.json();
    if (json.status === "success" && json.data) {
      if (json.data.packages && json.data.packages.length > 0) {
        CONFIG.packages = json.data.packages;
        renderPricing();
      }
      if (json.data.products && json.data.products.length > 0) {
        CONFIG.products = json.data.products;
        renderProducts();
      }
      if (json.data.config && json.data.config.whatsapp) {
        CONFIG.whatsapp = json.data.config.whatsapp;
        updateStaticWhatsAppLinks();
      }
    }
  } catch (err) {
    // Tetap berjalan mulus dengan data statis lokal
  }
}

/**
 * Mencatat lead saat pengunjung menekan tombol WhatsApp atau paket
 */
function initInquiryTracker() {
  document.addEventListener("click", (e) => {
    const targetLink = e.target.closest("a[data-wa-link], a.btn-full, #floating-wa-btn");
    if (!targetLink) return;

    const label = targetLink.getAttribute("aria-label") || targetLink.textContent.trim() || "Konsultasi WhatsApp";
    const gasUrl = localStorage.getItem("arra_gas_url") || (window.CONFIG && CONFIG.gasApiUrl);

    // Simpan ke log lokal
    try {
      const existing = JSON.parse(localStorage.getItem("arra_local_inquiries") || "[]");
      const newInq = {
        id: "INQ-" + UtilitiesDateStr(),
        timestamp: new Date().toISOString(),
        type: label.includes("Paket") ? "Paket Website" : "Konsultasi Umum",
        itemName: label,
        clientName: "Pengunjung Web",
        clientWhatsApp: "-",
        notes: "Klik tombol: " + label,
        status: "Baru"
      };
      existing.unshift(newInq);
      localStorage.setItem("arra_local_inquiries", JSON.stringify(existing.slice(0, 50)));
    } catch (err) {}

    // Kirim ke Google Apps Script di background jika terhubung
    if (gasUrl) {
      try {
        fetch(gasUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "submitInquiry",
            type: label.includes("Paket") ? "Paket Website" : "Konsultasi Umum",
            itemName: label,
            clientName: "Pengunjung Web",
            clientWhatsApp: "-",
            notes: "Pengunjung menekan: " + label
          })
        }).catch(() => {});
      } catch (e) {}
    }
  });

  function UtilitiesDateStr() {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hr = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const se = String(d.getSeconds()).padStart(2, "0");
    return `${yr}${mo}${da}-${hr}${mi}${se}`;
  }
}
