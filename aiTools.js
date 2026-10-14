/**
 * AI Tools Engine for ARRA DIGITAL
 * Provides instant prompt & content generation without requiring paid APIs.
 * Includes optional Google Gemini 1.5 Flash adapter when GEMINI_API_KEY is supplied.
 */

// Heuristic Generator Templates
function generateLocalContent(toolType, inputs) {
  const { product_name = 'Produk Digital', niche = 'Affiliate', audience = 'UMKM / Kreator', benefit = 'Menghemat waktu & mempermudah kerja' } = inputs;

  switch (toolType) {
    case 'affiliate_hooks':
      return {
        tool: 'Affiliate Hooks & Scroll-Stoppers',
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
        ],
        prompt_template: `Anda adalah copywriter affiliate TikTok/Reels papan atas Indonesia. Buat 5 variasi hook penahan scroll untuk produk "${product_name}" di bidang ${niche}. Target audiens: ${audience}. Manfaat utama: ${benefit}. Nada bicara santai, to the point, dan hindari kata-kata basi.`
      };

    case 'video_script':
      return {
        tool: 'Product Video Script (60 Detik)',
        summary: `Skrip Video Format PAS (Problem - Agitate - Solve - CTA) untuk ${product_name}`,
        timeline: [
          {
            segment: '00:00 - 00:03 (The Hook)',
            visual: 'Tatap kamera dengan ekspresi serius atau tunjukkan layar HP yang kusut/repot.',
            audio: `"Kalau Anda masih ngabisin berjam-jam cuma buat urusan ${niche}, dengerin ini sebentar."`
          },
          {
            segment: '00:04 - 00:15 (Agitasi Masalah)',
            visual: 'Kamera beralih ke close-up catatan manual atau tumpukan file yang berantakan.',
            audio: `"Masalahnya, banyak yang mikir kerja keras itu harus repot manual. Padahal waktu Anda jauh lebih berharga buat mikirin strategi dan closingan."`
          },
          {
            segment: '00:16 - 00:40 (Solusi & Demonstrasi Produk)',
            visual: 'Screen-record layar laptop/HP mendemonstrasikan ${product_name} digunakan dengan rapi dan cepat.',
            audio: `"Makanya sekarang saya pakai ${product_name}. Fiturnya udah dirancang otomatis buat ${benefit}. Tinggal masukin data, semua beres dalam hitungan menit."`
          },
          {
            segment: '00:41 - 00:60 (Call to Action)',
            visual: 'Tunjuk ke arah tombol keranjang kuning atau link profil bio dengan senyum ramah.',
            audio: `"Daripada buang waktu coba-coba sendiri, langsung cek link di bio atau keranjang di pojok bawah sekarang sebelum promonya selesai!"`
          }
        ],
        prompt_template: `Tulis skrip video berdurasi tepat 60 detik untuk video TikTok/Reels mempromosikan "${product_name}". Struktur harus mencakup Hook (3 dtk), Masalah (12 dtk), Solusi & Demo (25 dtk), serta CTA (20 dtk). Bahasa Indonesia alami untuk kreator lokal.`
      };

    case 'caption_cta':
      return {
        tool: 'Caption & CTA Generator',
        summary: `Caption Siap Posting Instagram / TikTok untuk ${product_name}`,
        caption: `Capek buang waktu urus ${niche} yang ribet?\n\nSekarang saatnya kerja lebih cerdas pakai ${product_name}. Solusi praktis buat kamu yang mau ${benefit} tanpa harus pusing setup rumit dari nol.\n\n✨ Keunggulan utama:\n- Praktis & langsung bisa dipakai hari ini\n- Panduan lengkap Bahasa Indonesia\n- Cocok untuk ${audience}\n\n👇 Mau coba juga? Cek link di bio kami sekarang atau ketik "INFO" di kolom komentar ya!`,
        hashtags: `#${niche.replace(/\s+/g, '')} #ProdukDigital #${product_name.replace(/\s+/g, '')} #TipsKreator #SolusiBisnis #ArraDigital`,
        cta_variations: [
          'Klik link di bio sebelum harga promo berakhir malam ini!',
          'Ketik "MAU" di komentar, nanti kami kirimkan akses detailnya langsung ke DM kamu!',
          'Simpan postingan ini biar gampang dicari pas kamu butuh nanti.'
        ],
        prompt_template: `Buat caption Instagram/TikTok berkonversi tinggi untuk produk "${product_name}". Target: ${audience}. Sertakan bullet point manfaat, hashtag relevan di Indonesia, dan 3 pilihan Call to Action berbeda.`
      };

    case 'content_calendar':
      return {
        tool: 'Kalender Konten 7 Hari',
        summary: `Rencana Konten Mingguan Niche ${niche}`,
        schedule: [
          { day: 'Senin', theme: 'Edukasi / Mindset', format: 'Carousel / Infografis', topic: `3 Kesalahan fatal saat memulai ${niche}` },
          { day: 'Selasa', theme: 'Problem & Agitasi', format: 'Short Video (Reels/TikTok)', topic: 'Kenapa cara lama bikin kamu rugi waktu' },
          { day: 'Rabu', theme: 'Tutorial Singkat', format: 'Screen Recording', topic: `Cara dapat ${benefit} dalam 3 langkah mudah` },
          { day: 'Kamis', theme: 'Social Proof / Studi Kasus', format: 'Storytelling Post', topic: 'Hasil nyata sebelum dan sesudah pakai sistem otomatis' },
          { day: 'Jumat', theme: 'Produk Showcase', format: 'Video Demo Singkat', topic: `Review fitur favorit di ${product_name}` },
          { day: 'Sabtu', theme: 'Q&A & Interaksi', format: 'Polling / Tanya Jawab', topic: 'Jawab pertanyaan paling sering dari calon pengguna' },
          { day: 'Minggu', theme: 'Soft Selling Promo', format: 'Direct Video CTA', topic: 'Pengingat penawaran terbatas minggu ini' }
        ],
        prompt_template: `Susun rencana kalender konten 7 hari lengkap untuk akun media sosial yang memasarkan produk "${product_name}" di segmen ${niche}. Setiap hari harus memiliki tema, format konten, dan judul topik yang menarik.`
      };

    case 'website_brief':
      return {
        tool: 'Generator Brief Proyek Website',
        summary: `Brief Spesifikasi Website untuk ${product_name}`,
        project_overview: {
          client_niche: niche,
          target_audience: audience,
          primary_goal: `Meningkatkan konversi penjualan ${product_name} dan menangkap leads WhatsApp.`
        },
        recommended_structure: [
          'Header & Sticky Navbar dengan tombol aksi WhatsApp',
          'Hero Section dengan Value Proposition jelas dan bukti sosial',
          'Katalog / Showcase Produk dengan harga transparan',
          'Kenapa Memilih Kami (Benefit dibanding kompetitor)',
          'Alur Pemesanan 3 Langkah Praktis',
          'FAQ seputar produk dan garansi',
          'Footer lengkap dengan link legal & kontak resmi'
        ],
        tech_recommendation: 'Static HTML5 + CSS modern dihosting di Cloudflare Pages / GitHub Pages untuk biaya operasional Rp 0/bulan.',
        prompt_template: `Buat project brief teknis dan konten untuk pembuatan website bisnis di bidang ${niche}. Tuliskan tujuan proyek, target pengunjung, arsitektur informasi halaman, dan rekomendasi teknis hemat biaya.`
      };

    default:
      throw new Error(`Tool type '${toolType}' tidak dikenali.`);
  }
}

