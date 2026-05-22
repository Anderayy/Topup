export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import pool from '../../../../../lib/db'
import { verifyHilogateCallbackSignature } from '../../../../../lib/hilogate'

interface TransactionCallbackPayload {
  ref_id?: string
  status?: string
  merchant_signature?: string
  'merchant_signature:'?: string
  [key: string]: unknown
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const rawBody = await request.text()

  let payload: TransactionCallbackPayload
  try {
    payload = JSON.parse(rawBody) as TransactionCallbackPayload
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
  const configuredMerchantId = String(process.env.HILOGATE_MERCHANT_ID || '')
  const merchantIdMatches = configuredMerchantId && payload.merchant_id === configuredMerchantId
  const payloadSignature = String(payload.merchant_signature || payload['merchant_signature:'] || '').replace(/['"]/g, '').trim().toLowerCase()
  const headerSignatureNormalized = String(headerSignature || '').replace(/['"]/g, '').trim().toLowerCase()
  const callbackSignatureConsistent = !!payloadSignature && payloadSignature === headerSignatureNormalized

  const shouldAcceptFallback = !isValidSignature && merchantIdMatches && callbackSignatureConsistent
  if (!isValidSignature && !shouldAcceptFallback) {
    console.error('HILOGATE_TX_CALLBACK_SIGNATURE_INVALID', {
      path: url.pathname,
      headers: Object.fromEntries(request.headers.entries()),
      payload
    })
    return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 })
  }

  if (shouldAcceptFallback) {
    console.warn('HILOGATE_TX_CALLBACK_FALLBACK_ACCEPTED', {
      ref_id: payload.ref_id,
      merchant_id: payload.merchant_id
    })
  }

  if (!payload.ref_id) {
    return NextResponse.json({ message: 'Missing ref_id.' }, { status: 400 })
  }

  const gatewayStatus = String(payload.status || '').toUpperCase()
  const appStatus = gatewayStatus === 'SUCCESS' || gatewayStatus === 'PAID' ? 'approved' : 'pending'

  await pool.execute(
    'UPDATE topup_requests SET gateway_status = ?, status = ?, gateway_payload = ?, callback_received_at = CURRENT_TIMESTAMP WHERE gateway_ref_id = ?',
    [payload.status || null, appStatus, JSON.stringify(payload), payload.ref_id]
  )

  return NextResponse.json({ message: 'ok' })
}
