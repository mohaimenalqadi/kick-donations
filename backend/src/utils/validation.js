'use strict';

/**
 * Input normalisation for donations.
 *
 * Output is rendered by React (which escapes text), so we do not strip quotes
 * or apostrophes any more. We only remove control characters, invisible
 * direction overrides (used to visually spoof text), and HTML tags.
 */

const { moderate, BLOCKED_PLACEHOLDER } = require('../services/moderation');

const LIMITS = Object.freeze({
    nameMin: 2,
    nameMax: 50,
    messageMax: 200,
    amountMin: 1,
    amountMax: 10000,
});

function cleanText(input, max) {
    if (typeof input !== 'string') return '';
    return input
        .normalize('NFC')
        .replace(/[\u0000-\u001F\u007F]/g, ' ')        // control chars
        .replace(/[\u202A-\u202E\u2066-\u2069\u200B-\u200F\uFEFF]/g, '') // bidi overrides / zero-width
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
}

function validateDonorName(name) {
    const value = cleanText(name, 200);
    if (value.length < LIMITS.nameMin) return { valid: false, error: 'اسم المتبرع يجب أن يكون حرفين على الأقل' };
    if (value.length > LIMITS.nameMax) return { valid: false, error: `اسم المتبرع طويل جدًا (الحد الأقصى ${LIMITS.nameMax} حرف)` };
    return { valid: true, value };
}

function validateAmount(amount) {
    const n = typeof amount === 'number' ? amount : Number.parseFloat(amount);
    if (!Number.isFinite(n)) return { valid: false, error: 'قيمة التبرع غير صالحة' };
    if (n < LIMITS.amountMin) return { valid: false, error: `الحد الأدنى للتبرع ${LIMITS.amountMin} دينار` };
    if (n > LIMITS.amountMax) return { valid: false, error: 'الحد الأقصى للتبرع 10,000 دينار' };
    return { valid: true, value: Math.round(n * 100) / 100 };
}

/**
 * @returns {{ value: string, original: string | null, flagged: boolean, reason: string | null }}
 */
function validateMessage(message) {
    const original = cleanText(message || '', LIMITS.messageMax);
    if (!original) return { value: '', original: null, flagged: false, reason: null };
    const { flagged, reason } = moderate(original);
    return flagged
        ? { value: BLOCKED_PLACEHOLDER, original, flagged: true, reason }
        : { value: original, original: null, flagged: false, reason: null };
}

/**
 * @param {{ donor_name: unknown, amount: unknown, message?: unknown }} data
 */
function validateDonation(data) {
    const errors = [];
    const name = validateDonorName(data.donor_name);
    const amount = validateAmount(data.amount);
    if (!name.valid) errors.push(name.error);
    if (!amount.valid) errors.push(amount.error);
    if (errors.length) return { valid: false, errors };

    // The donor name is moderated too: it is shown full-screen on stream.
    const nameCheck = moderate(name.value);
    const msg = validateMessage(data.message);

    return {
        valid: true,
        data: {
            donor_name: nameCheck.flagged ? 'داعم' : name.value,
            amount: amount.value,
            message: msg.value,
            flagged: msg.flagged || nameCheck.flagged,
            original_message: msg.flagged || nameCheck.flagged
                ? JSON.stringify({ donor_name: name.value, message: msg.original ?? msg.value })
                : null,
        },
    };
}

module.exports = { LIMITS, cleanText, validateDonorName, validateAmount, validateMessage, validateDonation };
