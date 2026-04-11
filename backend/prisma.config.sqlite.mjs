import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/** SQLite for local dev when you skip Docker / Neon / native Postgres. */
export default defineConfig({
  schema: 'prisma/schema.sqlite.prisma',
  migrations: {
    path: 'prisma/migrations_sqlite',
    seed: 'node prisma/seed.js',
  },
})
