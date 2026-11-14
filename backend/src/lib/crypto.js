'use strict';

const crypto = require('crypto');

/** Constant-time string comparison (avoids timing side channels on secrets). */
function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
    const ha = crypto.createHash('sha256').update(a).digest();
    const hb = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(ha, hb);
}

/** URL-safe random token. */
function randomToken(bytes = 24) {
    return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { safeEqual, randomToken };
