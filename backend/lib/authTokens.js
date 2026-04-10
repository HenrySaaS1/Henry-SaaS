import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me'

export function signUserToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyUserToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload.sub !== 'string') return null
    return payload.sub
  } catch {
    return null
  }
}

export function readBearerUserId(req) {
  const raw = req.headers.authorization
  if (!raw || typeof raw !== 'string') return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  return verifyUserToken(m[1].trim())
}
