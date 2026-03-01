'use strict';

const { createLockout } = require('../lib/lockout');
const { tooMany, unauthorized, badRequest } = require('../lib/errors');
const { normalizeUsername, publicUser } = require('../services/users');
const S = require('./schemas');

const loginBody = {
    type: 'object',
    required: ['username', 'password'],
    additionalProperties: false,
    properties: {
        username: { type: 'string', minLength: 1, maxLength: 50 },
        password: S.anyPassword,
    },
};

/** @type {import('fastify').FastifyPluginAsync<{ services: any }>} */
async function authRoutes(fastify, { services }) {
    const { users, audit } = services;
    const lockout = createLockout();

    const strictLimit = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

    fastify.post('/login', { schema: { body: loginBody }, config: strictLimit }, async (request, reply) => {
        const key = normalizeUsername(request.body.username);
        const wait = lockout.lockedFor(key);
        if (wait) throw tooMany(`تم قفل الحساب مؤقتاً بسبب محاولات فاشلة. حاول بعد ${Math.ceil(wait / 60000)} دقيقة`, 'LOCKED');

        const user = await users.verifyCredentials(request.body.username, request.body.password);
        if (!user) {
            lockout.fail(key);
            if ((await users.count()) === 0) {
                throw unauthorized('النظام يحتاج لإعداد أولي. أنشئ أول حساب مشرف.', 'FIRST_RUN');
            }
            await audit.record(null, 'login_failed', { username: key, ip: request.ip });
            throw unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة', 'BAD_CREDENTIALS');
        }

        lockout.reset(key);
        fastify.issueSession(reply, user);
        await audit.record(user.id, 'login', { ip: request.ip });
        return { success: true, user: publicUser(user) };
    });

    fastify.post('/setup', {
        config: strictLimit,
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password'],
                additionalProperties: false,
                properties: { username: S.username, password: S.newPassword },
            },
        },
    }, async (request) => {
        await users.createFirstAdmin(request.body);
        await audit.record(null, 'setup_first_admin', { username: normalizeUsername(request.body.username), ip: request.ip });
        return { success: true, message: 'تم إنشاء حساب المشرف بنجاح' };
    });

    fastify.post('/logout', async (request, reply) => {
        fastify.clearSession(reply);
        return { success: true, message: 'تم تسجيل الخروج' };
    });

    fastify.post('/logout-all', { preHandler: fastify.authenticate }, async (request, reply) => {
        await users.revokeSessions(request.user.id);
        fastify.clearSession(reply);
        await audit.record(request.user.id, 'logout_all', { ip: request.ip });
        return { success: true, message: 'تم تسجيل الخروج من جميع الأجهزة' };
    });

    fastify.get('/me', { preHandler: fastify.authenticate }, async (request) => ({ user: request.user }));

    /** Short-lived ticket the dashboard uses to open its socket connection. */
    fastify.get('/socket-ticket', { preHandler: fastify.authenticate }, async (request) => {
        const row = await users.getById(request.user.id);
        return { ticket: fastify.issueTicket(row, 'socket') };
    });

    /** Short-lived ticket for direct-to-API uploads (bypasses the frontend proxy body limit). */
    fastify.get('/upload-ticket', {
        preHandler: [fastify.authenticate, fastify.requireRole('admin')],
    }, async (request) => {
        const row = await users.getById(request.user.id);
        return { ticket: fastify.issueTicket(row, 'upload') };
    });

    fastify.patch('/profile', {
        preHandler: fastify.authenticate,
        config: strictLimit,
        schema: {
            body: {
                type: 'object',
                required: ['current_password'],
                additionalProperties: false,
                properties: { current_password: S.anyPassword, username: S.username, password: S.newPassword },
            },
        },
    }, async (request, reply) => {
        const { current_password, username, password } = request.body;
        if (!username && !password) throw badRequest('لم يتم توفير بيانات للتحديث');

        const row = await users.getById(request.user.id, { fresh: true });
        if (!(await users.verifyPassword(row, current_password))) {
            throw badRequest('كلمة المرور الحالية غير صحيحة', 'BAD_PASSWORD');
        }

        const result = await users.update(request.user.id, { username, password });
        // A password change bumps token_version: re-issue this device's session.
        if (result.row) fastify.issueSession(reply, result.row);
        await audit.record(request.user.id, 'update_profile', { updated_fields: result.changed, ip: request.ip });
        return { success: true, message: 'تم تحديث البيانات بنجاح', user: result.user };
    });
}

module.exports = authRoutes;
