const { supabase } = require('../config/database');

/**
 * Settings Routes
 */
async function settingsRoutes(fastify, options) {

    /**
     * GET /api/settings
     * Get platform configuration
     */
    fastify.get('/', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .single();

            if (error) throw error;
            return { settings: data };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب الإعدادات' });
        }
    });

    /**
     * PATCH /api/settings
     * Update platform configuration (admin only)
     */
    fastify.patch('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        if (request.user.role !== 'admin') {
            return reply.code(403).send({ error: 'صلاحية المشرف مطلوبة' });
        }

        const updates = request.body;

        try {
            const { data: settings, error: getError } = await supabase
                .from('platform_settings')
                .select('id')
                .single();

            if (getError) throw getError;

            const { data, error } = await supabase
                .from('platform_settings')
                .update(updates)
                .eq('id', settings.id)
                .select()
                .single();

            if (error) throw error;

            // Broadcast settings update to all connected clients (including Overlay)
            if (global.io) {
                global.io.emit('settingsUpdate', data);
            }

            return { success: true, settings: data };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في تحديث الإعدادات' });
        }
    });
}

module.exports = settingsRoutes;
