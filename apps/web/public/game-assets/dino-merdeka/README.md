# Dino Merdeka — aset siap implementasi

Paket ini berisi sprite PNG transparan yang sudah dipisah per frame, dinormalisasi,
dan disusun kembali sebagai spritesheet untuk Phaser.

## Isi paket

- `atlases/dino-run.png`: 8 frame, masing-masing 320×256 px.
- `atlases/dino-jump.png`: 6 frame, masing-masing 320×256 px.
- `atlases/dino-states.png`: 4 frame (`idle`, `ready`, `apex`, `gameOver`).
- `atlases/plane-fly.png`: 4 frame, masing-masing 448×224 px.
- `dino/` dan `plane/`: seluruh frame individual untuk inspeksi atau penggunaan non-atlas.
- `manifest.json`: metadata animasi, ukuran tampilan, dan hitbox awal yang direkomendasikan.

## Contoh preload Phaser

```ts
this.load.spritesheet(
  "dino-run",
  "/game-assets/dino-merdeka/atlases/dino-run.png",
  { frameWidth: 320, frameHeight: 256 },
);

this.load.spritesheet(
  "plane-fly",
  "/game-assets/dino-merdeka/atlases/plane-fly.png",
  { frameWidth: 448, frameHeight: 224 },
);
```

Pesawat pada aset menghadap kanan. Gunakan `setFlipX(true)` ketika rintangan bergerak
dari kanan ke kiri. Aktifkan `pixelArt: true` dan gunakan filter nearest-neighbor agar
karakter tetap tajam.

## Regenerasi paket

Master transparan disimpan di `aset game dino/_processed-masters`. Jalankan:

```powershell
py -3 scripts/prepare_dino_merdeka_assets.py
```

Script akan menimpa frame, atlas, dan manifest dengan hasil yang konsisten.
