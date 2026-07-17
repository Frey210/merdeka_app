# Gema Kemerdekaan RI - UPG

Aplikasi kiosk layar sentuh HUT RI ke-81 untuk Bandara Internasional Sultan Hasanuddin Makassar. Monorepo ini berisi frontend React dan backend FastAPI yang dijalankan melalui Docker Compose.

BGM memakai playlist lokal `Hari Merdeka`, `Tanah Air`, dan `Bagimu Negeri`. Browser memulai musik setelah sentuhan pertama sesuai kebijakan autoplay; pengguna dapat pause/play dari kontrol di layar.

Layar idle menampilkan carousel harapan dan foto pengunjung yang memberi persetujuan publik. Konten bersih dipublikasikan otomatis; filter bahasa menahan harapan atau nama leaderboard yang tidak pantas, sedangkan dashboard admin digunakan untuk menyembunyikan atau memulihkan konten. Data diperbarui setiap 30 detik dan berganti setiap 8 detik. Izin publik tidak memengaruhi QR unduh: foto privat tetap dapat diunduh selama token dan masa retensinya berlaku.

Fitur keempat `Dino Merdeka` adalah mini game endless runner orisinal berbasis Phaser 3. Setelah aset termuat, Dino menunggu dalam keadaan idle sampai tap pertama memicu countdown `Bersedia - Siap - Mulai`; counter dan gameplay baru aktif setelah countdown. Arena memakai parallax bandara dan runway, dengan rintangan darat untuk dilompati serta pesawat rendah yang harus dilewati tanpa melompat. Game dapat dimainkan offline dan menyimpan skor terverifikasi ke leaderboard all-time yang dapat digulir melalui FastAPI.

Input teks publik memakai keyboard layar `react-simple-keyboard` bertema merah-putih. Keyboard floating mendukung Shift sekali pakai, Caps Lock, serta simbol umum. Kiosk kembali ke idle setelah 60 detik tanpa aktivitas dan menu utama menyediakan tombol kembali langsung.

## Struktur

```text
apps/web/       React, TypeScript, Vite, Tailwind CSS
apps/api/       FastAPI, SQLAlchemy, Alembic, PostgreSQL
deploy/nginx/   Nginx SPA dan reverse proxy
data/photos/    Penyimpanan foto runtime (tidak dilacak Git)
```

## Menjalankan frontend lokal

```powershell
npm.cmd install
npm.cmd run dev
```

## Menjalankan backend lokal

```powershell
py -3 -m venv .venv
.venv\Scripts\python -m pip install -e "./apps/api[dev]"
.venv\Scripts\python -m uvicorn app.main:app --app-dir apps/api --reload
```

Dokumentasi API tersedia di `http://localhost:8000/docs` pada mode development.

## Menjalankan dengan Docker

Salin `.env.example` menjadi `.env`, isi secret dan kredensial database, lalu:

```powershell
docker compose up --build
```

Origin aplikasi tersedia pada `${APP_BIND_IP}:${APP_HTTP_PORT}`. Cloudflare Tunnel diarahkan ke origin tersebut; FastAPI hanya berada di jaringan internal Docker.

## Keamanan

- Jangan commit `.env` atau `deployment.md`.
- Gunakan database dan user PostgreSQL khusus aplikasi.
- Lindungi hostname admin dengan Cloudflare Access dan validasi JWT di origin.
- Foto disimpan pada volume privat dan hanya diunduh melalui token yang tervalidasi.
- Foto kedaluwarsa dibersihkan otomatis setiap jam; masa simpan default tujuh hari.
- Endpoint buku tamu dan upload foto memakai sliding-window rate limit per alamat klien.
- Dashboard admin menyembunyikan atau memulihkan konten publik; foto tanpa persetujuan publik tetap privat.
- Nginx mengirim CSP, HSTS, anti-frame, dan pembatasan izin kamera/mikrofon.
- Tutup Docker API TCP port 2375 sebelum deployment produksi.
