export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import pool from '../../../../lib/db'
import { comparePassword, signAdminToken, signUserToken } from '../../../../lib/auth'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { getClientIp, normalizeEmail, normalizePhone } from '../../../../lib/security'

function shouldUseSecureCookie(request: Request) {
  if (process.env.COOKIE_SECURE) {
    return process.env.COOKIE_SECURE === 'true'
  }
  const forwardedProto = request.headers.get('x-forwarded-proto')
  return forwardedProto === 'https' || new URL(request.url).protocol === 'https:'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role } = body
    const ip = getClientIp(request)
    const secureCookie = shouldUseSecureCookie(request)

    if (role === 'admin') {
      const email = normalizeEmail(body?.email)
      const password = String(body?.password || '')
      if (!email || !password) {
        return NextResponse.json({ message: 'Email dan password wajib diisi.' }, { status: 400 })
      }

      const limit = checkRateLimit(`login:admin:${ip}:${email}`, 10, 15 * 60 * 1000)
      if (!limit.allowed) {
        return NextResponse.json({ message: `Terlalu banyak percobaan login admin. Coba lagi ${limit.retryAfterSec} detik.` }, { status: 429 })
      }

      const [rows] = await pool.execute('SELECT id, email, password_hash FROM admins WHERE email = ?', [email])
      const admin = (rows as any[])[0]
      if (!admin || !comparePassword(password, admin.password_hash)) {
        return NextResponse.json({ message: 'Email atau Password salah.' }, { status: 401 })
      }

      const token = signAdminToken({ id: admin.id, email: admin.email })
      const response = NextResponse.json({ message: 'Login admin berhasil.' })
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        path: '/',
        secure: secureCookie,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7
      })

      return response
    }

    const loginId = String(body?.loginId || '').trim()
    const password = String(body?.password || '')
    if (!loginId || !password) {
      return NextResponse.json({ message: 'Email/No. Telepon dan password wajib diisi.' }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(loginId)
    const normalizedPhone = normalizePhone(loginId)
    const lookupPhone = normalizedPhone || '__invalid_phone__'
    const limit = checkRateLimit(`login:user:${ip}:${normalizedEmail || lookupPhone}`, 10, 15 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json({ message: `Terlalu banyak percobaan login. Coba lagi ${limit.retryAfterSec} detik.` }, { status: 429 })
    }

    const [rows] = await pool.execute(
      'SELECT id, unique_id, password_hash FROM users WHERE email = ? OR phone_number = ?',
      [normalizedEmail, lookupPhone]
    )
    const user = (rows as any[])[0]
    if (!user || !comparePassword(password, user.password_hash)) {
      return NextResponse.json({ message: 'Email/No. Telepon atau Password salah.' }, { status: 401 })
    }

    const token = signUserToken({ id: user.id, unique_id: user.unique_id })
    const response = NextResponse.json({ message: 'Login berhasil.' })
    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      secure: secureCookie,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7
    })
    return response
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
