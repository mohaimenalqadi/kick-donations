'use strict';

const { unwrap, notFound } = require('../lib/errors');
const { DEFAULT_TIERS, TIER_KEYS, normalizeTier, resolveTier } = require('../utils/tiers');

const CACHE_TTL_MS = 60_000;

/**
 * Tier configuration backed by `tier_settings`, with a short in-memory cache.
 * The server is the only place a donation's tier is decided, so the dashboard
 * preview, the stored tier and the overlay always agree.
 */
function createTierService({ db, log }) {
    let cache = null;
    let cachedAt = 0;

    function sortTiers(list) {
        return [...list].sort((a, b) => {
            const ia = TIER_KEYS.indexOf(a.tier_key);
            const ib = TIER_KEYS.indexOf(b.tier_key);
            if (ia !== -1 && ib !== -1) return ia - ib;
            return a.min_amount - b.min_amount;
        });
    }

    async function list({ fresh = false } = {}) {
        if (!fresh && cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;
        const { data, error } = await db.from('tier_settings').select('*');
        if (error) {
            log.error({ err: error }, 'failed to load tier_settings, using defaults');
            return cache || DEFAULT_TIERS.map(normalizeTier);
        }
        cache = sortTiers((data && data.length ? data : DEFAULT_TIERS).map(normalizeTier));
        cachedAt = Date.now();
        return cache;
    }

    function invalidate() {
        cache = null;
    }

    async function resolve(amount) {
        return resolveTier(amount, await list());
    }

    /** Adds presentation data the overlay needs to a donation row. */
    async function enrich(donation) {
        const tiers = await list();
        const tier = tiers.find((t) => t.tier_key === donation.tier) || resolveTier(donation.amount, tiers);
        return {
            id: donation.id,
            donor_name: donation.donor_name,
            amount: Number(donation.amount),
            message: donation.message || '',
            status: donation.status,
            created_at: donation.created_at,
            tier: tier.tier_key,
            label: tier.label,
            color: tier.color,
            duration: tier.duration,
            volume: tier.volume,
            background_url: tier.background_url || null,
            sound_url: tier.sound_url || null,
        };
    }

    async function update(id, patch) {
        const row = unwrap(
            await db
                .from('tier_settings')
                .update({ ...patch, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .maybeSingle()
        );
        if (!row) throw notFound('الفئة غير موجودة');
        invalidate();
        return normalizeTier(row);
    }

    return { list, resolve, enrich, update, invalidate };
}

module.exports = { createTierService };
