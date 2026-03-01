'use strict';

const fp = require('fastify-plugin');
const { unauthorized, forbidden } = require('../lib/errors');

const COOKIE_NAME = 'token';
const SOCKET_TICKET_TTL = '2m';

/**
 * Session handling.
 *
 * - The session JWT lives in an httpOnly cookie only (never in localStorage),
 *   so injected scripts cannot read it.
 * - Each request re-loads the user (30 s cache) so deleted users and role
 *   changes take effect immediately, and `token_version` lets us revoke all
 *   sessions of a user (password change, "log out everywhere", demotion).
 */
async function authPlugin(fastify, { config, users }) {
    await fastify.register(require('@fastify/cookie'));
    await fastify.register(require('@fastify/jwt'), {
        secret: config.jwtSecret,
        cookie: { cookieName: COOKIE_NAME, signed: false },
        sign: { algorithm: 'HS256' },
        verify: { algorithms: ['HS256'] },
    });

    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: config.cookieSecure,
        sameSite: config.cookieSameSite,
    };

    function readToken(request) {
        const header = request.headers.authorization;
        if (header && header.startsWith('Bearer ')) return header.slice(7);
        return request.cookies[COOKIE_NAME] || null;
    }

    /** @param {string|string[]} expectedTypes */
    async function userFromToken(token, expectedTypes) {
        let payload;
        try {
            payload = fastify.jwt.verify(token);
        } catch {
            return null;
        }
        const types = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes];
        if (!types.includes(payload.typ) || !payload.sub) return null;
        const user = await users.getById(payload.sub);
        if (!user) return null;
        if ((user.token_version || 0) !== (payload.tv || 0)) return null;
        return { id: user.id, username: user.username, role: user.role };
    }

    fastify.decorate('authenticate', async function authenticate(request) {
        const token = readToken(request);
        if (!token) throw unauthorized();
        // A route may additionally accept a short-lived ticket of a given type
        // (e.g. uploads, which go directly to the API instead of via the proxy).
        const ticketType = request.routeOptions.config?.ticketType;
        const user = await userFromToken(token, ticketType ? ['access', ticketType] : 'access');
        if (!user) throw unauthorized('جلسة منتهية - يرجى إعادة تسجيل الدخول', 'SESSION_EXPIRED');
        request.user = user;
    });

    /** @param {...('admin'|'moderator')} roles */
    fastify.decorate('requireRole', function requireRole(...roles) {
        return async function roleGuard(request) {
            if (!request.user) throw unauthorized();
            if (!roles.includes(request.user.role)) throw forbidden();
        };
    });

    fastify.decorate('issueSession', function issueSession(reply, user) {
        const token = fastify.jwt.sign(
            { sub: user.id, tv: user.token_version || 0, typ: 'access' },
            { expiresIn: `${config.sessionTtlHours}h` }
        );
        reply.setCookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: config.sessionTtlHours * 3600 });
    });

    fastify.decorate('clearSession', function clearSession(reply) {
        reply.clearCookie(COOKIE_NAME, cookieOptions);
    });

    /**
     * Short-lived, single-purpose token (socket handshake, direct upload).
     * It is never accepted as a session by ordinary routes.
     * @param {object} user DB row (needs token_version)
     * @param {'socket'|'upload'} typ
     */
    fastify.decorate('issueTicket', function issueTicket(user, typ) {
        return fastify.jwt.sign(
            { sub: user.id, tv: user.token_version || 0, typ },
            { expiresIn: typ === 'upload' ? '10m' : SOCKET_TICKET_TTL }
        );
    });

    fastify.decorate('verifySocketTicket', (token) => userFromToken(token, 'socket'));
}

module.exports = fp(authPlugin, { name: 'auth' });
