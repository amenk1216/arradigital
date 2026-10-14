/**
 * Arra Digital - Admin Dashboard & GAS Database Connector (admin.js)
 * Mengelola otentikasi admin, sinkronisasi data Google Apps Script / Google Sheets,
 * serta manipulasi paket harga, produk digital, dan log konsultasi.
 */

// State Global Admin
const STATE = {
  token: null,
  user: null,
  gasUrl: "",
  packages: [],
  products: [],
  inquiries: [],
  config: {}
};

document.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
  initAdminTabs();
  initSettingsForm();
  initModals();
});

/**
 * 1. Otentikasi & Manajemen Sesi Admin
 */
function initAdminAuth() {
  const token = sessionStorage.getItem("arra_admin_token");
  const storedGasUrl = localStorage.getItem("arra_gas_url") || (window.CONFIG && CONFIG.gasApiUrl) || "";
  STATE.gasUrl = storedGasUrl;

  const loginForm = document.getElementById("form-login");
  const logoutBtn = document.getElementById("btn-logout");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (token) {
    STATE.token = token;
    showDashboardView();
  } else {
    showLoginView();
  }
}

function showLoginView() {
  document.getElementById("view-login").style.display = "flex";
  document.getElementById("view-dashboard").style.display = "none";
}

function showDashboardView() {
  document.getElementById("view-login").style.display = "none";
  document.getElementById("view-dashboard").style.display = "flex";
  loadDashboardData();
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const alertEl = document.getElementById("login-alert");
  const submitBtn = document.getElementById("btn-submit-login");
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  alertEl.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Memverifikasi...";

  try {
    // Jika GAS URL dikonfigurasi, coba otentikasi via Google Apps Script
    if (STATE.gasUrl) {
      const response = await fetch(STATE.gasUrl, {
        method: "POST",
        body: JSON.stringify({ action: "login", username, password })
      });
      const resData = await response.json();
      if (resData.status === "success" && resData.token) {
        STATE.token = resData.token;
        STATE.user = resData.user;
        sessionStorage.setItem("arra_admin_token", resData.token);
        showDashboardView();
        return;
      }
    }

    // Fallback autentikasi lokal bawaan (standalone): admin / admin123
    if (username === "admin" && password === "admin123") {
      const mockToken = btoa(username + ":" + Date.now() + ":local");
      STATE.token = mockToken;
      STATE.user = { username: "admin", role: "superadmin" };
      sessionStorage.setItem("arra_admin_token", mockToken);
      showDashboardView();
    } else {
      throw new Error("Username atau password salah.");
    }
  } catch (err) {
    alertEl.textContent = err.message || "Gagal masuk ke dashboard.";
    alertEl.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Masuk ke Dashboard";
  }
}

function handleLogout() {
  sessionStorage.removeItem("arra_admin_token");
  STATE.token = null;
  STATE.user = null;
  showLoginView();
}

/**
 * 2. Navigasi Tab Dashboard
 */
function initAdminTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      switchTab(targetId);
    });
  });

  const syncBtn = document.getElementById("btn-sync-gas");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      loadDashboardData(true);
    });
  }

  const refreshInqBtn = document.getElementById("btn-refresh-inquiries");
  if (refreshInqBtn) {
    refreshInqBtn.addEventListener("click", () => {
      loadInquiriesData();
    });
  }
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
  });
  document.querySelectorAll(".tab-pane").forEach(p => {
    p.classList.toggle("active", p.id === tabId);
  });
}

/**
 * 3. Pemuatan & Sinkronisasi Data (GAS / Local Storage / CONFIG)
 */
