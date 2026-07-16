# Rencana Implementasi - Gema Kemerdekaan RI Kiosk UPG

Rencana ini mengutamakan MVP yang aman untuk area publik dan hanya memakai komponen gratis/open-source. Estimasi adalah 15 hari kerja efektif untuk satu engineer frontend/full-stack, satu reviewer desain/komunikasi, dan satu PIC operasional. Pekerjaan dapat dipercepat jika konten serta perangkat sudah tersedia.

## Urutan Implementasi

| Fase | Durasi | Hasil | Kriteria selesai |
| --- | ---: | --- | --- |
| 0. Penguncian keputusan | 1 hari | Ruang lingkup, PIC moderasi, retensi, perangkat, akun | Keputusan pada bagian 13 PRD disetujui. |
| 1. Fondasi dan desain | 2 hari | Repo React/TS, token desain, screen map, aset terpilih | Visual sesuai pedoman HUT RI 81 dan 1080p. |
| 2. Alur kiosk offline | 3 hari | Idle, menu, timeline, timeout, fallback | Menu/timeline tetap berfungsi tanpa internet. |
| 3. Guest book dan admin | 3 hari | Skema PostgreSQL, FastAPI, Cloudflare Access, moderasi | Data pending tidak pernah tampil publik. |
| 4. Photobooth dan QR | 3 hari | Kamera, Canvas, twibbon, upload privat, token unduh | Foto final/QR lulus uji perangkat target. |
| 5. Hardening dan UAT | 2 hari | Rate limit, observability, E2E, uji failover, SOP | Semua acceptance criteria P0 lulus. |
| 6. Pilot dan go-live | 1 hari | Instalasi kiosk, smoke test, briefing petugas | Kiosk stabil dan PIC siap moderasi. |

## Backlog Terperinci

### Fase 0 - Penguncian keputusan

- [ ] Tetapkan satu PIC produk, PIC moderasi, dan PIC teknis.
- [ ] Tentukan jumlah kiosk, resolusi/orientasi, browser/OS, model webcam, serta jaringan.
- [ ] Setujui teks privasi, retensi H+7, dan jalur eskalasi konten.
- [ ] Konfirmasi IP LXC Cloudflare Tunnel dan aktifkan MFA untuk admin Cloudflare Access.
- [x] Tetapkan domain awal: `merdeka.farlabs.my.id` dan `merdeka-admin.farlabs.my.id`.

### Fase 1 - Fondasi dan desain

- [x] Inisialisasi monorepo React/TypeScript/Vite dan FastAPI, lint, unit test, serta Docker Compose.
- [x] Salin aset yang diizinkan ke `public/assets`; gunakan file PNG logo resmi, font Saira lokal, dan foto hasil kurasi.
- [x] Definisikan design tokens: `brand-red #ED1C24`, putih, hitam, ukuran sentuh >= 56 px, dan skala teks kiosk.
- [x] Buat enam layar: Idle, Menu, Timeline, Guest Book, Kamera, Preview/QR; tambah dashboard admin terpisah.
- [ ] Lakukan review desain dengan komunikasi/brand sebelum coding detail.

### Fase 2 - Alur kiosk offline

- [x] Buat state machine layar: `idle`, `menu`, `timeline`, `guestbook`, `camera`, `preview`, `download`.
- [x] Implementasi timer global 90 detik yang mengecualikan countdown dan mematikan stream kamera saat reset.
- [x] Buat timeline data-driven dari JSON lokal (maksimum enam kartu, teks sumber tervalidasi).
- [x] Tambahkan cache aset aplikasi dan halaman offline melalui service worker hanya untuk shell/timeline.
- [x] Tambahkan indikator koneksi dan fallback menu/timeline ketika internet putus serta pesan pemulihan saat kamera atau jaringan gagal.

### Fase 3 - Guest book dan admin

