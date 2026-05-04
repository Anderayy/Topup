function toBase64(base64url: string) {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/')
  return padded + '='.repeat((4 - (padded.length % 4)) % 4)
}

function decodeUtf8(base64url: string) {
  return atob(toBase64(base64url))
}

async function verifyHs256(token: string, secret: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [headerPart, payloadPart, signaturePart] = parts
  const data = `${headerPart}.${payloadPart}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const signatureBytes = Uint8Array.from(atob(toBase64(signaturePart)), (c) => c.charCodeAt(0))
  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(data))
}

export async function verifyEdgeJwt(token: string, secret: string) {
  if (!token || !secret) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const payloadRaw = decodeUtf8(parts[1])
    const payload = JSON.parse(payloadRaw) as { exp?: number }
    if (payload.exp && Date.now() >= payload.exp * 1000) return false
    return await verifyHs256(token, secret)
  } catch {
    return false
  }
}
