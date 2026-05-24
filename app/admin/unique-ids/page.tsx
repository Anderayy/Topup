import { requireAdminSession } from '../../../lib/admin-session'
import AdminUniqueIdsClient from './AdminUniqueIdsClient'

export default function AdminUniqueIdsPage() {
  requireAdminSession()

  return <AdminUniqueIdsClient />
}
