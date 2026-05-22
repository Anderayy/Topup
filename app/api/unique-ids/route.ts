export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import pool from '../../../lib/db'

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT unique_id FROM unique_ids WHERE is_used = 0 ORDER BY unique_id ASC'
    )
    return NextResponse.json(
      { uniqueIds: rows },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
