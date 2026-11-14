'use strict';

/**
 * Default tier definitions. These are only used when the `tier_settings`
 * table is empty or unreachable — the database is the single source of truth.
 *
 * `max_amount: null` means "no upper bound". The special 50 LYD tier matches
 * exactly 50, so 51+ falls back to tier6 (matching the historical behaviour).
 */
const DEFAULT_TIERS = Object.freeze([
    { tier_key: 'tier1', label: 'بسيط', min_amount: 1, max_amount: null, duration: 10000, color: '#10b981', volume: 80 },
    { tier_key: 'tier2', label: 'فضي', min_amount: 5, max_amount: null, duration: 15000, color: '#3b82f6', volume: 80 },
    { tier_key: 'tier3', label: 'ذهبي', min_amount: 10, max_amount: null, duration: 30000, color: '#f59e0b', volume: 80 },
    { tier_key: 'tier4', label: 'بلاتيني', min_amount: 20, max_amount: null, duration: 45000, color: '#8b5cf6', volume: 80 },
    { tier_key: 'tier5', label: 'ملكي', min_amount: 30, max_amount: null, duration: 60000, color: '#ef4444', volume: 80 },
    { tier_key: 'tier6', label: 'أسطوري', min_amount: 40, max_amount: null, duration: 90000, color: '#e879f9', volume: 80 },
    { tier_key: 'tier_50', label: 'الخمسين الخارقة', min_amount: 50, max_amount: 50, duration: 120000, color: '#ff007f', volume: 80 },
]);

const TIER_KEYS = DEFAULT_TIERS.map((t) => t.tier_key);

/** Normalises a DB row (handles numeric strings and a missing max_amount column). */
function normalizeTier(row) {
    const min = Number(row.min_amount);
    let max = row.max_amount === undefined || row.max_amount === null || row.max_amount === ''
        ? null
        : Number(row.max_amount);
    // Back-compat: before migration 001 there was no max_amount column.
    if (row.max_amount === undefined && row.tier_key === 'tier_50') max = min;
    return {
        ...row,
        min_amount: min,
        max_amount: max,
        duration: Number(row.duration) || 10000,
        volume: row.volume === undefined || row.volume === null ? 80 : Number(row.volume),
    };
}

/**
 * Picks the tier for an amount: the highest `min_amount` that the amount
 * reaches, skipping tiers whose `max_amount` it exceeds.
 * @param {number} amount
 * @param {Array<object>} tiers
 */
function resolveTier(amount, tiers) {
    const n = Number(amount);
    const list = (tiers && tiers.length ? tiers : DEFAULT_TIERS).map(normalizeTier);
    const sorted = [...list].sort((a, b) => b.min_amount - a.min_amount);
    const match = sorted.find((t) => n >= t.min_amount && (t.max_amount === null || n <= t.max_amount));
    return match || sorted[sorted.length - 1];
}

module.exports = { DEFAULT_TIERS, TIER_KEYS, normalizeTier, resolveTier };
