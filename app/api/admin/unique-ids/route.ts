export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../lib/db'
import { verifyAdminToken } from '../../../../lib/auth'
import { writeAdminAudit } from '../../../../lib/audit'

function ensureAdmin() {
  const token = cookies().get('admin_token')?.value
  if (!token) throw new Error('Unauthorized')
  return verifyAdminToken(token)
}

export async function GET() {
  try {
    ensureAdmin()
    const [rows] = await pool.execute(
      'SELECT id, unique_id, is_used, created_at FROM unique_ids ORDER BY created_at DESC'
    )
    return NextResponse.json({ uniqueIds: rows })
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = ensureAdmin()
    const body = await request.json()
    const rawUniqueId = typeof body?.uniqueId === 'string' ? body.uniqueId.trim() : ''
    if (!rawUniqueId) {
      return NextResponse.json({ message: 'Unique ID wajib diisi.' }, { status: 400 })
    }
    if (rawUniqueId.length > 50) {
      return NextResponse.json({ message: 'Unique ID terlalu panjang.' }, { status: 400 })
    }
    if (!/^[A-Za-z0-9_-]+$/.test(rawUniqueId)) {
      return NextResponse.json({ message: 'Unique ID hanya boleh huruf, angka, _ atau -.' }, { status: 400 })
    }

    await pool.execute(
      'INSERT INTO unique_ids (unique_id, is_used) VALUES (?, 0)',
      [rawUniqueId]
    )
    await writeAdminAudit({
      adminId: (admin as any).id,
      action: 'create_unique_id',
      targetType: 'unique_id',
      targetId: rawUniqueId,
      detail: 'manual create'
    })
    return NextResponse.json({ message: 'Unique ID berhasil ditambahkan.' })
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('duplicate')) {
      return NextResponse.json({ message: 'Unique ID sudah ada.' }, { status: 409 })
    }
    return NextResponse.json({ message: error?.message === 'Unauthorized' ? 'Unauthorized' : 'Gagal menambahkan Unique ID.' }, { status: error?.message === 'Unauthorized' ? 401 : 500 })
  }
}
