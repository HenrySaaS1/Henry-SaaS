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
    const locCount = await prisma.location.count({ where: { userId: existing.id } })
    if (locCount === 0) {
      await prisma.location.createMany({
        data: [
          {
            userId: existing.id,
            name: 'Austin — HQ manufacturing',
            city: 'Austin',
            region: 'TX',
            country: 'USA',
            addressLine: '1200 Industrial Blvd',
            isPrimary: true,
          },
          {
            userId: existing.id,
            name: 'Guadalajara — Plant 2',
            city: 'Guadalajara',
            region: 'Jalisco',
            country: 'Mexico',
            addressLine: 'Parque Industrial Sur',
            isPrimary: false,
          },
          {
            userId: existing.id,
            name: 'Cork — EMEA finishing',
            city: 'Cork',
            region: 'Munster',
            country: 'Ireland',
            addressLine: 'Unit 4, Business Park',
            isPrimary: false,
          },
        ],
      })
      console.log('Seed: added multi-site locations for existing demo user.')
    } else {
      console.log('Seed skipped: demo user already exists.')
    }
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
      locations: {
        create: [
          {
            name: 'Austin — HQ manufacturing',
            city: 'Austin',
            region: 'TX',
            country: 'USA',
            addressLine: '1200 Industrial Blvd',
            isPrimary: true,
          },
          {
            name: 'Guadalajara — Plant 2',
            city: 'Guadalajara',
            region: 'Jalisco',
            country: 'Mexico',
            addressLine: 'Parque Industrial Sur',
            isPrimary: false,
          },
          {
            name: 'Cork — EMEA finishing',
            city: 'Cork',
            region: 'Munster',
            country: 'Ireland',
            addressLine: 'Unit 4, Business Park',
            isPrimary: false,
          },
        ],
      },
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
