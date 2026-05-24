import { requireAdminSession } from '../../../lib/admin-session'
import AdminUsersClient from './AdminUsersClient'

export default function AdminUsersPage() {
  requireAdminSession()

  return <AdminUsersClient />
}
