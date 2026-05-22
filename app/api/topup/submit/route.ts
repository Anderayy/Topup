export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../lib/db'
import { verifyUserToken } from '../../../../lib/auth'
import { createHilogateQrisTransaction } from '../../../../lib/hilogate'

export async function POST(request: Request) {
  const body = await request.json()
  const { amount, paymentMethod } = body
  const MAX_TOPUP_AMOUNT = 9999999999999

  if (!amount || !paymentMethod) {
    return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 })
  }

  if (String(paymentMethod).toUpperCase() !== 'QRIS') {
    return NextResponse.json({ message: 'Untuk saat ini metode yang tersedia hanya QRIS.' }, { status: 400 })
  }

  const token = cookies().get('token')?.value
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let payload: { id: number; unique_id: string }
  try {
    payload = verifyUserToken(token)
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || !Number.isInteger(numericAmount)) {
      return NextResponse.json({ message: 'Nominal tidak valid.' }, { status: 400 })
    }
    if (numericAmount < 5000) {
      return NextResponse.json({ message: 'Nominal minimal 5.000.' }, { status: 400 })
    }
    if (numericAmount > MAX_TOPUP_AMOUNT) {
      return NextResponse.json({ message: 'Nominal maksimal Rp 9.999.999.999.999.' }, { status: 400 })
    }

    const [userRows] = await pool.execute(
      'SELECT bank_name, account_number, full_name FROM users WHERE id = ?',
      [payload.id]
    )
    const user = (userRows as Array<{ bank_name: string; account_number: string; full_name: string }>)[0]
    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 })
    }

    const refId = `TU-${payload.unique_id}-${Date.now()}`
    const gatewayResult = await createHilogateQrisTransaction({
      refId,
      amount: numericAmount
    })

    const gatewayData = gatewayResult.data || {}
    const qrisString = typeof gatewayData.data?.qr_string === 'string' ? gatewayData.data.qr_string : null

    await pool.execute(
      `INSERT INTO topup_requests
      (user_id, bank_name, account_number, account_name, amount, payment_method, gateway_ref_id, gateway_transaction_id, gateway_status, gateway_payload, qris_string)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.id,
        user.bank_name,
        user.account_number,
        user.full_name,
        numericAmount,
        'QRIS',
        gatewayData.ref_id || refId,
        gatewayData.id || null,
        gatewayData.status || 'PENDING',
        JSON.stringify(gatewayData),
        qrisString
      ]
    )

    return NextResponse.json({
      message: 'Request top up berhasil dibuat.',
      data: {
        ref_id: gatewayData.ref_id || refId,
        status: gatewayData.status || 'PENDING',
        qr_string: qrisString,
        raw: gatewayData.data || null
      }
    })
  } catch (error) {
    console.error('TOPUP_SUBMIT_ERROR', error)
    const message = error instanceof Error ? error.message : 'Gagal submit top up.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
