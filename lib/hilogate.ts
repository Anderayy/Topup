import crypto from 'crypto'

const rawBaseUrl = (process.env.HILOGATE_BASE_URL || 'https://app.hilogate.com/api').replace(/\/$/, '')
const HILOGATE_HOST = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl
const HILOGATE_MERCHANT_ID = process.env.HILOGATE_MERCHANT_ID || ''
const HILOGATE_SECRET_KEY = process.env.HILOGATE_SECRET_KEY || ''
const HILOGATE_ENVIRONMENT = (process.env.HILOGATE_ENVIRONMENT || 'sandbox').toLowerCase()

interface CreateTransactionParams {
  refId: string
  amount: number
  expiresAt?: number
}

interface HilogateCreateTransactionResponse {
  code: number | string
  message?: string
  status?: string
  data?: {
    id?: string
    ref_id?: string
    status?: string
    data?: {
      qr_string?: string
      qr_url?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

function buildSignature(requestPath: string, bodyString: string) {
  return crypto
    .createHash('md5')
    .update(`${requestPath}${bodyString}${HILOGATE_SECRET_KEY}`)
    .digest('hex')
}

function buildSignatureBodyOnly(bodyString: string) {
  return crypto
    .createHash('md5')
    .update(`${bodyString}${HILOGATE_SECRET_KEY}`)
    .digest('hex')
}

function ensureConfig() {
  if (!HILOGATE_MERCHANT_ID || !HILOGATE_SECRET_KEY) {
    throw new Error('Konfigurasi Hilogate belum lengkap. Isi HILOGATE_MERCHANT_ID dan HILOGATE_SECRET_KEY.')
  }
}

export function verifyHilogateCallbackSignature(requestPath: string, rawBody: string, incomingSignature?: string | null) {
  if (!incomingSignature) return false
  const normalizedIncoming = incomingSignature.replace(/['"]/g, '').trim().toLowerCase()
  const expectedWithPath = buildSignature(requestPath, rawBody)
  const expectedBodyOnly = buildSignatureBodyOnly(rawBody)
  return normalizedIncoming === expectedWithPath || normalizedIncoming === expectedBodyOnly
}

export async function createHilogateQrisTransaction(params: CreateTransactionParams) {
  ensureConfig()

  const requestPath = '/api/v1/transactions'
  const requestBody: Record<string, unknown> = {
    ref_id: params.refId,
    amount: params.amount,
    method: 'qris'
  }

  if (params.expiresAt) {
    requestBody.expires_at = String(params.expiresAt)
  }

  const bodyString = JSON.stringify(requestBody)
  const signature = buildSignature(requestPath, bodyString)

  const response = await fetch(`${HILOGATE_HOST}${requestPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-ID': HILOGATE_MERCHANT_ID,
      'X-Signature': signature,
      'X-Environment': HILOGATE_ENVIRONMENT,
      'X-Request-ID': params.refId
    },
    body: bodyString,
    cache: 'no-store'
  })

  const raw = await response.text()
  let result: HilogateCreateTransactionResponse | null = null
  try {
    result = JSON.parse(raw) as HilogateCreateTransactionResponse
  } catch {
    result = null
  }

  if (!result) {
    throw new Error(`Hilogate response bukan JSON (HTTP ${response.status}). Body: ${raw.slice(0, 200)}`)
  }

  const numericCode = Number(result.code)
  const normalizedStatus = String(result.status || '').toLowerCase()
  const isBusinessSuccess = [0, 200, 201].includes(numericCode) || normalizedStatus === 'success'

  if (!response.ok || !isBusinessSuccess) {
    throw new Error(result?.message || `Gagal create transaksi Hilogate. HTTP ${response.status}`)
  }

  return result
}
