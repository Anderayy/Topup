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

  try {
    const payload = verifyUserToken(token)
    const [rows] = await pool.execute(
      'SELECT id, unique_id, full_name, bank_name, account_number FROM users WHERE id = ?',
      [payload.id]
    )
    const user = (rows as any[])[0]
    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}
