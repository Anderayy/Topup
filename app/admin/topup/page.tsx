import { requireAdminSession } from '../../../lib/admin-session'
import AdminTopupClient from './AdminTopupClient'

export default function AdminTopupPage() {
  requireAdminSession()

  return <AdminTopupClient />
}
