# Adinda Cell - Web Aplikasi Kasir & Service

Adinda Cell adalah aplikasi web berbasis React untuk operasional konter HP. Aplikasi ini menggabungkan kasir penjualan sparepart, manajemen stok, riwayat transaksi, dashboard analitik, transaksi service, laporan service, cetak struk, dan integrasi backend Google Apps Script.

## Ringkasan Fitur

- Login pengguna dengan role `admin` dan non-admin/kasir.
- Navigasi berbasis role: admin mendapat akses penuh, kasir diarahkan ke halaman kasir.
- Dashboard penjualan untuk analisis omzet, laba, produk terjual, stok, aset modal, dan komposisi stok.
- Kasir penjualan dengan pencarian produk, katalog produk, keranjang multi-item, ongkir, metode pembayaran, dan struk.
- Manajemen gudang untuk tambah, ubah, hapus, cari, filter, dan pantau stok produk.
- Riwayat transaksi penjualan dengan filter tanggal, total rekap, export CSV, cetak/PDF, hapus satuan, dan hapus semua per periode.
- Modul service lengkap: dashboard service, input transaksi service, riwayat service, export, cetak, dan hapus data service.
- Struk transaksi dengan format thermal 58mm, cetak browser, dan unduh PNG.
- Tema terang/gelap yang tersimpan di browser.
- Cache localStorage untuk mempercepat pemuatan data produk dan ringkasan dashboard.
- Loading skeleton, loading modal, snackbar notifikasi, dan modal konfirmasi untuk aksi penting.
- UI responsif untuk desktop dan mobile dengan sidebar mobile.

## Teknologi

- React 19
- Vite 7
- Tailwind CSS 4
- Material UI Joy untuk modal, snackbar, skeleton, dan progress
- MUI X Charts untuk grafik dashboard
- Lucide React untuk ikon
- Google Apps Script sebagai backend/API
- LocalStorage untuk session ringan, tema, cache, dan preferensi filter tanggal

## Struktur Halaman

### Login

Fitur pada halaman login:

- Form username dan password.
- Validasi input wajib.
- Proses login ke API Google Apps Script melalui action `login`.
- Menampilkan progress bar saat memeriksa akses.
- Snackbar sukses dan gagal.
- Menyimpan status login, role, dan nama pengguna ke localStorage.
- Redirect otomatis berdasarkan role:
  - `admin` masuk ke Dashboard.
  - selain admin masuk ke Kasir Penjualan.
- Tampilan responsif dengan visual promosi sistem POS.

### Sidebar & Navigasi

Fitur navigasi:

- Brand Adinda Cell.
- Menampilkan nama pengguna dan role.
- Menu Dashboard hanya untuk admin.
- Menu Kasir Penjualan untuk semua role yang login.
- Menu Riwayat Transaksi hanya untuk admin.
- Menu Data Stok Produk hanya untuk admin.
- Menu Service hanya untuk admin, berisi:
  - Dashboard Service
  - Transaksi Service
  - Riwayat Service
- Toggle tema gelap/terang.
- Sidebar mobile dengan tombol buka/tutup dan backdrop.
- Status koneksi server berdasarkan konfigurasi `API_URL`.
- Logout dengan modal konfirmasi.

## Fitur Role

### Admin

Admin dapat mengakses:

- Dashboard penjualan.
- Kasir penjualan.
- Riwayat transaksi penjualan.
- Manajemen stok produk.
- Dashboard service.
- Transaksi service.
- Riwayat service.
- Tema gelap/terang.
- Logout.

### Kasir / Non-Admin

Kasir dapat mengakses:

- Kasir penjualan.
- Transaksi penjualan dan cetak struk.
- Pencatatan barang rusak dari halaman kasir.
- Tema gelap/terang.
- Logout.

## Dashboard Penjualan

Fitur dashboard:

- Filter rentang tanggal dengan tanggal mulai dan tanggal selesai.
- Filter tersimpan di localStorage.
- Ringkasan metrik:
  - Laba Bersih
  - Total Omzet
  - Produk Terjual
  - Nilai Aset Modal
  - Total Stok Barang
  - Jenis Sparepart
- Animasi angka saat pertama kali dashboard dibuka di desktop.
- Grafik garis Omzet dan Laba Bersih berdasarkan periode.
- Grafik komposisi stok gudang berdasarkan jenis sparepart.
- Peringatan stok kritis untuk produk dengan stok kurang dari 6.
- Tabel stok kritis berisi produk, jenis, dan sisa stok.
- Fallback perhitungan dashboard dari transaksi jika endpoint ringkasan belum tersedia.
- Cache ringkasan dashboard selama 5 menit.

