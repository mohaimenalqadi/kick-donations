'use strict';

const S = require('./schemas');

const tierPatch = {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    properties: {
        label: { type: 'string', minLength: 1, maxLength: 50 },
        min_amount: { type: 'number', minimum: 0.01, maximum: 10000 },
        max_amount: { type: ['number', 'null'], minimum: 0.01, maximum: 10000 },
        color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        duration: { type: 'integer', minimum: 3000, maximum: 300000 },
        volume: { type: 'integer', minimum: 0, maximum: 100 },
        background_url: S.mediaUrl,
        sound_url: S.mediaUrl,
    },
};

/** Platform & tier configuration (admin). */
async function settingsRoutes(fastify, { services }) {
    const { settings, tiers, audit, realtime } = services;
    const admin = [fastify.authenticate, fastify.requireRole('admin')];
    const staff = [fastify.authenticate, fastify.requireRole('admin', 'moderator')];

    fastify.get('/settings', { preHandler: staff }, async () => ({ settings: await settings.getPublic() }));

    fastify.patch('/settings', {
        preHandler: admin,
        schema: {
            body: {
                type: 'object',
                additionalProperties: false,
                minProperties: 1,
                properties: {
                    site_title: { type: 'string', minLength: 1, maxLength: 40 },
                    currency: { type: 'string', enum: ['LYD', 'USD', 'EUR'] },
                    tts_enabled: { type: 'boolean' },
                    tts_voice: { type: 'string', maxLength: 60 },
                    mute_overlay: { type: 'boolean' },
                },
            },
        },
    }, async (request) => {
        const updated = await settings.update(request.body);
        realtime.settingsChanged(updated);
        await audit.record(request.user.id, 'update_settings', { fields: Object.keys(request.body) });
        return { success: true, settings: updated };
    });

    fastify.get('/tier-settings', { preHandler: staff }, async () => ({ tiers: await tiers.list() }));

    fastify.patch('/tier-settings/:id', { preHandler: admin, schema: { params: S.idParams, body: tierPatch } }, async (request) => {
        const tier = await tiers.update(request.params.id, request.body);
        realtime.tiersChanged(await tiers.list({ fresh: true }));
        await audit.record(request.user.id, 'update_tier', { tier_key: tier.tier_key, fields: Object.keys(request.body) });
        return { success: true, tier };
    });
}

module.exports = settingsRoutes;
