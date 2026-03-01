'use strict';

/** Unauthenticated, non-sensitive data (login page branding, page title). */
async function publicRoutes(fastify, { services }) {
    fastify.get('/branding', async (request, reply) => {
        const { site_title, currency } = await services.settings.getPublic();
        reply.header('Cache-Control', 'public, max-age=60');
        return { site_title, currency };
    });
}

module.exports = publicRoutes;
