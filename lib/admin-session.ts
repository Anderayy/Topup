import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken } from './auth'

export function requireAdminSession() {
  const token = cookies().get('admin_token')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    return verifyAdminToken(token)
  } catch {
    redirect('/admin/login')
  }
}