/**
 * Endpoint Utama Pemrosesan Tools
 */
async function processToolRequest(toolType, inputs) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const localFallback = generateLocalContent(toolType, inputs);
      const prompt = `${localFallback.prompt_template}\n\nKonteks Tambahan Pengguna:\nProduk: ${inputs.product_name || '-'}\nNiche: ${inputs.niche || '-'}\nAudiens: ${inputs.audience || '-'}\nManfaat: ${inputs.benefit || '-'}\n\nJawab dalam format JSON terstruktur dengan bahasa Indonesia yang elegan dan persuasif.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText);
          return {
            source: 'gemini_api',
            data: parsed,
            disclaimer: 'Dihasilkan dengan bantuan model Google Gemini. Hasil disajikan sebagai referensi ide kreatif tanpa jaminan performa finansial.'
          };
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back to local generator engine:', e.message);
    }
  }

  const localResult = generateLocalContent(toolType, inputs);
  return {
    source: 'local_engine',
    data: localResult,
    disclaimer: 'Dihasilkan secara instan oleh mesin template Arra Digital. Hasil merupakan panduan referensi ide kreatif; kinerja aktual bergantung pada konsistensi dan audiens nyata.'
  };
}

module.exports = {
  processToolRequest,
  generateLocalContent
};
