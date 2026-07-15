Tentu, ini adalah **Peta Tampilan Layar (Screen Map)** dan **Arahan Desain** untuk *webapp* interaktif terminal Anda.  
Desain harus mengutamakan **usabilitas layar sentuh (touch-friendly)**, kecepatan alur, dan visual yang membangkitkan semangat patriotisme namun tetap modern dan bersih (tidak *cluttered*).

### **Arahan Desain Umum (Global Design Guidelines)**

Sebelum masuk ke detail layar, berikut adalah fondasi desainnya:

1. **Palet Warna:**  
   * **Primer:** Merah (\#FF0000 / \#CD202C) dan Putih (\#FFFFFF).  
   * **Aksen:** Emas/Kuning Tua (untuk elemen premium, logo 79/80/dst), Hitam/Abu-abu Tua (untuk teks utama agar mudah dibaca).  
2. **Tipografi:**  
   * Gunakan Font Sans-Serif yang *bold* dan modern. Contoh: *Montserrat, Poppins,* atau *Inter*.  
   * **Ukuran Teks:** Sangat besar. Judul minimal 40px+, Teks *body* minimal 24px+. Ingat, pengguna berdiri dan melihat dari jarak tertentu.  
3. **Elemen UI:**  
   * **Tombol:** Harus besar, memiliki *padding* luas, dan sudut yang membulat (*rounded*). Berikan efek visual saat disentuh (*active state*).  
   * **Input Field:** Harus sangat besar agar mudah diklik, memicu *on-screen keyboard* bawaan OS terminal.  
   * **Ikon:** Gunakan ikon SVG yang bersih dan intuitif.  
4. **Nuansa Visual:** Modern, Digital, Patriotik, Gembira. Hindari desain yang terlalu kaku seperti dokumen pemerintah, buatlah seperti aplikasi *fintech* atau *startup* modern bertema kemerdekaan.

### **Peta Layar dan Detail Arahan**

Berikut adalah urutan layar yang akan dihadapi pengguna:

#### **1\. Layar Idle (Idle Screen / Screen Saver)**

*Layar ini aktif jika tidak ada interaksi selama 1-2 menit.*

* **Fungsi:** Menarik perhatian orang yang lewat, menampilkan hasil kurasi *guest book* dan foto.  
* **Arahan Komposisi:**  
  * **Latar Belakang:** Animasi ringan (misal: bendera berkibar *slow motion* yang di-*blur*, atau partikel merah putih).  
  * **Konten Utama (Kiri):** Teks besar "Dirgahayu Republik Indonesia" \+ Logo HUT RI tahun berjalan. Di bawahnya teks ajakan: "Sentuh Layar untuk Merayakan".  
  * **Konten Dinamis (Kanan):** *Masonry grid* atau *slideshow* otomatis yang menampilkan kartu-kartu berisi: \[Foto Penumpang (jika ada) \+ Nama \+ Asal \+ Ucapan Singkat\]. Data ini diambil dari Firestore (yang sudah di-*approve* admin).  
* **Interaksi:** Sentuhan di mana saja pada layar akan membawa ke Layar 2\.

#### **2\. Layar Selamat Datang & Menu Utama**

*Titik awal interaksi pengguna.*

* **Fungsi:** Menyapa pengguna dan memberikan opsi navigasi utama.  
* **Arahan Komposisi:**  
  * Header: Logo Instansi (Terminal/Bandara) di kiri, Logo HUT RI di kanan.  
  * Judul: "Selamat Datang di Gema Kemerdekaan RI".  
  * Pilihan Menu (3 Tombol Raksasa di tengah, horizontal atau vertikal):  
    1. **\[IKON SEJARAH\] Jejak Sejarah Kemerdekaan**  
    2. **\[IKON BUKU\] Tulis Harapan untuk Bangsa**  
    3. **\[IKON KAMERA\] AR Photobooth Merdeka**  
* **Interaksi:** Mengeklik salah satu tombol membawa ke alur masing-masing.

#### **Alur A: Jejak Sejarah (Timeline)**

#### **3A. Layar Timeline Sejarah**

* **Fungsi:** Edukasi singkat secara visual.  
* **Arahan Komposisi:**  
  * Gunakan konsep **Horizontal Timeline**. Pengguna bisa *swipe* ke kiri/kanan.  
  * Setiap poin sejarah adalah satu kartu besar vertikal (misal: 1908, 1928, 1945, dst).  
  * Isi Kartu: Tahun (Besar), Ilustrasi/Foto Sejarah (Kualitas tinggi), Deskripsi Singkat (Maksimal 2-3 kalimat).  
  * Navigasi: Tombol "Kembali ke Menu" di pojok kiri atas. Navigasi panah kiri/kanan yang besar di sisi layar.  
* **Visual:** Kartu dengan *glassmorphism* effect di atas latar belakang merah putih yang elegan.

#### **Alur B: Guest Book**

#### **3B. Layar Form Guest Book**

* **Fungsi:** Mengambil input data penumpang.  
* **Arahan Komposisi:**  
  * Judul: "Sampaikan Harapanmu untuk Indonesia".  
  * Layout: Form vertikal, *input field* sangat besar.  
    * Input 1: Nama Lengkap  
    * Input 2: Asal Daerah (bisa gunakan *dropdown* besar atau *autocomplete*).  
    * Input 3: Harapan untuk RI (Textarea besar).  
  * Tombol di bawah: \[Kirim Harapan\] (Warna Merah Mencolok).  
* **Interaksi:** Klik input memunculkan *keyboard* layar. Klik 'Kirim' membawa ke Layar 4B.

#### **4B. Layar Post-Submit (Penawaran Foto)**

* **Fungsi:** Terima kasih dan *cross-selling* ke fitur foto.  
* **Arahan Komposisi:**  
  * Visual: Animasi centang hijau atau konfeti.  
  * Teks: "Terima kasih, \[Nama\]\! Harapanmu telah tersimpan."  
  * Teks Ajakan: "Ayo lengkapi ucapanmu dengan foto seru ber-twibbon\!"  
  * Pilihan Tombol (Dua tombol berdampingan):  
    1. **\[Tombol Sekunder/Putih\]: Tidak, Kembali ke Menu**  
    2. **\[Tombol Primer/Merah\]: Ayo Foto\!**

#### **Alur C: Photobooth**

#### **3C. Layar Kamera & Pemilihan Twibbon**

* **Fungsi:** Mengambil foto dengan efek AR/Twibbon.  
* **Arahan Komposisi:**  
  * **Sisi Kiri (Area Kamera):** *Live feed* kamera (kotak besar, rasio 1:1 atau 4:5 agar bagus di HP). Di atas *live feed* ini ditumpuk PNG Twibbon yang dipilih.  
  * **Sisi Kanan (Area Kontrol):**  
    * Pilihan Twibbon: *Scrolling list* vertikal berisi *thumbnail* pilihan bingkai (misal: Bingkai Garuda, Bingkai Pejuang, Bingkai Merah Putih Abstrak).  
    * Tombol Ambil Foto: Tombol bulat besar warna merah di tengah bawah area kontrol.  
* **Interaksi:** Pilih twibbon \-\> Twibbon muncul di area kamera \-\> Klik tombol foto \-\> Hitung mundur 3,2,1 muncul di tengah layar \-\> Ambil gambar (freeze frame).

#### **4C. Layar Pratinjau & Publikasi**

* **Fungsi:** Review foto dan opsi penyimpanan.  
* **Arahan Komposisi:**  
  * Menampilkan hasil foto final (sudah digabung dengan twibbon).  
  * Tombol Navigasi:  
    * \[Kiri bawah\]: **Ambil Ulang** (Kembali ke 3C)  
    * \[Kanan bawah\]: **Simpan & Download**  
  * **Opsi Moderasi:** Di bawah foto ada *checkbox* besar: "\[ \] Saya bersedia foto ini ditampilkan di layar utama terminal." (Default: Unchecked untuk privasi).

#### **5C. Layar Download (QR Code)**

* **Fungsi:** Memberikan link download ke HP pengguna.  
* **Arahan Komposisi:**  
  * Teks: "Selesai\! Scan QR Code di bawah untuk mendownload fotomu."  
  * **Tengah:** **QR Code Raksasa**.  
  * Teks Tambahan: "Link berlaku selama 1 jam."  
  * Samping QR: Tampilan *thumbnail* foto mereka.  
  * Tombol Bawah: **Selesai & Kembali ke Menu Utama**.

### **Tambahan: Halaman Admin (Moderasi)**

*Halaman ini diakses melalui laptop staf/admin, bukan di kiosk.*

#### **Tampilan Admin**

* **Desain:** *Dashboard* standar, bersih, mengutamakan fungsionalitas.  
* **Fungsi:** Daftar antrean input *guest book* dan foto yang masuk.  
* **Komposisi:** Tabel dengan kolom: \[Waktu | Nama | Asal | Ucapan | Foto (Thumbnail) | Aksi\].  
* **Aksi:** Tombol Hijau **\[Approve\]** dan Tombol Merah **\[Reject/Delete\]**. Hanya data yang di-\[Approve\] yang akan muncul di *Layar Idle* Kiosk.