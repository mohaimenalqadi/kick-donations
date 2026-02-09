const { supabase } = require('../config/database');

/**
 * Tier Settings Routes
 */
async function tierSettingsRoutes(fastify, options) {

    /**
     * GET /api/tier-settings
     * Get all tier configurations
     */
    fastify.get('/', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('tier_settings')
                .select('*')
                .order('min_amount', { ascending: true });

            if (error) {
                fastify.log.error('Supabase Error:', error);
                throw error;
            }
            return { tiers: data };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({
                error: 'خطأ في جلب إعدادات الفئات',
                details: err.message,
                hint: err.hint,
                code: err.code
            });
        }
    });

    /**
     * PATCH /api/tier-settings/:id
     * Update a specific tier configuration
     */
    fastify.patch('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        if (request.user.role !== 'admin') {
            return reply.code(403).send({ error: 'صلاحية المشرف مطلوبة' });
        }

        const { id } = request.params;
        const updates = request.body;
        updates.updated_at = new Date().toISOString();

        try {
            const { data, error } = await supabase
                .from('tier_settings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Broadcast update via socket
            if (global.io) {
                global.io.emit('tierSettingsUpdate', data);
            }

            return { success: true, tier: data };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في تحديث إعدادات الفئة' });
        }
    });
}

module.exports = tierSettingsRoutes;
