'use client'

import { useEffect, useMemo, useState } from 'react'

const BASE_PATH = (process.env.NEXT_PUBLIC_APP_BASE_PATH || '').replace(/\/$/, '')

interface AdminUser {
  id: number
  unique_id: string
  full_name: string
  email: string
  phone_number: string
  bank_name: string
  account_number: string
  telegram_username: string
  status: 'active' | 'inactive'
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchUsers(showRefreshing = false) {
      if (showRefreshing) setIsRefreshing(true)
      const usersResponse = await fetch(`${BASE_PATH}/api/admin/users`)
      if (!usersResponse.ok) {
        if (isMounted) setError('Gagal memuat data pengguna.')
        if (showRefreshing) setIsRefreshing(false)
        return
      }
      const data = await usersResponse.json()
      if (isMounted) {
        setUsers(data.users || [])
        setError('')
        setLastUpdated(new Date())
      }
      if (showRefreshing) setIsRefreshing(false)
    }

    fetchUsers().catch(() => setError('Gagal memuat data pengguna.'))

    const interval = setInterval(() => {
      fetchUsers(true).catch(() => setError('Gagal memuat data pengguna.'))
    }, 8000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = search.toLowerCase()
      return (
        user.full_name.toLowerCase().includes(q) ||
        user.unique_id.toLowerCase().includes(q)
      )
    })
  }, [search, users])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl gap-6">
        <aside className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-heading">Admin Menu</h2>
          <nav className="mt-6 space-y-3 text-sm text-slate-700">
            <a href={`${BASE_PATH}/admin/users`} className="block rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-900">Data User</a>
            <a href={`${BASE_PATH}/admin/topup`} className="block rounded-2xl px-4 py-3 hover:bg-slate-100">Top Up Request</a>
            <a href={`${BASE_PATH}/admin/unique-ids`} className="block rounded-2xl px-4 py-3 hover:bg-slate-100">Unique ID</a>
            <button
              onClick={async () => {
                await fetch(`${BASE_PATH}/api/auth/logout`, { method: 'POST' })
                window.location.href = `${BASE_PATH}/admin/login`
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-left text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </nav>
        </aside>

        <section className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-heading">Data User</h1>
              <p className="text-slate-600">Menampilkan seluruh pengguna yang telah terdaftar.</p>
              <p className="mt-1 text-xs text-slate-500">
                {isRefreshing ? 'Memperbarui data...' : `Terakhir update: ${lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : '-'}`}
              </p>
            </div>
            <input
              className="input-field max-w-sm"
              placeholder="Cari nama atau Unique ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-3 pr-4">No</th>
                  <th className="py-3 pr-4">Unique ID</th>
                  <th className="py-3 pr-4">Nama</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">No. Telepon</th>
                  <th className="py-3 pr-4">Bank</th>
                  <th className="py-3 pr-4">No. Rekening</th>
                  <th className="py-3 pr-4">Telegram</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-4 pr-4 font-medium text-slate-700">{index + 1}</td>
                    <td className="py-4 pr-4">{user.unique_id}</td>
                    <td className="py-4 pr-4">{user.full_name}</td>
                    <td className="py-4 pr-4">{user.email}</td>
                    <td className="py-4 pr-4">{user.phone_number}</td>
                    <td className="py-4 pr-4">{user.bank_name}</td>
                    <td className="py-4 pr-4">{user.account_number}</td>
                    <td className="py-4 pr-4">{user.telegram_username || '-'}</td>
                    <td className="py-4 pr-4">
                      <span className={`badge ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">{new Date(user.created_at).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
