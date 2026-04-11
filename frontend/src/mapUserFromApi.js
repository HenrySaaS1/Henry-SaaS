import { DEFAULT_PRODUCT_IDS } from './productCatalog.js'

/** Normalize `/api/auth/me` and auth responses into client `user` shape. */
export function mapUserFromApi(user) {
  if (!user || typeof user.email !== 'string' || !user.email.trim()) return null
  const company =
    typeof user.company === 'string' && user.company.trim() ? user.company.trim() : 'Workspace'
  return {
    email: user.email.trim().toLowerCase(),
    company,
    slug: typeof user.slug === 'string' ? user.slug : 'generic',
    products:
      Array.isArray(user.products) && user.products.length > 0 ? user.products : DEFAULT_PRODUCT_IDS,
    planId:
      typeof user.planId === 'string' && ['basic', 'plus', 'premium'].includes(user.planId)
        ? user.planId
        : null,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : null,
    lastLoginAt: typeof user.lastLoginAt === 'string' ? user.lastLoginAt : null,
  }
}
