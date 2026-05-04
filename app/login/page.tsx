'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!loginId || !password) {
      setError('Email/No. Telepon dan Password wajib diisi.')
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
        signal: controller.signal
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data?.message || 'Email/No. Telepon atau Password salah')
        return
      }

      window.location.assign('/topup')
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Request login timeout. Silakan coba lagi.')
        return
      }
      setError('Tidak dapat menghubungi server. Silakan coba lagi.')
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-heading">Masuk ke Akun</h1>
          <p className="mt-2 text-slate-600">Gunakan email atau nomor telepon yang terdaftar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email atau Nomor Telepon</label>
            <input
              className="input-field"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="Masukkan email atau no. telepon"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-24"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Belum punya akun? <a href="/register" className="link-primary">Daftar sekarang</a></p>
        </div>
      </div>
    </main>
  )
}
