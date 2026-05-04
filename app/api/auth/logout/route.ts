export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout berhasil.' })
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  return response
}
