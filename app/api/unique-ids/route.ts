export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import pool from '../../../lib/db'

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT unique_id FROM unique_ids WHERE is_used = 0 ORDER BY unique_id ASC'
    )
    return NextResponse.json({ uniqueIds: rows })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
