# Guidebook Setup Project TopUp untuk Client

Dokumen ini adalah panduan instalasi project TopUp di subdomain milik client. Client cukup clone project dari GitHub, menyiapkan database MySQL, mengisi environment production, lalu mendaftarkan callback Hilogate.

Repository GitHub:

```text
https://github.com/Anderayy/Topup.git
```

Contoh subdomain production:

```text
https://topup.clientdomain.com
```

## 1. Gambaran Singkat

Project TopUp adalah aplikasi Next.js + MySQL untuk registrasi user, login user, request top up QRIS via Hilogate, dan admin panel.

Halaman penting:

| Kebutuhan | URL di Subdomain |
| --- | --- |
| Register user | `https://topup.clientdomain.com/register` |
| Login user | `https://topup.clientdomain.com/login` |
| Halaman top up | `https://topup.clientdomain.com/topup` |
| Login admin | `https://topup.clientdomain.com/admin/login` |
| Dashboard admin | `https://topup.clientdomain.com/admin` |

Endpoint callback Hilogate:

```text
https://topup.clientdomain.com/api/callbacks/hilogate/transaction
https://topup.clientdomain.com/api/callbacks/hilogate/withdrawal
```

## 2. Data yang Harus Disiapkan Client

Sebelum setup, client perlu menyiapkan:

- Subdomain final untuk aplikasi TopUp, contoh `https://topup.clientdomain.com`.
- Hosting yang support Next.js / Node.js.
- Database MySQL production.
- Credential database:
  - host
  - port
  - database name
  - username
  - password
- Credential Hilogate:
  - Merchant ID
  - Secret Key
- Email dan password admin awal.

## 3. Clone Project dari GitHub

Jalankan command berikut di server atau local environment:

```bash
git clone https://github.com/Anderayy/Topup.git
cd Topup
npm install
```

Test build:

```bash
npm run build
```

Untuk menjalankan local:

```bash
npm run dev
```

Local URL:

```text
http://localhost:3000
```

## 4. Setup Database MySQL

Buat database baru:

```sql
CREATE DATABASE topupdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import schema:

```bash
mysql -u <db_user> -p topupdb < schema.sql
```

Jika database berasal dari versi lama project, jalankan migration tambahan:

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

Di hosting, isi Environment Variables berikut. Jika testing local, buat file `.env.local`.

```env
DB_HOST=isi_host_database_client
DB_PORT=3306
DB_USER=isi_user_database_client
DB_PASSWORD=isi_password_database_client
DB_NAME=topupdb

JWT_SECRET=isi_secret_random_panjang
JWT_ADMIN_SECRET=isi_secret_admin_random_panjang

HILOGATE_BASE_URL=https://app.hilogate.com/api
HILOGATE_MERCHANT_ID=isi_merchant_id_hilogate
HILOGATE_SECRET_KEY=isi_secret_key_hilogate
HILOGATE_ENVIRONMENT=live
```

Catatan:

- Jangan upload `.env.local` ke GitHub.
- `JWT_SECRET` dan `JWT_ADMIN_SECRET` harus berbeda.
- Untuk production, `HILOGATE_ENVIRONMENT` harus `live`.
- Karena setup memakai subdomain, tidak perlu mengisi `APP_BASE_PATH` atau `NEXT_PUBLIC_APP_BASE_PATH`.

## 6. Arahkan Subdomain ke Hosting

Client perlu membuat subdomain, contoh:

```text
topup.clientdomain.com
```

Arahkan DNS subdomain tersebut ke hosting aplikasi sesuai instruksi provider hosting.

Setelah deploy berhasil, pastikan URL berikut bisa dibuka:

```text
https://topup.clientdomain.com/login
https://topup.clientdomain.com/register
https://topup.clientdomain.com/admin/login
```

## 7. Hubungkan dari Website Utama Client

Di website utama client, tambahkan tombol menuju halaman register TopUp.

Contoh:

```html
<a href="https://topup.clientdomain.com/register">Daftar TopUp</a>
```

Jika client ingin user lama langsung login:

```html
<a href="https://topup.clientdomain.com/login">Login TopUp</a>
```

Alur user:

1. User klik tombol "Daftar TopUp" di website utama client.
2. User masuk ke `https://topup.clientdomain.com/register`.
3. User mengisi data dan memilih `unique_id`.
4. Setelah registrasi berhasil, user diarahkan ke login.
5. Setelah login, user bisa melakukan top up di halaman `/topup`.

