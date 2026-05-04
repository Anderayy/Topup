export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../../lib/db'
import { verifyAdminToken } from '../../../../../lib/auth'
import { writeAdminAudit } from '../../../../../lib/audit'

function ensureAdmin() {
  const token = cookies().get('admin_token')?.value
  if (!token) throw new Error('Unauthorized')
  return verifyAdminToken(token)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const admin = ensureAdmin()
    const id = Number(params.id)
    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 })
    }

    const [rows] = await pool.execute('SELECT id, is_used FROM unique_ids WHERE id = ?', [id])
    const item = (rows as any[])[0]
    if (!item) {
      return NextResponse.json({ message: 'Unique ID tidak ditemukan.' }, { status: 404 })
    }
    if (Number(item.is_used) === 1) {
      return NextResponse.json({ message: 'Unique ID yang sudah dipakai tidak bisa dihapus.' }, { status: 409 })
    }

    const [idRows] = await pool.execute('SELECT unique_id FROM unique_ids WHERE id = ?', [id])
    const old = (idRows as any[])[0]
    await pool.execute('DELETE FROM unique_ids WHERE id = ?', [id])
    await writeAdminAudit({
      adminId: (admin as any).id,
      action: 'delete_unique_id',
      targetType: 'unique_id',
      targetId: String(old?.unique_id || id),
      detail: `delete id=${id}`
    })
    return NextResponse.json({ message: 'Unique ID berhasil dihapus.' })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message === 'Unauthorized' ? 'Unauthorized' : 'Gagal menghapus Unique ID.' }, { status: error?.message === 'Unauthorized' ? 401 : 500 })
  }
}
