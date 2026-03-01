'use strict';

const { unwrap } = require('../lib/errors');

/**
 * Aggregations run inside Postgres (see migrations/001) instead of pulling
 * every row into Node. All "per day" logic uses the configured timezone.
 */
function createStatsService({ db, config }) {
    async function summary() {
        const data = unwrap(await db.rpc('stats_summary', { p_tz: config.timezone }));
        const s = Array.isArray(data) ? data[0] || {} : data || {};
        return {
            all_time_total: Number(s.all_time_total) || 0,
            all_time_count: Number(s.all_time_count) || 0,
            today_total: Number(s.today_total) || 0,
            today_count: Number(s.today_count) || 0,
            daily_average: Number(s.daily_average) || 0,
        };
    }

    async function analytics({ start, end }) {
        const params = { p_start: start.toISOString(), p_end: end.toISOString() };
        const [daily, tiers] = await Promise.all([
            db.rpc('stats_daily', { ...params, p_tz: config.timezone }),
            db.rpc('stats_tier_distribution', params),
        ]);
        return {
            dailyTrend: unwrap(daily).map((r) => ({ date: r.day, total: Number(r.total), count: Number(r.count) })),
            distribution: unwrap(tiers).map((r) => ({ tier: r.tier, count: Number(r.count), total: Number(r.total) })),
        };
    }

    return { summary, analytics };
}

module.exports = { createStatsService };
