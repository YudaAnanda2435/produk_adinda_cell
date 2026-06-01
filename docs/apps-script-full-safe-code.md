# Apps Script Full Safe Code

Gunakan file ini sebagai pengganti penuh kode Google Apps Script jika setelah update muncul error CORS seperti:

```txt
No 'Access-Control-Allow-Origin' header is present
net::ERR_FAILED 200 (OK)
```

Penyebab paling umum: `doGet` error sebelum mengembalikan `ContentService` JSON. Browser lalu menerima halaman HTML error dari Google, bukan JSON publik, sehingga terlihat seperti CORS.

Kode di bawah mempertahankan pola kode lama yang sudah aman, lalu menambahkan:

- filter tanggal transaksi untuk `?sheet=transaksi&startDate=...&endDate=...`
- endpoint ringkasan dashboard untuk `?action=dashboard_summary&startDate=...&endDate=...`
- cache yang aman: kalau data terlalu besar untuk `CacheService`, request tetap sukses tanpa cache
- `refresh` query untuk melewati cache saat frontend butuh data paling baru
- `delete_all_transactions` hanya menghapus riwayat transaksi dan tidak mengembalikan stok produk
- clear cache setelah create/update/delete/checkout/delete_transaction_history/delete_all_transactions
- modul `service_transactions` untuk laporan jasa service yang terpisah dari transaksi penjualan stok

## Sheet Service

Buat sheet baru bernama `service_transactions`. Jangan digabung dengan sheet `transaksi`, karena transaksi penjualan punya efek stok, sedangkan transaksi service hanya untuk laporan jasa.

Header baris pertama:

```txt
id | pelanggan | no_hp | perangkat | keluhan | modal_sparepart | modal_pengerjaan | total_modal | catatan_modal | harga_jasa | laba | metode_pembayaran | catatan | tanggal
```

## Kode Lengkap

