import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'
import { signUserToken, readBearerUserId } from './lib/authTokens.js'
import { assertProductionEnv } from './lib/productionEnv.js'

dotenv.config()
assertProductionEnv()

const app = express()
const PORT = Number(process.env.PORT) || 5000

// Azure App Service sits behind a reverse proxy
app.set('trust proxy', 1)

const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN
    : process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

function userToClient(u) {
  let products = []
  try {
    products = JSON.parse(u.productIds)
    if (!Array.isArray(products)) products = []
  } catch {
    products = []
  }
  return {
    email: u.email,
    company: u.company,
    slug: u.slug,
    products,
    planId: u.planId,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    lastLoginAt:
      u.lastLoginAt instanceof Date ? u.lastLoginAt.toISOString() : u.lastLoginAt ?? null,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'HENRY backend is running' })
})

app.get('/api/auth/check-email', async (req, res) => {
  const email = String(req.query.email || '')
    .trim()
    .toLowerCase()
  if (!email || !email.includes('@')) {
    return res.json({ available: true })
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    res.json({ available: !existing })
  } catch (err) {
    // DB unreachable (e.g. local Postgres not running): don't block signup; register will surface errors.
    console.error('[check-email]', err)
    res.json({ available: true })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password, company, productIds, planId } = req.body || {}
  const emailNorm = String(email || '')
    .trim()
    .toLowerCase()
  const companyName = String(company || '').trim()
  const ids = Array.isArray(productIds) ? productIds.filter((x) => typeof x === 'string') : []

  if (!emailNorm || !emailNorm.includes('@')) {
    return res.status(400).json({ ok: false, message: 'Valid email is required.' })
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' })
  }
  if (!companyName) {
    return res.status(400).json({ ok: false, message: 'Organization name is required.' })
  }
  if (ids.length === 0) {
    return res.status(400).json({ ok: false, message: 'Select at least one product module.' })
  }

  const plan =
    planId && ['basic', 'plus', 'premium'].includes(planId) ? planId : null

  try {
    const passwordHash = await bcrypt.hash(String(password), 10)
    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        company: companyName,
        slug: 'generic',
        planId: plan,
        productIds: JSON.stringify(ids),
      },
    })
    const token = signUserToken(user.id)
    res.status(201).json({
      ok: true,
      token,
      user: userToClient(user),
    })
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ ok: false, message: 'This email is already registered.' })
    }
    console.error(e)
    res.status(500).json({ ok: false, message: 'Registration failed.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  const emailNorm = String(email || '')
    .trim()
    .toLowerCase()
  if (!emailNorm || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: emailNorm } })
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Email or password does not match.' })
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) {
      return res.status(401).json({ ok: false, message: 'Email or password does not match.' })
    }
    const refreshed = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    const token = signUserToken(user.id)
    res.json({ ok: true, token, user: userToClient(refreshed) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, message: 'Sign in failed.' })
  }
})

app.get('/api/auth/me', async (req, res) => {
  const userId = readBearerUserId(req)
  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Not signed in.' })
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Session invalid.' })
    }
    res.json({ ok: true, user: userToClient(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, message: 'Could not load profile.' })
  }
})

app.post('/api/contact', async (req, res) => {
  const { name, email, companyName, interest, notes } = req.body || {}
  const nameTrim = String(name || '').trim()
  const emailTrim = String(email || '').trim()
  if (!nameTrim || !emailTrim) {
    return res.status(400).json({ ok: false, message: 'Name and email are required.' })
  }

  const userId = readBearerUserId(req)

  try {
    await prisma.contact.create({
      data: {
        name: nameTrim,
        email: emailTrim,
        companyName: companyName ? String(companyName).trim() : null,
        interest: interest ? String(interest).trim() : null,
        notes: notes ? String(notes).trim() : null,
        userId: userId || null,
      },
    })
    return res.status(201).json({
      ok: true,
      message: 'Thanks — we received your request.',
      data: { name: nameTrim, email: emailTrim, companyName, interest, notes },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, message: 'Could not save your request.' })
  }
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`HENRY API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})

async function shutdown(signal) {
  console.log(`Received ${signal}, closing…`)
  server.close(() => {
    prisma
      .$disconnect()
      .catch(() => {})
      .finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))
