'use strict';

const S = require('./schemas');

/** Audit log viewer (admin). */
async function activityRoutes(fastify, { services }) {
    fastify.get('/', {
        preHandler: [fastify.authenticate, fastify.requireRole('admin')],
        schema: {
            querystring: {
                type: 'object',
                additionalProperties: false,
                properties: { ...S.pagination, action: { type: 'string', maxLength: 50 } },
            },
        },
    }, async (request) => services.audit.list(request.query));
}

module.exports = activityRoutes;
