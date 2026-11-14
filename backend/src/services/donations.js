'use strict';

const { unwrap, badRequest, notFound, conflict } = require('../lib/errors');
const { startOfDay } = require('../lib/time');
const { validateDonation } = require('../utils/validation');
const { escapeLike } = require('./users');

const LIST_COLUMNS = 'id, donor_name, amount, message, tier, status, flagged, created_at, displayed_at, created_by';

/**
 * Donation lifecycle:
 *   pending ──send──▶ live ──overlay ack──▶ done
 *                       ▲                    │
 *                       └──────replay────────┘
 */
function createDonationService({ db, tiers, realtime, config }) {
    async function getById(id) {
        const row = unwrap(await db.from('donations').select('*').eq('id', id).maybeSingle());
        if (!row) throw notFound('التبرع غير موجود');
        return row;
    }

    /**
     * @param {object} input raw body
     * @param {{ userId?: string, status?: 'pending'|'live', idempotencyKey?: string }} opts
     */
    async function create(input, { userId = null, status = 'pending', idempotencyKey = null } = {}) {
        const v = validateDonation(input);
        if (!v.valid) throw badRequest(v.errors.join('، '), 'VALIDATION');

        const tier = await tiers.resolve(v.data.amount);
        const row = {
            donor_name: v.data.donor_name,
            amount: v.data.amount,
            message: v.data.message,
            flagged: v.data.flagged,
            original_message: v.data.original_message,
            tier: tier.tier_key,
            status,
            created_by: userId,
            idempotency_key: idempotencyKey,
            displayed_at: null,
        };

        const { data, error } = await db.from('donations').insert(row).select().single();
        if (error) {
            if (error.code === '23505' && idempotencyKey) {
                const existing = unwrap(
                    await db.from('donations').select('*').eq('idempotency_key', idempotencyKey).maybeSingle()
                );
                return { donation: existing, duplicate: true };
            }
            unwrap({ data, error });
        }

        realtime.donationChanged(data.id, data.status);
        if (status === 'live') realtime.showDonation(await tiers.enrich(data));
        return { donation: data, duplicate: false };
    }

    async function list({ page = 1, limit = 25, status, tier, search, from, to, flagged } = {}) {
        const offset = (page - 1) * limit;
        let q = db
            .from('donations')
            .select(LIST_COLUMNS, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (status) q = q.eq('status', status);
        if (tier) q = q.eq('tier', tier);
        if (flagged !== undefined) q = q.eq('flagged', flagged);
        if (search) q = q.ilike('donor_name', `%${escapeLike(search)}%`);
        if (from) q = q.gte('created_at', from);
        if (to) q = q.lte('created_at', to);
        const { data, count, error } = await q;
        unwrap({ data, error });
        return { items: data || [], total: count ?? 0, page, limit };
    }

    /** Sends a donation to the overlay. Also used to replay a finished donation. */
    async function send(id) {
        const current = await getById(id);
        if (current.status === 'live') throw conflict('هذا التبرع معروض حالياً على البث', 'ALREADY_LIVE');
        const row = unwrap(
            await db.from('donations').update({ status: 'live' }).eq('id', id).select().single()
        );
        realtime.donationChanged(id, 'live');
        realtime.showDonation(await tiers.enrich(row));
        return row;
    }

    /** Overlay acknowledgement. Only a `live` donation can become `done`. */
    async function markDisplayed(id) {
        const displayedAt = new Date().toISOString();
        const rows = unwrap(
            await db
                .from('donations')
                .update({ status: 'done', displayed_at: displayedAt })
                .eq('id', id)
                .eq('status', 'live')
                .select('id')
        );
        if (rows.length) realtime.donationChanged(id, 'done', displayedAt);
        return rows.length > 0;
    }

    /** Pending + live donations, oldest first, enriched for the overlay. */
    async function queue() {
        const rows = unwrap(
            await db
                .from('donations')
                .select('*')
                .eq('status', 'live')
                .order('created_at', { ascending: true })
                .limit(100)
        );
        return Promise.all(rows.map((r) => tiers.enrich(r)));
    }

    async function latestDisplayed() {
        const row = unwrap(
            await db
                .from('donations')
                .select('id, donor_name, amount, tier, displayed_at')
                .eq('status', 'done')
                .order('displayed_at', { ascending: false, nullsFirst: false })
                .limit(1)
                .maybeSingle()
        );
        return row;
    }

    async function topToday() {
        const row = unwrap(
            await db
                .from('donations')
                .select('donor_name, amount')
                .gte('created_at', startOfDay(config.timezone).toISOString())
                .order('amount', { ascending: false })
                .limit(1)
                .maybeSingle()
        );
        return row ? { donor_name: row.donor_name, amount: Number(row.amount) } : null;
    }

    /** Restores the original text of a moderated donation after admin review. */
    async function approveMessage(id) {
        const current = await getById(id);
        if (!current.flagged || !current.original_message) throw badRequest('هذه الرسالة غير محجوبة');
        let original;
        try {
            original = JSON.parse(current.original_message);
        } catch {
            original = { message: current.original_message };
        }
        const row = unwrap(
            await db
                .from('donations')
                .update({
                    donor_name: original.donor_name || current.donor_name,
                    message: original.message ?? current.message,
                    flagged: false,
                    original_message: null,
                })
                .eq('id', id)
                .select(LIST_COLUMNS)
                .single()
        );
        return row;
    }

    async function getOriginal(id) {
        const current = await getById(id);
        if (!current.original_message) return null;
        try {
            return JSON.parse(current.original_message);
        } catch {
            return { message: current.original_message };
        }
    }

    async function remove(id) {
        const rows = unwrap(await db.from('donations').delete().eq('id', id).select('id'));
        if (!rows.length) throw notFound('التبرع غير موجود');
        realtime.donationChanged(id, 'deleted');
    }

    /** @param {'today'|'all'} period */
    async function bulkRemove(period) {
        let q = db.from('donations').delete();
        if (period === 'today') q = q.gte('created_at', startOfDay(config.timezone).toISOString());
        else q = q.not('id', 'is', null);
        const rows = unwrap(await q.select('id'));
        realtime.donationsReset();
        return rows.length;
    }

    return {
        getById, create, list, send, markDisplayed, queue, latestDisplayed, topToday,
        approveMessage, getOriginal, remove, bulkRemove,
    };
}

module.exports = { createDonationService };
