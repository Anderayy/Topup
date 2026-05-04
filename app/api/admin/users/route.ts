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
      'SELECT id, unique_id, full_name, email, phone_number, bank_name, account_number, telegram_username, status, created_at FROM users ORDER BY created_at DESC'
    )
    return NextResponse.json({ users: rows })
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}
