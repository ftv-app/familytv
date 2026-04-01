/**
 * Simple in-memory rate limiter with TTL
 * Used for per-user sync event rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp when the window resets
}

const storage = new Map<string, RateLimitEntry>();

// For testing: reset all rate limit state
export function resetRateLimitStorage(): void {
  storage.clear();
}

/**
 * Check if an action is allowed under the rate limit
 * @param key Unique key for the rate limit (e.g., userId)
 * @param maxEvents Maximum events allowed per window
 * @param windowMs Window size in milliseconds
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  maxEvents: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = storage.get(key);

  // No entry or window has expired
  if (!entry || now >= entry.resetAt) {
    storage.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxEvents - 1,
      resetAt: now + windowMs,
    };
  }

  // Within window, check count - must be STRICTLY GREATER than maxEvents to reject
  // This means exactly maxEvents calls are allowed (e.g., 10 calls if max is 10)
  if (entry.count > maxEvents) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  // After increment, if we've exceeded, reject
  if (entry.count > maxEvents) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxEvents - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  key: string,
  maxEvents: number,
  windowMs: number
): { remaining: number; resetAt: number; isLimited: boolean } {
  const now = Date.now();
  const entry = storage.get(key);

  if (!entry || now >= entry.resetAt) {
    return {
      remaining: maxEvents,
      resetAt: now + windowMs,
      isLimited: false,
    };
  }

  return {
    remaining: Math.max(0, maxEvents - entry.count),
    resetAt: entry.resetAt,
    isLimited: entry.count >= maxEvents,
  };
}

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of storage.entries()) {
    if (now >= entry.resetAt) {
      storage.delete(key);
    }
  }
}, 5 * 60 * 1000);