- [x] Buat database/user PostgreSQL khusus, tabel melalui Alembic, dan volume foto privat.
- [x] Buat endpoint FastAPI `submit-entry` untuk validasi, sanitasi, dan insert `pending`; throttling diselesaikan pada fase hardening.
- [x] Buat endpoint aman `approved-feed` yang hanya mengembalikan data yang telah disetujui dan sudah diminimalkan.
- [x] Implementasi admin dengan validasi JWT Cloudflare Access: daftar antrean, preview, approve, reject, hapus, dan audit log. Konfigurasi Team Domain/AUD tetap wajib sebelum digunakan.
- [x] Tambahkan polling 30 detik hanya pada feed `approved` dan carousel 8 detik agar idle terbarui tanpa me-refresh seluruh aplikasi.

### Fase 4 - Photobooth dan QR

- [x] Integrasikan `getUserMedia` dengan resolusi default 1280x720, indikator izin, dan penghentian track yang andal.
- [x] Sediakan tiga bingkai code-native bertema identitas resmi, pemilihannya, serta overlay pada hasil Canvas.
- [x] Render frame final ke Canvas, kompres JPEG <= 2 MB, dan samakan orientasi/mirroring preview dengan hasil.
- [x] Buat endpoint upload FastAPI yang memberi jalur UUID dan menolak file di luar tipe/ukuran yang diizinkan.
- [x] Buat endpoint `create-download` dan `download-photo`: token di-hash HMAC, berlaku 24 jam, volume tetap privat.
- [x] Tampilkan QR dari URL download; jangan menampilkan URL mentah atau membuka unduhan pada kiosk.

### Fase 5 - Hardening dan UAT

- [x] Tambahkan limit per kiosk/session pada endpoint submit/upload serta log operasional tanpa PII.
- [ ] Unit test: validator, timeout, generator gambar, token kedaluwarsa.
- [ ] E2E test: idle -> guest book -> admin approve -> idle; idle -> foto -> QR; koneksi/kamera gagal.
- [ ] Uji browser target setidaknya 4 jam, lalu uji pemulihan setelah restart browser, cabut kamera, dan internet putus.
- [ ] Review keamanan: tidak ada secret di bundle; user DB least-privilege; volume privat; JWT Access tervalidasi; URL token kedaluwarsa.
- [ ] Sign-off desain, komunikasi, IT, dan operasional berdasarkan kriteria penerimaan PRD.

### Fase 6 - Pilot dan go-live

- [ ] Pasang Chrome/Edge dalam kiosk mode dengan autostart URL aplikasi dan shortcut restart yang dibatasi petugas.
- [ ] Uji pencahayaan, posisi kamera setinggi mata, jangkauan QR, serta keterbacaan pada jarak 1-2 meter.
- [ ] Briefing petugas: login admin, approve/reject, restart browser, dan prosedur insiden.
- [ ] Pantau event, bersihkan data sesuai retensi, lalu ekspor metrik agregat untuk laporan akhir.

### Fase 7 - Mini Game Dino Merdeka (estimasi 6-8 hari kerja)

Keputusan teknis: situs `trex-runner.com` hanya menjadi referensi genre. Jangan embed situs, mengambil JavaScript, atau menyalin asetnya. Game dibuat orisinal dengan Phaser 3 (MIT), aset lokal, dan dynamic import agar bundle halaman utama tidak membesar.

#### 7.1 Desain permainan dan aset (1-1,5 hari)

- [ ] Tetapkan nama final, direkomendasikan `Dino Merdeka: Lari untuk Indonesia`.
- [x] Buat sprite dinosaurus orisinal yang membawa bendera Indonesia; jangan menyalin siluet/aset Chrome Dino.
- [x] Buat rintangan bertema bandara/Indonesia yang aman secara visual: cone, koper, awan, dan gap kecil.
- [ ] Siapkan animasi lari, lompat, game over, serta SFX lokal bebas lisensi; BGM utama diturunkan volumenya selama game.
- [x] Tetapkan canvas logis 1280x720, target 60 FPS, rasio responsif, dan target sentuh seluruh area permainan.

