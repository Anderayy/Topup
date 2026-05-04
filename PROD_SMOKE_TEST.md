# Production Smoke Test

## Tujuan

Memastikan flow paling kritikal berjalan normal setelah deploy production.

## Prasyarat

- App sudah running via HTTPS.
- Database production sudah aktif.
- Akun admin bootstrap sudah dibuat.
- Minimal 1 `unique_id` tersedia (belum digunakan).

## A. Health Basic

1. Buka halaman utama `/` dan pastikan tidak error.
2. Buka `/login`, `/register`, `/admin/login` dan pastikan halaman render normal.

## B. User Registration + Login

1. Register user baru dari `/register` dengan data valid.
2. Pastikan registrasi sukses.
3. Login user di `/login`.
4. Pastikan diarahkan ke `/topup`.

## C. Topup Submit Flow

1. Di halaman `/topup`, submit nominal valid (>= 10.000) dengan metode `QRIS` atau `VA`.
2. Pastikan response sukses.
3. Verifikasi di DB tabel `topup_requests`:
   - row baru muncul
   - `status = pending`
   - `user_id` sesuai user login

## D. Admin Flow

1. Login admin di `/admin/login`.
2. Buka `/admin/topup`, pastikan request baru terlihat.
3. Update status request ke `approved` (atau `rejected`).
4. Verifikasi di DB:
   - `topup_requests.status` berubah sesuai aksi
   - `reviewed_at` terisi

## E. Audit Log

1. Lakukan aksi admin (misal update status topup / create unique id).
2. Verifikasi tabel `admin_audit_logs`:
   - row baru tercatat
   - `admin_id`, `action`, `target_type`, `created_at` terisi

## F. Auth & Session

1. Logout user, pastikan akses `/topup` redirect ke `/login`.
2. Logout admin, pastikan akses `/admin/users` redirect ke `/admin/login`.
3. Uji akses API tanpa cookie:
   - endpoint protected harus balas `401 Unauthorized`.

## G. Negative Cases

1. Login dengan password salah -> harus gagal.
2. Submit topup nominal < 10.000 -> harus ditolak.
3. Register dengan `unique_id` yang sudah dipakai -> harus ditolak.

## H. Final Criteria (Pass/Fail)

Release dinyatakan **PASS** jika:

- Semua test A sampai G lulus.
- Tidak ada error 500 pada flow utama.
- Data DB konsisten dengan aksi user/admin.

Jika ada 1 kegagalan kritikal di auth, topup, atau admin update status: **FAIL** dan rollback sesuai `DEPLOY_CHECKLIST.md`.
