import { DEFAULT_PRODUCT_IDS } from './productCatalog.js'

/**
 * Pre-provisioned tenant logins for demos and pilots.
 * Replace with IdP / API auth and hashed secrets in production.
 */
export const BUILT_IN_CLIENTS = [
  {
    email: 'ops@harlandmedical.com',
    password: 'HarlandMed#2026',
    company: 'Harland Medical Systems',
    slug: 'harland',
    products: DEFAULT_PRODUCT_IDS,
    planId: 'premium',
  },
]

export function authenticateBuiltIn(email, password) {
  const key = email.trim().toLowerCase()
  const row = BUILT_IN_CLIENTS.find(
    (c) => c.email.toLowerCase() === key && c.password === password,
  )
  if (!row) return null
  return {
    email: row.email,
    company: row.company,
    slug: row.slug,
    products: Array.isArray(row.products) ? row.products : DEFAULT_PRODUCT_IDS,
    planId: typeof row.planId === 'string' ? row.planId : null,
  }
}
