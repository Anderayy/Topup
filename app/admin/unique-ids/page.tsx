'use client'

import { useEffect, useState } from 'react'

interface UniqueIdItem {
  id: number
  unique_id: string
  is_used: number
  created_at: string
}

export default function AdminUniqueIdsPage() {
  const [uniqueIds, setUniqueIds] = useState<UniqueIdItem[]>([])
  const [newUniqueId, setNewUniqueId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchUniqueIds(showRefreshing = false) {
      if (showRefreshing) setIsRefreshing(true)
      const response = await fetch('/api/admin/unique-ids')
      if (!response.ok) {
        if (isMounted) setError('Gagal memuat data Unique ID.')
        if (showRefreshing) setIsRefreshing(false)
        return
      }

      const data = await response.json()
      if (isMounted) {
        setUniqueIds(data.uniqueIds || [])
        setError('')
        setLastUpdated(new Date())
      }
      if (showRefreshing) setIsRefreshing(false)
    }

    fetchUniqueIds().catch(() => setError('Gagal memuat data Unique ID.'))
    const interval = setInterval(() => {
      fetchUniqueIds(true).catch(() => setError('Gagal memuat data Unique ID.'))
    }, 8000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const reloadUniqueIds = async () => {
    const response = await fetch('/api/admin/unique-ids')
    const data = await response.json()
    if (response.ok) {
      setUniqueIds(data.uniqueIds || [])
      setLastUpdated(new Date())
    }
  }

  const handleAddUniqueId = async () => {
    if (!newUniqueId.trim()) return
    const response = await fetch('/api/admin/unique-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueId: newUniqueId.trim() })
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data?.message || 'Gagal menambah Unique ID.')
      return
    }
    setNewUniqueId('')
    setToast('Unique ID berhasil ditambahkan.')
    setTimeout(() => setToast(''), 2000)
    await reloadUniqueIds()
  }

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/unique-ids/import', {
      method: 'POST',
      body: formData
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data?.message || 'Gagal import Excel.')
      setUploading(false)
      return
    }

    setUploading(false)
    event.target.value = ''
    setToast(`Import selesai. Total dibaca: ${data?.totalRead || 0}`)
    setTimeout(() => setToast(''), 2500)
    await reloadUniqueIds()
  }

  const handleDelete = async (id: number, uniqueId: string) => {
    const ok = window.confirm(`Hapus Unique ID "${uniqueId}"?`)
    if (!ok) return

    const response = await fetch(`/api/admin/unique-ids/${id}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) {
      setError(data?.message || 'Gagal menghapus Unique ID.')
      return
    }

    setToast('Unique ID berhasil dihapus.')
    setTimeout(() => setToast(''), 2000)
    await reloadUniqueIds()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl gap-6">
        <aside className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-heading">Admin Menu</h2>
          <nav className="mt-6 space-y-3 text-sm text-slate-700">
            <a href="/admin/users" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">Data User</a>
            <a href="/admin/topup" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">Top Up Request</a>
            <a href="/admin/unique-ids" className="block rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-900">Unique ID</a>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/admin/login'
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-left text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </nav>
        </aside>

        <section className="flex-1 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-heading">Unique ID</h1>
            <p className="text-slate-600">Kelola daftar Unique ID untuk registrasi user.</p>
            <p className="mt-1 text-xs text-slate-500">
              {isRefreshing ? 'Memperbarui data...' : `Terakhir update: ${lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : '-'}`}
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 p-4">
            <h2 className="text-base font-semibold text-heading">Tambah Unique ID</h2>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                className="input-field max-w-sm"
                placeholder="Tambah Unique ID manual"
                value={newUniqueId}
                onChange={(event) => setNewUniqueId(event.target.value)}
              />
              <button onClick={handleAddUniqueId} className="btn-primary text-sm">Tambah</button>
              <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                {uploading ? 'Importing...' : 'Import Excel'}
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Total Unique ID: {uniqueIds.length} | Tersedia: {uniqueIds.filter((item) => item.is_used === 0).length}
            </p>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-3 pr-4">No</th>
                  <th className="py-3 pr-4">Unique ID</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Tgl Dibuat</th>
                  <th className="py-3 pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {uniqueIds.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-4 pr-4 font-medium text-slate-700">{index + 1}</td>
                    <td className="py-4 pr-4">{item.unique_id}</td>
                    <td className="py-4 pr-4">
                      <span className={`badge ${item.is_used === 1 ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.is_used === 1 ? 'used' : 'available'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                    <td className="py-4 pr-4">
                      <button
                        disabled={item.is_used === 1}
                        onClick={() => handleDelete(item.id, item.unique_id)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        Hapus
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
