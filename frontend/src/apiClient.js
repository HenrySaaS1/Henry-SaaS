const TOKEN_KEY = 'henry_auth_token_v1'

export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL
  if (import.meta.env.PROD && (!fromEnv || !String(fromEnv).trim())) {
    console.error(
      '[henry] VITE_API_URL is missing. Set it in GitHub Actions (secret) for Azure Static Web Apps.',
    )
  }
  return (fromEnv || 'http://localhost:5000').replace(/\/$/, '')
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('henry_session_v1')
}

export async function apiJson(path, { method = 'GET', body, token, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const t = token === undefined ? getToken() : token
  if (t) headers.Authorization = `Bearer ${t}`
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}
