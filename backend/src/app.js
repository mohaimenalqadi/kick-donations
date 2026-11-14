'use strict';

const Fastify = require('fastify');
const { createDatabase } = require('./config/database');
const { AppError } = require('./lib/errors');
const { createRealtime } = require('./services/realtime');
const { createAuditService } = require('./services/audit');
const { createTierService } = require('./services/tiers');
const { createSettingsService } = require('./services/settings');
const { createUserService } = require('./services/users');
const { createDonationService } = require('./services/donations');
const { createStatsService } = require('./services/stats');
const pkg = require('../package.json');

const VALIDATION_MESSAGE = 'البيانات المرسلة غير صالحة';

/**
 * Verifies the database has the columns/functions this version needs, so a
 * missing migration is reported clearly instead of as random 500s.
 */
async function checkSchema(db) {
    const probes = [
        ['users.token_version', db.from('users').select('token_version').limit(1)],
        ['donations.flagged/original_message/idempotency_key', db.from('donations').select('flagged, original_message, idempotency_key').limit(1)],
        ['platform_settings.overlay_key', db.from('platform_settings').select('overlay_key').limit(1)],
        ['tier_settings.max_amount', db.from('tier_settings').select('max_amount').limit(1)],
        ['rpc stats_summary', db.rpc('stats_summary', { p_tz: 'UTC' })],
    ];
    const results = await Promise.all(probes.map(async ([name, q]) => [name, (await q).error]));
    return results.filter(([, err]) => err).map(([name, err]) => `${name}: ${err.message}`);
}

/**
 * Builds the Fastify app. Kept separate from `listen()` so tests can use
 * `app.inject()` and so dependencies (db, socket server) can be swapped.
 *
 * @param {object} config        result of loadConfig()
 * @param {{ db?: any, withRealtime?: boolean, logger?: any }} [opts]
 */
async function buildApp(config, opts = {}) {
    const app = Fastify({
        logger: opts.logger ?? {
            level: config.isTest ? 'silent' : 'info',
            redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers["x-api-key"]', 'req.headers["x-overlay-key"]'],
        },
        trustProxy: config.trustProxyHops,
        bodyLimit: 64 * 1024,
        genReqId: () => require('crypto').randomUUID(),
        ajv: { customOptions: { allErrors: false, coerceTypes: 'array', removeAdditional: true, useDefaults: true } },
    });

    const db = opts.db || createDatabase(config);
    const log = app.log;

    // ---- services (composition root) ----
    const users = createUserService({ db });
    const settings = createSettingsService({ db });
    const tiers = createTierService({ db, log });
    const audit = createAuditService({ db, log });
    const stats = createStatsService({ db, config });

    await app.register(require('./plugins/security'), { config });
    await app.register(require('./plugins/auth'), { config, users });

    const realtime = createRealtime({
        httpServer: opts.withRealtime === false ? null : app.server,
        config,
        log,
        verifyTicket: (t) => app.verifySocketTicket(t),
        getOverlayKey: () => settings.getOverlayKey(),
    });
    const donations = createDonationService({ db, tiers, realtime, config });
    realtime.setDisplayedHandler((id) => donations.markDisplayed(id));

    const services = { db, users, settings, tiers, audit, stats, donations, realtime };
    app.decorate('services', services);

    // ---- error handling ----
    app.setErrorHandler((err, request, reply) => {
        if (err.validation) {
            return reply.code(400).send({ error: VALIDATION_MESSAGE, code: 'VALIDATION', details: err.validation.map((v) => `${v.instancePath || v.params?.missingProperty || ''} ${v.message}`.trim()) });
        }
        if (err instanceof AppError) {
            return reply.code(err.statusCode).send({ error: err.message, code: err.code });
        }
        if (err.statusCode === 429) {
            return reply.code(429).send({ error: 'محاولات كثيرة، حاول مرة أخرى بعد قليل', code: 'RATE_LIMITED' });
        }
        if (err.statusCode && err.statusCode < 500) {
            return reply.code(err.statusCode).send({ error: 'طلب غير صالح', code: err.code || 'BAD_REQUEST' });
        }
        request.log.error({ err }, 'unhandled error');
        return reply.code(500).send({ error: 'حدث خطأ في الخادم، حاول مرة أخرى', code: 'INTERNAL', requestId: request.id });
    });

    app.setNotFoundHandler((request, reply) => reply.code(404).send({ error: 'المسار غير موجود', code: 'NOT_FOUND' }));

    // ---- routes ----
    const deps = { services, config, db };
    await app.register(require('./routes/public'), { prefix: '/api/public', ...deps });
    await app.register(require('./routes/auth'), { prefix: '/api/auth', ...deps });
    await app.register(require('./routes/users'), { prefix: '/api/users', ...deps });
    await app.register(require('./routes/donations'), { prefix: '/api/donations', ...deps });
    await app.register(require('./routes/settings'), { prefix: '/api', ...deps });
    await app.register(require('./routes/overlay'), { prefix: '/api/overlay', ...deps });
    await app.register(require('./routes/activity'), { prefix: '/api/activity-logs', ...deps });
    await app.register(require('./routes/uploads'), { prefix: '/api/uploads', ...deps });

    let schemaProblems = null;
    app.decorate('checkSchema', async () => {
        schemaProblems = await checkSchema(db);
        return schemaProblems;
    });

    app.get('/', { config: { rateLimit: false } }, async () => ({ name: 'Kick Donation API', version: pkg.version }));

    app.get('/health', { config: { rateLimit: false } }, async (request, reply) => {
        const started = Date.now();
        const { error } = await db.from('platform_settings').select('id').limit(1);
        const ok = !error && (!schemaProblems || schemaProblems.length === 0);
        reply.code(ok ? 200 : 503);
        return {
            status: ok ? 'ok' : 'degraded',
            database: error ? 'unreachable' : 'ok',
            schema: schemaProblems === null ? 'unchecked' : schemaProblems.length ? 'migration_required' : 'ok',
            latencyMs: Date.now() - started,
            uptimeSec: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        };
    });

    app.addHook('onClose', async () => {
        await realtime.close();
    });

    return app;
}

module.exports = { buildApp };
