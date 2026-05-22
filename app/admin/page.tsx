import { redirect } from 'next/navigation'

const BASE_PATH = (process.env.NEXT_PUBLIC_APP_BASE_PATH || '').replace(/\/$/, '')

export default function AdminPage() {
  redirect(`${BASE_PATH}/admin/login`)
}
