# Guidebook Setup Project TopUp di Subdomain Kamu

Dokumen ini menjelaskan cara memasang project TopUp di subdomain kamu. Kamu tinggal clone project dari GitHub, membuat database MySQL, mengisi environment production, lalu mendaftarkan callback Hilogate.

Repository GitHub:

```text
https://github.com/Anderayy/Topup.git
```

Contoh subdomain production:

```text
https://topup.domainkamu.com
```

Di semua contoh URL pada dokumen ini, ganti `topup.domainkamu.com` dengan subdomain asli milik kamu.

## 1. Gambaran Singkat

Project TopUp adalah aplikasi Next.js + MySQL untuk:

- registrasi user,
- login user,
- request top up QRIS melalui Hilogate,
- admin panel untuk mengelola user, unique ID, dan transaksi top up.

Halaman penting:

| Kebutuhan | URL di Subdomain Kamu |
| --- | --- |
| Register user | `https://topup.domainkamu.com/register` |
| Login user | `https://topup.domainkamu.com/login` |
| Halaman top up | `https://topup.domainkamu.com/topup` |
| Login admin | `https://topup.domainkamu.com/admin/login` |
| Dashboard admin | `https://topup.domainkamu.com/admin` |

Endpoint callback Hilogate yang nanti kamu daftarkan:

```text
https://topup.domainkamu.com/api/callbacks/hilogate/transaction
https://topup.domainkamu.com/api/callbacks/hilogate/withdrawal
```

## 2. Yang Harus Kamu Siapkan

Sebelum mulai setup, siapkan data berikut:

- Subdomain final untuk aplikasi TopUp, contoh `https://topup.domainkamu.com`.
- Hosting yang support Next.js / Node.js.
- Database MySQL production.
- Credential database:
  - host,
  - port,
  - database name,
  - username,
  - password.
- Credential Hilogate:
  - Merchant ID,
  - Secret Key.
- Email dan password untuk admin pertama.

## 3. Clone Project dari GitHub

Masuk ke server atau local environment kamu, lalu jalankan:

```bash
git clone https://github.com/Anderayy/Topup.git
cd Topup
npm install
```

Untuk memastikan project bisa di-build:

```bash
npm run build
```

Untuk menjalankan project di local:

```bash
npm run dev
```

Local URL:

```text
http://localhost:3000
```

## 4. Setup Database MySQL

Buat database baru di MySQL kamu:

```sql
CREATE DATABASE topupdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import struktur tabel dari file `schema.sql`:

```bash
mysql -u <db_user> -p topupdb < schema.sql
```

Jika kamu pernah memakai versi lama project ini, jalankan migration Hilogate:

```bash
mysql -u <db_user> -p topupdb < migrations/2026-05-16-hilogate-qris.sql
```

Tabel utama:

| Tabel | Fungsi |
| --- | --- |
| `users` | Data user terdaftar |
| `unique_ids` | Daftar unique ID yang bisa dipilih saat register |
| `topup_requests` | Data request top up dan status Hilogate |
| `payment_withdrawal_callbacks` | Data callback withdrawal Hilogate |
| `admins` | Akun admin |
| `admin_audit_logs` | Log aktivitas admin |

## 5. Isi Environment Production

Di hosting kamu, isi Environment Variables berikut. Jika kamu testing di local, buat file `.env.local`.

```env
DB_HOST=isi_host_database_kamu
DB_PORT=3306
DB_USER=isi_user_database_kamu
DB_PASSWORD=isi_password_database_kamu
DB_NAME=topupdb

JWT_SECRET=isi_secret_random_panjang
JWT_ADMIN_SECRET=isi_secret_admin_random_panjang

HILOGATE_BASE_URL=https://app.hilogate.com/api
HILOGATE_MERCHANT_ID=isi_merchant_id_hilogate_kamu
HILOGATE_SECRET_KEY=isi_secret_key_hilogate_kamu
HILOGATE_ENVIRONMENT=live
```

Catatan:

- Jangan upload `.env.local` ke GitHub.
- `JWT_SECRET` dan `JWT_ADMIN_SECRET` harus berbeda.
- Untuk production, isi `HILOGATE_ENVIRONMENT=live`.
- Karena setup ini memakai subdomain, kamu tidak perlu mengisi `APP_BASE_PATH` atau `NEXT_PUBLIC_APP_BASE_PATH`.

## 6. Arahkan Subdomain ke Hosting

Buat subdomain untuk aplikasi TopUp, contoh:

```text
topup.domainkamu.com
```

Setelah itu, arahkan DNS subdomain tersebut ke hosting aplikasi kamu sesuai instruksi provider hosting.

Setelah deploy berhasil, pastikan URL ini bisa dibuka:

```text
https://topup.domainkamu.com/login
https://topup.domainkamu.com/register
https://topup.domainkamu.com/admin/login
```

## 7. Hubungkan dari Website Utama Kamu

Di website utama kamu, tambahkan tombol menuju halaman register TopUp.

Contoh tombol register:

```html
<a href="https://topup.domainkamu.com/register">Daftar TopUp</a>
```

Jika kamu ingin user lama langsung masuk ke halaman login:

```html
<a href="https://topup.domainkamu.com/login">Login TopUp</a>
```

Alur user:

1. User klik tombol "Daftar TopUp" di website utama kamu.
2. User masuk ke `https://topup.domainkamu.com/register`.
3. User mengisi data dan memilih `unique_id`.
4. Setelah registrasi berhasil, user diarahkan ke login.
5. Setelah login, user bisa melakukan top up di halaman `/topup`.

