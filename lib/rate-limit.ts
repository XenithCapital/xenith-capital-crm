/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Provides burst protection within a single serverless function instance.
 * For distributed rate limiting across Vercel instances, replace with
 * an Upstash Redis-backed solution.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Periodically purge expired entries to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param key     Unique identifier (e.g. IP address or token)
 * @param limit   Maximum number of requests in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