## Kasir Penjualan

Fitur kasir:

- Pencarian produk minimal 3 karakter dari kombinasi merk, model, dan jenis sparepart.
- Dropdown hasil pencarian maksimal 20 produk.
- Katalog produk berbentuk kartu.
- Pencarian katalog berdasarkan merk, model, atau jenis.
- Tombol `Lihat Lainnya` untuk memuat katalog bertahap.
- Indikator produk terpilih.
- Indikator jumlah item yang sudah masuk keranjang.
- Validasi stok kosong dan stok tidak mencukupi.
- Detail produk terpilih:
  - Harga jual
  - Harga modal
  - Stok tersedia
  - Jenis sparepart
  - Keterangan
- Input jumlah pembelian.
- Tombol tambah dan kurang jumlah.
- Keranjang multi-item.
- Penggabungan item yang sama di keranjang.
- Ubah jumlah item langsung di keranjang.
- Hapus item dari keranjang.
- Perhitungan otomatis:
  - Total per item
  - Total keranjang
  - Ongkir
  - Total bayar
  - Laba per item
  - Total laba transaksi
- Metode pembayaran:
  - Tunai
  - QRIS
  - Transfer
- Pembayaran tunai:
  - Input uang diterima
  - Perhitungan kembalian
  - Validasi uang diterima tidak boleh kurang dari total bayar
- Pembayaran QRIS:
  - Modal QRIS layar penuh
  - Menampilkan total yang harus dibayar
- Pembayaran transfer:
  - Pilihan bank BCA, Mandiri, BNI, dan SeaBank
  - Menampilkan nama rekening dan nomor rekening setelah bank dipilih
- Checkout setiap item ke API action `checkout`.
- Optimistic update transaksi lokal setelah checkout berhasil.
- Refresh stok produk secara silent setelah transaksi.
- Reset keranjang, input, uang diterima, dan ongkir setelah transaksi sukses.
- Menampilkan struk transaksi setelah pembayaran berhasil.
- Loading modal saat transaksi diproses.
- Snackbar sukses/gagal.
- Skeleton loading khusus halaman kasir.

## Pencatatan Barang Rusak / Loss

Fitur loss dari halaman kasir:

- Pilih produk dan jumlah barang rusak.
- Validasi produk dan stok.
- Modal konfirmasi sebelum mencatat kerusakan.
- Mencatat barang rusak sebagai transaksi khusus dengan nama produk berawalan `[RUSAK]`.
- Total harga bernilai 0.
- Laba bernilai negatif sebesar harga modal dikali jumlah.
- Metode pembayaran diisi `-`.
- Mengirim data ke API action `checkout`.
- Refresh stok produk setelah pencatatan berhasil.
- Notifikasi sukses/gagal.

## Struk Transaksi

Fitur struk:

- Dipakai untuk transaksi kasir dan transaksi service.
- Format tampilan struk thermal 58mm.
- Logo toko dari `/adinda.png`.
- Informasi toko:
  - ADINDA CELLULAR
  - Service HP & Jual sparepart
  - Alamat toko
  - Nomor kontak
- Nomor bill otomatis dari timestamp.
- Tanggal dan jam transaksi.
- Daftar item, jumlah, harga satuan, total, dan keterangan.
- Total pesanan.
- Ongkir.
- Total bayar.
- Tombol unduh struk sebagai PNG.
- Tombol cetak melalui browser.
- Tombol tutup struk.
- Canvas generator untuk membuat file PNG struk.
- Pengaturan CSS print khusus ukuran 58mm.
- **Integrasi Printer Thermal Fisik:**
  - Mendukung cetak langsung ke printer thermal (USB/Bluetooth) di Windows/Mac menggunakan **QZ Tray**.
  - Mengirim raw **ESC/POS commands** secara langsung (tanpa melalui driver UI).
  - Merender logo menggunakan perintah raster bitmap (`GS v 0`) agar sangat kompatibel dengan berbagai printer thermal generik/murah.
  - Pilihan printer disimpan otomatis di browser agar tidak perlu memilih ulang setiap kali cetak.
## Manajemen Gudang / Data Stok Produk

Fitur produk:

- Menampilkan daftar produk dalam tabel.
- Kolom data:
  - Produk / merk
  - Model
  - Jenis sparepart
  - Stok
  - Harga modal
  - Harga jual
  - Keuntungan
  - Keterangan
  - Aksi
