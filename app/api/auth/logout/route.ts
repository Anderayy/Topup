export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

function shouldUseSecureCookie(request: Request) {
  if (process.env.COOKIE_SECURE) {
    return process.env.COOKIE_SECURE === 'true'
  }
  const forwardedProto = request.headers.get('x-forwarded-proto')
  return forwardedProto === 'https' || new URL(request.url).protocol === 'https:'
}

export async function POST(request: Request) {
  const response = NextResponse.json({ message: 'Logout berhasil.' })
  const secureCookie = shouldUseSecureCookie(request)
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    secure: secureCookie,
    sameSite: 'strict',
    maxAge: 0
  })
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    path: '/',
    secure: secureCookie,
    sameSite: 'strict',
    maxAge: 0
  })
  return response
}
