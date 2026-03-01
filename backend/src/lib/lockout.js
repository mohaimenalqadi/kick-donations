'use strict';

/**
 * In-memory brute-force protection keyed by username.
 * After `maxAttempts` failures within `windowMs` the key is locked for
 * `lockMs`. Suitable for a single instance; move to Redis when scaling out.
 */
function createLockout({ maxAttempts = 5, windowMs = 15 * 60_000, lockMs = 15 * 60_000 } = {}) {
    const entries = new Map();

    function prune(now) {
        if (entries.size < 5000) return;
        for (const [k, e] of entries) if (e.lockedUntil < now && now - e.first > windowMs) entries.delete(k);
    }

    return {
        /** @returns {number} ms remaining in lock, 0 when not locked */
        lockedFor(key, now = Date.now()) {
            const e = entries.get(key);
            return e && e.lockedUntil > now ? e.lockedUntil - now : 0;
        },
        fail(key, now = Date.now()) {
            prune(now);
            let e = entries.get(key);
            if (!e || now - e.first > windowMs) e = { count: 0, first: now, lockedUntil: 0 };
            e.count += 1;
            if (e.count >= maxAttempts) e.lockedUntil = now + lockMs;
            entries.set(key, e);
        },
        reset(key) {
            entries.delete(key);
        },
    };
}

module.exports = { createLockout };
