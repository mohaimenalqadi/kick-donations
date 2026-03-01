'use strict';

const { badRequest } = require('../lib/errors');
const S = require('./schemas');

/** Admin-only user management. */
async function userRoutes(fastify, { services }) {
    const { users, audit } = services;

    fastify.addHook('preHandler', fastify.authenticate);
    fastify.addHook('preHandler', fastify.requireRole('admin'));

    fastify.get('/', async () => ({ users: await users.list() }));

    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password', 'role'],
                additionalProperties: false,
                properties: { username: S.username, password: S.newPassword, role: S.role },
            },
        },
    }, async (request, reply) => {
        const user = await users.create(request.body);
        await audit.record(request.user.id, 'create_user', { target_id: user.id, username: user.username, role: user.role });
        reply.code(201);
        return { success: true, user };
    });

    fastify.patch('/:id', {
        schema: {
            params: S.idParams,
            body: {
                type: 'object',
                additionalProperties: false,
                minProperties: 1,
                properties: { password: S.newPassword, role: S.role },
            },
        },
    }, async (request) => {
        const { id } = request.params;
        if (id === request.user.id && request.body.role) {
            throw badRequest('لا يمكنك تغيير صلاحيتك بنفسك');
        }
        const result = await users.update(id, request.body);
        await audit.record(request.user.id, 'update_user', { target_id: id, updated_fields: result.changed });
        return { success: true, user: result.user };
    });

    fastify.post('/:id/revoke-sessions', { schema: { params: S.idParams } }, async (request) => {
        await users.revokeSessions(request.params.id);
        await audit.record(request.user.id, 'revoke_sessions', { target_id: request.params.id });
        return { success: true };
    });

    fastify.delete('/:id', { schema: { params: S.idParams } }, async (request) => {
        const { id } = request.params;
        if (id === request.user.id) throw badRequest('لا يمكنك حذف حسابك الخاص');
        const removed = await users.remove(id);
        await audit.record(request.user.id, 'delete_user', { target_id: id, username: removed.username });
        return { success: true, message: 'تم حذف المستخدم بنجاح' };
    });
}

module.exports = userRoutes;
