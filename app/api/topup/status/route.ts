export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../lib/db'
import { verifyUserToken } from '../../../../lib/auth'

export async function GET(request: Request) {
  const token = cookies().get('token')?.value
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const refId = String(searchParams.get('ref_id') || '').trim()
  if (!refId) {
    return NextResponse.json({ message: 'ref_id wajib diisi.' }, { status: 400 })
  }

  try {
    const payload = verifyUserToken(token)
    const [rows] = await pool.execute(
      `SELECT gateway_status, status, callback_received_at
       FROM topup_requests
       WHERE user_id = ? AND gateway_ref_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [payload.id, refId]
    )

    const topup = (rows as Array<{ gateway_status: string | null; status: string; callback_received_at: string | null }>)[0]
    if (!topup) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        gateway_status: topup.gateway_status || 'PENDING',
        status: topup.status,
        callback_received_at: topup.callback_received_at
      }
    })
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}

