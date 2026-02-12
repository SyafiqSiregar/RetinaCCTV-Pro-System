# RetinaCCTV-Pro-System
Sistem manajemen inventaris dan kasir berbasis cloud-serverless yang terintegrasi penuh, dirancang untuk meminimalisir human error dalam pelacakan Serial Number (SN). Berbasis google spreadsheet


### **Judul Project**

**RetinaCCTV Pro System: Integrated Inventory & Point of Sales (POS)**

### **Deskripsi Singkat**

Sistem manajemen inventaris dan kasir berbasis *cloud-serverless* yang terintegrasi penuh, dirancang untuk meminimalisir *human error* dalam pelacakan Serial Number (SN) dan mempercepat transaksi penjualan CCTV menggunakan ekosistem Google.

### **Deskripsi Lengkap**

RetinaCCTV Pro adalah solusi perangkat lunak kustom yang dibangun untuk mengatasi masalah manajemen stok barang elektronik yang memiliki identitas unik (Serial Number/SN). Aplikasi ini menggabungkan dua fungsi vital: **Manajemen Gudang (Back Office)** dan **Mesin Kasir (Front Office/POS)** dalam satu database terpusat.

Sistem ini mengubah Google Spreadsheet menjadi database relasional yang kuat, diakses melalui antarmuka web modern yang responsif. Fokus utama pengembangan adalah pada kecepatan input data melalui *barcode scanner*, validasi data ganda otomatis untuk mencegah kerugian aset, serta pencatatan transaksi penjualan yang akurat dengan perhitungan PPN otomatis dan pencetakan struk termal.

### **Role**

**Full Stack Developer** (Konseptor Sistem, UI/UX Designer, & Programmer)

### **Klien**

CV RETINA PERISAI NUSANTARA

### **Tahun**

2026

### **Tech Stack**

* **Backend:** Google Apps Script (Serverless)
* **Database:** Google Spreadsheet (Real-time Cloud DB)
* **Frontend:** HTML5, CSS3, Bootstrap 5
* **JavaScript Libraries:** jQuery (DOM Manipulation), DataTables (Advanced Tables), Chart.js (Visualisasi Data), SweetAlert2 (Interaksi User).
* **Tools:** Google Drive API.

### **Fitur Utama**

1. **Dual-Interface System:** Pemisahan akses UI antara Admin Gudang (Manajemen Stok) dan Kasir (Penjualan) melalui satu URL dinamis, menjaga keamanan akses fitur.
2. **Smart Barcode Scanning:** Alur kerja input "Scan-to-Action". Scan Part Number (PN) otomatis mendeteksi nama barang, dan Scan Serial Number (SN) memvalidasi keaslian stok.
3. **Advanced POS with Tax Logic:** Mesin kasir dengan fitur keranjang belanja, kalkulasi otomatis PPN 10%, hitung kembalian, dan *direct printing* ke printer thermal (58mm/80mm).
4. **Anti-Duplication Security:** Algoritma validasi ketat yang menolak input SN yang sama pada barang masuk, atau menjual barang yang SN-nya belum terdaftar di gudang.

### **Hasil/Impact**

* **Efisiensi Biaya:** Mengurangi biaya infrastruktur server menjadi Rp 0,- dengan memanfaatkan ekosistem Google.
* **Akurasi Data:** Mengeliminasi 99% kesalahan input data ganda atau penjualan barang "hantu" (barang fisik ada tapi data tidak ada).
* **Kecepatan Operasional:** Mempercepat proses stok opname dan transaksi kasir hingga 3x lipat dibandingkan metode manual.

### **Penjelasan Detail Teknis & Sistem**

Berikut adalah rincian mendalam mengenai logika dan sistem yang saya bangun di dalam proyek ini:

#### **1. Arsitektur "Serverless" Berbasis Google**

Alih-alih menyewa hosting dan VPS mahal, sistem ini dibangun di atas **Google Apps Script (GAS)**.

* **Code.gs (Backend):** Berfungsi sebagai API yang menjembatani antarmuka web dengan database. Menangani logika CRUD (Create, Read, Update, Delete), validasi data, dan autentikasi sederhana.
* **Google Sheets (Database):** Bertindak sebagai database relasional. Terdiri dari tabel terpisah untuk *Master Barang, Riwayat Masuk, Riwayat Keluar, Penjualan, Supplier, dan User*.

#### **2. Sistem Validasi Stok Berbasis Serial Number (SN)**

Ini adalah fitur paling krusial. Karena CCTV adalah barang bergaransi, pelacakan harus per unit, bukan hanya per jumlah (qty).

* **Logika Masuk:** Saat barang masuk, sistem mengecek apakah SN tersebut sudah ada di database. Jika ada, sistem menolak input (mencegah duplikasi).
* **Logika Keluar/Jual:** Saat kasir melakukan scan SN, sistem melakukan *cross-check* ke database "Barang Masuk" untuk memastikan barang tersebut legal/terdaftar, sekaligus mengecek ke database "Barang Keluar" untuk memastikan barang tersebut belum pernah terjual.

#### **3. Smart Workflow & UX Optimization**

Saya merancang UX (User Experience) khusus untuk penggunaan dengan alat *barcode scanner*:

* **Auto-Focus & Auto-Select:** Saat barcode Part Number (PN) discan, kursor otomatis melompat ke kolom input berikutnya tanpa perlu menyentuh mouse.
* **Read-Only Safety:** Kolom jumlah (Qty) dikunci di angka "1" pada mode transaksi SN untuk memaksa user melakukan scan per unit, memastikan akurasi data 100%.
* **Supplier Tracking:** Saat barang discan di kasir, sistem otomatis menampilkan dari Supplier mana barang tersebut berasal (mengambil data historis penerimaan), memudahkan klaim garansi di masa depan.

#### **4. Modul Point of Sales (POS) Terintegrasi**

Fitur kasir dibangun dengan antarmuka *Split View*:

* **Kiri (Panel Transaksi):** Menampilkan total tagihan yang dinamis (Real-time calculation), input pembayaran, dan kalkulasi kembalian otomatis.
* **Kanan (Keranjang Belanja):** Menampung item sementara dalam *Array JavaScript* sebelum dikirim ke database.
* **Thermal Printing:** Menggunakan CSS `@media print` khusus untuk merender struk belanja yang presisi pada kertas printer kasir standar (58mm), lengkap dengan detail PPN 10%.

#### **5. Keamanan & Backup Data**

* **Role Protection:** Fitur-fitur destruktif seperti "Reset Database" dilindungi oleh *Double Authentication* (meminta password admin lagi sebelum eksekusi).
* **Auto Backup:** Fitur satu klik untuk mengunduh seluruh database Spreadsheet menjadi file Excel (.xlsx) lokal sebagai cadangan, namun secara cerdas mengecualikan sheet "User" (data login) untuk keamanan privasi.
