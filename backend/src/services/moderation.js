'use strict';

/**
 * Message moderation.
 *
 * Design goals (vs. the previous substring-only filter):
 *  - Built once at startup, not on every request.
 *  - Arabic letter normalisation (أ/إ/آ → ا, ة → ه, ى → ي, diacritics, tatweel)
 *    so trivial spelling variants are caught.
 *  - Short terms (≤ 3 letters, e.g. "تيس", "زب") only match whole words, so
 *    names like "تيسير" are not blocked. Longer Arabic terms also match as
 *    substrings (to catch attached pronouns: "كسمكم", "قحبتك").
 *  - Latin terms match whole words only ("ass" no longer blocks "class").
 *  - Flagged messages are not silently destroyed: the caller stores the
 *    original so an admin can review and approve it.
 */

const { words } = require('../data/profanity.json');

const BLOCKED_PLACEHOLDER = '[رسالة محظورة]';

const LINK_PATTERNS = [
    /https?:\/\//i,
    /\bwww\./i,
    /\b[a-z0-9-]+\.(com|net|org|gg|me|io|ly|tv|xyz|link|app)\b/i,
    /\b(discord\.gg|t\.me|wa\.me)\b/i,
];
const REPEAT_PATTERN = /(.)\1{9,}/u;

function normalizeArabic(text) {
    return text
        .toLowerCase()
        .replace(/[ً-ٰٟ]/g, '') // diacritics
        .replace(/ـ/g, '')                // tatweel
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي');
}

/** Collapses separators and repeated letters used to dodge filters ("ك.ل.ب", "كلللب"). */
function squash(text) {
    return text.replace(/[\s.\-_,;:!?*/\\#$%^&()[\]{}+=|~'"`]/g, '').replace(/(.)\1+/gu, '$1');
}

const isLatin = (w) => /^[a-z0-9 ]+$/.test(w);

/**
 * Everyday words that appear in the list only as part of an insult phrase
 * ("يا طيّر", "يا بارد"...). On their own they are harmless and must never
 * be blocked. Compared after normalisation.
 */
const ALLOW = new Set(
    ['طير', 'طيري', 'بارد', 'فقير', 'مثقف', 'نحبك', 'شلال', 'صامت', 'مريض', 'فيلسوف', 'ظالم', 'قاسي', 'كذاب', 'حجره', 'صخره', 'لوح', 'جيعان', 'دجاجه', 'ارنب', 'تمساح', 'بوم', 'غراب', 'عقرب', 'حيه', 'دميه', 'طبل', 'فارغ', 'ذيل', 'تابع', 'بطل']
        .map(normalizeArabic)
);

function buildMatcher(list) {
    const wholeWords = new Set();   // single-token terms matched against tokens
    const phrases = [];             // multi-word terms matched against normalised text
    const substrings = [];          // long Arabic terms matched inside squashed text

    for (const raw of list) {
        const w = normalizeArabic(raw.trim()).replace(/^يا\s+/, '');
        if (!w || ALLOW.has(w)) continue;
        if (w.includes(' ')) {
            phrases.push(w);
            continue;
        }
        wholeWords.add(w);
        if (!isLatin(w) && w.length >= 4) substrings.push(squash(w));
    }

    return function check(message) {
        const norm = normalizeArabic(message);
        const tokens = norm.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
        // Re-join runs of single letters: "F U C K" / "ك ل ب" → "fuck" / "كلب"
        const joined = [];
        let run = '';
        for (const t of tokens) {
            if ([...t].length === 1) run += t;
            else {
                if (run.length > 1) joined.push(run);
                run = '';
            }
        }
        if (run.length > 1) joined.push(run);

        for (const t of [...tokens, ...joined]) {
            if (wholeWords.has(t) || wholeWords.has(t.replace(/(.)\1+/gu, '$1'))) return t;
            // Arabic clitics: "والكلب", "بالكلب", "ياكلب"
            const stripped = t.replace(/^(وال|بال|فال|ال|يا|و|ف|ب|ل)/, '');
            if (stripped !== t && [...stripped].length >= 3 && wholeWords.has(stripped)) return stripped;
        }
        const spaced = ` ${tokens.join(' ')} `;
        for (const p of phrases) if (spaced.includes(` ${p} `)) return p;
        const squashed = squash(norm);
        for (const s of substrings) if (squashed.includes(s)) return s;
        return null;
    };
}

const findProfanity = buildMatcher(words);

/**
 * @param {string} message already-sanitised message
 * @returns {{ flagged: boolean, reason: null | 'profanity' | 'link' | 'spam' }}
 */
function moderate(message) {
    if (!message) return { flagged: false, reason: null };
    if (LINK_PATTERNS.some((re) => re.test(message))) return { flagged: true, reason: 'link' };
    if (REPEAT_PATTERN.test(message)) return { flagged: true, reason: 'spam' };
    if (findProfanity(message)) return { flagged: true, reason: 'profanity' };
    return { flagged: false, reason: null };
}

module.exports = { moderate, normalizeArabic, BLOCKED_PLACEHOLDER };
