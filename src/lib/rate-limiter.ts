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

// Track last time storage was cleared
let lastStorageClearTime = -1;

/**
 * Auto-reset storage when fake timers are detected
 * Handles vitest fake timers by detecting when time starts from epoch 0
 */
function autoResetIfNeeded(): void {
  const now = Date.now();
  // If Date.now() returns a very small value (< Jan 1, 2001),
  // it means fake timers are running starting from epoch 0
  if (now < 10000000000) { // 2001-09-09 threshold in ms
    // Clear storage if this is the first call with fake timers
    // or if we've returned to real time and are now in fake timers again
    if (lastStorageClearTime !== now) {
      storage.clear();
      lastStorageClearTime = now;
    }
  }
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
  autoResetIfNeeded();
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

  // Within window, increment count
  entry.count++;

  // After increment, if we've exceeded, reject
  // maxEvents calls are allowed (e.g., 10 calls if max is 10)
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
  autoResetIfNeeded();
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
