'use strict';

const { safeEqual } = require('../lib/crypto');
const { unauthorized } = require('../lib/errors');
const { LIMITS } = require('../utils/validation');
const S = require('./schemas');

const donationBody = {
    type: 'object',
    required: ['donor_name', 'amount'],
    additionalProperties: false,
    properties: {
        donor_name: { type: 'string', minLength: 1, maxLength: 200 },
        amount: { type: 'number', minimum: LIMITS.amountMin, maximum: LIMITS.amountMax },
        message: { type: 'string', maxLength: 1000 },
    },
};

async function donationRoutes(fastify, { services, config }) {
    const { donations, stats, audit, realtime } = services;
    const staff = [fastify.authenticate, fastify.requireRole('admin', 'moderator')];
    const admin = [fastify.authenticate, fastify.requireRole('admin')];

    fastify.get('/', {
        preHandler: staff,
        schema: {
            querystring: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ...S.pagination,
                    status: { type: 'string', enum: ['pending', 'live', 'done'] },
                    tier: { type: 'string', maxLength: 30 },
                    search: { type: 'string', maxLength: 50 },
                    flagged: { type: 'boolean' },
                    from: { type: 'string', format: 'date-time' },
                    to: { type: 'string', format: 'date-time' },
                },
            },
        },
    }, async (request) => {
        const result = await donations.list(request.query);
        return { ...result, connections: realtime.presence() };
    });

    fastify.post('/', { preHandler: staff, schema: { body: donationBody } }, async (request, reply) => {
        const { donation } = await donations.create(request.body, { userId: request.user.id });
        await audit.record(request.user.id, 'create_donation', { donation_id: donation.id, amount: donation.amount, flagged: donation.flagged });
        reply.code(201);
        return { success: true, donation };
    });

    fastify.post('/:id/send', { preHandler: staff, schema: { params: S.idParams } }, async (request) => {
        const donation = await donations.send(request.params.id);
        await audit.record(request.user.id, 'send_donation', { donation_id: donation.id });
        return { success: true, donation };
    });

    fastify.get('/:id/original', { preHandler: admin, schema: { params: S.idParams } }, async (request) => ({
        original: await donations.getOriginal(request.params.id),
    }));

    fastify.post('/:id/approve', { preHandler: admin, schema: { params: S.idParams } }, async (request) => {
        const donation = await donations.approveMessage(request.params.id);
        await audit.record(request.user.id, 'approve_message', { donation_id: donation.id });
        return { success: true, donation };
    });

    fastify.delete('/bulk', {
        preHandler: admin,
        schema: {
            querystring: {
                type: 'object',
                required: ['period'],
                additionalProperties: false,
                properties: { period: { type: 'string', enum: ['today', 'all'] } },
            },
        },
    }, async (request) => {
        const { period } = request.query;
        const deleted = await donations.bulkRemove(period);
        await audit.record(request.user.id, 'bulk_delete_donations', { period, deleted });
        return { success: true, deleted, message: `تم حذف ${period === 'today' ? 'عمليات اليوم' : 'جميع العمليات'} بنجاح (${deleted})` };
    });

    fastify.delete('/:id', { preHandler: admin, schema: { params: S.idParams } }, async (request) => {
        await donations.remove(request.params.id);
        await audit.record(request.user.id, 'delete_donation', { donation_id: request.params.id });
        return { success: true, message: 'تم حذف التبرع' };
    });

    fastify.get('/stats', { preHandler: staff }, async () => ({
        stats: await stats.summary(),
        connections: realtime.presence(),
    }));

    fastify.get('/analytics', {
        preHandler: admin,
        schema: {
            querystring: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' },
                },
            },
        },
    }, async (request) => {
        const end = request.query.end ? new Date(request.query.end) : new Date();
        const start = request.query.start ? new Date(request.query.start) : new Date(end.getTime() - 30 * 86400_000);
        return stats.analytics({ start, end });
    });

    /**
     * POST /api/donations/sms-auto — automation webhook (n8n).
     * Authenticated by X-Api-Key, not by cookie, so CSRF checks do not apply.
     * Send `reference` (e.g. the transfer/SMS id) or an Idempotency-Key header
     * so retries never create the same donation twice.
     */
    fastify.post('/sms-auto', {
        config: { csrf: false, rateLimit: { max: 60, timeWindow: '1 minute' } },
        schema: {
            body: {
                type: 'object',
                required: ['donor_name', 'amount'],
                properties: {
                    ...donationBody.properties,
                    donor_phone: { type: 'string', maxLength: 30 },
                    reference: { type: 'string', minLength: 1, maxLength: 120 },
                },
            },
        },
    }, async (request, reply) => {
        if (!config.smsAutomationKey || !safeEqual(String(request.headers['x-api-key'] || ''), config.smsAutomationKey)) {
            throw unauthorized('مفتاح API غير صالح', 'BAD_API_KEY');
        }
        const idem = request.body.reference || request.headers['idempotency-key'] || null;
        const { donation, duplicate } = await donations.create(
            { donor_name: request.body.donor_name, amount: request.body.amount, message: request.body.message },
            { status: 'live', idempotencyKey: idem ? `sms:${String(idem).slice(0, 120)}` : null }
        );
        if (!duplicate) await audit.record(null, 'sms_auto_donation', { donation_id: donation.id, amount: donation.amount });
        reply.code(duplicate ? 200 : 201);
        return { success: true, duplicate, donation: { id: donation.id, status: donation.status, tier: donation.tier } };
    });
}

module.exports = donationRoutes;
