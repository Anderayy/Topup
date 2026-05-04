export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'
import pool from '../../../../../lib/db'
import { verifyAdminToken } from '../../../../../lib/auth'
import { writeAdminAudit } from '../../../../../lib/audit'

function ensureAdmin() {
  const token = cookies().get('admin_token')?.value
  if (!token) throw new Error('Unauthorized')
  return verifyAdminToken(token)
}

export async function POST(request: Request) {
  try {
    const admin = ensureAdmin()
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'File Excel wajib diupload.' }, { status: 400 })
    }
    if (!/\.(xlsx|xls)$/i.test(file.name || '')) {
      return NextResponse.json({ message: 'Format file harus .xlsx atau .xls.' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'Ukuran file maksimal 2MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any[]>(firstSheet, {
      header: 1,
      raw: false,
      defval: ''
    })

    const uniqueSet = new Set<string>()
    for (const row of rows) {
      const firstCell = row?.[0]
      if (firstCell === undefined || firstCell === null) continue
      const value = String(firstCell).trim()
      if (value && value.toLowerCase() !== 'unique_id') {
        uniqueSet.add(value)
      }
    }

    const uniqueIds = Array.from(uniqueSet)
    if (uniqueIds.length === 0) {
      return NextResponse.json({ message: 'Data Unique ID tidak ditemukan di kolom pertama.' }, { status: 400 })
    }
    if (uniqueIds.length > 5000) {
      return NextResponse.json({ message: 'Maksimal 5000 Unique ID per import.' }, { status: 400 })
    }

    const placeholders = uniqueIds.map(() => '?').join(',')
    const [existingRows] = await pool.query(
      `SELECT unique_id FROM unique_ids WHERE unique_id IN (${placeholders})`,
      uniqueIds
    )
    const existing = new Set((existingRows as any[]).map((row) => String(row.unique_id)))
    const toInsert = uniqueIds.filter((id) => !existing.has(id))

    if (toInsert.length > 0) {
      const values = toInsert.map((item) => [item, 0])
      await pool.query(
        'INSERT INTO unique_ids (unique_id, is_used) VALUES ?',
        [values]
      )
    }
    await writeAdminAudit({
      adminId: (admin as any).id,
      action: 'import_unique_ids',
      targetType: 'unique_id',
      detail: `file=${file.name}; total=${uniqueIds.length}; inserted=${toInsert.length}; skipped=${uniqueIds.length - toInsert.length}`
    })

    return NextResponse.json({
      message: 'Import Unique ID selesai.',
      totalRead: uniqueIds.length,
      inserted: toInsert.length,
      skipped: uniqueIds.length - toInsert.length,
      skippedItems: uniqueIds.filter((id) => existing.has(id)).slice(0, 20)
    })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message === 'Unauthorized' ? 'Unauthorized' : 'Gagal import Excel.' }, { status: error?.message === 'Unauthorized' ? 401 : 500 })
  }
}
