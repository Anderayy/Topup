# Guidebook Setup Project TopUp

Versi dokumen: 22 Mei 2026  
Project: TopUp System  
Stack: Next.js 14, React, Node.js, MySQL, Hilogate QRIS

## 1. Tujuan Dokumen

Dokumen ini akan menuntun Anda untuk setup project TopUp ke subdomain yang sudah disiapkan.

Project ini akan dijalankan di subdomain, contoh:

```text
https://topup.domain-anda.com
```

Semua URL pada dokumen ini memakai format subdomain tersebut.

## 2. Informasi yang Perlu Anda Siapkan

Sebelum setup dimulai, siapkan data berikut:

| Kebutuhan | Contoh |
| --- | --- |
| URL repository GitHub | `https://github.com/Anderayy/Topup.git` |
| Subdomain production | `https://topup.domain-anda.com` |
| Database host | `localhost` atau host dari provider database |
| Database port | `3306` |
| Database name | `topupdb` |
| Database username | `topup_user` |
| Database password | password database Anda |
| Email admin awal | `admin@domain-anda.com` |
| Password admin awal | minimal 8 karakter |
| Hilogate Merchant ID | diberikan oleh Hilogate |
| Hilogate Secret Key | diberikan oleh Hilogate |

URL callback Hilogate yang perlu diberikan ke pihak Hilogate:

```text
https://topup.domain-anda.com/api/callbacks/hilogate/transaction
https://topup.domain-anda.com/api/callbacks/hilogate/withdrawal
```

## 3. Requirement Server

Server atau hosting Anda harus mendukung:

- Node.js 20 atau lebih baru
- npm
- MySQL 8.x atau MariaDB yang kompatibel
- Akses terminal atau SSH
- Subdomain HTTPS/SSL aktif
- Reverse proxy seperti Nginx, Apache, cPanel Node.js App, PM2, Docker, atau platform seperti Vercel

Catatan penting: shared hosting biasa yang hanya mendukung PHP tidak cukup untuk menjalankan project ini. Hosting harus mendukung aplikasi Node.js/Next.js.

## 4. Clone Project dari GitHub

Masuk ke server melalui terminal/SSH, lalu clone repository:

```bash
git clone https://github.com/Anderayy/Topup.git
cd Topup
```

Jika repository dibuat private, pastikan akun server atau akun deploy sudah memiliki akses ke repository tersebut.

## 5. Install Dependency

Jalankan:

```bash
npm install
```

Untuk server production yang ingin install dependency berdasarkan lockfile:

```bash
npm ci
```

## 6. Setup Database

Buat database baru di MySQL yang akan dipakai project ini.

Contoh melalui MySQL CLI:

```sql
CREATE DATABASE topupdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'topup_user'@'localhost' IDENTIFIED BY 'password_database_yang_kuat';
GRANT ALL PRIVILEGES ON topupdb.* TO 'topup_user'@'localhost';
FLUSH PRIVILEGES;
```

Jika database dibuat melalui cPanel/phpMyAdmin, buat database dan user dari panel hosting, lalu catat:

- Database host
- Database port
- Database name
- Database username
- Database password

## 7. Import Struktur Database

Project menyediakan file `schema.sql` untuk membuat tabel awal.

Jalankan dari folder project:

```bash
mysql -u topup_user -p topupdb < schema.sql
```

Jika menggunakan host database yang berbeda:

```bash
mysql -h database-host-anda.com -P 3306 -u topup_user -p topupdb < schema.sql
```

Jika import dilakukan lewat phpMyAdmin:

1. Buka phpMyAdmin.
2. Pilih database yang sudah Anda buat.
3. Klik menu Import.
4. Upload file `schema.sql`.
5. Jalankan import.

Tabel utama yang akan dibuat:

- `users`
- `unique_ids`
- `topup_requests`
- `payment_withdrawal_callbacks`
- `admins`
- `admin_audit_logs`

## 8. Setup File Environment

Buat file `.env.local` dari `.env.example`:

```bash
cp .env.example .env.local
```

Di Windows CMD:

```cmd
copy .env.example .env.local
```

Di PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Isi `.env.local` sesuai data server, database, dan credential Hilogate Anda:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=topup_user
DB_PASSWORD=password_database_yang_kuat
DB_NAME=topupdb

JWT_SECRET=ganti_dengan_random_secret_panjang
JWT_ADMIN_SECRET=ganti_dengan_random_admin_secret_panjang

HILOGATE_BASE_URL=https://app.hilogate.com/api
HILOGATE_MERCHANT_ID=merchant_id_dari_hilogate
HILOGATE_SECRET_KEY=secret_key_dari_hilogate
HILOGATE_ENVIRONMENT=live
```

Untuk membuat secret yang kuat:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Jalankan dua kali, satu untuk `JWT_SECRET` dan satu untuk `JWT_ADMIN_SECRET`.

Penting:

- Jangan upload `.env.local` ke GitHub.
- Jangan kirim Hilogate Secret Key melalui chat publik.
- Jika secret pernah tersebar, minta rotate key ke pihak Hilogate.

## 9. Buat Akun Admin Awal

Project ini tidak menyimpan admin default di database. Admin awal harus dibuat dengan command bootstrap.

Linux/macOS:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@domain-anda.com BOOTSTRAP_ADMIN_PASSWORD=PasswordKuat123 npm run bootstrap:admin
```

PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL='admin@domain-anda.com'
$env:BOOTSTRAP_ADMIN_PASSWORD='PasswordKuat123'
npm run bootstrap:admin
```

CMD:

```cmd
set BOOTSTRAP_ADMIN_EMAIL=admin@domain-anda.com
set BOOTSTRAP_ADMIN_PASSWORD=PasswordKuat123
npm run bootstrap:admin
```

Setelah berhasil, admin bisa login melalui:

```text
https://topup.domain-anda.com/admin/login
```

## 10. Build Project

Sebelum dijalankan di production, build project:

```bash
npm run build
```

Jika build berhasil, jalankan:

```bash
npm run start
```

Secara default Next.js berjalan di port `3000`.

Untuk mengganti port:

```bash
npm run start -- -p 3001
```

## 11. Opsi Deployment

### Opsi A: VPS dengan PM2 dan Nginx

Install PM2:

```bash
npm install -g pm2
```

Build dan jalankan app:

```bash
npm ci
npm run build
pm2 start npm --name topup -- run start
pm2 save
```

Contoh konfigurasi Nginx:

```nginx
server {
    server_name topup.domain-anda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan SSL, misalnya menggunakan Certbot:

```bash
sudo certbot --nginx -d topup.domain-anda.com
```

### Opsi B: Vercel

1. Login ke Vercel.
2. Import repository GitHub `https://github.com/Anderayy/Topup`.
3. Pilih project TopUp.
4. Isi Environment Variables sesuai `.env.local`.
5. Deploy.
6. Tambahkan subdomain Anda di menu Domains, contoh `topup.domain-anda.com`.
7. Gunakan subdomain final sebagai callback Hilogate.

Catatan: pastikan database MySQL dapat diakses dari Vercel. Jika database berada di VPS/private network, gunakan database managed/public endpoint dengan whitelist IP sesuai kebijakan Anda.

### Opsi C: cPanel Node.js App

1. Buat Node.js Application dari cPanel.
2. Arahkan Application Root ke folder project.
3. Set startup command ke `npm run start` jika panel mendukung.
4. Isi Environment Variables dari panel cPanel.
5. Jalankan `npm install` dan `npm run build` melalui terminal cPanel/SSH.
6. Restart Node.js App.

Setiap provider cPanel bisa berbeda. Jika panel tidak mendukung Next.js production build, gunakan VPS atau Vercel.

## 12. Setup URL Callback Hilogate

Setelah subdomain production aktif, berikan URL berikut ke pihak Hilogate:

```text
Transaction Callback:
https://topup.domain-anda.com/api/callbacks/hilogate/transaction

Withdrawal Callback:
https://topup.domain-anda.com/api/callbacks/hilogate/withdrawal
```

Environment Hilogate production:

```env
HILOGATE_BASE_URL=https://app.hilogate.com/api
HILOGATE_MERCHANT_ID=<merchant_id_live>
HILOGATE_SECRET_KEY=<merchant_secret_key_live>
HILOGATE_ENVIRONMENT=live
```

Callback harus menggunakan HTTPS, bukan HTTP.

## 13. Alur Penggunaan Setelah Setup

Halaman utama:

```text
https://topup.domain-anda.com/
```

Register user:

```text
https://topup.domain-anda.com/register
```

Login user:

```text
https://topup.domain-anda.com/login
```

Top up user:

```text
https://topup.domain-anda.com/topup
```

Login admin:

```text
https://topup.domain-anda.com/admin/login
```

Dashboard admin:

```text
https://topup.domain-anda.com/admin
```

Manajemen unique ID:

```text
https://topup.domain-anda.com/admin/unique-ids
```

Data user:

```text
https://topup.domain-anda.com/admin/users
```

Data topup:

```text
https://topup.domain-anda.com/admin/topup
```

Jika project ini ingin ditaruh sebagai tombol di website utama Anda, arahkan tombol ke:

```text
https://topup.domain-anda.com/register
```

atau:

```text
https://topup.domain-anda.com/login
```

Rekomendasi tombol:

- Tombol "Daftar TopUp" arahkan ke `/register`.
- Tombol "Masuk TopUp" arahkan ke `/login`.
- Tombol admin tidak perlu ditampilkan ke publik.

## 14. Setup Unique ID

User hanya bisa register memakai `unique_id` yang sudah disediakan admin.

Langkah admin:

1. Login ke `/admin/login`.
2. Masuk ke menu Data User atau Unique IDs.
3. Tambahkan `unique_id` manual, atau import file Excel `.xlsx/.xls`.
4. Pastikan unique ID statusnya belum digunakan.
5. Setelah user register, unique ID otomatis ditandai used.

Format Excel import:

- Gunakan kolom pertama untuk daftar unique ID.
- Satu baris berisi satu unique ID.

Contoh:

| unique_id |
| --- |
| USER001 |
| USER002 |
| USER003 |

## 15. Checklist Testing Setelah Deploy

Lakukan validasi berikut sebelum website diumumkan:

| Test | Expected Result |
| --- | --- |
| Buka homepage | Halaman tampil normal |
| Buka `/register` | Form register tampil |
| Buka `/login` | Form login tampil |
| Login admin | Admin berhasil masuk |
| Tambah unique ID | Data masuk ke database |
| Register user | User berhasil dibuat |
| Login user | User berhasil masuk |
| Submit topup QRIS | Request dibuat dan QRIS muncul |
| Callback Hilogate | `gateway_status` dan `callback_received_at` ter-update |
| Dashboard topup admin | Data topup tampil |

Query pengecekan callback:

```sql
SELECT id, gateway_ref_id, gateway_status, callback_received_at
FROM topup_requests
ORDER BY id DESC
LIMIT 10;
```

Jika `callback_received_at` terisi, callback Hilogate sudah masuk ke sistem.

## 16. Troubleshooting

### Error database connection

Cek `.env.local`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Tes koneksi:

```bash
mysql -h localhost -P 3306 -u topup_user -p topupdb
```

### Error table not found

Import ulang `schema.sql` ke database yang benar:

```bash
mysql -u topup_user -p topupdb < schema.sql
```

### Admin tidak bisa login

Jalankan ulang bootstrap admin:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@domain-anda.com BOOTSTRAP_ADMIN_PASSWORD=PasswordBaru123 npm run bootstrap:admin
```

PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL='admin@domain-anda.com'
$env:BOOTSTRAP_ADMIN_PASSWORD='PasswordBaru123'
npm run bootstrap:admin
```

### Submit topup gagal karena Hilogate

Cek environment:

```env
HILOGATE_BASE_URL=https://app.hilogate.com/api
HILOGATE_MERCHANT_ID=<merchant_id_live>
HILOGATE_SECRET_KEY=<merchant_secret_key_live>
HILOGATE_ENVIRONMENT=live
```

Pastikan merchant ID dan secret key adalah credential live, bukan sandbox.

### Callback Hilogate tidak masuk

Cek hal berikut:

- Subdomain sudah HTTPS.
- URL callback di dashboard Hilogate sudah benar.
- Endpoint tidak diblokir firewall.
- App production sedang berjalan.
- `HILOGATE_SECRET_KEY` sama dengan secret yang dipakai Hilogate.

URL callback yang benar:

```text
https://topup.domain-anda.com/api/callbacks/hilogate/transaction
https://topup.domain-anda.com/api/callbacks/hilogate/withdrawal
```

## 17. Checklist Go Live

Sebelum go live, pastikan:

- Repository GitHub yang digunakan adalah `https://github.com/Anderayy/Topup`.
- File `.env.local` tidak ikut ter-commit.
- Database production sudah dibuat.
- `schema.sql` sudah di-import.
- Admin awal sudah dibuat.
- Subdomain production sudah aktif.
- SSL/HTTPS sudah aktif.
- Environment Hilogate sudah `live`.
- Callback URL sudah diberikan ke Hilogate.
- Submit topup QRIS sudah dites.
- Callback Hilogate sudah berhasil masuk.
- Backup database sudah disiapkan.

## 18. Repository GitHub

Project sudah tersedia di GitHub, sehingga Anda bisa langsung clone repository berikut:

```bash
git clone https://github.com/Anderayy/Topup.git
```

Rekomendasi urutan setup:

1. Clone repository dari GitHub.
2. Install dependency.
3. Buat database.
4. Import `schema.sql`.
5. Isi `.env.local`.
6. Build dan jalankan project.
7. Set subdomain dan callback Hilogate.

## 19. Ringkasan Data yang Perlu Diberikan ke Hilogate

Berikan data berikut ke pihak Hilogate:

| Field | Isi |
| --- | --- |
| Merchant subdomain | `https://topup.domain-anda.com` |
| Transaction callback URL | `https://topup.domain-anda.com/api/callbacks/hilogate/transaction` |
| Withdrawal callback URL | `https://topup.domain-anda.com/api/callbacks/hilogate/withdrawal` |
| Environment | `live` |

## 20. Catatan Keamanan

- Jangan menggunakan password database default.
- Jangan menggunakan `JWT_SECRET` pendek.
- Jangan menyimpan credential production di chat publik.
- Jangan commit `.env.local`, dump database, atau file backup database ke GitHub.
- Batasi akses admin hanya untuk personel yang berwenang.
- Aktifkan backup database berkala di hosting Anda.
- Rotate secret jika ada indikasi credential tersebar.
