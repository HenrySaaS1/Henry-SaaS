/**
 * Windows: Prisma often fails with EPERM when renaming query_engine-*.dll.node
 * while another Node process has the engine loaded (e.g. `npm run dev`).
 * Removing `.prisma/client` first avoids the rename-onto-locked-file case.
 */
import { existsSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const clientDir = path.join(root, 'node_modules', '.prisma', 'client')

if (existsSync(clientDir)) {
  try {
    rmSync(clientDir, { recursive: true, force: true })
  } catch (err) {
    console.warn(
      '[prisma-generate] Could not remove node_modules/.prisma/client (stop `npm run dev` / other Node using Prisma, then run npm run db:generate):',
      err.message,
    )
  }
}

const result = spawnSync('npx', ['prisma', 'generate'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  console.error(
    '\nIf you see EPERM on query_engine-windows.dll.node: stop the backend dev server (and any Prisma Studio), then run: npm run db:generate\n',
  )
}

process.exit(result.status ?? 1)
