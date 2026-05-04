import mysql from 'mysql2/promise'

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

const pool = mysql.createPool({
  host: DB_HOST || 'localhost',
  port: DB_PORT ? Number(DB_PORT) : 3306,
  user: DB_USER || 'root',
  password: DB_PASSWORD || undefined,
  database: DB_NAME || undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default pool
