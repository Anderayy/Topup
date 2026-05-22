'use client'

import { useEffect, useMemo, useState } from 'react'

const BASE_PATH = (process.env.NEXT_PUBLIC_APP_BASE_PATH || '').replace(/\/$/, '')

interface TopupRequest {
  id: number
  unique_id: string
  full_name: string
  telegram_username: string
  bank_name: string
  account_number: string
  account_name: string
  amount: number
  payment_method: 'QRIS' | 'VA'
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  submitted_at: string
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}

export default function AdminTopupPage() {
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadRequests(showRefreshing = false) {
      if (showRefreshing) setIsRefreshing(true)
      const response = await fetch(`${BASE_PATH}/api/admin/topup`)
      if (!response.ok) {
        if (isMounted) setError('Gagal memuat data top up.')
        if (showRefreshing) setIsRefreshing(false)
        return
      }
      const data = await response.json()
      if (isMounted) {
        const latestRequests = data.requests || []
        setRequests(latestRequests)
        setStatus((prev) => {
          const next = { ...prev }
          latestRequests.forEach((item: TopupRequest) => {
            if (next[item.id] === undefined) next[item.id] = item.status
          })
          return next
        })
        setNotes((prev) => {
          const next = { ...prev }
          latestRequests.forEach((item: TopupRequest) => {
            if (next[item.id] === undefined) next[item.id] = item.notes || ''
          })
          return next
        })
        setError('')
        setLastUpdated(new Date())
      }
      if (showRefreshing) setIsRefreshing(false)
    }

    loadRequests().catch(() => setError('Gagal memuat data top up.'))

    const interval = setInterval(() => {
      loadRequests(true).catch(() => setError('Gagal memuat data top up.'))
    }, 8000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleUpdate = async (id: number) => {
    const newStatus = status[id]
    const newNotes = notes[id]
    const response = await fetch(`${BASE_PATH}/api/admin/topup/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes: newNotes })
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data?.message || 'Gagal memperbarui status.')
      return
    }

    setToast('Status top up berhasil diperbarui.')
    setRequests((current) => current.map((item) => (item.id === id ? { ...item, status: newStatus as any, notes: newNotes } : item)))
    setTimeout(() => setToast(''), 2500)
  }

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((item) =>
      item.unique_id.toLowerCase().includes(q) ||
      item.full_name.toLowerCase().includes(q)
    )
  }, [requests, search])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl gap-6">
        <aside className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-heading">Admin Menu</h2>
          <nav className="mt-6 space-y-3 text-sm text-slate-700">
            <a href={`${BASE_PATH}/admin/users`} className="block rounded-2xl px-4 py-3 hover:bg-slate-100">Data User</a>
            <a href={`${BASE_PATH}/admin/topup`} className="block rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-900">Top Up Request</a>
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
              <h1 className="text-2xl font-semibold text-heading">Top Up Request</h1>
              <p className="text-slate-600">Kelola status top up dan beri catatan.</p>
              <p className="mt-1 text-xs text-slate-500">
                {isRefreshing ? 'Memperbarui data...' : `Terakhir update: ${lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : '-'}`}
              </p>
            </div>
            <input
              className="input-field max-w-sm"
              placeholder="Cari Unique ID atau Nama User"
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
                  <th className="py-3 pr-4">Nama User</th>
                  <th className="py-3 pr-4">Telegram</th>
                  <th className="py-3 pr-4">Bank Tujuan</th>
                  <th className="py-3 pr-4">No. Rekening</th>
                  <th className="py-3 pr-4">Nama Rekening</th>
                  <th className="py-3 pr-4">Nominal</th>
                  <th className="py-3 pr-4">Metode</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Tgl Submit</th>
                  <th className="py-3 pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-4 pr-4 font-medium text-slate-700">{index + 1}</td>
                    <td className="py-4 pr-4">{item.unique_id}</td>
                    <td className="py-4 pr-4">{item.full_name}</td>
                    <td className="py-4 pr-4">{item.telegram_username || '-'}</td>
                    <td className="py-4 pr-4">{item.bank_name}</td>
                    <td className="py-4 pr-4">{item.account_number}</td>
                    <td className="py-4 pr-4">{item.account_name}</td>
                    <td className="whitespace-nowrap py-4 pr-4">{formatRupiah(item.amount)}</td>
                    <td className="py-4 pr-4">{item.payment_method}</td>
                    <td className="py-4 pr-4">
                      <span className={`badge ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">{new Date(item.submitted_at).toLocaleString('id-ID')}</td>
                    <td className="py-4 pr-4 space-y-2">
                      <select
                        className="input-field"
                        value={status[item.id] || item.status}
                        onChange={(event) => setStatus((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                      </select>
                      <textarea
                        className="input-field h-24 resize-none"
                        placeholder="Notes opsional"
                        value={notes[item.id] || ''}
                        onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      />
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="btn-primary text-sm"
                      >
                        Simpan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