#### 7.2 Gameplay MVP (1,5-2 hari)

- [x] Tambahkan menu ke-4 bernomor `04`; ubah layout menu menjadi grid 2x2 yang seimbang pada 1920x1080.
- [x] Tambahkan state aplikasi `game` dengan intro singkat, gameplay, game over, input nama, dan leaderboard.
- [x] Implementasi input sentuh/klik/Space untuk melompat, gravity, collision, pooling rintangan, dan peningkatan kecepatan bertahap.
- [x] Buat generator rintangan deterministik berbasis seed agar permainan dapat diputar ulang dan divalidasi server.
- [x] Batasi satu sesi maksimal 120 detik dan sediakan tombol kembali saat permainan aktif.
- [x] Sediakan fallback renderer Canvas Phaser bila WebGL tidak tersedia.

#### 7.3 Leaderboard dan validasi skor (2 hari)

- [x] Tambahkan migrasi tabel `game_sessions` dan `leaderboard_entries` beserta indeks skor menurun/waktu menaik.
- [x] `POST /api/v1/game/sessions`: buat UUID, seed acak, versi konfigurasi, serta masa berlaku 5 menit.
- [x] Client merekam waktu input lompat, bukan mengirim skor yang dipercaya langsung.
- [ ] `POST /api/v1/game/sessions/{id}/finish`: server menjalankan ulang simulasi deterministik, menghitung skor, dan menolak replay mustahil, sesi kedaluwarsa, atau submit kedua.
- [x] `GET /api/v1/game/leaderboard?period=daily|all-time&limit=10`: kembalikan hanya nama panggilan, skor, dan waktu yang diperlukan.
- [ ] Lengkapi validasi replay server dengan simulasi collision deterministik dan blocklist istilah tidak pantas; validasi dasar/rate limit sudah aktif.
- [x] Setelah submit, tampilkan Top 10, peringkat pemain, skor pribadi, dan tombol `Main Lagi`.

#### 7.4 Admin, privasi, dan retensi (0,5-1 hari)

- [x] Tambahkan tab admin `Leaderboard` untuk menyembunyikan atau memulihkan entri; catat audit event.
- [x] Tampilkan pemberitahuan bahwa nama panggilan dan skor akan terlihat publik sebelum submit.
- [x] Jangan simpan IP, fingerprint, nama lengkap wajib, atau data perjalanan; pemain dapat melewati penyimpanan skor.
- [ ] Tetapkan retensi leaderboard sampai akhir event + 30 hari, kemudian purge otomatis sesuai keputusan pemilik bisnis.
- [x] Saat API offline, game tetap dapat dimainkan tetapi hasil hanya tampil lokal dan tidak diantrikan bersama nama pemain.

#### 7.5 Test dan UAT (1-1,5 hari)

- [ ] Unit test physics deterministik, seed, collision, scaling skor, normalisasi nama, dan validasi replay server.
- [ ] Test keamanan: skor palsu, replay dimodifikasi, submit ganda, sesi kedaluwarsa, flood sesi, dan nama tidak pantas.
- [ ] E2E: menu -> game -> game over -> nama -> leaderboard -> main lagi -> kembali menu.
- [ ] Uji 30 menit berulang tanpa memory leak, target 60 FPS, input touchscreen, keyboard, resolusi 1920x1080 dan portrait.
- [ ] UAT tingkat kesulitan dengan minimal 5 pengguna; target sesi pertama 20-45 detik dan instruksi dapat dipahami tanpa petugas.

#### Kontrak API yang direncanakan

| Endpoint | Fungsi | Aturan utama |
| --- | --- | --- |
| `POST /api/v1/game/sessions` | Memulai sesi | Rate limit, seed dari server, berlaku 5 menit. |
| `POST /api/v1/game/sessions/{id}/finish` | Validasi replay dan simpan skor | Satu kali, skor dihitung server, nama opsional. |
| `GET /api/v1/game/leaderboard` | Top harian/all-time | Maksimum 10-20 baris, cache pendek. |
| `GET /api/v1/admin/leaderboard` | Daftar moderasi | Wajib Cloudflare Access. |
| `PATCH /api/v1/admin/leaderboard/{id}` | Sembunyikan/pulihkan entri | Audit wajib. |

