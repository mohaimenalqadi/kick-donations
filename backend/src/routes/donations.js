const { supabase } = require('../config/database');
const authorize = require('../middleware/authorize');
const { validateDonation } = require('../utils/validation');
const { calculateTier } = require('../utils/tiers');
const { emitNewDonation, emitStatusUpdate, getConnectionStats } = require('../services/websocket');

/**
 * Donation Routes
 */
async function donationRoutes(fastify, options) {

    /**
     * GET /api/donations
     * Get all donations with optional filters
     */
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { data: donations, error } = await supabase
                .from('donations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                donations,
                connections: getConnectionStats()
            };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب التبرعات' });
        }
    });

    /**
     * GET /api/donations/queue
     * Get pending and live donations queue for recovery
     */
    fastify.get('/queue', async (request, reply) => {
        try {
            // Fetch both live (interrupted) and pending (waiting)
            const { data: donations, error } = await supabase
                .from('donations')
                .select('*')
                .in('status', ['pending', 'live'])
                .order('created_at', { ascending: true });

            if (error) throw error;

            return { queue: donations || [] };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب طابور الانتظار' });
        }
    });

    /**
     * GET /api/donations/latest
     * Get the latest completed donation for "Sticky" display
     */
    fastify.get('/latest', async (request, reply) => {
        try {
            const { data: donation, error } = await supabase
                .from('donations')
                .select('*')
                .eq('status', 'done')
                .order('displayed_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            return { latest: donation };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب آخر تبرع' });
        }
    });

    /**
     * GET /api/donations/top
     * Get top donor of the day
     */
    fastify.get('/top', async (request, reply) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: topDonation, error } = await supabase
                .from('donations')
                .select('donor_name, amount')
                .gte('created_at', today.toISOString())
                .order('amount', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            return { top: topDonation };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب أفضل متبرع' });
        }
    });

    /**
     * POST /api/donations
     * Create a new donation (admin only)
     */
    fastify.post('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { donor_name, amount, message } = request.body;

        try {
            // Validate
            const validation = validateDonation({ donor_name, amount, message });
            if (!validation.valid) {
                return reply.code(400).send({ error: validation.errors.join(', ') });
            }

            const { donor_name: vName, amount: vAmount, message: vMessage } = validation.data;

            // Calculate tier info
            const tierInfo = calculateTier(vAmount);

            // Create donation in DB
            const { data: donation, error } = await supabase
                .from('donations')
                .insert([{
                    donor_name: vName,
                    amount: vAmount,
                    message: vMessage,
                    tier: tierInfo.name, // Fixed: use .name instead of .tier
                    status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;

            // Log activity
            await supabase.from('activity_logs').insert({
                user_id: request.user.id,
                action: 'create_donation',
                details: { donation_id: donation.id }
            });

            return { success: true, donation };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(400).send({ error: err.message });
        }
    });

    /**
     * POST /api/donations/:id/send
     * Send donation to stream overlay
     */
    fastify.post('/:id/send', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;

        try {
            // Get donation
            const { data: donation, error: getError } = await supabase
                .from('donations')
                .select('*')
                .eq('id', id)
                .single();

            if (getError || !donation) {
                return reply.code(404).send({ error: 'التبرع غير موجود' });
            }

            // Update status to live
            const { error: updateError } = await supabase
                .from('donations')
                .update({ status: 'live' })
                .eq('id', id);

            if (updateError) throw updateError;

            // Emit to socket
            emitNewDonation(donation);

            return { success: true };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في إرسال التبرع' });
        }
    });

    /**
     * DELETE /api/donations/bulk
     * Bulk delete donations (today or all)
     */
    fastify.delete('/bulk', {
        preHandler: [fastify.authenticate, authorize(['admin'])],
        schema: {}
    }, async (request, reply) => {
        const { period } = request.query; // 'today' or 'all'

        // Check if admin
        if (request.user.role !== 'admin') {
            return reply.code(403).send({ error: 'صلاحية المشرف مطلوبة' });
        }

        try {
            let query = supabase.from('donations').delete();

            if (period === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (period === 'all') {
                // Supabase requires a WHERE clause for delete()
                query = query.neq('id', '00000000-0000-0000-0000-000000000000');
            } else {
                return reply.code(400).send({ error: 'خيار حذف غير صالح' });
            }

            const { error } = await query;
            if (error) throw error;

            return { success: true, message: `تم حذف ${period === 'today' ? 'عمليات اليوم' : 'جميع العمليات'} بنجاح` };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في الحذف الجماعي' });
        }
    });

    /**
     * DELETE /api/donations/:id
     * Delete donation (admin only)
     */
    fastify.delete('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;

        try {
            const { error } = await supabase
                .from('donations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true, message: 'تم حذف التبرع' };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في حذف التبرع' });
        }
    });

    /**
     * GET /api/donations/analytics
     * Get donation analytics for charts
     */
    fastify.get('/analytics', {
        preHandler: [fastify.authenticate, authorize(['admin'])],
        schema: {}
    }, async (request, reply) => {
        const { start, end } = request.query;

        try {
            // Default to last 30 days if no range provided
            const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = end ? new Date(end) : new Date();

            // 1. Daily Trend
            const { data: trendData, error: trendError } = await supabase
                .rpc('get_daily_donation_count', {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });

            // If RPC doesn't exist, we'll fall back to a raw query (simplified)
            let dailyTrend = trendData || [];
            if (trendError) {
                const { data: rawDonations, error: rawError } = await supabase
                    .from('donations')
                    .select('created_at, amount')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString());

                if (rawError) throw rawError;

                // Simple JS aggregation
                const groups = {};
                rawDonations.forEach(d => {
                    const day = d.created_at.split('T')[0];
                    groups[day] = (groups[day] || 0) + parseFloat(d.amount);
                });

                dailyTrend = Object.keys(groups)
                    .sort() // Chronological sort
                    .map(day => ({ date: day, total: groups[day] }));
            }

            // 2. Tier Distribution
            const { data: tierData, error: tierError } = await supabase
                .from('donations')
                .select('tier')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (tierError) throw tierError;

            const tierCounts = {};
            tierData.forEach(d => {
                tierCounts[d.tier] = (tierCounts[d.tier] || 0) + 1;
            });
            const distribution = Object.keys(tierCounts).map(tier => ({ tier, count: tierCounts[tier] }));

            return { dailyTrend, distribution };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب البيانات التحليلية' });
        }
    });

    /**
     * GET /api/donations/stats
     * Get donation statistics
     */
    fastify.get('/stats', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { data, error: rpcError } = await supabase.rpc('get_platform_stats');

            if (!rpcError && data && data.length > 0) {
                const statsData = data[0];
                return {
                    today: {
                        total: parseFloat(statsData.all_time_total) || 0, // Now All-Time Total
                        count: parseInt(statsData.today_count) || 0,    // Today's Operations
                        average: parseFloat(statsData.daily_average) || 0, // Global Daily Average
                        today_total: parseFloat(statsData.today_total) || 0
                    },
                    connections: getConnectionStats()
                };
            }

            // Fallback
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: todayDonations, error } = await supabase
                .from('donations')
                .select('amount')
                .gte('created_at', today.toISOString());

            if (error) throw error;

            const totalToday = todayDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            const countToday = todayDonations.length;

            return {
                today: {
                    total: totalToday,
                    count: countToday,
                    average: countToday > 0 ? (totalToday / countToday).toFixed(2) : 0
                },
                connections: getConnectionStats()
            };

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'خطأ في جلب الإحصائيات' });
        }
    });
}

module.exports = donationRoutes;
