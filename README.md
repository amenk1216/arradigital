# ARRA DIGITAL - Solusi Digital Cerdas & Tools AI Indonesia

Website resmi produksi **ARRA DIGITAL** (`arradigital.my.id`). Dibangun dengan arsitektur **Serverless Static Frontend + Google Apps Script (GAS) Database via Google Sheets**, di-host di **GitHub** dan di-deploy menggunakan **Vercel** dengan domain kustom `arradigital.my.id`.

---

## 1. Arsitektur Sistem

- **Frontend:** HTML5, Modern Vanilla CSS, Vanilla JavaScript (ES6+ SPA Router).
- **Backend & Database:** Google Apps Script (GAS) Web App + Google Sheets sebagai database gratis tanpa biaya server bulanan.
- **Hosting & CI/CD:** GitHub Repository terintegrasi otomatis ke Vercel.
- **Custom Domain:** `arradigital.my.id` diatur melalui DNS Vercel dengan SSL/HTTPS otomatis.
- **Admin Hub:** Panel administrasi terproteksi di `/admin` (atau `/admin.html`) untuk mengelola produk, pesanan, metrik, dan kontak WhatsApp.

---

## 2. Struktur Proyek

```text
arra-digital/
├── index.html                   # Halaman utama aplikasi (SPA Router 12 rute publik)
├── admin.html                   # Halaman panel dashboard admin mandiri
├── vercel.json                  # Konfigurasi routing Vercel & security headers
├── css/
│   ├── style.css                # Desain sistem tema, typography, kartu, modal
│   └── admin.css                # Desain panel admin, tabel data, & status pills
├── js/
│   ├── gas-adapter.js           # Penghubung otomatis frontend ke Google Apps Script
│   ├── app.js                   # Logika SPA publik (katalog, AI tools, checkout WA)
│   ├── admin.js                 # Logika panel admin (login, kelola paket/produk/pesanan)
│   ├── config.js                # Default konfigurasi awal bisnis & URL GAS
│   └── main.js                  # Handler public dynamic fallback
├── google-apps-script/
│   ├── Code.gs                  # Kode backend lengkap untuk Google Apps Script
│   └── README.md                # Panduan deployment Google Apps Script
├── gas/
│   └── Code.gs                  # Salinan kode Google Apps Script siap pakai
├── assets/
│   ├── favicon.svg              # Favicon SVG resmi
│   └── logo.svg                 # Logo brand ARRA DIGITAL
└── README.md                    # Dokumentasi panduan lengkap
```

---

## 3. Panduan Setup Google Sheets & Google Apps Script (Database)

Google Spreadsheet berfungsi sebagai basis data (database) gratis seumur hidup.

### Langkah 1: Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet: `Arra Digital - Database`.

### Langkah 2: Pasang Script Backend
1. Di Google Sheets, klik menu **Extensions (Ekstensi)** > **Apps Script**.
2. Hapus seluruh baris kode default yang ada di editor.
3. Salin seluruh isi file [`google-apps-script/Code.gs`](google-apps-script/Code.gs) dan tempel (paste) ke editor.
4. Simpan dengan menekan ikon Disket (`Ctrl + S` atau `Cmd + S`).

### Langkah 3: Inisialisasi Database Otomatis (1-Klik)
1. Pada toolbar atas Apps Script, pilih fungsi **`setupDatabase`** dari dropdown daftar fungsi.
2. Klik tombol **Run (Jalankan)**.
3. Klik **Review permissions** > pilih akun Google Anda > klik **Advanced (Lanjutan)** > pilih **Go to (unsafe)** > klik **Allow (Izinkan)**.
4. Fungsi ini akan secara otomatis membuat 5 tab sheet lengkap dengan data awal:
   - `Settings`: Pengaturan nama brand, nomor WhatsApp, email, dan domain.
   - `Products`: Data produk digital dan jasa pembuatan website.
   - `Orders`: Pencatatan seluruh pesanan dan leads dari website.
   - `Admins`: Data username dan password administrator.
   - `Articles`: Artikel panduan dan konten edukasi.

### Langkah 4: Terapkan (Deploy) sebagai Web App
1. Klik tombol biru **Deploy (Terapkan)** di pojok kanan atas > pilih **New deployment (Penerapan baru)**.
2. Klik ikon Gerigi di sebelah kiri > pilih jenis **Web app (Aplikasi Web)**.
3. Atur konfigurasi berikut:
   - **Description:** `Arra Digital Production API`
   - **Execute as (Jalankan sebagai):** `Me (Saya / email Google Anda)`
   - **Who has access (Siapa yang memiliki akses):** `Anyone (Siapa saja)`  *(PENTING: Jangan pilih 'Only myself' agar website bisa mengakses data).*
