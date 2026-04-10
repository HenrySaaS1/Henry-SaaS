import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

/** Same default module ids as frontend `productCatalog.js` */
const DEFAULT_PRODUCT_IDS = ['core', 'factory-analytics', 'automation', 'myhenry']

const prisma = new PrismaClient()

async function main() {
  const email = 'ops@harlandmedical.com'
  const password = 'HarlandMed#2026'
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Seed skipped: demo user already exists.')
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      company: 'Harland Medical Systems',
      slug: 'harland',
      planId: 'premium',
      productIds: JSON.stringify([...DEFAULT_PRODUCT_IDS]),
    },
  })
  console.log('Seeded demo tenant:', email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
