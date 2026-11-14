'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveTier, DEFAULT_TIERS } = require('../src/utils/tiers');
const { moderate } = require('../src/services/moderation');
const { validateDonation, cleanText } = require('../src/utils/validation');
const { startOfDay, tzOffsetMinutes } = require('../src/lib/time');
const { safeEqual } = require('../src/lib/crypto');
const { createLockout } = require('../src/lib/lockout');
const { escapeLike } = require('../src/services/users');
const { loadConfig } = require('../src/config/env');
const { sniff } = require('../src/routes/uploads');

test('resolveTier: boundaries and the exact-50 tier', () => {
    const t = (n) => resolveTier(n, DEFAULT_TIERS).tier_key;
    assert.equal(t(1), 'tier1');
    assert.equal(t(4.99), 'tier1');
    assert.equal(t(5), 'tier2');
    assert.equal(t(19), 'tier3');
    assert.equal(t(20), 'tier4');
    assert.equal(t(39.5), 'tier5');
    assert.equal(t(49), 'tier6');
    assert.equal(t(50), 'tier_50');
    assert.equal(t(51), 'tier6');
    assert.equal(t(5000), 'tier6');
});

test('resolveTier: honours DB values and legacy rows without max_amount', () => {
    const rows = [
        { tier_key: 'tier1', min_amount: '1', duration: 1000 },
        { tier_key: 'tier2', min_amount: '100', duration: 1000 },
        { tier_key: 'tier_50', min_amount: '50', duration: 1000 }, // no max_amount column
    ];
    assert.equal(resolveTier(60, rows).tier_key, 'tier1');
    assert.equal(resolveTier(50, rows).tier_key, 'tier_50');
    assert.equal(resolveTier(150, rows).tier_key, 'tier2');
});

test('moderation: blocks profanity and obfuscated variants', () => {
    for (const msg of ['يا كلب', 'انت حمار', 'ك.س.م.ك', 'كسمكم', 'fuck you', 'F U C K', 'يا قحبة']) {
        assert.equal(moderate(msg).flagged, true, `should flag: ${msg}`);
    }
});

test('moderation: no false positives on normal messages', () => {
    for (const msg of [
        'نحبك يا بطل', 'class pass assignment', 'تيسير يسلم عليك', 'الجو بارد اليوم', 'طير الحمام',
        'Sussex', 'kick افضل منصة', 'ربي يوفقك', 'تحية من بنغازي', 'شكرا على البث',
    ]) {
        assert.equal(moderate(msg).flagged, false, `should NOT flag: ${msg}`);
    }
});

test('moderation: links and spam', () => {
    assert.equal(moderate('تابعوني https://x.com').reason, 'link');
    assert.equal(moderate('discord.gg/abc').reason, 'link');
    assert.equal(moderate('هههههههههههههههه').reason, 'spam');
});

test('validateDonation: keeps the original of a flagged message for review', () => {
    const v = validateDonation({ donor_name: "O'Brien", amount: '10.555', message: 'يا كلب' });
    assert.equal(v.valid, true);
    assert.equal(v.data.donor_name, "O'Brien"); // apostrophes are no longer stripped
    assert.equal(v.data.amount, 10.56);
    assert.equal(v.data.flagged, true);
    assert.equal(v.data.message, '[رسالة محظورة]');
    assert.equal(JSON.parse(v.data.original_message).message, 'يا كلب');
});

test('validateDonation: rejects bad input', () => {
    assert.equal(validateDonation({ donor_name: 'a', amount: 5 }).valid, false);
    assert.equal(validateDonation({ donor_name: 'Ali', amount: 0 }).valid, false);
    assert.equal(validateDonation({ donor_name: 'Ali', amount: 10001 }).valid, false);
    assert.equal(validateDonation({ donor_name: 'Ali', amount: 'abc' }).valid, false);
});

test('cleanText strips tags, control and bidi-override characters', () => {
    assert.equal(cleanText('<b>Ali</b>‮\u0000 ok', 100), 'Ali ok');
});

test('startOfDay uses the configured timezone (Tripoli = UTC+2)', () => {
    const now = new Date('2026-03-10T23:30:00Z'); // 01:30 on the 11th in Tripoli
    assert.equal(tzOffsetMinutes(now, 'Africa/Tripoli'), 120);
    assert.equal(startOfDay('Africa/Tripoli', now).toISOString(), '2026-03-10T22:00:00.000Z');
});

test('safeEqual', () => {
    assert.equal(safeEqual('abc', 'abc'), true);
    assert.equal(safeEqual('abc', 'abd'), false);
    assert.equal(safeEqual('', ''), false);
    assert.equal(safeEqual(undefined, 'a'), false);
});

test('lockout locks after max attempts and resets', () => {
    const l = createLockout({ maxAttempts: 3, windowMs: 1000, lockMs: 5000 });
    l.fail('u', 0); l.fail('u', 1);
    assert.equal(l.lockedFor('u', 2), 0);
    l.fail('u', 2);
    assert.ok(l.lockedFor('u', 3) > 0);
    l.reset('u');
    assert.equal(l.lockedFor('u', 4), 0);
});

test('escapeLike neutralises wildcards (no "ad%" → "admin" login)', () => {
    assert.equal(escapeLike('ad%'), 'ad\\%');
    assert.equal(escapeLike('a_b'), 'a\\_b');
});

test('loadConfig rejects weak secrets', () => {
    assert.throws(() => loadConfig({ SUPABASE_URL: 'x', SUPABASE_SERVICE_KEY: 'y', JWT_SECRET: 'short' }), /JWT_SECRET/);
    assert.throws(
        () => loadConfig({ SUPABASE_URL: 'x', SUPABASE_SERVICE_KEY: 'y', JWT_SECRET: 'x'.repeat(40), COOKIE_SAMESITE: 'none', COOKIE_SECURE: 'false' }),
        /COOKIE_SAMESITE/
    );
});

test('upload sniffing detects real types', () => {
    assert.equal(sniff(Buffer.from('GIF89a......')), 'image/gif');
    assert.equal(sniff(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/png');
    assert.equal(sniff(Buffer.from('<svg onload=alert(1)>')), null);
});
