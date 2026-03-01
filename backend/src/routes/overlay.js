'use strict';

const { safeEqual } = require('../lib/crypto');
const { unauthorized } = require('../lib/errors');

/**
 * Overlay endpoints.
 *
 * The OBS browser source has no login session, so it authenticates with the
 * overlay key (`X-Overlay-Key` header, taken from `/overlay?key=...`).
 * Admin endpoints manage the key and control playback.
 */
async function overlayRoutes(fastify, { services }) {
    const { settings, tiers, donations, realtime, audit } = services;
    const admin = [fastify.authenticate, fastify.requireRole('admin')];
    const staff = [fastify.authenticate, fastify.requireRole('admin', 'moderator')];

    async function requireOverlayKey(request) {
        const expected = await settings.getOverlayKey();
        const given = String(request.headers['x-overlay-key'] || '');
        if (!expected || !safeEqual(given, expected)) throw unauthorized('مفتاح صفحة العرض غير صالح', 'BAD_OVERLAY_KEY');
    }

    /** Everything the overlay needs to (re)start: settings, tiers, live queue, leaderboard. */
    fastify.get('/bootstrap', {
        preHandler: requireOverlayKey,
        config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    }, async () => {
        const [publicSettings, tierList, queue, top] = await Promise.all([
            settings.getPublic(),
            tiers.list(),
            donations.queue(),
            donations.topToday(),
        ]);
        return { settings: publicSettings, tiers: tierList, queue, top };
    });

    fastify.get('/top', { preHandler: requireOverlayKey }, async () => ({ top: await donations.topToday() }));

    fastify.get('/key', { preHandler: admin }, async () => ({ key: await settings.getOverlayKey() }));

    fastify.post('/key/rotate', { preHandler: admin }, async (request) => {
        const key = await settings.rotateOverlayKey();
        await realtime.disconnectOverlays();
        await audit.record(request.user.id, 'rotate_overlay_key', {});
        return { success: true, key };
    });

    fastify.get('/status', { preHandler: staff }, async () => realtime.presence());

    fastify.post('/skip', { preHandler: staff }, async (request) => {
        realtime.skipCurrent();
        await audit.record(request.user.id, 'overlay_skip', { donation_id: realtime.presence().nowPlaying?.donationId });
        return { success: true };
    });

    /** Preview a tier's alert on the overlay without creating a donation. */
    fastify.post('/test', {
        preHandler: admin,
        schema: {
            body: {
                type: 'object',
                required: ['tier_key'],
                additionalProperties: false,
                properties: { tier_key: { type: 'string', maxLength: 30 } },
            },
        },
    }, async (request) => {
        const list = await tiers.list();
        const tier = list.find((t) => t.tier_key === request.body.tier_key) || list[0];
        const amount = tier.max_amount ?? tier.min_amount;
        const enriched = await tiers.enrich({
            id: `test-${Date.now()}`,
            donor_name: 'تجربة التنبيه',
            amount,
            message: 'هذه رسالة تجريبية لمعاينة شكل التنبيه',
            tier: tier.tier_key,
            status: 'live',
            created_at: new Date().toISOString(),
        });
        realtime.showTest(enriched);
        return { success: true };
    });
}

module.exports = overlayRoutes;