```js
var CACHE_SECONDS = 60;
var TIMEZONE = "Asia/Jakarta";

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getCachedJson_(key, builder) {
  var cache = CacheService.getScriptCache();

  try {
    var cached = cache.get(key);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    // Cache gagal tidak boleh menggagalkan response utama.
  }

  var data = builder();

  try {
    var text = JSON.stringify(data);
    // CacheService punya batas ukuran item. Lewati cache kalau payload besar.
    if (text.length < 90000) {
      cache.put(key, text, CACHE_SECONDS);
    }
  } catch (err) {
    // Tetap return data walaupun cache gagal.
  }

  return data;
}

function clearDataCache_() {
  try {
    CacheService.getScriptCache().removeAll([
      "products",
      "transactions:all",
      "dashboard:all",
      "service_transactions:all"
    ]);
  } catch (err) {}
}

function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  var headers = values[0];
  var result = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }

  return result;
}

function getProducts_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return sheetToObjects_(ss.getSheetByName("products"));
}

function getTransactions_(startDate, endDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rows = sheetToObjects_(ss.getSheetByName("transaksi"));
  return filterTransactionsByDate_(rows, startDate, endDate);
}

function getServiceTransactions_(startDate, endDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("service_transactions");
  if (!sheet) return [];

  var rows = sheetToObjects_(sheet);
  return filterTransactionsByDate_(rows, startDate, endDate);
}

function filterTransactionsByDate_(rows, startDate, endDate) {
  if (!startDate || !endDate) return rows;

  var start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  var end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return rows.filter(function (trx) {
    var time = new Date(trx.tanggal).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });
}

function buildDateSlots_(startDate, endDate) {
  var slots = {};
  if (!startDate || !endDate) return slots;

  var start = new Date(startDate);
  var end = new Date(endDate);
  var diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  var isMonthly = diffDays > 31;

  if (isMonthly) {
    var currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    var lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (currentMonth <= lastMonth) {
      var monthKey = Utilities.formatDate(currentMonth, TIMEZONE, "yyyy-MM");
      var monthLabel = Utilities.formatDate(currentMonth, TIMEZONE, "MMM yyyy");
      slots[monthKey] = { date: monthKey, label: monthLabel, omzet: 0 };
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    return slots;
  }

  var currentDay = new Date(start);
  currentDay.setHours(0, 0, 0, 0);
  var lastDay = new Date(end);
  lastDay.setHours(0, 0, 0, 0);

  while (currentDay <= lastDay) {
    var dayKey = Utilities.formatDate(currentDay, TIMEZONE, "yyyy-MM-dd");
    var dayLabel = Utilities.formatDate(currentDay, TIMEZONE, "dd/MM");
    slots[dayKey] = { date: dayKey, label: dayLabel, omzet: 0 };
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return slots;
}

function buildDashboardSummary_(startDate, endDate) {
  var transactions = getTransactions_(startDate, endDate);
  var slots = buildDateSlots_(startDate, endDate);
  var diffDays = startDate && endDate
    ? (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  var isMonthly = diffDays > 31;

  var result = {
    unitTerjual: 0,
    labaBersih: 0,
    omzetTotal: 0,
    barChartData: []
  };

  transactions.forEach(function (trx) {
    result.unitTerjual += Number(trx.jumlah) || 0;
    result.labaBersih += Number(trx.laba) || 0;
    result.omzetTotal += Number(trx.total_harga) || 0;

    var date = new Date(trx.tanggal);
    var key = isMonthly
      ? Utilities.formatDate(date, TIMEZONE, "yyyy-MM")
      : Utilities.formatDate(date, TIMEZONE, "yyyy-MM-dd");

    if (!slots[key]) {
      slots[key] = {
        date: key,
        label: isMonthly
          ? Utilities.formatDate(date, TIMEZONE, "MMM yyyy")
          : Utilities.formatDate(date, TIMEZONE, "dd/MM"),
        omzet: 0
      };
    }

    slots[key].omzet += Number(trx.total_harga) || 0;
  });

  result.barChartData = Object.keys(slots).sort().map(function (key) {
    return slots[key];
  });

  return result;
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};

    if (params.action === "dashboard_summary") {
      if (params.refresh) {
        return json_(buildDashboardSummary_(params.startDate, params.endDate));
      }

      return json_(getCachedJson_(
        "dashboard:" + (params.startDate || "") + ":" + (params.endDate || ""),
        function () {
          return buildDashboardSummary_(params.startDate, params.endDate);
        }
      ));
    }

    if (params.sheet === "transaksi") {
      if (params.refresh) {
        return json_(getTransactions_(params.startDate, params.endDate));
      }

      return json_(getCachedJson_(
        "transactions:" + (params.startDate || "") + ":" + (params.endDate || ""),
        function () {
          return getTransactions_(params.startDate, params.endDate);
        }
      ));
    }

    if (params.sheet === "service_transactions") {
      if (params.refresh) {
        return json_(getServiceTransactions_(params.startDate, params.endDate));
      }

      return json_(getCachedJson_(
        "service_transactions:" + (params.startDate || "") + ":" + (params.endDate || ""),
        function () {
          return getServiceTransactions_(params.startDate, params.endDate);
        }
      ));
    }

    return json_(getCachedJson_("products", getProducts_));
  } catch (err) {
    return json_({
      status: "error",
      message: err.message,
      stack: err.stack
    });
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data = body.data;

    if (action === "login") {
      var sheetUsers = ss.getSheetByName("users");
      var userValues = sheetUsers.getDataRange().getValues();

      for (var i = 1; i < userValues.length; i++) {
        var dbUser = String(userValues[i][1]).trim();
        var dbPass = String(userValues[i][2]).trim();
        var inputUser = String(data.username).trim();
        var inputPass = String(data.password).trim();

        if (dbUser === inputUser && dbPass === inputPass) {
          return json_({
            status: "success",
            role: String(userValues[i][3]).trim()
          });
        }
      }

      return json_({
        status: "error",
        message: "Username atau password salah!"
      });
    }

    else if (action === "checkout") {
      var sheetProd = ss.getSheetByName("products");
      var sheetTrans = ss.getSheetByName("transaksi");
      var prodValues = sheetProd.getDataRange().getValues();

      for (var i = 1; i < prodValues.length; i++) {
        if (String(prodValues[i][0]) === String(data.id_produk)) {
          var stokLama = Number(prodValues[i][4]);
          var stokBaru = stokLama - Number(data.jumlah);

          if (stokBaru < 0) throw new Error("Stok tidak mencukupi!");

          sheetProd.getRange(i + 1, 5).setValue(stokBaru);
          break;
        }
      }

      var rowTrans = [
        "TRX-" + new Date().getTime(),
        data.id_produk,
        data.nama_produk,
        data.jumlah,
        data.total_harga,
        data.laba,
        new Date().toISOString(),
        data.keterangan ? data.keterangan : "-",
        data.metode_pembayaran
      ];
      sheetTrans.appendRow(rowTrans);
      clearDataCache_();
      return json_({ status: "success" });
    }

    else if (action === "create") {
      var sheetCreate = ss.getSheetByName("products");
      var genId = data.id ? String(data.id) : String(new Date().getTime());
      sheetCreate.appendRow([
        genId,
        data.merk,
        data.model,
        data.jenis_sparepart,
        data.stok,
        data.harga_beli,
        data.harga_jual,
        data.harga_jual - data.harga_beli,
        data.keterangan,
        new Date().toISOString()
      ]);
      clearDataCache_();
      return json_({ status: "success" });
    }

    else if (action === "update") {
      var sheetUpdate = ss.getSheetByName("products");
      var vUpdate = sheetUpdate.getDataRange().getValues();
      for (var i = 1; i < vUpdate.length; i++) {
        if (String(vUpdate[i][0]) === String(data.id)) {
          sheetUpdate.getRange(i + 1, 2, 1, 9).setValues([[
            data.merk,
            data.model,
            data.jenis_sparepart,
            data.stok,
            data.harga_beli,
            data.harga_jual,
            data.harga_jual - data.harga_beli,
            data.keterangan,
            new Date().toISOString()
          ]]);
          break;
        }
      }
      clearDataCache_();
      return json_({ status: "success" });
    }

    else if (action === "delete") {
      var sheetDel = ss.getSheetByName("products");
      var vDel = sheetDel.getDataRange().getValues();
      for (var i = 1; i < vDel.length; i++) {
        if (String(vDel[i][0]) === String(data.id)) {
          sheetDel.deleteRow(i + 1);
          break;
        }
      }
      clearDataCache_();
      return json_({ status: "success" });
    }

    else if (action === "delete_all_transactions") {
      var startDate = data.startDate;
      var endDate = data.endDate;
      var sheetTransBulk = ss.getSheetByName("transaksi");
      var transValuesBulk = sheetTransBulk.getDataRange().getValues();
      var rowsToDelete = [];

      for (var i = 1; i < transValuesBulk.length; i++) {
        var trxDate = new Date(transValuesBulk[i][6]);
        var shouldDelete = true;

        if (startDate && endDate) {
          var start = new Date(startDate);
          start.setHours(0, 0, 0, 0);

          var end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          var trxTime = trxDate.getTime();
          shouldDelete = trxTime >= start.getTime() && trxTime <= end.getTime();
        }

        if (!shouldDelete) continue;

        rowsToDelete.push(i + 1);
      }

      for (var k = rowsToDelete.length - 1; k >= 0; k--) {
        sheetTransBulk.deleteRow(rowsToDelete[k]);
      }

      clearDataCache_();
      return json_({
        status: "success",
        deletedCount: rowsToDelete.length
      });
    }

    else if (action === "delete_transaction_history" || action === "delete_transaction") {
      var sheetTransDel = ss.getSheetByName("transaksi");
      var transValues = sheetTransDel.getDataRange().getValues();
      var deletedTransaction = false;

      for (var i = 1; i < transValues.length; i++) {
        if (String(transValues[i][0]) === String(data.id)) {
          sheetTransDel.deleteRow(i + 1);
          deletedTransaction = true;
          break;
        }
      }

      clearDataCache_();
      return json_({
        status: deletedTransaction ? "success" : "error",
        message: deletedTransaction
          ? "Riwayat transaksi berhasil dihapus tanpa mengubah stok."
          : "Transaksi tidak ditemukan."
      });
    }

    else if (action === "create_service_transaction") {
      var sheetServiceCreate = ss.getSheetByName("service_transactions");
      if (!sheetServiceCreate) {
        sheetServiceCreate = ss.insertSheet("service_transactions");
        sheetServiceCreate.appendRow([
          "id",
          "pelanggan",
          "no_hp",
          "perangkat",
          "keluhan",
          "modal_sparepart",
          "modal_pengerjaan",
          "total_modal",
          "catatan_modal",
          "harga_jasa",
          "laba",
          "metode_pembayaran",
          "catatan",
          "tanggal"
        ]);
      }

      var serviceModalSparepart = Number(data.modal_sparepart) || 0;
      var serviceModalPengerjaan = Number(data.modal_pengerjaan) || 0;
      var serviceTotalModal = Number(data.total_modal) || serviceModalSparepart + serviceModalPengerjaan;
      var serviceHargaJasa = Number(data.harga_jasa) || 0;
      var serviceLaba = Number(data.laba) || serviceHargaJasa - serviceTotalModal;

      sheetServiceCreate.appendRow([
        "SRV-" + new Date().getTime(),
        data.pelanggan || "-",
        data.no_hp || "-",
        data.perangkat || "-",
        data.keluhan || "-",
        serviceModalSparepart,
        serviceModalPengerjaan,
        serviceTotalModal,
        data.catatan_modal || "-",
        serviceHargaJasa,
        serviceLaba,
        data.metode_pembayaran || "-",
        data.catatan || "-",
        new Date().toISOString()
      ]);

      clearDataCache_();
      return json_({ status: "success" });
    }

    else if (action === "delete_service_transaction") {
      var sheetServiceDel = ss.getSheetByName("service_transactions");
      if (!sheetServiceDel) return json_({ status: "success" });

      var serviceValuesDel = sheetServiceDel.getDataRange().getValues();
      for (var i = 1; i < serviceValuesDel.length; i++) {
        if (String(serviceValuesDel[i][0]) === String(data.id)) {
          sheetServiceDel.deleteRow(i + 1);
          break;
        }
      }

      clearDataCache_();
      return json_({ status: "success" });
    }

    else if (action === "delete_all_service_transactions") {
      var serviceStartDate = data.startDate;
      var serviceEndDate = data.endDate;
      var sheetServiceBulk = ss.getSheetByName("service_transactions");
      if (!sheetServiceBulk) {
        return json_({ status: "success", deletedCount: 0 });
      }

      var serviceValuesBulk = sheetServiceBulk.getDataRange().getValues();
      var serviceRowsToDelete = [];

      for (var i = 1; i < serviceValuesBulk.length; i++) {
        var serviceDate = new Date(serviceValuesBulk[i][13]);
        var shouldDeleteService = true;

        if (serviceStartDate && serviceEndDate) {
          var serviceStart = new Date(serviceStartDate);
          serviceStart.setHours(0, 0, 0, 0);

          var serviceEnd = new Date(serviceEndDate);
          serviceEnd.setHours(23, 59, 59, 999);

          var serviceTime = serviceDate.getTime();
          shouldDeleteService =
            serviceTime >= serviceStart.getTime() &&
            serviceTime <= serviceEnd.getTime();
        }

        if (!shouldDeleteService) continue;
        serviceRowsToDelete.push(i + 1);
      }

      for (var k = serviceRowsToDelete.length - 1; k >= 0; k--) {
        sheetServiceBulk.deleteRow(serviceRowsToDelete[k]);
      }

      clearDataCache_();
      return json_({
        status: "success",
        deletedCount: serviceRowsToDelete.length
      });
    }

    else {
      return json_({
        status: "error",
        message: "Perintah (action) tidak dikenali oleh sistem!"
      });
    }
  } catch (err) {
    return json_({
      status: "error",
      message: err.message,
      stack: err.stack
    });
  }
}
```

## Setelah Paste

1. Klik `Save`.
2. Klik `Run` sekali untuk memberi izin akses Spreadsheet jika diminta.
3. Klik `Deploy > Manage deployments`.
4. Edit deployment aktif atau buat deployment baru.
5. Pastikan:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
6. Buka URL `/exec` langsung di browser. Response harus berupa JSON array produk atau JSON error, bukan halaman HTML Google.
7. Update `API_URL` di `src/services/api.js` jika URL deployment berubah.
