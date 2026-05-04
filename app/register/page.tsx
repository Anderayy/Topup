'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bankName, setBankName] = useState('BCA')
  const [accountNumber, setAccountNumber] = useState('')
  const [telegramUsername, setTelegramUsername] = useState('')
  const [password, setPassword] = useState('')
  const [uniqueId, setUniqueId] = useState('')
  const [uniqueIds, setUniqueIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadUniqueIds() {
      const response = await fetch('/api/unique-ids')
      if (!response.ok) return
      const data = await response.json()
      setUniqueIds((data.uniqueIds || []).map((item: { unique_id: string }) => item.unique_id))
    }
    loadUniqueIds().catch(() => undefined)
  }, [])

  const validate = () => {
    if (!fullName || !email || !phoneNumber || !bankName || !accountNumber || !telegramUsername || !password || !uniqueId) {
      setError('Semua field wajib diisi.')
      return false
    }

    if (accountNumber.length < 6) {
      setError('Nomor rekening tidak valid.')
      return false
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return false
    }

    setError('')
    return true
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          bankName,
          accountNumber,
          telegramUsername,
          password,
          uniqueId
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data?.message || 'Terjadi kesalahan saat registrasi.')
        setLoading(false)
        return
      }

      setToast('Registrasi berhasil. Mengarahkan ke login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('Tidak dapat menghubungi server. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-heading">Buat Akun Baru</h1>
          <p className="mt-2 text-slate-600">Lengkapi data berikut untuk mulai menggunakan layanan top up.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              className="input-field"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="label">Nomor Telepon</label>
            <input
              className="input-field"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="08xxxxxx atau 62xxxxxx"
            />
          </div>

          <div>
            <label className="label">Nama Bank</label>
            <select className="input-field" value={bankName} onChange={(event) => setBankName(event.target.value)}>
              <option>BCA</option>
              <option>Mandiri</option>
              <option>BRI</option>
              <option>BNI</option>
              <option>Bank X</option>
              <option>Bank Y</option>
            </select>
          </div>

          <div>
            <label className="label">Nomor Rekening</label>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Masukkan nomor rekening"
            />
          </div>

          <div>
            <label className="label">Username Telegram</label>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl border border-slate-300/90 bg-slate-100 px-4 py-3 text-slate-500">@</span>
              <input
                className="input-field flex-1"
                type="text"
                value={telegramUsername.replace(/^@/, '')}
                onChange={(event) => setTelegramUsername(event.target.value.replace(/^@/, ''))}
                placeholder="username_telegram"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="label">Unique ID</label>
            <select className="input-field" value={uniqueId} onChange={(event) => setUniqueId(event.target.value)}>
              <option value="">Pilih Unique ID</option>
              {uniqueIds.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Sudah punya akun? <a href="/login" className="link-primary">Masuk di sini</a></p>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
