import pool from './db'

export async function writeAdminAudit(params: {
  adminId: number
  action: string
  targetType: string
  targetId?: string | null
  detail?: string | null
}) {
  const { adminId, action, targetType, targetId, detail } = params
  await pool.execute(
    'INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
    [adminId, action, targetType, targetId || null, detail || null]
  )
}
