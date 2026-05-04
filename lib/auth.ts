import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function getSecret(name: 'JWT_SECRET' | 'JWT_ADMIN_SECRET'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be defined in environment`)
  }
  return value
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

export function signUserToken(payload: { id: number; unique_id: string }) {
  return jwt.sign(payload, getSecret('JWT_SECRET'), { expiresIn: '7d' })
}

export function verifyUserToken(token: string) {
  return jwt.verify(token, getSecret('JWT_SECRET')) as { id: number; unique_id: string }
}

export function signAdminToken(payload: { id: number; email: string }) {
  return jwt.sign(payload, getSecret('JWT_ADMIN_SECRET'), { expiresIn: '7d' })
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, getSecret('JWT_ADMIN_SECRET')) as { id: number; email: string }
}
