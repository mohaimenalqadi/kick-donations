'use strict';

/**
 * Error with an HTTP status and a message that is safe to show to clients.
 * Anything that is not an AppError is reported to clients as a generic 500.
 */
class AppError extends Error {
    /**
     * @param {number} statusCode
     * @param {string} message  user-facing (Arabic) message
     * @param {string} [code]   machine-readable code
     */
    constructor(statusCode, message, code) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
    }
}

const badRequest = (msg, code) => new AppError(400, msg, code);
const unauthorized = (msg = 'غير مصرح - يجب تسجيل الدخول', code = 'UNAUTHORIZED') => new AppError(401, msg, code);
const forbidden = (msg = 'ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء', code = 'FORBIDDEN') => new AppError(403, msg, code);
const notFound = (msg = 'العنصر غير موجود', code = 'NOT_FOUND') => new AppError(404, msg, code);
const conflict = (msg, code = 'CONFLICT') => new AppError(409, msg, code);
const tooMany = (msg = 'محاولات كثيرة، حاول لاحقاً', code = 'TOO_MANY_REQUESTS') => new AppError(429, msg, code);

/**
 * Throws the Supabase error (if any) so it reaches the global error handler.
 * @template T
 * @param {{ data: T, error: any }} result
 * @returns {T}
 */
function unwrap(result) {
    if (result.error) {
        const err = new Error(result.error.message || 'Database error');
        err.cause = result.error;
        err.dbCode = result.error.code;
        throw err;
    }
    return result.data;
}

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict, tooMany, unwrap };