## 8. Daftarkan Callback di Hilogate

Minta client mendaftarkan callback berikut di dashboard Hilogate:

```text
https://topup.clientdomain.com/api/callbacks/hilogate/transaction
https://topup.clientdomain.com/api/callbacks/hilogate/withdrawal
```

Data yang perlu dikirim ke Hilogate:

| Data | Nilai |
| --- | --- |
| Transaction Callback URL | `https://topup.clientdomain.com/api/callbacks/hilogate/transaction` |
| Withdrawal Callback URL | `https://topup.clientdomain.com/api/callbacks/hilogate/withdrawal` |
| Environment | `live` |

Setelah callback aktif, Hilogate akan mengirim update status transaksi ke aplikasi. Aplikasi akan menyimpan status tersebut ke tabel `topup_requests`.

## 9. Buat Akun Admin Awal

Setelah database dan environment selesai, buat akun admin pertama.

Linux / macOS:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@clientdomain.com BOOTSTRAP_ADMIN_PASSWORD=PasswordKuat123 npm run bootstrap:admin
```

PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL='admin@clientdomain.com'
$env:BOOTSTRAP_ADMIN_PASSWORD='PasswordKuat123'
npm run bootstrap:admin
```

Login admin:

```text
https://topup.clientdomain.com/admin/login
```

## 10. Siapkan Unique ID

User hanya bisa register jika admin sudah menyiapkan `unique_id`.

Langkah:

1. Login ke admin panel.
2. Buka menu Unique ID atau Data User.
3. Tambahkan `unique_id` manual, atau import file Excel `.xlsx/.xls`.
4. Pastikan unique ID tersedia sebelum user mulai register.

Saat user berhasil register, unique ID otomatis menjadi sudah dipakai.

## 11. Deployment Production

Alur deployment:

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

7. Arahkan subdomain ke aplikasi.
8. Daftarkan callback Hilogate.
9. Buat admin awal.
10. Tambahkan unique ID.
11. Test registrasi dan top up QRIS.

Jika memakai Vercel, client cukup import repository GitHub, isi Environment Variables, lalu deploy.

## 12. Checklist Testing

Sebelum dibuka untuk user, cek:

- `https://topup.clientdomain.com/register` bisa dibuka.
- `https://topup.clientdomain.com/login` bisa dibuka.
- `https://topup.clientdomain.com/admin/login` bisa dibuka.
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
- Pastikan database bisa diakses dari hosting aplikasi.
- Pastikan `schema.sql` sudah diimport.

Jika user tidak bisa register:

- Pastikan admin sudah menambahkan `unique_id`.
- Pastikan unique ID belum dipakai user lain.

Jika QRIS gagal dibuat:

- Cek `HILOGATE_MERCHANT_ID`.
- Cek `HILOGATE_SECRET_KEY`.
- Pastikan `HILOGATE_ENVIRONMENT=live`.
- Cek log aplikasi untuk pesan error Hilogate.

Jika callback tidak masuk:

- Pastikan callback URL di Hilogate memakai subdomain production.
- Pastikan endpoint callback dapat diakses publik via HTTPS.
- Pastikan hosting mengizinkan request `POST`.
- Pastikan secret key Hilogate di environment sama dengan dashboard Hilogate.

## 14. Form Data dari Client

Client perlu mengisi data berikut:

| Data | Isi Client |
| --- | --- |
| Subdomain TopUp |  |
| Database host |  |
| Database port |  |
| Database name |  |
| Database user |  |
| Database password |  |
| Hilogate Merchant ID |  |
| Hilogate Secret Key |  |
| Email admin awal |  |
| Password admin awal |  |
| Transaction callback URL | `https://topup.clientdomain.com/api/callbacks/hilogate/transaction` |
| Withdrawal callback URL | `https://topup.clientdomain.com/api/callbacks/hilogate/withdrawal` |

## 15. Catatan Keamanan

- Jangan commit `.env.local` ke GitHub.
- Jangan share Hilogate secret key di grup chat umum.
- Gunakan password admin yang kuat.
- Gunakan HTTPS untuk subdomain production.
- Jika secret pernah terekspos, rotate secret di Hilogate dan update Environment Variables.

