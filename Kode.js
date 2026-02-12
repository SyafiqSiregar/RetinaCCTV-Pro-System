const SS = SpreadsheetApp.getActiveSpreadsheet();

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ ADMIN SYSTEM')
      .addItem('▶️ ! Update Struktur Database (Wajib Klik)', 'resetDatabaseLayout')
      .addSeparator()
      .addItem('📥 Download Backup Data (.xlsx)', 'downloadBackupXLSX')
      .addToUi();
}

function downloadBackupXLSX() {
  const ui = SpreadsheetApp.getUi();
  const sheetsToExport = ["Barang", "Masuk", "Keluar", "Supplier", "Kategori"];
  const dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HHmm");
  const tempSS = SpreadsheetApp.create("Backup_RetinaCCTV_" + dateStr);
  const tempId = tempSS.getId();
  
  sheetsToExport.forEach(name => {
    const sourceSheet = SS.getSheetByName(name);
    if (sourceSheet) sourceSheet.copyTo(tempSS).setName(name);
  });
  
  const defaultSheet = tempSS.getSheetByName("Sheet1");
  if (defaultSheet) tempSS.deleteSheet(defaultSheet);
  
  const url = "https://docs.google.com/spreadsheets/d/" + tempId + "/export?format=xlsx";
  const htmlOutput = HtmlService.createHtmlOutput(
    `<div style="text-align:center; font-family:sans-serif; padding:20px;">
       <p>File Backup berhasil disiapkan!</p>
       <br><a href="${url}" target="_blank" style="background-color:#4361ee; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">KLIK UNTUK DOWNLOAD (.xlsx)</a>
     </div>`
  ).setWidth(350).setHeight(220);
  ui.showModalDialog(htmlOutput, 'Download Data');
}

function resetDatabaseLayout() {
  const ui = SpreadsheetApp.getUi();
  const sheetUser = SS.getSheetByName('User');
  if (sheetUser) {
    const prompt = ui.prompt('🔐 SECURITY CHECK', 'PERINGATAN: Struktur Database akan direset!\nMasukkan Password Administrator:', ui.ButtonSet.OK_CANCEL);
    if (prompt.getSelectedButton() !== ui.Button.OK) return;
    const inputPass = prompt.getResponseText();
    const dataUser = sheetUser.getDataRange().getValues();
    let isAuthorized = false;
    for (let i = 1; i < dataUser.length; i++) {
      if (String(dataUser[i][1]) === inputPass && String(dataUser[i][2]) === 'Administrator') {
        isAuthorized = true; break;
      }
    }
    if (!isAuthorized) { ui.alert('❌ Password Salah!'); return; }
  }

  // UPDATE STRUKTUR: HAPUS SUPPLIER DARI BARANG
  const tabs = [
    { name: "Barang", header: ["Kode Barang", "Nama Barang", "Kategori", "Satuan", "Harga Beli", "Harga Jual", "Stok"] },
    { name: "Masuk", header: ["ID Transaksi", "Tanggal", "Kode Barang", "Nama Barang", "Supplier", "Jumlah", "Serial Number"] },
    { name: "Keluar", header: ["ID Transaksi", "Tanggal", "Kode Barang", "Nama Barang", "Supplier", "Keterangan", "Jumlah", "Serial Number"] },
    { name: "Supplier", header: ["ID Supplier", "Nama Supplier", "Alamat", "Telepon"] },
    { name: "Kategori", header: ["ID Kategori", "Nama Kategori"] },
    { name: "User", header: ["Username", "Password", "Role"] }
  ];

  tabs.forEach(t => {
    let sheet = SS.getSheetByName(t.name);
    if (sheet) { SS.deleteSheet(sheet); }
    sheet = SS.insertSheet(t.name);
    sheet.appendRow(t.header);
    sheet.getRange(1, 1, 1, t.header.length).setFontWeight("bold").setBackground("#4e73df").setFontColor("white").setHorizontalAlignment("center");
    if(t.name === "User") sheet.appendRow(["admin", "admin123", "Administrator"]);
  });
  SpreadsheetApp.getUi().alert('✅ SUKSES! Kolom Supplier telah dihapus dari Master Barang.');
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index').evaluate().setTitle('RetinaCCTV Pro System').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getData(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  let numCols = sheet.getLastColumn();
  
  // UPDATE: Barang sekarang hanya 7 kolom (hilang 1)
  if (sheetName === 'Barang') numCols = 7;
  else if (sheetName === 'Masuk') numCols = 7;
  else if (sheetName === 'Keluar') numCols = 8;
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).getValues();

  if(sheetName === 'Masuk' || sheetName === 'Keluar') {
    return data.map(row => {
      if (row[1] && row[1] instanceof Date) { 
        row[1] = Utilities.formatDate(row[1], "GMT+7", "dd/MM/yyyy HH:mm"); 
      }
      return row;
    });
  }
  return data;
}

