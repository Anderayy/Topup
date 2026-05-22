# Setup Cepat Callback Hilogate (LIVE)

## 1) Persiapan Local
- Pastikan DB sudah pakai migration terbaru: `migrations/2026-05-16-hilogate-qris.sql`
- Isi `.env.local`:

```env
HILOGATE_BASE_URL=https://app.hilogate.com/api
HILOGATE_MERCHANT_ID=<merchant_id_live>
HILOGATE_SECRET_KEY=<merchant_secret_key_live>
HILOGATE_ENVIRONMENT=live
```

## 2) Opsi Sementara (Ngrok)
Pakai ini hanya untuk sementara, karena URL gratis bisa berubah.

```powershell
# Terminal 1
npm run dev

# Terminal 2 (setelah ngrok terpasang)
ngrok http 3000
```

Gunakan URL HTTPS dari ngrok, lalu set di Hilogate:
- `https://<ngrok-domain>/api/callbacks/hilogate/transaction`
- `https://<ngrok-domain>/api/callbacks/hilogate/withdrawal`

## 3) Opsi Stabil (Vercel)
1. Push project ke GitHub.
2. Import repo ke Vercel.
3. Tambahkan env yang sama di Project Settings > Environment Variables.
4. Deploy.
5. Pakai URL Vercel sebagai callback:
- `https://<project>.vercel.app/api/callbacks/hilogate/transaction`
- `https://<project>.vercel.app/api/callbacks/hilogate/withdrawal`

## 4) Validasi Setelah Diset
1. Submit topup dari halaman `/topup`.
2. Cek dashboard Hilogate, transaksi muncul.
3. Cek tabel `topup_requests`:
- `gateway_ref_id` terisi
- `gateway_status` ter-update
- `callback_received_at` terisi saat callback masuk

## 5) Catatan Keamanan
- Merchant secret key jangan share ke grup chat.
- Karena secret pernah tampil di screenshot, minta rotate key lalu update env.