#### Kriteria penerimaan mini game

1. Game tidak memuat iframe, iklan, analytics, atau aset pihak ketiga saat runtime.
2. Dino terlihat membawa bendera merah-putih tanpa mengganggu keterbacaan karakter dan obstacle.
3. Menu utama tetap tampil utuh sebagai grid 2x2 dan fitur lama tidak mengalami regresi.
4. Server menjadi sumber kebenaran skor; manipulasi nilai langsung dari DevTools ditolak.
5. Leaderboard menampilkan Top 10 dan peringkat pemain maksimal 2 detik setelah submit pada jaringan normal.
6. Nama tidak disimpan bila pemain memilih melewati leaderboard; admin dapat menyembunyikan entri dalam satu tindakan.
7. Game tetap dapat dimainkan saat API tidak tersedia, dengan penjelasan bahwa skor tidak masuk leaderboard.

## Arsitektur Target

```text
Touchscreen + webcam kiosk
          |
          v
Cloudflare edge + Tunnel LXC
          |
          v
Nginx + React SPA on Docker LXC
  | offline shell/timeline        | /api and /d
  |                               v
  |                         FastAPI + Pydantic
  v                           |              |
Canvas JPEG                   v              v
                    PostgreSQL LXC    Private volume
                                           |
                                token QR download (24h)
```

## Konfigurasi dan Keamanan Sebelum Produksi

- Environment publik frontend tidak mengandung credential atau alamat database.
- Secret server-side: database URL, salt token, dan konfigurasi Cloudflare Access hanya di environment Docker/server.
- Nginx meneruskan `/api/*` dan `/d/*` ke FastAPI internal sehingga CORS publik tidak diperlukan pada produksi.
- Buat akun Cloudflare Access individual, MFA, validasi JWT origin, dan audit trail; jangan memakai satu password bersama.
- Tutup Docker API port 2375 sebelum go-live dan batasi port origin hanya dari IP LXC Tunnel.
- Jadwalkan job penghapusan untuk foto, token, dan guest entry sesuai retensi yang disetujui.
- Gunakan Content Security Policy dan jangan memakai skrip pihak ketiga yang tidak diperlukan.

## Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Kamera/izin browser gagal | Photobooth tidak dapat digunakan | Uji perangkat final; halaman fallback; SOP restart dan kabel cadangan. |
| Konten tidak layak tampil | Risiko reputasi | Status pending default, moderasi manual, tombol hapus cepat. |
| Internet putus | Upload/QR gagal | Timeline tetap offline, tombol retry, antrean lokal terbatas untuk submit jika disetujui. |
| Disk server penuh | Upload/feed gagal | Batasi JPEG 2 MB, retensi singkat, monitoring disk, dan backup/pembersihan terjadwal. |
| Origin dapat diakses dari LAN | Bypass Cloudflare Access | Firewall hanya mengizinkan IP LXC Tunnel dan FastAPI memvalidasi JWT Access untuk admin. |
| Kiosk ditinggalkan | Data/kamera tersisa | Timeout 90 detik, clear state, stop media tracks. |
| Logo/visual tidak sesuai | Pelanggaran pedoman | Review aset dan screenshot final oleh PIC brand sebelum go-live. |

## Definition of Done

Sebuah fitur dianggap selesai hanya bila kode ditinjau, lulus test terkait, mobile/portrait tidak merusak layar, tidak memuat secret, memiliki keadaan error/loading, dan memiliki bukti screenshot atau hasil UAT pada perangkat kiosk. Fitur P0 tidak boleh diganti dengan fitur AR atau animasi tambahan sebelum semua acceptance criteria di PRD lulus.