function getChartData() {
  const brg = getData('Barang');
  const masuk = getData('Masuk');
  const keluar = getData('Keluar');
  
  let katStats = {};
  let totalAset = 0; 

  brg.forEach(r => { 
    // UPDATE INDEX: Kategori=2, Satuan=3, Beli=4, Jual=5, Stok=6
    let k = r[2] || "Tanpa Kategori"; 
    let hargaBeli = Number(r[4]) || 0; // Index Beli bergeser ke 4
    let s = Number(r[6]) || 0;         // Index Stok bergeser ke 6
    katStats[k] = (katStats[k] || 0) + s; 
    totalAset += (s * hargaBeli);
  });

  let trenMasuk = [0,0,0,0,0,0,0,0,0,0,0,0];
  let trenKeluar = [0,0,0,0,0,0,0,0,0,0,0,0];
  if(masuk.length > 0) trenMasuk[new Date().getMonth()] = masuk.length;
  if(keluar.length > 0) trenKeluar[new Date().getMonth()] = keluar.length;
  
  // Update total stok index 6
  let totalStok = brg.reduce((acc, row) => acc + (Number(row[6]) || 0), 0);
  
  return {
    jmlBarang: brg.length,
    jmlStok: totalStok,
    jmlMasuk: masuk.length,
    jmlKeluar: keluar.length,
    totalAset: totalAset, 
    chartKategori: katStats,
    chartTren: { masuk: trenMasuk, keluar: trenKeluar }
  };
}

function cariBarangBySN(sn) {
  const sheetMasuk = SS.getSheetByName('Masuk');
  const sheetKeluar = SS.getSheetByName('Keluar');
  
  if (!sn) return { status: 'error', msg: 'SN Kosong' };
  const snClean = String(sn).trim().toLowerCase();
  
  const dataKeluar = sheetKeluar.getDataRange().getValues();
  for (let i = 1; i < dataKeluar.length; i++) {
    if (dataKeluar[i].length > 7 && String(dataKeluar[i][7]).trim().toLowerCase() === snClean) {
      return { status: 'error', msg: 'SN ini sudah KELUAR!' };
    }
  }
  
  const dataMasuk = sheetMasuk.getDataRange().getValues();
  for (let i = 1; i < dataMasuk.length; i++) {
    if (String(dataMasuk[i][6]).trim().toLowerCase() === snClean) {
      return { 
        status: 'success', 
        kode: dataMasuk[i][2], 
        nama: dataMasuk[i][3],
        supplier: dataMasuk[i][4] 
      };
    }
  }
  return { status: 'error', msg: 'SN tidak ditemukan (Belum Masuk).' };
}

function simpanTransaksi(tipe, data) {
  const sheetTrx = SS.getSheetByName(tipe);
  const sheetBrg = SS.getSheetByName('Barang');
  const idTrx = 'TRX-' + Date.now();
  const tgl = new Date(); 
  
  if (data.sn && data.sn.trim() !== '' && data.sn !== '-') {
    const history = sheetTrx.getDataRange().getValues();
    let snIndex = (tipe === 'Masuk') ? 6 : 7;
    for (let i = 1; i < history.length; i++) {
      if (history[i].length > snIndex) {
        let existingSN = String(history[i][snIndex]).trim().toLowerCase(); 
        let inputSN = String(data.sn).trim().toLowerCase();
        if (existingSN === inputSN) {
          return { status: 'error', msg: 'GAGAL! SN "' + data.sn + '" SUDAH ADA.' };
        }
      }
    }
  }

  if (tipe === 'Masuk') {
     sheetTrx.appendRow([idTrx, tgl, data.kodeBrg, data.namaBrg, data.keterangan, data.jumlah, data.sn]); 
  } else {
     sheetTrx.appendRow([idTrx, tgl, data.kodeBrg, data.namaBrg, data.supplier, data.keterangan, data.jumlah, data.sn]);
  }
  
  const allBrg = sheetBrg.getDataRange().getValues();
  let barangFound = false;
  for(let i=1; i<allBrg.length; i++){
    if(String(allBrg[i][0]).toLowerCase() == String(data.kodeBrg).toLowerCase()){
      // UPDATE INDEX STOK: Dulu 7, Sekarang 6 (Karena Supplier hilang)
      let stokLama = Number(allBrg[i][6]); 
      let stokBaru = (tipe == 'Masuk') ? stokLama + Number(data.jumlah) : stokLama - Number(data.jumlah);
      
      if(stokBaru < 0) return { status: 'error', msg: 'Stok Kurang!' };
      
      // Update ke Kolom G (index 7 di A1 notation)
      sheetBrg.getRange(i+1, 7).setValue(stokBaru);
      barangFound = true;
      break;
    }
  }
  
  if(!barangFound) return { status: 'error', msg: 'Barang tidak ditemukan di Master!' };
  return { status: 'success', msg: 'Berhasil Disimpan' };
}

