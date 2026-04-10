import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'HENRY backend is running' })
})

app.post('/api/contact', (req, res) => {
  const { name, email, companyName, interest, notes } = req.body
  if (!name || !email) {
    return res.status(400).json({ ok: false, message: 'Name and email are required.' })
  }

  return res.status(201).json({
    ok: true,
    message: 'Lead captured locally.',
    data: { name, email, companyName, interest, notes },
  })
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
