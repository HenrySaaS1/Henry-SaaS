import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/** Seed + paths (replaces deprecated `prisma` key in package.json). In Prisma 6, DB URL stays in schema.prisma. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
})
