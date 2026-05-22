export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import pool from '../../../../../lib/db'
import { verifyHilogateCallbackSignature } from '../../../../../lib/hilogate'

interface WithdrawalCallbackPayload {
  ref_id?: string
  status?: string
  merchant_signature?: string
  'merchant_signature:'?: string
  [key: string]: unknown
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const rawBody = await request.text()

  let payload: WithdrawalCallbackPayload
  try {
    payload = JSON.parse(rawBody) as WithdrawalCallbackPayload
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 })
  }

  const headerSignature =
    request.headers.get('x-signature') ||
    request.headers.get('x-merchant-signature') ||
    request.headers.get('merchant-signature') ||
    request.headers.get('signature')

  const incomingSignature = headerSignature || payload.merchant_signature || payload['merchant_signature:'] || null

  const isValidSignature = verifyHilogateCallbackSignature(url.pathname, rawBody, incomingSignature)
  if (!isValidSignature) {
    console.error('HILOGATE_WD_CALLBACK_SIGNATURE_INVALID', {
      path: url.pathname,
      headers: Object.fromEntries(request.headers.entries()),
      payload
    })
    return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 })
  }

  await pool.execute(
    `INSERT INTO payment_withdrawal_callbacks (gateway_ref_id, gateway_status, payload)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE gateway_status = VALUES(gateway_status), payload = VALUES(payload), callback_received_at = CURRENT_TIMESTAMP`,
    [payload.ref_id || null, payload.status || null, JSON.stringify(payload)]
  )

  return NextResponse.json({ message: 'ok' })
}
