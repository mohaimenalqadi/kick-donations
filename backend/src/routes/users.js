const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');
const authorize = require('../middleware/authorize');

/**
 * User Management Routes
 */
async function userRoutes(fastify, options) {

    // All routes in this file require authentication and admin role
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.addHook('preHandler', authorize(['admin']));

    /**
     * GET /api/users
     * List all users
     */
    fastify.get('/', async (request, reply) => {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, username, role, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { users };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب قائمة المستخدمين' });
        }
    });

    /**
     * POST /api/users
     * Create a new user
     */
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password', 'role'],
                properties: {
                    username: { type: 'string', minLength: 3 },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['admin', 'moderator'] }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password, role } = request.body;
        const normalizedUsername = username.toLowerCase().trim();

        try {
            // Check if user exists
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('username', normalizedUsername)
                .single();

            if (existing) {
                return reply.code(400).send({ error: 'اسم المستخدم هذا موجود بالفعل' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(12);
            const password_hash = await bcrypt.hash(password, salt);

            // Insert user
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    username: normalizedUsername,
                    password_hash,
                    role
                })
                .select('id, username, role')
                .single();

            if (error) throw error;

            // Log activity
            await supabase.from('activity_logs').insert({
                user_id: request.user.id,
                action: 'create_user',
                details: { new_username: normalizedUsername, role }
            });

            return { success: true, user: newUser };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في إنشاء المستخدم' });
        }
    });

    /**
     * PATCH /api/users/:id
     * Update user (role or password)
     */
    fastify.patch('/:id', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['admin', 'moderator'] }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const { password, role } = request.body;

        try {
            const updates = {};
            if (role) updates.role = role;
            if (password) {
                const salt = await bcrypt.genSalt(12);
                updates.password_hash = await bcrypt.hash(password, salt);
            }

            if (Object.keys(updates).length === 0) {
                return reply.code(400).send({ error: 'لا يوجد بيانات لتحديثها' });
            }

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id)
                .select('id, username, role')
                .single();

            if (error) throw error;

            // Log activity
            await supabase.from('activity_logs').insert({
                user_id: request.user.id,
                action: 'update_user',
                details: { target_id: id, updated_fields: Object.keys(updates).filter(k => k !== 'password_hash') }
            });

            return { success: true, user: updatedUser };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في تحديث المستخدم' });
        }
    });

    /**
     * DELETE /api/users/:id
     * Delete a user
     */
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;

        // Prevent self-deletion
        if (id === request.user.id) {
            return reply.code(400).send({ error: 'لا يمكنك حذف حسابك الخاص' });
        }

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await supabase.from('activity_logs').insert({
                user_id: request.user.id,
                action: 'delete_user',
                details: { target_id: id }
            });

            return { success: true, message: 'تم حذف المستخدم بنجاح' };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في حذف المستخدم' });
        }
    });
}

module.exports = userRoutes;
