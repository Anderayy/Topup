import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyEdgeJwt } from './lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/topup')) {
    const token = request.cookies.get('token')?.value
    const isValid = token ? await verifyEdgeJwt(token, process.env.JWT_SECRET || '') : false
    if (!isValid) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value
    const isValid = token ? await verifyEdgeJwt(token, process.env.JWT_ADMIN_SECRET || '') : false
    if (!isValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/topup', '/admin/:path*']
}
