'use strict';

const { unwrap } = require('../lib/errors');
const { randomToken } = require('../lib/crypto');

/** Fields that may be shown to unauthenticated pages (login, overlay). */
const PUBLIC_FIELDS = ['site_title', 'currency', 'tts_enabled', 'tts_voice', 'mute_overlay'];

const CACHE_TTL_MS = 30_000;

/**
 * Single-row `platform_settings` table. `overlay_key` is a secret and is
 * never included in `getPublic()` / `get()` responses.
 */
function createSettingsService({ db }) {
    let cache = null;
    let cachedAt = 0;

    async function getRow({ fresh = false } = {}) {
        if (!fresh && cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;
        const row = unwrap(await db.from('platform_settings').select('*').limit(1).maybeSingle());
        cache = row || {};
        cachedAt = Date.now();
        return cache;
    }

    function pick(row) {
        const out = {};
        for (const k of PUBLIC_FIELDS) if (row[k] !== undefined) out[k] = row[k];
        out.site_title = out.site_title || 'KickPay';
        out.currency = out.currency || 'LYD';
        return out;
    }

    async function getPublic() {
        return pick(await getRow());
    }

    async function update(patch) {
        const current = await getRow({ fresh: true });
        if (!current.id) throw new Error('platform_settings row is missing — run migrations');
        const row = unwrap(
            await db.from('platform_settings').update(patch).eq('id', current.id).select().single()
        );
        cache = row;
        cachedAt = Date.now();
        return pick(row);
    }

    async function getOverlayKey() {
        const row = await getRow();
        return row.overlay_key || null;
    }

    async function rotateOverlayKey() {
        const current = await getRow({ fresh: true });
        const key = randomToken(24);
        unwrap(await db.from('platform_settings').update({ overlay_key: key }).eq('id', current.id));
        cache = null;
        return key;
    }

    return { getPublic, update, getOverlayKey, rotateOverlayKey, PUBLIC_FIELDS };
}

module.exports = { createSettingsService };
