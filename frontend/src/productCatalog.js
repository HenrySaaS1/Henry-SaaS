/** Purchasable HENRY modules — same ids stored on the tenant at signup. */
export const PRODUCT_CATALOG = [
  {
    id: 'core',
    title: 'HENRY Core',
    short: 'Centralized real-time visibility into production.',
  },
  {
    id: 'factory-analytics',
    title: 'Factory Analytics',
    short: 'Advanced analytics, reporting, and trends.',
  },
  {
    id: 'automation',
    title: 'Automation Tools',
    short: 'Smart automation and predictive maintenance.',
  },
  {
    id: 'myhenry',
    title: 'MyHenry',
    short: 'Personalized AI agent for your workflows.',
  },
]

export const DEFAULT_PRODUCT_IDS = PRODUCT_CATALOG.map((p) => p.id)

export function titlesForProductIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const set = new Set(ids)
  return PRODUCT_CATALOG.filter((p) => set.has(p.id)).map((p) => p.title)
}
