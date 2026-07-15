# PRD - Gema Kemerdekaan RI: Kiosk Interaktif UPG

## 1. Ringkasan

Gema Kemerdekaan RI adalah aplikasi web layar sentuh untuk Bandara Internasional Sultan Hasanuddin Makassar (UPG), sebagai bagian dari peringatan HUT ke-81 Kemerdekaan RI pada 1-31 Agustus 2026. Aplikasi dipasang pada PC kiosk yang terhubung ke layar sentuh dan kamera, lalu mengajak penumpang untuk melihat sejarah singkat, menyampaikan harapan, dan membuat foto bertema kemerdekaan yang dapat diunduh melalui QR.

Produk ini memperluas aktivasi InJourney Airports: bandara menjadi ruang pengalaman publik yang menampilkan kebanggaan nasional dan kekhasan budaya daerah tanpa mengganggu arus penumpang atau operasi terminal.

## 2. Dasar Analisis Dokumen

Sumber yang ditelaah:

- `planning (1).md`: konsep produk, alur kiosk, guest book, photobooth, QR, moderasi, dan kebutuhan perangkat.
- `planning (2).md`: peta layar serta prinsip interaksi layar sentuh.
- `Asset_Design_guideline/HUT RI 81.pptx`: program InJourney Airports. UPG termasuk lokasi focal point pada 1-31 Agustus 2026; arahan menggabungkan merah-putih dan ornamen budaya daerah.
- `Asset_Design_guideline/HUTRI 81 - Pedoman Identitas Visual.pdf`: batasan resmi identitas HUT RI 81.
- Aset foto, logo, video, font, elemen grafis, dan audio di `Asset_Design_guideline/`.

### Ketentuan identitas yang wajib diterapkan

- Tema resmi: **Indonesia Berdaulat, Adil dan Makmur**.
- Palet inti: merah `#ED1C24`, putih `#FFFFFF`, hitam `#000000`. Jangan menambah warna identitas lain pada logo.
- Font: Saira Semi Condensed Bold untuk judul/subjudul dan Saira Semi Condensed Regular untuk teks isi. File font sudah tersedia di aset.
- Gunakan varian logo resmi yang sesuai orientasi layar. Logo tidak boleh diubah warna, diberi gradien/garis/bayangan, diputar, atau ditaruh pada area foto yang ramai/kurang kontras.
- Logo utama minimum 225 px, logo sekunder minimum 150 px; pertahankan area aman 2X sebagaimana pedoman.
- Foto mengikuti gaya aset resmi: cropping dengan bidang merah/putih dan elemen grafis organik. Untuk UPG, konten dapat menampilkan budaya Sulawesi Selatan setelah disetujui tim komunikasi.

## 3. Tujuan dan Indikator Keberhasilan

### Tujuan

1. Menghadirkan pengalaman HUT RI yang singkat, mudah dipakai, dan menarik bagi penumpang.
2. Mengumpulkan ucapan positif yang telah dimoderasi untuk ditampilkan kembali di kiosk.
3. Memberikan artefak digital yang dapat dibawa pulang melalui QR tanpa meminta nomor telepon atau email.
4. Menjaga privasi dan kelayakan konten pada layar publik.

### KPI event (target awal, disahkan pemilik bisnis)

| Metrik | Target |
| --- | --- |
| Interaksi mulai | >= 150 per hari per kiosk |
| Guest book valid | >= 40 per hari |
| Foto selesai dibuat | >= 60 per hari |
| Pemindaian QR dari foto | >= 60% foto tersimpan |
| Waktu penyelesaian photobooth | <= 90 detik median |
| Konten publik yang lolos moderasi | 100% disetujui admin |
| Kembali ke idle setelah inaktif | 90 detik |

## 4. Pengguna dan Kebutuhan

| Pengguna | Kebutuhan utama |
| --- | --- |
| Penumpang/pengunjung | Interaksi cepat, huruf besar, tombol jelas, tanpa akun, hasil foto mudah diambil. |
| Petugas event | Dapat memoderasi kiriman dalam hitungan detik dan memulihkan kiosk. |
| Admin komunikasi | Dapat mengelola konten timeline, twibbon, dan melihat statistik. |
| Tim IT bandara | Aplikasi stabil, dapat dipantau, aman, dan mudah dijalankan mode kiosk. |

## 5. Ruang Lingkup

### MVP (wajib sebelum pembukaan)

1. Layar idle dengan ajakan sentuh dan rotasi konten yang telah disetujui.
2. Menu utama: Jejak Sejarah, Tulis Harapan, dan Photobooth.
3. Timeline sejarah offline, maksimal enam kartu dan dapat di-swipe/ditekan.
4. Guest book: nama panggilan/nama, asal daerah, dan harapan; validasi serta persetujuan privasi.
5. Photobooth dengan kamera, tiga twibbon statis resmi, hitung mundur, ambil ulang, simpan foto, dan QR unduh sementara.
6. Persetujuan eksplisit untuk menampilkan foto/harapan di layar publik; default tidak setuju.
7. Dashboard admin terproteksi untuk approve/reject, hapus data, dan melihat status kiosk dasar.
8. Timeout, pembersihan sesi kamera, serta halaman fallback bila kamera/internet gagal.

