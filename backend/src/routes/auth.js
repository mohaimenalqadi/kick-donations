const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');

/**
 * Authentication Routes
 */
async function authRoutes(fastify, options) {

    /**
     * POST /api/auth/login
     * Login with username and password
     */
    fastify.post('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string', minLength: 3 },
                    password: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password } = request.body;

        try {
            // Fetch user from database
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username.toLowerCase().trim())
                .single();

            if (error || !user) {
                // Check if any users exist at all
                const { count } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                if (count === 0) {
                    return reply.code(401).send({
                        error: 'FIRST_RUN',
                        message: 'النظام يحتاج لإعداد أولي. أدخل البيانات لإنشاء أول حساب مشرف.'
                    });
                }

                return reply.code(401).send({
                    error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
                });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return reply.code(401).send({
                    error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
                });
            }

            // Generate JWT token
            const token = fastify.jwt.sign({
                id: user.id,
                username: user.username,
                role: user.role
            }, { expiresIn: '24h' });

            // Log activity
            await supabase.from('activity_logs').insert({
                user_id: user.id,
                action: 'login',
                details: { ip: request.ip }
            });

            // Set cookie and return token
            reply
                .setCookie('token', token, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 86400 // 24 hours
                })
                .send({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
                    },
                    token
                });

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في الخادم' });
        }
    });

    /**
     * POST /api/auth/logout
     * Clear session
     */
    fastify.post('/logout', async (request, reply) => {
        reply
            .clearCookie('token', { path: '/' })
            .send({ success: true, message: 'تم تسجيل الخروج' });
    });

    /**
     * GET /api/auth/me
     * Get current user info
     */
    fastify.get('/me', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        return {
            user: request.user
        };
    });

    /**
     * PATCH /api/auth/profile
     * Update user profile (username/password)
     */
    fastify.patch('/profile', {
        preHandler: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string', minLength: 3 },
                    password: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password } = request.body;
        const userId = request.user.id;

        try {
            const updates = {};

            // 1. Handle Username Update
            if (username) {
                const newUsername = username.toLowerCase().trim();

                // Check if username is taken by someone else
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', newUsername)
                    .neq('id', userId)
                    .single();

                if (existingUser) {
                    return reply.code(400).send({ error: 'اسم المستخدم هذا مستخدم بالفعل' });
                }

                updates.username = newUsername;
            }

            // 2. Handle Password Update
            if (password) {
                const salt = await bcrypt.genSalt(12);
                updates.password_hash = await bcrypt.hash(password, salt);
            }

            if (Object.keys(updates).length === 0) {
                return reply.code(400).send({ error: 'لم يتم توفير بيانات للتحديث' });
            }

            // 3. Update Database
            const { data: updatedUser, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            // 4. Generate New JWT (in case username changed)
            const token = fastify.jwt.sign({
                id: updatedUser.id,
                username: updatedUser.username,
                role: updatedUser.role
            }, { expiresIn: '24h' });

            // 5. Log Activity
            await supabase.from('activity_logs').insert({
                user_id: userId,
                action: 'update_profile',
                details: {
                    updated_fields: Object.keys(updates).filter(k => k !== 'password_hash'),
                    ip: request.ip
                }
            });

            // 6. Set New Cookie
            reply.setCookie('token', token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 86400
            });

            return {
                success: true,
                message: 'تم تحديث البيانات بنجاح',
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    role: updatedUser.role
                },
                token
            };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في تحديث البيانات' });
        }
    });
}

module.exports = authRoutes;
