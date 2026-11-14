'use strict';

const fp = require('fastify-plugin');
const { forbidden } = require('../lib/errors');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'x-requested-with';

/**
 * Transport-level security:
 *  - CORS restricted to FRONTEND_URL (comma-separated list).
 *  - Security headers via helmet (the API serves JSON only, so a strict CSP).
 *  - Global rate limit.
 *  - CSRF defence for cookie-authenticated requests: every state-changing
 *    request must (a) come from an allowed Origin when one is sent and
 *    (b) carry a custom header, which browsers cannot add cross-site without
 *    a CORS preflight that we reject. Routes authenticated by API key opt out
 *    with `config: { csrf: false }`.
 */
async function securityPlugin(fastify, { config }) {
    const allowed = new Set(config.allowedOrigins);

    await fastify.register(require('@fastify/helmet'), {
        contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
        crossOriginResourcePolicy: { policy: 'same-site' },
        hsts: config.isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
    });

    await fastify.register(require('@fastify/cors'), {
        origin: (origin, cb) => {
            // Same-origin / server-to-server requests have no Origin header.
            if (!origin || allowed.has(origin)) return cb(null, true);
            return cb(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', CSRF_HEADER, 'Idempotency-Key', 'X-Api-Key', 'X-Overlay-Key'],
        maxAge: 600,
    });

    await fastify.register(require('@fastify/rate-limit'), {
        global: true,
        max: 300,
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, ctx) => ({
            statusCode: 429,
            error: 'محاولات كثيرة، حاول مرة أخرى بعد قليل',
            code: 'RATE_LIMITED',
            retryAfter: ctx.after,
        }),
    });

    fastify.addHook('onRequest', async (request) => {
        if (SAFE_METHODS.has(request.method)) return;
        if (request.routeOptions.config?.csrf === false) return;

        const origin = request.headers.origin;
        if (origin && !allowed.has(origin)) throw forbidden('مصدر الطلب غير مسموح', 'BAD_ORIGIN');
        if (!request.headers[CSRF_HEADER]) throw forbidden('طلب غير صالح', 'CSRF');
    });
}

module.exports = fp(securityPlugin, { name: 'security' });
