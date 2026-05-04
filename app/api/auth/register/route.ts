export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import pool from '../../../../lib/db'
import { hashPassword } from '../../../../lib/auth'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { getClientIp, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../../../../lib/security'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const fullName = String(body?.fullName || '').trim()
    const email = normalizeEmail(body?.email || '')
    const phoneNumber = normalizePhone(body?.phoneNumber || '')
    const bankName = String(body?.bankName || '').trim()
    const accountNumber = String(body?.accountNumber || '').trim()
    const telegramUsername = String(body?.telegramUsername || '').trim().replace(/^@/, '')
    const password = String(body?.password || '')
    const uniqueId = String(body?.uniqueId || '').trim()
    const ip = getClientIp(request)

    if (!fullName || !email || !phoneNumber || !bankName || !accountNumber || !telegramUsername || !password || !uniqueId) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 })
    }
    if (!/^[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) {
      return NextResponse.json({ message: 'Username Telegram tidak valid.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Format email tidak valid.' }, { status: 400 })
    }
    if (!isValidPhone(phoneNumber)) {
      return NextResponse.json({ message: 'Format nomor telepon tidak valid. Gunakan format 08... atau 62...' }, { status: 400 })
    }

    if (String(password).length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter.' }, { status: 400 })
    }
    const limit = checkRateLimit(`register:${ip}:${email}`, 10, 60 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json({ message: `Terlalu banyak percobaan registrasi. Coba lagi ${limit.retryAfterSec} detik.` }, { status: 429 })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [idRows] = await connection.execute(
        'SELECT id, is_used FROM unique_ids WHERE unique_id = ? FOR UPDATE',
        [uniqueId]
      )
      const unique = (idRows as any[])[0]
      if (!unique) {
        await connection.rollback()
        return NextResponse.json({ message: 'Unique ID tidak ditemukan.' }, { status: 400 })
      }
      if (Number(unique.is_used) === 1) {
        await connection.rollback()
        return NextResponse.json({ message: 'Unique ID sudah digunakan.' }, { status: 409 })
      }

      const passwordHash = hashPassword(password)
      await connection.execute(
        'INSERT INTO users (unique_id, full_name, email, phone_number, bank_name, account_number, telegram_username, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uniqueId, fullName, email, phoneNumber, bankName, accountNumber, `@${telegramUsername}`, passwordHash]
      )
      await connection.execute('UPDATE unique_ids SET is_used = 1 WHERE id = ?', [unique.id])

      await connection.commit()
      return NextResponse.json({ message: 'Registrasi berhasil' })
    } catch (error: any) {
      await connection.rollback()
      if (String(error?.message || '').toLowerCase().includes('duplicate')) {
        return NextResponse.json({ message: 'Email atau Unique ID sudah digunakan.' }, { status: 409 })
      }
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    } finally {
      connection.release()
    }
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