4. Klik **Deploy**.
5. Salin **Web app URL** yang muncul (URL berakhiran `/exec`, contoh: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 4. Panduan Deploy ke GitHub & Vercel (Domain arradigital.my.id)

### Langkah 1: Push ke GitHub
Buka terminal di folder proyek ini:
```bash
git init
git add .
git commit -m "feat: Arra Digital GAS Database, Vercel & Admin Panel"
git branch -M main
git remote add origin https://github.com/USERNAME/arra-digital.git
git push -u origin main
```

### Langkah 2: Deploy di Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login.
2. Klik **Add New...** > **Project**.
3. Hubungkan akun GitHub Anda dan pilih repositori `arra-digital`.
4. Pada konfigurasi build:
   - **Framework Preset:** `Other` (Static)
   - **Root Directory:** `./`
5. Klik **Deploy**. Website Anda akan langsung aktif dalam hitungan detik.

### Langkah 3: Menghubungkan Domain `arradigital.my.id`
1. Di dashboard project Vercel Anda, buka tab **Settings** > **Domains**.
2. Masukkan domain `arradigital.my.id` dan `www.arradigital.my.id`, lalu klik **Add**.
3. Vercel akan menampilkan instruksi DNS. Buka panel DNS tempat Anda membeli domain (misal Cloudflare, Niagahoster, Domainesia, Idwebhost), lalu tambahkan:
   - **A Record:**
     - Host: `@` (atau root)
     - Target: `76.76.21.21`
   - **CNAME Record:**
     - Host: `www`
     - Target: `cname.vercel-dns.com`
4. Tunggu beberapa menit hingga sertifikat SSL terbit otomatis oleh Vercel.

---

## 5. Panduan Menggunakan Panel Admin (`/admin`)

Panel Admin dapat diakses langsung melalui:
- URL: `https://arradigital.my.id/admin` atau link **"Admin"** di navbar dan footer.

### Kredensial Login Administrator:
- Username dan Password diatur secara aman melalui file konfigurasi lingkungan (`.env` atau Environment Variables server/Vercel).
- **Default Username:** `admin` (Dapat disesuaikan di `ADMIN_USERNAME` pada `.env`)
- **Password:** Dikonfigurasikan melalui variabel `ADMIN_PASSWORD` pada `.env` demi keamanan server.

### Menghubungkan Google Apps Script di Admin Panel:
1. Setelah login ke Dashboard, klik tab **Pengaturan**.
2. Pada bagian **"🔗 Integrasi Google Apps Script (Spreadsheet DB)"**, tempelkan URL Web App Google Apps Script Anda.
3. Klik tombol **"⚡ Uji & Simpan Koneksi Sheets"**.
4. Sistem akan melakukan ping uji coba dan menampilkan status hijau: `✓ Berhasil Terhubung ke Google Spreadsheet!`.
5. Mulai saat itu, seluruh perubahan produk, harga, dan pesanan baru akan tersimpan langsung di Google Spreadsheet Anda.

### Fitur Panel Admin:
1. **Ringkasan (Dashboard):**
   - Metrik total pesanan, pesanan pending, omzet terverifikasi, jumlah produk, dan pelanggan.
   - Tabel 5 pesanan/leads terbaru.
2. **Kelola Produk:**
   - Tambah produk baru atau edit harga, deskripsi, dan status (`active` / `draft`).
3. **Kelola Pesanan:**
   - Filter pesanan berdasarkan status: `PENDING`, `PAID`, `COMPLETED`, `CANCELLED`.
   - Update status pesanan dan catat referensi mutasi pembayaran bank/e-wallet.
4. **Pelanggan:**
   - Direktori kontak pelanggan yang pernah memesan atau berkonsultasi via WhatsApp.
5. **Pengaturan Bisnis:**
   - Ubah nomor WhatsApp bisnis (format `628xxxxxxxx`), tagline, email, dan nama brand.

---

## 6. Fitur AI Tools Tanpa Biaya API

Website dilengkapi dengan 5 tools AI interaktif di menu `/tools` yang berjalan langsung di browser tanpa memerlukan API berbayar:
1. **Hook Video AI Affiliate:** Menghasilkan 5 sudut pandang hook penahan scroll untuk video TikTok/Reels.
2. **Skrip Video 60 Detik:** Formula PAS (*Problem - Agitate - Solve - CTA*) untuk promosi produk.
3. **Caption & CTA Konversi:** Template copywriting hard selling & soft selling dengan hashtag.
4. **Kalender Konten 7 Hari:** Rencana jadwal konten harian tematik.
5. **Brief Proyek Website:** Template spesifikasi pembuatan website & aplikasi.

---

## 7. Mode Standalone / Offline

Jika Anda belum sempat men-deploy Google Apps Script, website **tetap berjalan 100% normal** berkat adapter database lokal di `js/gas-adapter.js`. Anda tetap dapat mencoba pemesanan, melihat katalog, menggunakan AI tools, dan login ke panel admin secara offline.
