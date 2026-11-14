'use strict';

const bcrypt = require('bcryptjs');
const { unwrap, badRequest, notFound, conflict } = require('../lib/errors');

const BCRYPT_ROUNDS = 12;
const USER_CACHE_TTL_MS = 30_000;
// Used to keep login timing identical whether or not the user exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', BCRYPT_ROUNDS);

/** Escapes LIKE wildcards so ILIKE performs an exact, case-insensitive match. */
function escapeLike(value) {
    return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const normalizeUsername = (u) => String(u || '').trim().toLowerCase();
const publicUser = (u) => ({ id: u.id, username: u.username, role: u.role, created_at: u.created_at });

function createUserService({ db }) {
    /** Short cache so `authenticate` does not hit the DB on every request. */
    const cache = new Map();

    function invalidate(id) {
        if (id) cache.delete(id);
        else cache.clear();
    }

    async function getById(id, { fresh = false } = {}) {
        const hit = cache.get(id);
        if (!fresh && hit && Date.now() - hit.at < USER_CACHE_TTL_MS) return hit.user;
        const user = unwrap(await db.from('users').select('*').eq('id', id).maybeSingle());
        if (user) cache.set(id, { user, at: Date.now() });
        else cache.delete(id);
        return user;
    }

    async function findByUsername(username) {
        const rows = unwrap(
            await db.from('users').select('*').ilike('username', escapeLike(normalizeUsername(username))).limit(2)
        );
        return rows.length === 1 ? rows[0] : null;
    }

    async function count() {
        const { count: n, error } = await db.from('users').select('id', { count: 'exact', head: true });
        unwrap({ data: null, error });
        return n || 0;
    }

    async function verifyCredentials(username, password) {
        const user = await findByUsername(username);
        const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
        return ok && user ? user : null;
    }

    async function verifyPassword(user, password) {
        return bcrypt.compare(password, user.password_hash);
    }

    async function list() {
        const rows = unwrap(
            await db.from('users').select('id, username, role, created_at').order('created_at', { ascending: false })
        );
        return rows.map(publicUser);
    }

    async function assertUsernameFree(username, exceptId) {
        const existing = await findByUsername(username);
        if (existing && existing.id !== exceptId) throw conflict('اسم المستخدم هذا مستخدم بالفعل', 'USERNAME_TAKEN');
    }

    async function create({ username, password, role }) {
        const name = normalizeUsername(username);
        await assertUsernameFree(name);
        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const row = unwrap(
            await db.from('users').insert({ username: name, password_hash, role }).select().single()
        );
        return publicUser(row);
    }

    /** Creates the first admin atomically (see migration `create_first_admin`). */
    async function createFirstAdmin({ username, password }) {
        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const created = unwrap(
            await db.rpc('create_first_admin', { p_username: normalizeUsername(username), p_password_hash: password_hash })
        );
        if (!created) throw conflict('النظام مهيأ بالفعل. يرجى تسجيل الدخول.', 'ALREADY_SETUP');
    }

    async function countAdmins() {
        const { count: n, error } = await db.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin');
        unwrap({ data: null, error });
        return n || 0;
    }

    /**
     * Updates a user. Changing the password or role bumps `token_version`,
     * which invalidates every session issued before the change.
     */
    async function update(id, { username, password, role }) {
        const current = await getById(id, { fresh: true });
        if (!current) throw notFound('المستخدم غير موجود');

        const patch = {};
        if (username !== undefined) {
            const name = normalizeUsername(username);
            if (name !== current.username) {
                await assertUsernameFree(name, id);
                patch.username = name;
            }
        }
        if (role !== undefined && role !== current.role) {
            if (current.role === 'admin' && role !== 'admin' && (await countAdmins()) <= 1) {
                throw badRequest('لا يمكن إزالة صلاحية آخر مشرف في النظام', 'LAST_ADMIN');
            }
            patch.role = role;
        }
        if (password) patch.password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        if (patch.password_hash || patch.role) patch.token_version = (current.token_version || 0) + 1;

        if (!Object.keys(patch).length) return { user: publicUser(current), changed: [] };

        const row = unwrap(await db.from('users').update(patch).eq('id', id).select().single());
        invalidate(id);
        const changed = Object.keys(patch).filter((k) => !['password_hash', 'token_version'].includes(k));
        if (patch.password_hash) changed.push('password');
        return { user: publicUser(row), row, changed };
    }

    async function revokeSessions(id) {
        const current = await getById(id, { fresh: true });
        if (!current) throw notFound('المستخدم غير موجود');
        const row = unwrap(
            await db.from('users').update({ token_version: (current.token_version || 0) + 1 }).eq('id', id).select().single()
        );
        invalidate(id);
        return row;
    }

    async function remove(id) {
        const current = await getById(id, { fresh: true });
        if (!current) throw notFound('المستخدم غير موجود');
        if (current.role === 'admin' && (await countAdmins()) <= 1) {
            throw badRequest('لا يمكن حذف آخر مشرف في النظام', 'LAST_ADMIN');
        }
        unwrap(await db.from('users').delete().eq('id', id));
        invalidate(id);
        return publicUser(current);
    }

    return {
        getById, findByUsername, count, verifyCredentials, verifyPassword,
        list, create, createFirstAdmin, update, revokeSessions, remove, invalidate,
    };
}

module.exports = { createUserService, escapeLike, normalizeUsername, publicUser };
