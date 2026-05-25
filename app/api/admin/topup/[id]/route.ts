export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../../lib/db'
import { verifyAdminToken } from '../../../../../lib/auth'
import { writeAdminAudit } from '../../../../../lib/audit'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('admin_token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = verifyAdminToken(token)
    const body = await request.json()
    const { status, notes } = body
    const allowed = ['pending', 'approved', 'rejected']
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 })
    }
    const requestId = Number(params.id)
    if (!requestId) {
      return NextResponse.json({ message: 'ID request tidak valid.' }, { status: 400 })
    }

    await pool.execute(
      'UPDATE topup_requests SET status = ?, notes = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes || null, requestId]
    )
    await writeAdminAudit({
      adminId: (admin as any).id,
      action: 'update_topup_status',
      targetType: 'topup_request',
      targetId: String(requestId),
      detail: `status=${status}; notes=${String(notes || '').slice(0, 200)}`
    })

    return NextResponse.json({ message: 'Status top up diperbarui.' })
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('admin_token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let admin: { id: number; email: string }
  try {
    admin = verifyAdminToken(token)
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const requestId = Number(params.id)
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ message: 'ID request tidak valid.' }, { status: 400 })
  }

  try {
    const [rows] = await pool.execute(
      `SELECT tr.id, tr.gateway_ref_id, tr.amount, u.unique_id
       FROM topup_requests tr
       JOIN users u ON tr.user_id = u.id
       WHERE tr.id = ?`,
      [requestId]
    )
    const topup = (rows as Array<{ id: number; gateway_ref_id: string | null; amount: string; unique_id: string }>)[0]
    if (!topup) {
      return NextResponse.json({ message: 'Request top up tidak ditemukan.' }, { status: 404 })
    }

    await pool.execute('DELETE FROM topup_requests WHERE id = ?', [requestId])
    try {
      await writeAdminAudit({
        adminId: admin.id,
        action: 'delete_topup_request',
        targetType: 'topup_request',
        targetId: String(requestId),
        detail: `unique_id=${topup.unique_id}; amount=${topup.amount}; gateway_ref_id=${topup.gateway_ref_id || '-'}`
      })
    } catch (error) {
      console.error('ADMIN_DELETE_TOPUP_AUDIT_ERROR', error)
    }

    return NextResponse.json({ message: 'Request top up berhasil dihapus.' })
  } catch (error) {
    console.error('ADMIN_DELETE_TOPUP_ERROR', error)
    return NextResponse.json({ message: 'Gagal menghapus request top up.' }, { status: 500 })
  }
}
