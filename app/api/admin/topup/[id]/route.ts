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
