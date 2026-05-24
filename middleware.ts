import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyEdgeJwt } from './lib/auth-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const appBasePath = (
    process.env.NEXT_PUBLIC_APP_BASE_PATH ||
    process.env.APP_BASE_PATH ||
    process.env.NEXT_PUBLIC_BASE_PATH ||
    process.env.BASE_PATH ||
    '/topup-app'
  ).replace(/\/$/, '')
  const normalizedPathname = pathname.startsWith(`${appBasePath}/`)
    ? pathname.slice(appBasePath.length)
    : pathname
  const redirectUrl = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith(`${appBasePath}/`) ? `${appBasePath}${path}` : path
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (normalizedPathname.startsWith('/topup')) {
    const token = request.cookies.get('token')?.value
    const isValid = token ? await verifyEdgeJwt(token, process.env.JWT_SECRET || '') : false
    if (!isValid) {
      return redirectUrl('/login')
    }
  }

  if (normalizedPathname.startsWith('/admin') && normalizedPathname !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value
    const isValid = token ? await verifyEdgeJwt(token, process.env.JWT_ADMIN_SECRET || '') : false
    if (!isValid) {
      return redirectUrl('/admin/login')
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/topup/:path*', '/admin/:path*', '/topup-app/topup/:path*', '/topup-app/admin/:path*']
}
