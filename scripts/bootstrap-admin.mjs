import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index < 1) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'))

  const adminEmail = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase()
  const adminPassword = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || '')
  if (!adminEmail || !adminPassword) {
    console.error('BOOTSTRAP_ADMIN_EMAIL dan BOOTSTRAP_ADMIN_PASSWORD wajib diisi.')
    process.exit(1)
  }
  if (adminPassword.length < 8) {
    console.error('Password admin minimal 8 karakter.')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME
  })

  try {
    const hash = bcrypt.hashSync(adminPassword, 10)
    await connection.execute(
      'INSERT INTO admins (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      [adminEmail, hash]
    )
    console.log(`Admin bootstrap selesai untuk ${adminEmail}`)
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error?.message || 'Gagal bootstrap admin.')
  process.exit(1)
})
