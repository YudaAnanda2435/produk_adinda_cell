function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = (e.parameter.sheet === "transaksi") ? "transaksi" : "products";
  var sheet = ss.getSheetByName(sheetName);
  
  var values = sheet.getDataRange().getValues();
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
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data = body.data;

    // 1. FITUR LOGIN
    if (action === "login") {
      var sheetUsers = ss.getSheetByName("users");
      var userValues = sheetUsers.getDataRange().getValues();
      
      for (var i = 1; i < userValues.length; i++) {
        // Gunakan .trim() untuk menghapus spasi tidak sengaja di Google Sheets
        var dbUser = String(userValues[i][1]).trim();
        var dbPass = String(userValues[i][2]).trim();
        var inputUser = String(data.username).trim();
        var inputPass = String(data.password).trim();

        if (dbUser === inputUser && dbPass === inputPass) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "success", 
            role: String(userValues[i][3]).trim()
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "error", 
        message: "Username atau password salah!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. FITUR TRANSAKSI KASIR
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
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. FITUR CRUD PRODUK
    else if (action === "create") {
      var sheetCreate = ss.getSheetByName("products");
      var genId = data.id ? String(data.id) : String(new Date().getTime());
      sheetCreate.appendRow([genId, data.merk, data.model, data.jenis_sparepart, data.stok, data.harga_beli, data.harga_jual, (data.harga_jual - data.harga_beli), data.keterangan, new Date().toISOString()]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    } 
    
    else if (action === "update") {
      var sheetUpdate = ss.getSheetByName("products");
      var vUpdate = sheetUpdate.getDataRange().getValues();
      for (var i = 1; i < vUpdate.length; i++) {
        if (String(vUpdate[i][0]) === String(data.id)) {
          sheetUpdate.getRange(i + 1, 2, 1, 9).setValues([[data.merk, data.model, data.jenis_sparepart, data.stok, data.harga_beli, data.harga_jual, (data.harga_jual - data.harga_beli), data.keterangan, new Date().toISOString()]]);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "delete_transaction") {
      var sheetTransDel = ss.getSheetByName("transaksi");
      var sheetProdDel = ss.getSheetByName("products");
      var transValues = sheetTransDel.getDataRange().getValues();
      
      for (var i = 1; i < transValues.length; i++) {
        if (String(transValues[i][0]) === String(data.id)) {
          var idProduk = transValues[i][1];
          var jumlahBalik = Number(transValues[i][3]);
          
          var prodValuesDel = sheetProdDel.getDataRange().getValues();
          for (var j = 1; j < prodValuesDel.length; j++) {
            if (String(prodValuesDel[j][0]) === String(idProduk)) {
              var stokSekarang = Number(prodValuesDel[j][4]);
              sheetProdDel.getRange(j + 1, 5).setValue(stokSekarang + jumlahBalik);
              break;
            }
          }
          sheetTransDel.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. PENOLAKAN MUTLAK JIKA ACTION TIDAK SESUAI
    else {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error", 
        message: "Perintah (action) tidak dikenali oleh sistem!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", 
      message: f.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}