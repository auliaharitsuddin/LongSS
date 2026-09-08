# LongSS - Long Screenshot Tool

A browser extension (Manifest V3) for capturing full-page, framed, and auto-scrolled screenshots.

![LongSS Logo](icons/icon128.png)

## Description

LongSS is a lightweight Chrome/Edge/Brave/Opera extension that captures screenshots directly in the browser — no external servers, no data collection. All image processing (scrolling, stitching, framing) happens locally using the Canvas API.

## Functions

- **Full Page Screenshot** — automatically scrolls the page top to bottom and stitches everything into one image.
- **Framed Screenshot** — lets you select an area on the page (like a Snipping Tool) and adds a styled frame (light, dark, or purple gradient) with configurable padding and optional rounded corners.
- **Scrolled Recording** — automatically scrolls and captures a page (useful for infinite-scroll feeds), stopping when it reaches the bottom, when you click Stop, or after ~25 seconds, whichever comes first.

## All Features (from source)

- Full page capture with automatic scrolling and stitching (`background.js`, `content.js`)
- Framed screenshot with area selection, 3 frame styles, adjustable padding (20/40/70px), optional rounded corners (`popup.html`, `popup.js`)
- Automatic scroll recording with a floating on-page "Stop" indicator, lazy-load waiting, and truncation warning for very long pages (`content.js`, `content.css`)
- Save-location settings: ask where to save each time, or specify a subfolder under Downloads (`popup.js`)
- Preview pane before saving, with Save/Discard actions
- Progress bar and status messages during capture
- Manifest V3 service worker architecture

### Permissions (from `manifest.json`)
- `activeTab` — capture the current tab
- `storage` — save user preferences (save-location settings)
- `downloads` — save captured screenshots to disk
- `scripting` — inject capture logic into the page
- `host_permissions: <all_urls>` — works on any website

## Terminology

- **Full Page Screenshot**: captures the entire scrollable page, not just the visible viewport.
- **Framed Screenshot**: a screenshot with a decorative border/shadow added around a selected area.
- **Scrolled Recording**: an automated capture mode that scrolls through a page (e.g. a social feed) and stitches the frames it captures along the way.
- **Stitching**: combining multiple captured image segments into a single continuous image via the Canvas/OffscreenCanvas API.
- **Truncated result**: when a page is extremely long, the output canvas is capped at a safe size and the preview flags the result as partial.

## How to Use

### Load the extension (development / unpacked)

**Chrome / Edge / Brave / Opera**
1. Clone or download this repository.
2. Go to `chrome://extensions/` (or the equivalent `edge://`, `brave://`, `opera://` page).
3. Enable **Developer mode** (toggle, top-right).
4. Click **Load unpacked** and select the `LongSS` folder.
5. Pin the extension icon from the toolbar puzzle-piece menu.

**Firefox** (temporary, for testing only)
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `manifest.json`.
3. Note: Firefox permanent installation requires packaging as `.xpi` and Mozilla signing.

### Using it
1. Click the LongSS icon in the toolbar.
2. Choose a mode:
   - **Full Page Screenshot** — click and wait for the download.
   - **Framed Screenshot** — click to expand frame options, pick style/padding/corners, then select an area on the page.
   - **Mulai Rekam Scroll (Otomatis)** — click to start; the extension scrolls automatically. Click again (or the on-page Stop button) to end early, or let it auto-stop.
3. Review the preview, then **Save** or **Discard**.
4. (Optional) Open the settings panel to choose a Downloads subfolder or to be prompted for a save location each time.

### Build/package scripts (`package.json`)
- `npm run icons` — regenerate icon PNGs via `create-icons.js` (requires the `sharp` devDependency)
- `npm run pack:chrome` / `npm run pack:firefox` — zip the extension folder for distribution
- `npm test` — points to opening `test.html` manually in a browser

No build step or config file is required to run the extension — it's plain JS/HTML/CSS loaded unpacked.

## Privacy

- No data collection, no external servers — everything runs locally in the browser.
- See `PRIVACY.md` for the full policy.

## License

MIT — see `LICENSE`.

---

## Bahasa Indonesia

# LongSS - Alat Screenshot Panjang

Ekstensi browser (Manifest V3) untuk menangkap screenshot halaman penuh, berbingkai, dan rekaman scroll otomatis.

![Logo LongSS](icons/icon128.png)

## Deskripsi

LongSS adalah ekstensi ringan untuk Chrome/Edge/Brave/Opera yang menangkap screenshot langsung di browser — tanpa server eksternal, tanpa pengumpulan data. Semua pemrosesan gambar (scrolling, penggabungan, pembingkaian) dilakukan secara lokal menggunakan Canvas API.

## Fungsi