- Pencarian berdasarkan merk HP.
- Pencarian berdasarkan model HP.
- Filter berdasarkan kategori sparepart.
- Kategori sparepart yang tersedia:
  - LCD
  - Baterai
  - Baterai B+
  - Back Glass
  - Flex vol
  - Flex on/off + vol
  - Flex on/off
  - Flexi On Off
  - Flexi Board Cas
  - Board Cas
  - Lainnya
- Tambah produk baru.
- Edit data produk.
- Hapus produk dengan modal konfirmasi.
- Form produk berisi:
  - Merk HP
  - Model / Tipe HP
  - Jenis Sparepart
  - Jumlah Stok
  - Harga Beli
  - Harga Jual
  - Keterangan Tambahan
- Estimasi laba kotor per item otomatis dari harga jual dikurangi harga beli.
- Optimistic UI untuk tambah, edit, dan hapus produk.
- Rollback data jika server mengembalikan error.
- Silent refresh data setelah operasi sukses.
- Loading modal saat menyimpan atau menghapus.
- Snackbar sukses/gagal.
- Indikator stok menipis untuk stok kurang dari 6.

## Riwayat Transaksi Penjualan

Fitur riwayat:

- Filter rentang tanggal.
- Filter tersimpan di localStorage.
- Fetch transaksi dari sheet `transaksi`.
- Tabel riwayat berisi:
  - Waktu
  - Produk
  - Qty
  - Total Harga
  - Laba
  - Metode Pembayaran
  - Keterangan
  - Aksi
- Rekap total pada periode aktif:
  - Total qty
  - Total omzet
  - Total laba
- Pagination manual dengan tombol `Tampilkan 50 Transaksi Lagi`.
- Hapus satu riwayat transaksi.
- Hapus semua transaksi pada periode aktif.
- Konfirmasi frasa `hapus` untuk hapus semua.
- Export laporan ke CSV untuk Excel.
- Cetak laporan atau simpan PDF melalui `window.print()`.
- Layout print khusus A4 portrait.
- Optimistic UI untuk hapus transaksi.
- Rollback jika server gagal menghapus.
- Loading modal dan snackbar.
- Catatan: hapus riwayat tidak mengubah stok produk.

## Dashboard Service

Fitur dashboard service:

- Filter rentang tanggal.
- Filter tersimpan di localStorage.
- Fetch data dari sheet `service_transactions`.
- Ringkasan metrik:
  - Total Laba Service
  - Total Bayar
  - Sparepart / Komponen
  - Jumlah Service
- Grafik garis Total Bayar dan Laba.
- Daftar service terbaru maksimal 6 data.
- Menampilkan pelanggan, perangkat, laba, keluhan/catatan.
- Loading state saat memuat laporan.
- Render grafik dijadwalkan saat browser idle agar halaman terasa ringan.

## Transaksi Service

Fitur transaksi service:

- Form input service:
  - Nama pelanggan
  - No. HP
  - Perangkat
  - Keluhan / pekerjaan
  - Garansi
  - Sparepart / komponen
  - Jasa pengerjaan
  - Metode pembayaran
- Metode pembayaran:
  - Tunai
  - QRIS
  - Transfer
- Ringkasan otomatis:
  - Sparepart / modal
  - Jasa pengerjaan
  - Total bayar
  - Laba service
- Perhitungan:
  - Total bayar = sparepart/komponen + jasa pengerjaan.
  - Laba service = jasa pengerjaan.
- Payload kompatibel dengan beberapa nama field backend:
  - `modal_sparepart`
  - `sparepart`
  - `sparepart_komponen`
  - `harga_sparepart`
  - `total_modal`
  - `harga_jasa`
  - `total_bayar`
  - `jasa_pengerjaan`
  - `laba`
- Simpan transaksi ke API action `create_service_transaction`.
- Menampilkan struk service setelah transaksi berhasil.
- Silent refresh data service.
- Reset form setelah sukses.
- Loading modal dan snackbar.

## Riwayat Service

Fitur riwayat service:

- Filter rentang tanggal.
- Filter tersimpan di localStorage.
- Tabel riwayat service berisi:
  - Waktu
  - Pelanggan
  - No. HP
  - Perangkat
  - Pekerjaan
  - Sparepart / Komponen
  - Total Bayar
  - Laba Service
  - Metode
  - Aksi
- Rekap total pada periode aktif:
  - Total sparepart / komponen
  - Total bayar
  - Total laba service
- Pagination manual dengan tombol `Tampilkan 50 Transaksi Lagi`.
- Hapus satu transaksi service.
- Hapus semua transaksi service pada periode aktif.
- Konfirmasi frasa `hapus` untuk hapus semua.
- Export CSV.
- Cetak PDF melalui browser.
- Layout print khusus A4 landscape.
- Optimistic UI untuk hapus transaksi service.
- Rollback jika server gagal.
- Loading modal dan snackbar.
- Catatan: hapus transaksi service tidak mengubah stok produk.

