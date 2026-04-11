import { DEFAULT_PRODUCT_IDS } from './productCatalog.js'

const authExplicitlyOff =
  import.meta.env.VITE_BYPASS_AUTH === 'false' || import.meta.env.VITE_BYPASS_AUTH === '0'

/**
 * Skip sign-in: in `npm run dev` this is on by default (preview user).
 * Production builds: off unless `VITE_BYPASS_AUTH=true`.
 * To test real login locally: `VITE_BYPASS_AUTH=false` in `frontend/.env`.
 */
export const AUTH_BYPASS =
  !authExplicitlyOff &&
  (import.meta.env.DEV ||
    import.meta.env.VITE_BYPASS_AUTH === 'true' ||
    import.meta.env.VITE_BYPASS_AUTH === '1')

export function bypassDemoUser() {
  const now = new Date().toISOString()
  return {
    email: 'preview@henry.local',
    company: 'Preview workspace',
    slug: 'preview',
    products: [...DEFAULT_PRODUCT_IDS],
    planId: 'premium',
    createdAt: now,
    lastLoginAt: now,
  }
}