async function loadDashboardData(showSuccessNotification = false) {
  updateGasStatusBadge();

  // Load local state first
  const localSavedConfig = localStorage.getItem("arra_custom_config");
  const baseConfig = localSavedConfig ? JSON.parse(localSavedConfig) : window.CONFIG;

  STATE.packages = baseConfig.packages ? [...baseConfig.packages] : [];
  STATE.products = baseConfig.products ? [...baseConfig.products] : [];
  STATE.config = baseConfig.brand ? { ...baseConfig } : {};

  // Muat inquiries lokal yang tersimpan
  const localInquiries = localStorage.getItem("arra_local_inquiries");
  STATE.inquiries = localInquiries ? JSON.parse(localInquiries) : getSampleInquiries();

  // Coba sinkronisasi jika URL GAS aktif
  if (STATE.gasUrl) {
    try {
      const res = await fetch(`${STATE.gasUrl}?action=getData`);
      const json = await res.json();
      if (json.status === "success" && json.data) {
        if (json.data.packages) STATE.packages = json.data.packages;
        if (json.data.products) STATE.products = json.data.products;
        if (json.data.config) {
          STATE.config = { ...STATE.config, ...json.data.config };
        }
        updateGasStatusBadge(true);
      }

      // Ambil Inquiries dari GAS
      await loadInquiriesData();

      if (showSuccessNotification) {
        showGlobalAlert("Sinkronisasi Google Spreadsheet berhasil diperbarui!", "success");
      }
    } catch (err) {
      console.warn("Koneksi GAS gagal atau offline, menggunakan data lokal:", err);
      updateGasStatusBadge(false);
    }
  }

  renderMetrics();
  renderPackagesTable();
  renderProductsTable();
  renderInquiriesTable();
  populateSettingsForm();
}

async function loadInquiriesData() {
  if (!STATE.gasUrl) return;
  try {
    const res = await fetch(`${STATE.gasUrl}?action=getInquiries&token=${encodeURIComponent(STATE.token)}`);
    const json = await res.json();
    if (json.status === "success" && json.inquiries) {
      STATE.inquiries = json.inquiries;
      renderInquiriesTable();
      renderMetrics();
    }
  } catch (e) {
    console.warn("Gagal memuat inquiries:", e);
  }
}

function updateGasStatusBadge(isConnected) {
  const dot = document.querySelector(".status-dot");
  const text = document.getElementById("gas-status-text");
  const statText = document.getElementById("stat-gas-status");

  if (!STATE.gasUrl) {
    dot.className = "status-dot standalone";
    text.textContent = "Mode Standalone (Lokal)";
    if (statText) statText.textContent = "Lokal";
  } else if (isConnected) {
    dot.className = "status-dot active";
    text.textContent = "Terhubung ke Google Sheets";
    if (statText) statText.textContent = "Aktif (Sheets)";
  } else {
    dot.className = "status-dot standalone";
    text.textContent = "Tersimpan (Offline)";
    if (statText) statText.textContent = "Disimpan";
  }
}

/**
 * 4. Rendering Tampilan Admin
 */
function renderMetrics() {
  document.getElementById("stat-total-packages").textContent = STATE.packages.length;
  document.getElementById("stat-total-products").textContent = STATE.products.length;
  document.getElementById("stat-total-inquiries").textContent = STATE.inquiries.length;
}

