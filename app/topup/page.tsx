'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  id: number
  unique_id: string
  full_name: string
}

export default function TopupPage() {
  const MAX_TOPUP_AMOUNT = 9999999999999
  const [user, setUser] = useState<UserData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('QRIS')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setUser(data.user)
    }
    fetchProfile().catch(() => router.push('/login'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const validate = () => {
    if (!amount || !paymentMethod) {
      setError('Semua field wajib diisi.')
      return false
    }
    const value = Number(amount)
    if (Number.isNaN(value) || value < 10000) {
      setError('Nominal minimal 10.000.')
      return false
    }
    if (value > MAX_TOPUP_AMOUNT) {
      setError('Nominal maksimal Rp 9.999.999.999.999.')
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
      const response = await fetch('/api/topup/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), paymentMethod })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.message || 'Gagal mengirim request top up.')
        setLoading(false)
        return
      }
      setToast('Request top up berhasil dikirim. Admin akan segera memproses.')
      setAmount('')
      setLoading(false)
    } catch (err) {
      setError('Tidak dapat menghubungi server. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numberValue = Number(value.replace(/[^0-9]/g, ''))
    if (!numberValue) return ''
    return numberValue.toLocaleString('id-ID')
  }

  return (
    <main className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="card w-full max-w-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-slate-500">Halo, <span className="font-semibold text-heading">{user?.full_name || 'Pengguna'}</span></p>
            <p className="text-sm text-slate-500">Unique ID: <span className="font-medium">{user?.unique_id || '...'}</span></p>
          </div>
          <button onClick={handleLogout} className="rounded-xl border border-slate-300 px-5 py-3 text-sm text-slate-700 hover:bg-slate-100">
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Metode Pembayaran</label>
            <select className="input-field" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="QRIS">QRIS</option>
              <option value="VA">VA</option>
            </select>
          </div>

          <div>
            <label className="label">Nominal Top Up</label>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl border border-slate-300/90 bg-slate-100 px-4 py-3 text-slate-500">Rp</span>
              <input
                className="input-field flex-1"
                type="text"
                value={formatCurrency(amount)}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Maks. Rp 9.999.999.999.999</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Mengirim...' : 'Submit Top Up'}
          </button>
        </form>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