### Di luar MVP

- Face tracking, filter AR, atau pengenalan wajah.
- Login/akun penumpang, integrasi media sosial, email/WhatsApp.
- Cetak foto fisik.
- Analitik berbayar atau dashboard BI kompleks.
- Pengelolaan konten mandiri oleh banyak cabang.

## 6. Alur Utama

```text
Idle -> sentuh layar -> menu
                       |- Timeline -> menu
                       |- Guest book -> terima kasih -> (foto | menu)
                       `- Photobooth -> preview -> simpan -> QR -> menu

Admin -> antrean moderasi -> approve/reject -> konten approved tampil di idle
```

1. Saat idle, aplikasi menampilkan identitas HUT RI 81, ajakan sentuh, dan kartu ucapan/foto yang telah disetujui.
2. Penumpang memilih satu dari tiga aktivitas.
3. Guest book disimpan dalam status `pending`; tidak akan pernah langsung muncul pada layar publik.
4. Photobooth mengakses kamera setelah pengguna menekan mulai. Foto final adalah gabungan frame video dan twibbon di Canvas.
5. Setelah foto tersimpan, kiosk menampilkan QR yang hanya dapat digunakan selama 24 jam. Pengguna dapat kembali ke menu atau kiosk kembali idle otomatis.
6. Semua layar interaktif kembali ke idle setelah 90 detik tanpa aktivitas; stream kamera dihentikan dan data form yang belum dikirim dibuang.

## 7. Kebutuhan Fungsional

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | Kiosk harus berjalan fullscreen pada resolusi target 1920x1080 dan tetap layak pada 1080x1920. | P0 |
| FR-02 | Semua aksi utama memiliki area sentuh minimal 56x56 CSS px; teks isi minimal 24 px pada 1080p. | P0 |
| FR-03 | Timeline dapat diakses tanpa internet setelah aplikasi pertama kali dimuat. | P0 |
| FR-04 | Guest book memvalidasi nama 2-50 karakter, asal 2-60, dan harapan 10-240; karakter tidak aman disanitasi. | P0 |
| FR-05 | Kiriman guest book atau foto berstatus `pending` dan hanya tampil setelah `approved`. | P0 |
| FR-06 | Photobooth mendukung kamera USB melalui `getUserMedia`, tiga twibbon PNG, countdown 3 detik, preview, dan ambil ulang. | P0 |
| FR-07 | Foto final JPEG maksimum 2 MB dan QR mengarah ke halaman unduh bertoken yang kedaluwarsa 24 jam. | P0 |
| FR-08 | Admin login, melihat antrean, menyetujui/menolak/menghapus kiriman, serta dapat menonaktifkan konten publik. | P0 |
| FR-09 | Kiosk mencatat event anonim (mulai, submit, foto, QR tampil, error) tanpa menyimpan identitas perangkat pribadi. | P1 |
| FR-10 | Admin dapat mengganti kartu timeline dan daftar twibbon melalui konfigurasi terkontrol. | P1 |

## 8. Kebutuhan Nonfungsional

- Waktu tampil pertama <= 3 detik pada koneksi terminal yang normal; aset visual dikompresi dan dipreload.
- Antarmuka dan flow utama berbahasa Indonesia, dengan bahasa yang ramah, ringkas, dan non-politis.
- Target aksesibilitas: kontras teks minimum WCAG AA, fokus keyboard untuk admin, serta tidak mengandalkan warna saja.
- Kiosk tetap dapat membuka menu, timeline, dan kamera ketika koneksi internet putus; penyimpanan/QR diberi pesan retry yang jelas.
- Tidak ada akses publik untuk membaca seluruh database atau daftar foto.
- Admin memakai autentikasi dan peran `admin`; kredensial layanan tidak pernah berada di frontend.
- Data event dihapus maksimal H+7 setelah event atau sesuai kebijakan retensi yang disetujui legal/komunikasi.

## 9. Teknologi yang Dipilih

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Gratis, cepat, mudah dirawat; cocok untuk SPA kiosk. |
| UI | Tailwind CSS + Radix primitives + Framer Motion | Gratis/open-source, mudah membuat target sentuh besar dan animasi ringan. |
| Kamera/foto | Browser MediaDevices + Canvas API | Tidak perlu SDK berbayar; bekerja dengan webcam USB modern. |
| Backend | FastAPI + Pydantic + Uvicorn | Gratis/open-source, validasi kuat, dokumentasi OpenAPI otomatis, dan ringan untuk server yang tersedia. |
| Database | PostgreSQL 17 + SQLAlchemy + Psycopg 3 + Alembic | Database relasional sudah tersedia pada LXC terpisah dan mendukung migrasi terkontrol. |
| Hosting | Docker Compose pada LXC Debian + Nginx | Memanfaatkan server sendiri dan menyederhanakan deployment serta rollback. |
| Public ingress | Cloudflare Tunnel pada LXC terpisah | Memetakan subdomain publik ke IP/port internal tanpa membuka port origin ke internet. |
| Penyimpanan foto | Filesystem privat pada volume Docker | Cukup untuk event dan retensi pendek; file hanya disajikan setelah token diverifikasi API. |
| Admin | Cloudflare Access + validasi JWT pada FastAPI | Melindungi dashboard di edge sekaligus mencegah bypass langsung ke origin. |
| Anti-spam | Validasi FastAPI + rate limit origin/Cloudflare | Mencegah flood tanpa mengumpulkan data tambahan. |
| QR | `qrcode` (open-source) | QR dibuat di browser dari URL unduh bertoken. |
| Monitoring | Structured application log + health endpoint | Tidak menambah layanan berbayar dan cukup untuk MVP; Sentry dapat ditambahkan kemudian. |

### Topologi deployment yang disepakati

- Frontend publik: `merdeka.farlabs.my.id` diarahkan Tunnel ke Nginx pada Docker LXC.
- Dashboard admin: `merdeka-admin.farlabs.my.id` diarahkan Tunnel ke origin admin dan wajib dilindungi Cloudflare Access.
- FastAPI tidak perlu memiliki hostname publik tersendiri; Nginx meneruskan `/api/*` dan `/d/*` melalui jaringan Docker internal.
- FastAPI mengakses PostgreSQL melalui jaringan LAN Proxmox dengan user dan database khusus aplikasi.
- Cloudflare Tunnel tetap berjalan pada LXC yang sudah ada, bukan sebagai container aplikasi.

## 10. Model Data Ringkas

| Entitas | Field inti |
| --- | --- |
| `guest_entries` | `id`, `display_name`, `origin`, `message`, `status`, `consent_public`, `created_at`, `reviewed_at`, `reviewed_by` |
| `photos` | `id`, `guest_entry_id?`, `storage_path`, `public_consent`, `status`, `expires_at`, `created_at`, `reviewed_at` |
| `download_tokens` | `id`, `photo_id`, `token_hash`, `expires_at`, `used_at?` |
| `content_items` | `id`, `type`, `title`, `body`, `asset_path`, `sort_order`, `active` |
| `audit_events` | `id`, `actor_type`, `action`, `entity_type`, `entity_id`, `created_at` |

FastAPI menjadi satu-satunya akses data dari browser. User database aplikasi tidak memiliki hak superuser; endpoint publik hanya dapat membuat data `pending` dan membaca proyeksi `approved`. Endpoint admin memerlukan identitas Cloudflare Access yang tervalidasi dan seluruh aksi moderasi dicatat pada audit log.

## 11. Privasi, Moderasi, dan Operasional

- Tampilkan pemberitahuan sebelum kamera aktif: tujuan foto, masa simpan, QR, dan pilihan tampil publik.
- Persetujuan tampilan publik terpisah dari persetujuan membuat foto. Jangan gunakan checkbox yang sudah tercentang.
- Jangan simpan rekaman video, IP, nomor telepon, email, atau data perjalanan.
- Foto/ucapan tetap `pending` bahkan bila pengguna setuju tampil publik. Petugas harus menyetujui manual.
- Admin dapat reject dan menghapus seketika. Konten yang ditolak tidak tampil pada idle.
- Gunakan nama file UUID, volume privat, dan token unduhan sekali pakai atau berlaku 24 jam. Database hanya menyimpan hash token.
- Pasang browser dalam kiosk mode, nonaktifkan autofill/download browser, dan buat shortcut pemulihan ke halaman admin/healthcheck untuk petugas.

## 12. Kriteria Penerimaan Go-Live

1. Semua asset HUT RI 81 pada aplikasi telah melalui review visual dan mengikuti aturan logo, warna, font, dan kontras pedoman.
2. Pengguna dapat menyelesaikan guest book dan photobooth tanpa keyboard fisik dalam <= 90 detik pada perangkat target.
3. Foto yang diunduh melalui QR identik dengan preview dan tidak dapat diakses setelah token kedaluwarsa.
4. Data `pending` tidak muncul pada layar idle, REST endpoint publik, maupun URL storage.
5. Timeout menghentikan kamera dan menghapus state form lokal.
6. Admin dapat approve/reject dari perangkat terpisah dan hasilnya muncul/hilang pada idle maksimal 30 detik.
7. Kiosk diuji minimal 4 jam terus-menerus, termasuk cabut/pasang internet dan kamera.
8. Tim operasional memiliki SOP start, restart, moderasi, serta eskalasi insiden.

## 13. Keputusan yang Masih Memerlukan Konfirmasi Pemilik Bisnis

- Jumlah, orientasi, lokasi pasti kiosk, dan spesifikasi webcam/touchscreen.
- Legal owner, teks persetujuan, dan retensi final foto/ucapan.
- Materi timeline yang telah diverifikasi sumber sejarahnya.
- Staf, jam kerja, dan SLA moderasi; tanpa ini foto/ucapan tidak boleh dipublikasikan otomatis.
- IP LXC Cloudflare Tunnel untuk pembatasan firewall origin.
- Konfirmasi final hostname `merdeka.farlabs.my.id` dan `merdeka-admin.farlabs.my.id`.