## Integrasi API

Backend dikonfigurasi di `src/services/api.js` melalui konstanta `API_URL`.

Endpoint dan action yang digunakan:

- GET produk dari `API_URL`.
- GET transaksi dengan parameter `sheet=transaksi`.
- GET transaksi service dengan parameter `sheet=service_transactions`.
- GET ringkasan dashboard dengan action `dashboard_summary`.
- POST `login` untuk autentikasi.
- POST `create` untuk tambah produk.
- POST `update` untuk edit produk.
- POST `delete` untuk hapus produk.
- POST `checkout` untuk transaksi penjualan dan barang rusak.
- POST `delete_transaction_history` untuk hapus satu riwayat penjualan.
- POST `delete_all_transactions` untuk hapus riwayat penjualan per periode.
- POST `create_service_transaction` untuk tambah transaksi service.
- POST `delete_service_transaction` untuk hapus satu transaksi service.
- POST `delete_all_service_transactions` untuk hapus riwayat service per periode.

### Ketahanan API (Resilience)

- Terdapat fitur **Auto-Retry** bawaan di dalam *fetcher* (`fetchJsonWithRetry`).
- Fitur ini akan otomatis mencoba ulang koneksi (maksimal 3 kali dengan jeda *exponential backoff*) jika Google Apps Script menolak *request* akibat *Concurrent Execution Limit* (saat banyak perangkat mengedit data bersamaan) atau gangguan koneksi sesaat.
## Cache & Penyimpanan Lokal

Data yang disimpan di localStorage:

- `isLoggedIn`
- `userRole`
- `userName`
- `theme`
- Cache produk dengan prefix `adinda-cache:products`
- Cache dashboard dengan prefix `adinda-cache:dashboard-summary`
- Filter tanggal dashboard penjualan
- Filter tanggal riwayat penjualan
- Filter tanggal dashboard service
- Filter tanggal riwayat service

Perilaku cache:

- Produk memakai cache panjang 24 jam sebagai fallback saat gagal fetch.
- Ringkasan dashboard memakai cache 5 menit.
- Dashboard tetap dapat menghitung ringkasan dari transaksi jika endpoint summary gagal.

## UX, Performa, dan Responsivitas

- Lazy loading halaman dengan `React.lazy` dan `Suspense`.
- Preload halaman saat navigasi dan saat browser idle.
- Skeleton untuk dashboard dan tabel.
- Skeleton khusus halaman kasir.
- Scroll utama dikendalikan agar halaman tidak lompat saat berpindah tab.
- UI mendukung desktop dan mobile.
- Sidebar berubah menjadi drawer pada mobile.
- Mode gelap diterapkan dengan class `.dark` pada elemen HTML.
- Notifikasi Joy UI Snackbar untuk hasil aksi.
- ConfirmModal untuk aksi destruktif.
- LoadingModal untuk proses yang menunggu respons server.

## Komponen Pendukung

- `ConfirmModal`: modal konfirmasi umum, termasuk dukungan frasa konfirmasi untuk aksi berisiko.
- `LoadingModal`: modal loading proses.
- `ReceiptModal`: preview, cetak, dan unduh struk.
- `Skeleton`: skeleton dashboard dan tabel.
- `Sidebar`: navigasi utama, tema, role, dan status server.
- `AiAssistant`: komponen asisten AI masih berupa kode komentar dan belum aktif di aplikasi utama.
- `ProductForm`, `ProductTable`, `DashboardCard`, dan `LightweightCharts`: komponen terpisah tersedia, tetapi sebagian halaman saat ini memakai implementasi lokal di file halaman.

## Menjalankan Project

Install dependency:

```bash
npm install
```

Jalankan mode development:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Catatan Penting

- Aplikasi membutuhkan koneksi ke Google Apps Script agar operasi login, produk, transaksi, dan service tersimpan permanen.
- Beberapa aksi memakai optimistic UI, sehingga tampilan berubah lebih dulu lalu disinkronkan ke server.
- Hapus riwayat penjualan dan service hanya menghapus data laporan, tidak mengembalikan atau mengubah stok produk.
- QRIS di halaman kasir masih menggunakan gambar contoh dari Wikimedia dan perlu diganti dengan QRIS toko asli bila akan dipakai produksi.
- Nomor rekening transfer pada halaman kasir masih berupa contoh dan perlu disesuaikan dengan rekening toko.
