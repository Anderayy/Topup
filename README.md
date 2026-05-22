# TopUp System

Sistem web fullstack Next.js + MySQL dengan autentikasi user/admin dan alur transaksi top up berbasis `unique_id`.

## Fitur Utama

- User register dengan: nama, email, nomor telepon, bank, rekening, password, dan pilihan `unique_id`.
- `unique_id` disediakan admin dari CMS (manual atau import Excel).
- Login user menggunakan `unique_id` + password.
- Admin bisa melihat data user, data top up, dan identitas `unique_id` untuk tiap transaksi.
- Halaman admin auto-refresh berkala agar data terbaru cepat terlihat.

## Setup

1. Install dependency:

   ```bash
   npm install
   ```

2. Buat `.env.local` dari `.env.example`:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=change_me_database_password
   DB_NAME=topupdb
   JWT_SECRET=change_me_user_jwt_secret
   JWT_ADMIN_SECRET=change_me_admin_jwt_secret
   ```

3. Import skema database:

   ```bash
   mysql -u root -p topupdb < schema.sql
   ```

4. Jalankan:

   ```bash
   npm run dev
   ```

## Bootstrap Admin (Wajib)

Project ini tidak lagi menyimpan seed admin default di `schema.sql`.
Untuk membuat akun admin awal, jalankan:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@domain.com BOOTSTRAP_ADMIN_PASSWORD=PasswordKuat123 npm run bootstrap:admin
```

Di PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL='admin@domain.com'
$env:BOOTSTRAP_ADMIN_PASSWORD='PasswordKuat123'
npm run bootstrap:admin
```

## Security Checklist Sebelum Publish

- Jangan commit `.env*` yang berisi rahasia.
- Ganti semua secret production (`JWT_SECRET`, `JWT_ADMIN_SECRET`, `DB_PASSWORD`).
- Jangan push dump database production yang berisi data pribadi user.
- Gunakan managed rate-limit store (Redis/Upstash) untuk deployment multi-instance.

## Hilogate (LIVE)

- Isi env:
  - `HILOGATE_BASE_URL=https://app.hilogate.com/api`
  - `HILOGATE_MERCHANT_ID=<merchant_id_live>`
  - `HILOGATE_SECRET_KEY=<merchant_secret_key_live>`
  - `HILOGATE_ENVIRONMENT=live`
- Callback URL yang harus diset di dashboard Hilogate:
  - `https://<domain-kamu>/api/callbacks/hilogate/transaction`
  - `https://<domain-kamu>/api/callbacks/hilogate/withdrawal`

## Catatan Unique ID

- Admin menambahkan `unique_id` dari menu **Data User**:
  - input manual
  - import file `.xlsx/.xls` (ambil kolom pertama)
- User hanya bisa memilih `unique_id` yang belum dipakai.
- Setelah registrasi berhasil, `unique_id` otomatis ditandai `used`.
