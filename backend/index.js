import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'
import { signUserToken, readBearerUserId } from './lib/authTokens.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

function locationToClient(l) {
  return {
    id: l.id,
    name: l.name,
    addressLine: l.addressLine,
    city: l.city,
    region: l.region,
    country: l.country,
    isPrimary: Boolean(l.isPrimary),
  }
}

function userToClient(u, locations = []) {
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
    locations: locations.map(locationToClient),
  }
}

async function ensureDefaultLocation(user) {
  const n = await prisma.location.count({ where: { userId: user.id } })
  if (n === 0) {
    await prisma.location.create({
      data: {
        userId: user.id,
        name: `${user.company} — Main site`,
        isPrimary: true,
      },
    })
  }
}

async function clientUserPayload(user) {
  await ensureDefaultLocation(user)
  const locations = await prisma.location.findMany({
    where: { userId: user.id },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  })
  return userToClient(user, locations)
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
  } catch {
    res.status(500).json({ ok: false, message: 'Could not verify email.' })
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
        locations: {
          create: [{ name: `${companyName} — Main site`, isPrimary: true }],
        },
      },
    })
    const token = signUserToken(user.id)
    const payload = await clientUserPayload(user)
    res.status(201).json({
      ok: true,
      token,
      user: payload,
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
    const payload = await clientUserPayload(refreshed)
    res.json({ ok: true, token, user: payload })
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
    const payload = await clientUserPayload(user)
    res.json({ ok: true, user: payload })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, message: 'Could not load profile.' })
  }
})

app.post('/api/locations', async (req, res) => {
  const userId = readBearerUserId(req)
  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Not signed in.' })
  }
  const { name, addressLine, city, region, country, isPrimary } = req.body || {}
  const nameTrim = String(name || '').trim()
  if (!nameTrim || nameTrim.length > 120) {
    return res.status(400).json({ ok: false, message: 'Location name is required (max 120 characters).' })
  }

  try {
    if (isPrimary === true) {
      await prisma.location.updateMany({
        where: { userId },
        data: { isPrimary: false },
      })
    }
    await prisma.location.create({
      data: {
        userId,
        name: nameTrim,
        addressLine: addressLine ? String(addressLine).trim().slice(0, 200) : null,
        city: city ? String(city).trim().slice(0, 100) : null,
        region: region ? String(region).trim().slice(0, 100) : null,
        country: country ? String(country).trim().slice(0, 100) : null,
        isPrimary: Boolean(isPrimary),
      },
    })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Session invalid.' })
    }
    const payload = await clientUserPayload(user)
    res.status(201).json({ ok: true, user: payload })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, message: 'Could not add location.' })
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

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