function simpanData(jenis, data) {
  const sheet = SS.getSheetByName(jenis);
  let id = data.id || (jenis!=='Barang' ? generateId(jenis) : null);
  
  if(jenis === 'Barang') {
    if(getData('Barang').some(r => String(r[0]).toLowerCase() == String(id).toLowerCase())) {
        return { status: 'error', msg: 'Kode Barang Sudah Ada!' };
    }
  }

  if (jenis == 'Barang') {
    // UPDATE: HAPUS SUPPLIER DARI DATA YG DISIMPAN
    // [Kode, Nama, Kategori, Satuan, Beli, Jual, Stok]
    sheet.appendRow([id, data.nama, data.kategori, data.satuan, data.beli, data.jual, data.stok]);
  }
  if (jenis == 'Supplier') sheet.appendRow([id, data.nama, data.alamat, data.telepon]);
  if (jenis == 'Kategori') sheet.appendRow([id, data.nama]);

  return { status: 'success', msg: 'Data Tersimpan' };
}

function updateData(jenis, id, data) {
  const sheet = SS.getSheetByName(jenis);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) == String(id)) {
      if (jenis === 'Barang') {
        sheet.getRange(i + 1, 2).setValue(data.nama);
        sheet.getRange(i + 1, 3).setValue(data.kategori);
        // UPDATE INDEKS UPDATE BARANG
        sheet.getRange(i + 1, 4).setValue(data.satuan); // Kol D
        sheet.getRange(i + 1, 5).setValue(data.beli);   // Kol E
        sheet.getRange(i + 1, 6).setValue(data.jual);   // Kol F
      } 
      else if (jenis === 'Supplier') {
        sheet.getRange(i + 1, 2).setValue(data.nama);
        sheet.getRange(i + 1, 3).setValue(data.alamat);
        sheet.getRange(i + 1, 4).setValue(data.telepon);
      }
      else if (jenis === 'Kategori') {
        sheet.getRange(i + 1, 2).setValue(data.nama);
      }
      else if (jenis === 'Masuk') {
        sheet.getRange(i + 1, 5).setValue(data.keterangan); 
        sheet.getRange(i + 1, 7).setValue(data.sn);
      }
      else if (jenis === 'Keluar') {
        sheet.getRange(i + 1, 6).setValue(data.keterangan); 
        sheet.getRange(i + 1, 8).setValue(data.sn); 
      }
      return { status: 'success', msg: 'Data Berhasil Diupdate' };
    }
  }
  return { status: 'error', msg: 'ID Tidak Ditemukan' };
}

function hapusData(sheetName, id) {
  const sheet = SS.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) == String(id)) { 
        if (sheetName === 'Masuk' || sheetName === 'Keluar') {
            const kodeBarang = data[i][2]; 
            const jumlahTrx = (sheetName === 'Masuk') ? Number(data[i][5]) : Number(data[i][6]);
            const sheetBrg = SS.getSheetByName('Barang');
            const dataBrg = sheetBrg.getDataRange().getValues();
            for (let j = 1; j < dataBrg.length; j++) {
                if (String(dataBrg[j][0]) == String(kodeBarang)) {
                    // UPDATE INDEX STOK: 6 (sebelumnya 7)
                    let stokSekarang = Number(dataBrg[j][6]);
                    let stokBaru = (sheetName === 'Masuk') ? stokSekarang - jumlahTrx : stokSekarang + jumlahTrx;
                    sheetBrg.getRange(j + 1, 7).setValue(stokBaru);
                    break;
                }
            }
        }
        sheet.deleteRow(i + 1); 
        return 'success'; 
    }
  }
  return 'not found';
}

function checkLogin(u, p) {
  const users = SS.getSheetByName('User').getDataRange().getValues();
  for(let i=1; i<users.length; i++) {
    if(users[i][0] == u && users[i][1] == p) return { status: 'success', role: users[i][2] };
  }
  return { status: 'failed' };
}

function generateId(prefix) { return prefix.substring(0,3).toUpperCase() + "-" + Math.floor(1000+Math.random()*9000); }
