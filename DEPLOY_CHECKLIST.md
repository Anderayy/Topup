# Deploy Checklist

## 1. Pre-Deploy

- Pastikan branch release sudah final dan lulus review.
- Pastikan file rahasia tidak ada di repo (`.env`, `.env.local`, dump DB, log sensitif).
- Pastikan production secrets baru sudah disiapkan:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `JWT_SECRET`
  - `JWT_ADMIN_SECRET`
  - `NODE_ENV=production`

## 2. Database Setup (Production)

- Buat database baru, contoh: `topupdb_prod`.
- Buat user DB khusus aplikasi (bukan `root`).
- Berikan privilege hanya ke database aplikasi.
- Import schema:

```bash
mysql -u <db_user> -p <db_name> < schema.sql
```

- Jangan import dump data production lama tanpa proses masking/sanitasi.

## 3. App Setup (Server)

- Install dependencies:

```bash
npm ci
```

- Build aplikasi:

```bash
npm run build
```

- Start aplikasi:

```bash
npm run start
```

- Wajib jalankan lewat HTTPS (reverse proxy atau platform managed).

## 4. Bootstrap Admin Pertama

- Jalankan sekali di environment production:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL='admin@domain.com'
$env:BOOTSTRAP_ADMIN_PASSWORD='PasswordKuat123'
npm run bootstrap:admin
```

- Setelah berhasil, hapus variabel bootstrap dari shell/session.

## 5. Post-Deploy Verification

- Jalankan semua langkah di `PROD_SMOKE_TEST.md`.
- Pastikan login user dan admin berjalan normal.
- Pastikan submit topup dan update status topup berhasil.
- Pastikan audit log admin tercatat.

## 6. Security Final Checks

- Rotate secret jika ada indikasi pernah terekspos.
- Pastikan backup DB otomatis aktif (minimal harian).
- Batasi akses jaringan ke MySQL hanya dari app server.
- Monitoring error server dan response latency aktif.

## 7. Rollback Plan

- Siapkan artifact build terakhir yang stabil.
- Siapkan backup database terakhir sebelum deploy.
- Jika terjadi issue kritikal:
  - rollback app ke versi terakhir stabil
  - restore DB bila ada migrasi/data corruption
  - validasi ulang dengan smoke test minimum (login, submit topup, admin approve)
