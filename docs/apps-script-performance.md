# Apps Script Performance Patch

Bagian ini harus dikerjakan di editor Google Apps Script, bukan di repo React.
Frontend sudah siap memakai endpoint ringan berikut:

- `?action=dashboard_summary&sheet=dashboard&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `?sheet=transaksi&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Frontend juga bisa mengirim `refresh=timestamp` agar Apps Script melewati cache saat transaksi baru selesai dibuat.

## Langkah Cepat Jika Muncul CORS

Jika setelah update Apps Script muncul error CORS, pakai kode lengkap di:

[apps-script-full-safe-code.md](apps-script-full-safe-code.md)

Error CORS pada Apps Script sering sebenarnya bukan CORS murni. Biasanya `doGet` error sebelum mengembalikan `ContentService` JSON, lalu Google mengirim halaman HTML error/login tanpa header CORS.

## Langkah Manual

1. Buka Google Sheet backend.
2. Pilih `Extensions > Apps Script`.
3. Backup isi script lama.
4. Tambahkan cache helper aman di bawah ini.
5. Update `doGet(e)` supaya mengenali `dashboard_summary` dan filter tanggal transaksi.
6. Bungkus `doGet(e)` dengan `try/catch` yang selalu `return json_(...)`.
7. Deploy ulang sebagai Web App, lalu pakai URL deployment terbaru jika berubah.

## Cache Helper

```js
const CACHE_SECONDS = 60;

function getCachedJson_(key, builder) {
  const cache = CacheService.getScriptCache();
  try {
    const cached = cache.get(key);
    if (cached) return JSON.parse(cached);
  } catch (err) {}

  const data = builder();

  try {
    const text = JSON.stringify(data);
    if (text.length < 90000) {
      cache.put(key, text, CACHE_SECONDS);
    }
  } catch (err) {}

  return data;
}

function clearDataCache_() {
  CacheService.getScriptCache().removeAll([
    "products",
    "transactions",
    "dashboard",
  ]);
}
```

Panggil `clearDataCache_()` setelah aksi `create`, `update`, `delete`, `checkout`, `delete_transaction`, dan `delete_all_transactions` berhasil.

## Contoh doGet

Sesuaikan nama sheet dan nama kolom dengan script backend yang sekarang.

```js
function doGet(e) {
  const params = e.parameter || {};

  if (params.action === "dashboard_summary") {
    return json_(getCachedJson_(
      `dashboard:${params.startDate}:${params.endDate}`,
      () => buildDashboardSummary_(params.startDate, params.endDate)
    ));
  }

  if (params.sheet === "transaksi") {
    return json_(getCachedJson_(
      `transactions:${params.startDate}:${params.endDate}`,
      () => getTransactions_(params.startDate, params.endDate)
    ));
  }

  return json_(getCachedJson_("products", getProducts_));
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Ringkasan Dashboard

```js
function buildDashboardSummary_(startDate, endDate) {
  const transactions = getTransactions_(startDate, endDate);

  const result = {
    unitTerjual: 0,
    labaBersih: 0,
    omzetTotal: 0,
    barChartData: [],
  };

  const grouped = {};

  transactions.forEach((trx) => {
    result.unitTerjual += Number(trx.jumlah) || 0;
    result.labaBersih += Number(trx.laba) || 0;
    result.omzetTotal += Number(trx.total_harga) || 0;

    const date = new Date(trx.tanggal);
    const key = Utilities.formatDate(date, "Asia/Jakarta", "yyyy-MM-dd");
    const label = Utilities.formatDate(date, "Asia/Jakarta", "dd/MM");

    if (!grouped[key]) grouped[key] = { date: key, label, omzet: 0 };
    grouped[key].omzet += Number(trx.total_harga) || 0;
  });

  result.barChartData = Object.keys(grouped).sort().map((key) => grouped[key]);
  return result;
}
```

## Filter Transaksi

Pastikan `getTransactions_(startDate, endDate)` mengembalikan transaksi dalam rentang tanggal saja. Jika kolom tanggal bernama berbeda, sesuaikan `trx.tanggal`.

```js
function filterByDate_(rows, startDate, endDate) {
  if (!startDate || !endDate) return rows;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return rows.filter((trx) => {
    const time = new Date(trx.tanggal).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });
}
```
