'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const BASE_PATH = (process.env.NEXT_PUBLIC_APP_BASE_PATH || '').replace(/\/$/, '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email dan Password wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${BASE_PATH}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data?.message || 'Email atau Password salah')
        setLoading(false)
        return
      }

      router.push(`${BASE_PATH}/admin/users`)
    } catch (err) {
      setError('Tidak dapat menghubungi server. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mt-3 text-3xl font-semibold text-heading">Login Admin</h1>
          <p className="mt-2 text-slate-600">Masuk sebagai administrator untuk melihat data user dan top up.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              className="input-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@sistem.com"
              type="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              type="password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Login Admin'}
          </button>
        </form>
      </div>
    </main>
  )
}
