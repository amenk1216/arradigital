/**
 * Konfigurasi Utama Arra Digital (config.js)
 * Semua data dinamis (harga, paket, kontak, FAQ, portofolio) dikelola di sini.
 */
const CONFIG = {
  // Google Apps Script Web App Endpoint URL (dapat diisi URL GAS setelah deploy, atau via Admin Settings)
  gasApiUrl: "",
  brand: {
    name: "Arra Digital",
    tagline: "Studio Website & Produk Digital",
    domain: "arradigital.my.id",
    year: 2026
  },
  whatsapp: {
    number: "6281317028494",
    defaultMessage: "Halo Arra Digital, saya ingin konsultasi."
  },
  theme: {
    default: "auto" // 'auto', 'light', atau 'dark'
  },
  packages: [
    {
      id: "starter",
      name: "Starter",
      price: 750000,
      pricePrefix: "",
      unit: "/ proyek",
      target: "Untuk UMKM, profil usaha sederhana, atau bisnis pemula yang ingin segera hadir online.",
      features: [
        "Landing page 1 halaman",
        "Desain responsif",
        "Tombol WhatsApp & peta",
        "1x revisi"
      ],
      revisions: "1x revisi",
      support: "Setup awal & panduan",
      popular: false
    },
    {
      id: "bisnis",
      name: "Bisnis",
      price: 2500000,
      pricePrefix: "",
      unit: "/ proyek",
      target: "Untuk usaha berkembang yang membutuhkan kredibilitas penuh dan fitur pemasaran lengkap.",
      features: [
        "Company profile hingga 5 halaman",
        "SEO dasar & Google Maps",
        "Galeri & formulir kontak",
        "Analytics pengunjung",
        "3x revisi",
        "Support 1 bulan"
      ],
      revisions: "3x revisi",
      support: "Support 1 bulan penuh",
      popular: true
    },
    {
      id: "custom-app",
      name: "Custom App",
      price: 5000000,
      pricePrefix: "Mulai ",
      unit: "/ proyek",
      target: "Untuk alur bisnis unik, sistem pencatatan terpusat, dan otomasi operasional.",
      features: [
        "Web app sesuai alur usaha",
        "Dashboard & laporan otomatis",
        "Multi-user dengan hak akses",
        "Pelatihan penggunaan",
        "Support 3 bulan"
      ],
      revisions: "Revisi bertahap",
      support: "Support 3 bulan prioritas",
      popular: false
    }
  ],
  products: [
    {
      id: "ai-premium",
      name: "Akses AI Premium",
      icon: "⚡",
      description: "Akses berlangganan akun AI premium pilihan untuk mendongkrak produktivitas kerja, copywriting, dan riset Anda secara efisien.",
      priceText: "Hubungi kami"
    },
    {
      id: "template-prompts",
      name: "Template & Prompt Pack",
      icon: "📑",
      description: "Kumpulan template dokumen usaha, spreadsheet manajemen, dan formula prompt siap pakai untuk mempercepat operasional.",
      priceText: "Hubungi kami"
    },
    {
      id: "tools-siap-pakai",
      name: "Tools Siap Pakai",
      icon: "🛠️",
      description: "Beragam utilitas digital, skrip otomasi Google Apps Script, dan alat bantu praktis tanpa proses instalasi yang rumit.",
      priceText: "Hubungi kami"
    }
  ],
  services: [
    {
      id: "website",
      icon: "🌐",
      title: "Pembuatan Website",
      description: "Mulai dari landing page konversi tinggi hingga company profile profesional. Cepat dimuat, ramah mobile, dan dirancang khusus memikat calon pelanggan Anda."
    },
    {
      id: "custom-app",
      icon: "⚙️",
      title: "Aplikasi & Sistem Custom",
      description: "Digitalisasi alur kerja Anda dengan web app atau otomasi kustom (seperti Google Apps Script) untuk menghemat waktu dan meminimalisir kesalahan manual."
    },
    {
      id: "maintenance",
      icon: "🛡️",
      title: "Maintenance & Support",
      description: "Jaga website dan aplikasi tetap optimal, aman, dan mutakhir. Kami siap mendampingi operasional digital usaha Anda secara berkelanjutan."
    }
  ],
  steps: [
    {
      title: "Konsultasi",
      description: "Diskusikan kebutuhan, sasaran, atau kendala bisnis Anda. Kami bantu memetakan solusi digital yang paling pas dan efisien."
    },
    {
      title: "Penawaran",
      description: "Kami susun proposal transparan: rincian fitur, timeline pengerjaan yang jelas, serta kesepakatan harga tanpa biaya tersembunyi."
    },
    {
      title: "Pengerjaan",
      description: "Proses perancangan dan pengembangan dimulai setelah pembayaran DP, disertai pembaruan berkala untuk Anda."
    },
    {
      title: "Peluncuran",
      description: "Setelah uji fungsi tuntas dan pelunasan, website atau sistem langsung online dan diserahterimakan lengkap dengan panduannya."
    }
  ],
  faq: [
    {
      q: "Berapa lama estimasi pengerjaan website atau aplikasi?",
      a: "Untuk landing page rata-rata selesai dalam 7 hari kerja setelah materi (teks, logo, foto) kami terima lengkap. Company profile membutuhkan sekitar 10–14 hari kerja, sedangkan aplikasi custom disesuaikan dengan kompleksitas alur kerja yang disepakati."
    },
    {
      q: "Bagaimana sistem pembayarannya?",
      a: "Sistem pembayaran kami menggunakan skema DP (Down Payment) sebesar 50% di awal sebelum pengerjaan dimulai, dan pelunasan 50% sisanya dilakukan setelah proyek selesai diuji dan siap diluncurkan."
    },
    {
      q: "Apakah biaya paket sudah termasuk hosting dan domain?",
      a: "Biaya paket fokus pada jasa desain, perancangan, dan pengembangan sistem. Untuk domain dan hosting, kami dapat membantu pendaftaran dan pengaturannya langsung atas nama akun Anda sendiri agar Anda memiliki kepemilikan penuh, atau kami bundling sesuai kesepakatan."
    },
    {
      q: "Bagaimana kebijakan revisi selama proyek berjalan?",
      a: "Setiap paket memiliki kuota revisi (mulai 1x hingga 3x atau bertahap). Revisi mencakup penyesuaian tata letak, warna, teks, dan elemen grafis selama masih dalam koridor ruang lingkup (scope) yang disepakati di awal."
    },
    {
      q: "Bagaimana cara mendapatkan produk digital setelah memesan?",
      a: "Setelah pembayaran terkonfirmasi, kami akan mengirimkan link akses, panduan aktivasi, atau file produk digital langsung melalui WhatsApp atau email resmi Anda dalam hitungan menit."
    }
  ],
  portfolio: [
    {
      title: "Sistem Manajemen Laundry (Google Apps Script)",
      type: "Aplikasi Otomasi & Web App",
      description: "Otomasi pencatatan transaksi kiloan & satuan, status cucian real-time, cetak nota digital, dan rekap omzet otomatis via Google Sheets.",
      tags: ["Google Apps Script", "Web App", "Otomasi"],
      isSample: true
    },
    {
      title: "Landing Page Kuliner Sehat",
      type: "Landing Page Konversi",
      description: "Website satu halaman responsif dengan katalog menu interaktif, integrasi pemesanan WhatsApp instan, dan penunjuk rute Google Maps.",
      tags: ["Landing Page", "Kuliner", "WhatsApp Order"],
      isSample: true
    },
    {
      title: "Company Profile Jasa Konstruksi",
      type: "Company Profile Perusahaan",
      description: "Profil usaha 5 halaman modern menampilkan portofolio proyek arsitektur, form konsultasi, dan optimasi SEO lokal.",
      tags: ["Company Profile", "SEO", "Multi-page"],
      isSample: true
    }
  ]
};