- **Full Page Screenshot** — otomatis men-scroll halaman dari atas ke bawah dan menggabungkan semuanya menjadi satu gambar.
- **Framed Screenshot** — memungkinkan Anda memilih area di halaman (seperti Snipping Tool) lalu menambahkan bingkai bergaya (terang, gelap, atau gradient ungu) dengan padding yang bisa diatur dan sudut membulat opsional.
- **Scrolled Recording** — otomatis men-scroll dan menangkap halaman (berguna untuk feed infinite-scroll), berhenti ketika mencapai bagian bawah, saat Anda klik Stop, atau setelah ±25 detik, mana yang lebih dulu.

## Semua Fitur (dari kode sumber)

- Penangkapan halaman penuh dengan scroll otomatis dan penggabungan gambar (`background.js`, `content.js`)
- Screenshot berbingkai dengan pemilihan area, 3 gaya bingkai, padding yang dapat diatur (20/40/70px), sudut membulat opsional (`popup.html`, `popup.js`)
- Rekaman scroll otomatis dengan indikator "Stop" mengambang di halaman, menunggu konten lazy-load, dan peringatan jika hasil terpotong untuk halaman yang sangat panjang (`content.js`, `content.css`)
- Pengaturan lokasi simpan: tanya lokasi setiap kali, atau tentukan subfolder di dalam Downloads (`popup.js`)
- Panel preview sebelum menyimpan, dengan aksi Save/Discard
- Progress bar dan pesan status selama proses capture
- Arsitektur service worker Manifest V3

### Izin (dari `manifest.json`)
- `activeTab` — menangkap tab yang sedang aktif
- `storage` — menyimpan preferensi pengguna (pengaturan lokasi simpan)
- `downloads` — menyimpan hasil screenshot ke disk
- `scripting` — menyuntikkan logika capture ke halaman
- `host_permissions: <all_urls>` — bekerja di semua situs web

## Istilah

- **Full Page Screenshot**: menangkap seluruh halaman yang bisa di-scroll, bukan hanya bagian yang terlihat di layar.
- **Framed Screenshot**: screenshot dengan bingkai/bayangan dekoratif yang ditambahkan di sekitar area yang dipilih.
- **Scrolled Recording**: mode capture otomatis yang men-scroll halaman (mis. feed media sosial) dan menggabungkan frame-frame yang ditangkap selama proses tersebut.
- **Stitching**: menggabungkan beberapa potongan gambar hasil capture menjadi satu gambar utuh menggunakan Canvas/OffscreenCanvas API.
- **Hasil terpotong (truncated)**: jika halaman sangat panjang, ukuran canvas keluaran dibatasi demi keamanan dan preview akan menandai hasil sebagai sebagian.

## Cara Menggunakan

### Memuat ekstensi (mode pengembangan / unpacked)

**Chrome / Edge / Brave / Opera**
1. Clone atau unduh repositori ini.
2. Buka `chrome://extensions/` (atau halaman setara `edge://`, `brave://`, `opera://`).
3. Aktifkan **Developer mode** (toggle di kanan atas).
4. Klik **Load unpacked** lalu pilih folder `LongSS`.
5. Pin ikon ekstensi dari menu puzzle-piece di toolbar.

**Firefox** (sementara, khusus pengujian)
1. Buka `about:debugging#/runtime/this-firefox`.
2. Klik **Load Temporary Add-on** lalu pilih `manifest.json`.
3. Catatan: instalasi permanen di Firefox memerlukan pengemasan sebagai `.xpi` dan penandatanganan oleh Mozilla.

### Cara pakai
1. Klik ikon LongSS di toolbar.
2. Pilih salah satu mode:
   - **Full Page Screenshot** — klik dan tunggu hingga file terunduh.
   - **Framed Screenshot** — klik untuk membuka opsi bingkai, pilih gaya/padding/sudut, lalu pilih area di halaman.
   - **Mulai Rekam Scroll (Otomatis)** — klik untuk memulai; ekstensi akan men-scroll otomatis. Klik lagi (atau tombol Stop di halaman) untuk mengakhiri lebih awal, atau biarkan berhenti otomatis.
3. Periksa hasil preview, lalu **Save** atau **Discard**.
4. (Opsional) Buka panel pengaturan untuk memilih subfolder Downloads atau agar ditanya lokasi simpan setiap kali.

### Script build/kemas (`package.json`)
- `npm run icons` — membuat ulang ikon PNG lewat `create-icons.js` (membutuhkan devDependency `sharp`)
- `npm run pack:chrome` / `npm run pack:firefox` — mengemas folder ekstensi menjadi zip untuk distribusi
- `npm test` — mengarah ke pembukaan `test.html` secara manual di browser

Tidak ada langkah build atau file konfigurasi yang diperlukan untuk menjalankan ekstensi — ini murni JS/HTML/CSS yang dimuat sebagai unpacked extension.

## Privasi

- Tidak ada pengumpulan data, tidak ada server eksternal — semua diproses secara lokal di browser.
- Lihat `PRIVACY.md` untuk kebijakan lengkap.

## Lisensi

MIT — lihat `LICENSE`.