## 8. Daftarkan Callback di Hilogate

Di dashboard Hilogate kamu, masukkan callback berikut:

```text
https://topup.domainkamu.com/api/callbacks/hilogate/transaction
https://topup.domainkamu.com/api/callbacks/hilogate/withdrawal
```

Data yang kamu isi di Hilogate:

| Data | Nilai |
| --- | --- |
| Transaction Callback URL | `https://topup.domainkamu.com/api/callbacks/hilogate/transaction` |
| Withdrawal Callback URL | `https://topup.domainkamu.com/api/callbacks/hilogate/withdrawal` |
| Environment | `live` |

Setelah callback aktif, Hilogate akan mengirim update status transaksi ke aplikasi TopUp kamu. Aplikasi akan menyimpan status tersebut ke tabel `topup_requests`.

## 9. Buat Akun Admin Pertama

Setelah database dan environment selesai, buat akun admin pertama.

Linux / macOS:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@domainkamu.com BOOTSTRAP_ADMIN_PASSWORD=PasswordKuat123 npm run bootstrap:admin
```

PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL='admin@domainkamu.com'
$env:BOOTSTRAP_ADMIN_PASSWORD='PasswordKuat123'
npm run bootstrap:admin
```

Setelah berhasil, login admin lewat:

```text
https://topup.domainkamu.com/admin/login
```

## 10. Siapkan Unique ID

User hanya bisa register jika kamu sudah menyiapkan `unique_id` dari admin panel.

Langkah:

1. Login ke admin panel.
2. Buka menu Unique ID atau Data User.
3. Tambahkan `unique_id` secara manual, atau import file Excel `.xlsx/.xls`.
4. Pastikan unique ID tersedia sebelum user mulai register.

Saat user berhasil register, unique ID otomatis menjadi sudah dipakai.

## 11. Deployment Production

Urutan deployment:

1. Clone repo dari GitHub:

```bash
git clone https://github.com/Anderayy/Topup.git
cd Topup
```

2. Install dependency:

```bash
npm install
```

3. Buat database MySQL dan import `schema.sql`.
4. Isi Environment Variables production.
5. Build aplikasi:

```bash
npm run build
```

6. Jalankan aplikasi:

```bash
npm run start
```

7. Arahkan subdomain kamu ke aplikasi.
8. Daftarkan callback Hilogate.
9. Buat admin pertama.
10. Tambahkan unique ID dari admin panel.
11. Test registrasi dan top up QRIS.

Jika kamu memakai Vercel, kamu bisa import repository GitHub, isi Environment Variables, lalu deploy.

## 12. Checklist Testing

Sebelum aplikasi dibuka untuk user, cek:

- `https://topup.domainkamu.com/register` bisa dibuka.
- `https://topup.domainkamu.com/login` bisa dibuka.
- `https://topup.domainkamu.com/admin/login` bisa dibuka.
- Admin bisa login.
- Admin bisa menambahkan/import unique ID.
- User bisa register memakai unique ID.
- User bisa login.
- User bisa submit top up QRIS.
- QRIS tampil setelah submit.
- Callback Hilogate masuk.
- Tabel `topup_requests` terupdate:
  - `gateway_ref_id` terisi.
  - `gateway_status` terisi.
  - `callback_received_at` terisi setelah callback masuk.

## 13. Troubleshooting Cepat

Jika aplikasi tidak connect database:

- Cek `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`.
- Pastikan database kamu bisa diakses dari hosting aplikasi.
- Pastikan `schema.sql` sudah diimport.

Jika user tidak bisa register:

- Pastikan kamu sudah menambahkan `unique_id`.
- Pastikan unique ID belum dipakai user lain.

Jika QRIS gagal dibuat:

- Cek `HILOGATE_MERCHANT_ID`.
- Cek `HILOGATE_SECRET_KEY`.
- Pastikan `HILOGATE_ENVIRONMENT=live`.
- Cek log aplikasi untuk pesan error Hilogate.

Jika callback tidak masuk:

- Pastikan callback URL di Hilogate memakai subdomain production kamu.
- Pastikan endpoint callback dapat diakses publik via HTTPS.
- Pastikan hosting mengizinkan request `POST`.
- Pastikan secret key Hilogate di environment sama dengan dashboard Hilogate.

## 14. Data yang Perlu Kamu Isi

Isi tabel ini sebelum deployment:

| Data | Isi Kamu |
| --- | --- |
| Subdomain TopUp |  |
| Database host |  |
| Database port |  |
| Database name |  |
| Database user |  |
| Database password |  |
| Hilogate Merchant ID |  |
| Hilogate Secret Key |  |
| Email admin pertama |  |
| Password admin pertama |  |
| Transaction callback URL | `https://topup.domainkamu.com/api/callbacks/hilogate/transaction` |
| Withdrawal callback URL | `https://topup.domainkamu.com/api/callbacks/hilogate/withdrawal` |

## 15. Catatan Keamanan

- Jangan commit `.env.local` ke GitHub.
- Jangan share Hilogate secret key di grup chat umum.
- Gunakan password admin yang kuat.
- Gunakan HTTPS untuk subdomain production.
- Jika secret pernah terekspos, rotate secret di Hilogate dan update Environment Variables.

