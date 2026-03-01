'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeApp } = require('./helpers');

const ORIGIN = 'https://app.example.com';
const json = { 'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest' };

test('CORS: allowed origin is reflected, foreign origin is not', async (t) => {
    const app = await makeApp();
    t.after(() => app.close());

    const ok = await app.inject({ method: 'OPTIONS', url: '/api/auth/login', headers: { origin: ORIGIN, 'access-control-request-method': 'POST' } });
    assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);

    const evil = await app.inject({ method: 'OPTIONS', url: '/api/auth/login', headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } });
    assert.notEqual(evil.headers['access-control-allow-origin'], 'https://evil.example');
});

test('CSRF: mutations need the custom header and an allowed Origin', async (t) => {
    const app = await makeApp();
    t.after(() => app.close());

    const noHeader = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { 'content-type': 'application/json' }, payload: {} });
    assert.equal(noHeader.statusCode, 403);
    assert.equal(noHeader.json().code, 'CSRF');

    const badOrigin = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { ...json, origin: 'https://evil.example' }, payload: {} });
    assert.equal(badOrigin.statusCode, 403);
    assert.equal(badOrigin.json().code, 'BAD_ORIGIN');

    const good = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { ...json, origin: ORIGIN }, payload: {} });
    assert.equal(good.statusCode, 200);
});

test('auth: protected routes reject anonymous and forged tokens', async (t) => {
    const app = await makeApp();
    t.after(() => app.close());

    for (const url of ['/api/donations', '/api/users', '/api/settings', '/api/tier-settings', '/api/activity-logs', '/api/overlay/key']) {
        const res = await app.inject({ method: 'GET', url });
        assert.equal(res.statusCode, 401, url);
    }

    const forged = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.' } });
    assert.equal(forged.statusCode, 401);
});

test('auth: session for a deleted user is rejected', async (t) => {
    const app = await makeApp({ respond: (table) => (table === 'users' ? { data: null, error: null } : { data: [], error: null }) });
    t.after(() => app.close());
    const token = app.jwt.sign({ sub: '00000000-0000-4000-8000-000000000001', tv: 0, typ: 'access' });
    const res = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token } });
    assert.equal(res.statusCode, 401);
});

test('auth: token_version mismatch (revoked session) is rejected; role comes from DB', async (t) => {
    const user = { id: '00000000-0000-4000-8000-000000000002', username: 'mod', role: 'moderator', token_version: 3 };
    const app = await makeApp({ respond: (table) => (table === 'users' ? { data: user, error: null } : { data: [], error: null }) });
    t.after(() => app.close());

    const old = app.jwt.sign({ sub: user.id, tv: 2, typ: 'access' });
    assert.equal((await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token: old } })).statusCode, 401);

    const current = app.jwt.sign({ sub: user.id, tv: 3, typ: 'access' });
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token: current } });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().user.role, 'moderator');

    // A socket ticket is not a session token.
    const ticket = app.jwt.sign({ sub: user.id, tv: 3, typ: 'socket' });
    assert.equal((await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token: ticket } })).statusCode, 401);

    // Moderators cannot delete donations or manage users.
    const del = await app.inject({ method: 'DELETE', url: `/api/donations/${user.id}`, cookies: { token: current }, headers: { 'x-requested-with': 'XMLHttpRequest' } });
    assert.equal(del.statusCode, 403);
    const users = await app.inject({ method: 'GET', url: '/api/users', cookies: { token: current } });
    assert.equal(users.statusCode, 403);
});

test('settings PATCH rejects unknown fields instead of writing them (mass assignment)', async (t) => {
    const user = { id: '00000000-0000-4000-8000-000000000003', username: 'admin', role: 'admin', token_version: 0 };
    let written = null;
    const app = await makeApp({
        respond: (table, calls) => {
            if (table === 'users') return { data: user, error: null };
            const upd = calls.find((c) => c[0] === 'update');
            if (upd) written = upd[1];
            return { data: { id: 'row', site_title: 'X' }, error: null };
        },
    });
    t.after(() => app.close());
    const token = app.jwt.sign({ sub: user.id, tv: 0, typ: 'access' });

    const res = await app.inject({
        method: 'PATCH', url: '/api/settings', cookies: { token }, headers: json,
        payload: { site_title: 'X', overlay_key: 'attacker' },
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(written, { site_title: 'X' });

    const bad = await app.inject({
        method: 'PATCH', url: '/api/tier-settings/00000000-0000-4000-8000-000000000009', cookies: { token }, headers: json,
        payload: { background_url: 'javascript:alert(1)' },
    });
    assert.equal(bad.statusCode, 400);
});

test('sms-auto requires a valid API key and bypasses CSRF only for that route', async (t) => {
    const app = await makeApp();
    t.after(() => app.close());
    const res = await app.inject({ method: 'POST', url: '/api/donations/sms-auto', headers: { 'x-api-key': 'wrong' }, payload: { donor_name: 'Ali', amount: 5 } });
    assert.equal(res.statusCode, 401);
});

test('overlay bootstrap requires the overlay key', async (t) => {
    const app = await makeApp({ respond: (table) => (table === 'platform_settings' ? { data: { id: 'r', overlay_key: 'secret-key' }, error: null } : { data: [], error: null }) });
    t.after(() => app.close());
    assert.equal((await app.inject({ method: 'GET', url: '/api/overlay/bootstrap' })).statusCode, 401);
    assert.equal((await app.inject({ method: 'GET', url: '/api/overlay/bootstrap', headers: { 'x-overlay-key': 'nope' } })).statusCode, 401);
    const ok = await app.inject({ method: 'GET', url: '/api/overlay/bootstrap', headers: { 'x-overlay-key': 'secret-key' } });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.json().settings.overlay_key, undefined);
});

test('errors do not leak internals', async (t) => {
    const app = await makeApp({ respond: () => ({ data: null, error: { message: 'relation "secret_table" does not exist', code: '42P01' } }) });
    t.after(() => app.close());
    const res = await app.inject({ method: 'GET', url: '/api/public/branding' });
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body, /secret_table/);
});

test('security headers are present', async (t) => {
    const app = await makeApp();
    t.after(() => app.close());
    const res = await app.inject({ method: 'GET', url: '/' });
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['content-security-policy']);
});
