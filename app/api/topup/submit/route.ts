export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../lib/db'
import { verifyUserToken } from '../../../../lib/auth'

export async function POST(request: Request) {
  const body = await request.json()
  const { amount, paymentMethod } = body
  const MAX_TOPUP_AMOUNT = 9999999999999

  if (!amount || !paymentMethod) {
    return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 })
  }
  const allowedMethods = ['QRIS', 'VA']
  if (!allowedMethods.includes(String(paymentMethod))) {
    return NextResponse.json({ message: 'Metode pembayaran tidak valid.' }, { status: 400 })
  }

  const token = cookies().get('token')?.value
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let payload: { id: number; unique_id: string }
  try {
    payload = verifyUserToken(token)
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const numericAmount = Number(amount)
    if (numericAmount < 10000) {
      return NextResponse.json({ message: 'Nominal minimal 10.000.' }, { status: 400 })
    }
    if (numericAmount > MAX_TOPUP_AMOUNT) {
      return NextResponse.json({ message: 'Nominal maksimal Rp 9.999.999.999.999.' }, { status: 400 })
    }

    const [userRows] = await pool.execute(
      'SELECT bank_name, account_number, full_name FROM users WHERE id = ?',
      [payload.id]
    )
    const user = (userRows as any[])[0]
    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 })
    }

    await pool.execute(
      'INSERT INTO topup_requests (user_id, bank_name, account_number, account_name, amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [payload.id, user.bank_name, user.account_number, user.full_name, numericAmount, paymentMethod]
    )

    return NextResponse.json({ message: 'Request top up berhasil.' })
  } catch {
    return NextResponse.json({ message: 'Gagal submit top up.' }, { status: 500 })
  }
}
