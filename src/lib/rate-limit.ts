/**
 * Fixed-window rate limiter kept in memory. Good enough for one server
 * process (the assistant guards a paid API key); a multi-instance deployment
 * would move this to a shared store.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  return function check(key: string, now = Date.now()): { ok: boolean; retryAfterMs: number } {
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      windows.set(key, { start: now, count: 1 });
      // Drop stale windows now and then so the map can't grow forever.
      if (windows.size > 10_000) {
        for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
      }
      return { ok: true, retryAfterMs: 0 };
    }
    if (current.count >= limit) {
      return { ok: false, retryAfterMs: current.start + windowMs - now };
    }
    current.count += 1;
    return { ok: true, retryAfterMs: 0 };
  };
}