function renderPackagesTable() {
  const tbody = document.getElementById("packages-table-body");
  if (!tbody) return;

  tbody.innerHTML = STATE.packages.map(pkg => {
    const formattedPrice = (pkg.pricePrefix || "") + "Rp " + new Intl.NumberFormat("id-ID").format(pkg.price);
    const popBadge = pkg.popular
      ? `<span class="badge-pill badge-popular" style="font-size: 0.7rem;">Paling Laris</span>`
      : `<span style="color: var(--muted); font-size: 0.8rem;">Standar</span>`;

    return `
      <tr>
        <td><strong>${pkg.name}</strong></td>
        <td>${formattedPrice}</td>
        <td style="max-width: 280px; font-size: 0.85rem; color: var(--muted);">${pkg.target}</td>
        <td>${popBadge}</td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openEditPackageModal('${pkg.id}')">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderProductsTable() {
  const tbody = document.getElementById("products-table-body");
  if (!tbody) return;

  tbody.innerHTML = STATE.products.map(prod => `
    <tr>
      <td style="font-size: 1.5rem;">${prod.icon}</td>
      <td><strong>${prod.name}</strong></td>
      <td style="font-size: 0.85rem; color: var(--muted);">${prod.description}</td>
      <td>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openEditProductModal('${prod.id}')">
          Edit
        </button>
      </td>
    </tr>
  `).join("");
}

function renderInquiriesTable() {
  const tbody = document.getElementById("inquiries-table-body");
  const overviewTbody = document.getElementById("overview-inquiries-body");

  if (!tbody) return;

  if (STATE.inquiries.length === 0) {
    const emptyRow = `<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 24px;">Belum ada konsultasi atau leads masuk.</td></tr>`;
    tbody.innerHTML = emptyRow;
    if (overviewTbody) overviewTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted);">Belum ada konsultasi masuk.</td></tr>`;
    return;
  }

  tbody.innerHTML = STATE.inquiries.map(inq => {
    const statusClass = inq.status === "Selesai" ? "pill-done" : (inq.status === "Dihubungi" ? "pill-contacted" : "pill-new");
    const formattedDate = inq.timestamp ? new Date(inq.timestamp).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-";
    const waClean = (inq.clientWhatsApp || "").replace(/[^0-9]/g, "");
    const waLink = waClean ? `https://wa.me/${waClean}` : "#";

    return `
      <tr>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem;">${inq.id}</div>
          <div style="font-size: 0.75rem; color: var(--muted);">${formattedDate}</div>
        </td>
        <td><span class="status-pill pill-new">${inq.type}</span></td>
        <td><strong>${inq.itemName}</strong></td>
        <td>
          <div>${inq.clientName}</div>
          ${waClean ? `<a href="${waLink}" target="_blank" rel="noopener" style="font-size: 0.8rem; color: var(--accent);">&#x1F4AC; ${waClean}</a>` : `<span style="color: var(--muted); font-size: 0.8rem;">-</span>`}
        </td>
        <td>
          <select class="form-select" style="padding: 4px 8px; font-size: 0.8rem; width: auto;" onchange="handleInquiryStatusChange('${inq.id}', this.value)">
            <option value="Baru" ${inq.status === "Baru" ? "selected" : ""}>Baru</option>
            <option value="Dihubungi" ${inq.status === "Dihubungi" ? "selected" : ""}>Dihubungi</option>
            <option value="Selesai" ${inq.status === "Selesai" ? "selected" : ""}>Selesai</option>
          </select>
        </td>
        <td>
          ${waClean ? `<a href="${waLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="font-size: 0.75rem;">Chat WA</a>` : "-"}
        </td>
      </tr>
    `;
  }).join("");

  // Update Overview Mini Table (top 5 recent)
  if (overviewTbody) {
    const topRecent = STATE.inquiries.slice(0, 5);
    overviewTbody.innerHTML = topRecent.map(inq => {
      const statusClass = inq.status === "Selesai" ? "pill-done" : (inq.status === "Dihubungi" ? "pill-contacted" : "pill-new");
      const formattedDate = inq.timestamp ? new Date(inq.timestamp).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-";
      return `
        <tr>
          <td style="font-size: 0.8rem;">${formattedDate}</td>
          <td><span class="status-pill ${statusClass}">${inq.type}</span></td>
          <td>${inq.clientName}</td>
          <td style="font-size: 0.85rem;">${inq.itemName}</td>
          <td><span class="status-pill ${statusClass}">${inq.status}</span></td>
        </tr>
      `;
    }).join("");
  }
}

/**
 * 5. Pengaturan Formulir & Koneksi GAS
 */
function initSettingsForm() {
  const gasForm = document.getElementById("form-gas-url");
  const businessForm = document.getElementById("form-business-settings");

  if (gasForm) {
    gasForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const url = document.getElementById("gas-endpoint-url").value.trim();
      STATE.gasUrl = url;
      localStorage.setItem("arra_gas_url", url);

      if (url) {
        try {
          const res = await fetch(`${url}?action=ping`);
          const json = await res.json();
          if (json.status === "ok") {
            showGlobalAlert("Koneksi Google Apps Script BERHASIL terhubung!", "success");
            updateGasStatusBadge(true);
            loadDashboardData();
          } else {
            showGlobalAlert("URL Apps Script merespons tetapi data tidak sesuai.", "info");
          }
        } catch (err) {
          showGlobalAlert("URL disimpan, tetapi pengujian gagal (Pastikan deployment disetel ke 'Anyone').", "danger");
          updateGasStatusBadge(false);
        }
      } else {
        showGlobalAlert("Koneksi GAS dikosongkan. Sistem berjalan dalam Mode Standalone.", "info");
        updateGasStatusBadge(false);
      }
    });
  }

  if (businessForm) {
    businessForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const waNumber = document.getElementById("setting-wa-number").value.trim();
      const defaultMsg = document.getElementById("setting-wa-msg").value.trim();
      const brandName = document.getElementById("setting-brand-name").value.trim();
      const brandTagline = document.getElementById("setting-brand-tagline").value.trim();

      // Update state
      if (!STATE.config.whatsapp) STATE.config.whatsapp = {};
      if (!STATE.config.brand) STATE.config.brand = {};

      STATE.config.whatsapp.number = waNumber;
      STATE.config.whatsapp.defaultMessage = defaultMsg;
      STATE.config.brand.name = brandName;
      STATE.config.brand.tagline = brandTagline;

      saveCustomConfigToLocalStorage();

      // Jika GAS aktif, simpan ke Google Sheets
      if (STATE.gasUrl) {
        try {
          await fetch(STATE.gasUrl, {
            method: "POST",
            body: JSON.stringify({
              action: "updateConfig",
              token: STATE.token,
              config: {
                brandName,
                brandTagline,
                whatsappNumber: waNumber,
                defaultMessage: defaultMsg
              }
            })
          });
        } catch (err) {
          console.warn("Gagal update config ke GAS:", err);
        }
      }

      showGlobalAlert("Pengaturan bisnis dan WhatsApp berhasil disimpan!", "success");
    });
  }
}

function populateSettingsForm() {
  const gasInput = document.getElementById("gas-endpoint-url");
  if (gasInput) gasInput.value = STATE.gasUrl || "";

  const waNumber = (STATE.config.whatsapp && STATE.config.whatsapp.number) || (window.CONFIG && CONFIG.whatsapp.number) || "6281317028494";
  const waMsg = (STATE.config.whatsapp && STATE.config.whatsapp.defaultMessage) || (window.CONFIG && CONFIG.whatsapp.defaultMessage) || "Halo Arra Digital, saya ingin konsultasi.";
  const brandName = (STATE.config.brand && STATE.config.brand.name) || (window.CONFIG && CONFIG.brand.name) || "Arra Digital";
  const brandTagline = (STATE.config.brand && STATE.config.brand.tagline) || (window.CONFIG && CONFIG.brand.tagline) || "Studio Website & Produk Digital";

  const waNumberEl = document.getElementById("setting-wa-number");
  const waMsgEl = document.getElementById("setting-wa-msg");
  const brandNameEl = document.getElementById("setting-brand-name");
  const brandTaglineEl = document.getElementById("setting-brand-tagline");

  if (waNumberEl) waNumberEl.value = waNumber;
  if (waMsgEl) waMsgEl.value = waMsg;
  if (brandNameEl) brandNameEl.value = brandName;
  if (brandTaglineEl) brandTaglineEl.value = brandTagline;
}

/**
 * 6. Modal Edit Paket & Produk
 */
function initModals() {
  const pkgForm = document.getElementById("form-edit-package");
  const prodForm = document.getElementById("form-edit-product");

  if (pkgForm) {
    pkgForm.addEventListener("submit", handleEditPackageSubmit);
  }
  if (prodForm) {
    prodForm.addEventListener("submit", handleEditProductSubmit);
  }
}

window.openEditPackageModal = function(pkgId) {
  const pkg = STATE.packages.find(p => p.id === pkgId);
  if (!pkg) return;

  document.getElementById("edit-pkg-id").value = pkg.id;
  document.getElementById("edit-pkg-name").value = pkg.name;
  document.getElementById("edit-pkg-price").value = pkg.price;
  document.getElementById("edit-pkg-prefix").value = pkg.pricePrefix || "";
  document.getElementById("edit-pkg-target").value = pkg.target || "";
  document.getElementById("edit-pkg-features").value = Array.isArray(pkg.features) ? pkg.features.join("\n") : pkg.features;
  document.getElementById("edit-pkg-revisions").value = pkg.revisions || "";
  document.getElementById("edit-pkg-support").value = pkg.support || "";
  document.getElementById("edit-pkg-popular").checked = Boolean(pkg.popular);

  openModal("modal-edit-package");
};

async function handleEditPackageSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("edit-pkg-id").value;
  const name = document.getElementById("edit-pkg-name").value.trim();
  const price = Number(document.getElementById("edit-pkg-price").value);
  const pricePrefix = document.getElementById("edit-pkg-prefix").value;
  const target = document.getElementById("edit-pkg-target").value.trim();
  const featuresText = document.getElementById("edit-pkg-features").value.trim();
  const features = featuresText.split("\n").map(s => s.trim()).filter(Boolean);
  const revisions = document.getElementById("edit-pkg-revisions").value.trim();
  const support = document.getElementById("edit-pkg-support").value.trim();
  const popular = document.getElementById("edit-pkg-popular").checked;

  const pkgIndex = STATE.packages.findIndex(p => p.id === id);
  if (pkgIndex >= 0) {
    const updatedPkg = {
      ...STATE.packages[pkgIndex],
      name, price, pricePrefix, target, features, revisions, support, popular
    };
    STATE.packages[pkgIndex] = updatedPkg;
    saveCustomConfigToLocalStorage();
    renderPackagesTable();

    // Kirim ke GAS jika terhubung
    if (STATE.gasUrl) {
      try {
        await fetch(STATE.gasUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "updatePackage",
            token: STATE.token,
            package: updatedPkg
          })
        });
      } catch (err) {
        console.warn("Gagal update paket ke GAS:", err);
      }
    }

    closeModal("modal-edit-package");
    showGlobalAlert(`Paket "${name}" berhasil diperbarui!`, "success");
  }
}

window.openEditProductModal = function(prodId) {
  const prod = STATE.products.find(p => p.id === prodId);
  if (!prod) return;

  document.getElementById("edit-prod-id").value = prod.id;
  document.getElementById("edit-prod-icon").value = prod.icon || "⚡";
  document.getElementById("edit-prod-name").value = prod.name;
  document.getElementById("edit-prod-desc").value = prod.description;

  openModal("modal-edit-product");
};

async function handleEditProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("edit-prod-id").value;
  const icon = document.getElementById("edit-prod-icon").value.trim();
  const name = document.getElementById("edit-prod-name").value.trim();
  const description = document.getElementById("edit-prod-desc").value.trim();

  const prodIndex = STATE.products.findIndex(p => p.id === id);
  if (prodIndex >= 0) {
    const updatedProd = { ...STATE.products[prodIndex], icon, name, description };
    STATE.products[prodIndex] = updatedProd;
    saveCustomConfigToLocalStorage();
    renderProductsTable();

    // Kirim ke GAS jika terhubung
    if (STATE.gasUrl) {
      try {
        await fetch(STATE.gasUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "updateProduct",
            token: STATE.token,
            product: updatedProd
          })
        });
      } catch (err) {
        console.warn("Gagal update produk ke GAS:", err);
      }
    }

    closeModal("modal-edit-product");
    showGlobalAlert(`Produk "${name}" berhasil diperbarui!`, "success");
  }
}

window.handleInquiryStatusChange = async function(inquiryId, newStatus) {
  const item = STATE.inquiries.find(i => i.id === inquiryId);
  if (item) {
    item.status = newStatus;
    localStorage.setItem("arra_local_inquiries", JSON.stringify(STATE.inquiries));

    if (STATE.gasUrl) {
      try {
        await fetch(STATE.gasUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "updateInquiryStatus",
            token: STATE.token,
            inquiryId,
            newStatus
          })
        });
      } catch (err) {
        console.warn("Gagal update status inquiry ke GAS:", err);
      }
    }
    showGlobalAlert(`Status konsultasi ${inquiryId} diubah menjadi "${newStatus}"`, "info");
  }
};

window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("is-active");
};

window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("is-active");
};

function saveCustomConfigToLocalStorage() {
  const customConfig = {
    brand: STATE.config.brand || (window.CONFIG && CONFIG.brand),
    whatsapp: STATE.config.whatsapp || (window.CONFIG && CONFIG.whatsapp),
    packages: STATE.packages,
    products: STATE.products,
    services: window.CONFIG ? CONFIG.services : [],
    steps: window.CONFIG ? CONFIG.steps : [],
    faq: window.CONFIG ? CONFIG.faq : [],
    portfolio: window.CONFIG ? CONFIG.portfolio : []
  };
  localStorage.setItem("arra_custom_config", JSON.stringify(customConfig));
}

function showGlobalAlert(message, type = "success") {
  const alertEl = document.getElementById("global-alert");
  if (!alertEl) return;
  alertEl.className = `alert-box alert-${type}`;
  alertEl.textContent = message;
  alertEl.style.display = "block";
  setTimeout(() => {
    alertEl.style.display = "none";
  }, 4000);
}

function getSampleInquiries() {
  return [
    {
      id: "INQ-20261014-001",
      timestamp: new Date().toISOString(),
      type: "Paket Website",
      itemName: "Bisnis",
      clientName: "Budi Santoso",
      clientWhatsApp: "6281234567890",
      notes: "Tanya estimasi pengerjaan company profile 5 halaman",
      status: "Baru"
    },
    {
      id: "INQ-20261014-002",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "Produk Digital",
      itemName: "Akses AI Premium",
      clientName: "Siti Rahma",
      clientWhatsApp: "6285712345678",
      notes: "Minat akun AI untuk riset tugas akhir",
      status: "Dihubungi"
    }
  ];
}
