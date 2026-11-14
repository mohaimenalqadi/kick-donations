'use strict';

const { unwrap } = require('../lib/errors');

/**
 * Activity / audit log. Writing a log entry must never break the action
 * being logged, but failures are reported instead of silently ignored.
 */
function createAuditService({ db, log }) {
    async function record(userId, action, details = {}) {
        const { error } = await db.from('activity_logs').insert({ user_id: userId || null, action, details });
        if (error) log.warn({ err: error, action }, 'audit log write failed');
    }

    async function list({ page = 1, limit = 50, action } = {}) {
        const from = (page - 1) * limit;
        let q = db
            .from('activity_logs')
            .select('id, action, details, created_at, user_id, users(username)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (action) q = q.eq('action', action);
        const { data, count, error } = await q;
        unwrap({ data, error });
        return {
            items: (data || []).map((r) => ({
                id: r.id,
                action: r.action,
                details: r.details,
                created_at: r.created_at,
                user_id: r.user_id,
                username: r.users?.username ?? null,
            })),
            total: count ?? 0,
        };
    }

    return { record, list };
}

module.exports = { createAuditService };
