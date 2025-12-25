const BASE = (import.meta.env.VITE_LARAVEL_BASE || 'http://127.0.0.1:8000') + '/api'

export async function fetchArticles() {
  const res = await fetch(BASE + '/articles')
  if (!res.ok) throw new Error('Failed to fetch articles')
  return res.json()
}
