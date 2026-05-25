export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '../../../../../lib/db'
import { verifyAdminToken } from '../../../../../lib/auth'
import { writeAdminAudit } from '../../../../../lib/audit'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('admin_token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const userId = Number(params.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ message: 'ID user tidak valid.' }, { status: 400 })
  }

  let admin: { id: number; email: string }
  try {
    admin = verifyAdminToken(token)
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const connection = await pool.getConnection()
  let committed = false
  try {
    await connection.beginTransaction()

    const [rows] = await connection.execute(
      'SELECT id, unique_id, email, full_name FROM users WHERE id = ? FOR UPDATE',
      [userId]
    )
    const user = (rows as Array<{ id: number; unique_id: string; email: string; full_name: string }>)[0]
    if (!user) {
      await connection.rollback()
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 })
    }

    await connection.execute('DELETE FROM users WHERE id = ?', [userId])
    await connection.execute('UPDATE unique_ids SET is_used = 0 WHERE unique_id = ?', [user.unique_id])
    await connection.commit()
    committed = true

    try {
      await writeAdminAudit({
        adminId: admin.id,
        action: 'delete_user',
        targetType: 'user',
        targetId: String(userId),
        detail: `unique_id=${user.unique_id}; email=${user.email}; full_name=${user.full_name}`
      })
    } catch (error) {
      console.error('ADMIN_DELETE_USER_AUDIT_ERROR', error)
    }

    return NextResponse.json({ message: 'User berhasil dihapus.' })
  } catch (error) {
    if (!committed) {
      await connection.rollback()
    }
    console.error('ADMIN_DELETE_USER_ERROR', error)
    return NextResponse.json({ message: 'Gagal menghapus user.' }, { status: 500 })
  } finally {
    connection.release()
  }
}
