export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../lib/db'
import { verifyAdminToken } from '../../../../lib/auth'

export async function GET(request: Request) {
  const token = cookies().get('admin_token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    verifyAdminToken(token)
    const [rows] = await pool.execute(
      `SELECT tr.id, u.unique_id, u.full_name, u.telegram_username, tr.bank_name, tr.account_number, tr.account_name, tr.amount, tr.payment_method, tr.status, tr.notes, tr.submitted_at
       FROM topup_requests tr
       JOIN users u ON tr.user_id = u.id
       ORDER BY tr.submitted_at DESC`
    )
    return NextResponse.json({ requests: rows })
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}
