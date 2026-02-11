/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input - remove dangerous characters
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/<[^>]*>/g, '')           // Remove HTML tags
        .replace(/[<>\"\'`;]/g, '')        // Remove dangerous chars
        .substring(0, 500);                 // Limit length
}

/**
 * Validate donor name
 * @param {string} name - Donor name
 * @returns {object} { valid: boolean, error?: string, value?: string }
 */
function validateDonorName(name) {
    const sanitized = sanitizeString(name);

    if (!sanitized || sanitized.length < 2) {
        return { valid: false, error: 'اسم المتبرع يجب أن يكون حرفين على الأقل' };
    }

    if (sanitized.length > 50) {
        return { valid: false, error: 'اسم المتبرع طويل جدًا (الحد الأقصى 50 حرف)' };
    }

    return { valid: true, value: sanitized };
}

/**
 * Validate donation amount
 * @param {number|string} amount - Donation amount
 * @returns {object} { valid: boolean, error?: string, value?: number }
 */
function validateAmount(amount) {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
        return { valid: false, error: 'قيمة التبرع غير صالحة' };
    }

    if (numAmount < 1) {
        return { valid: false, error: 'الحد الأدنى للتبرع 1 دينار' };
    }

    if (numAmount > 10000) {
        return { valid: false, error: 'الحد الأقصى للتبرع 10,000 دينار' };
    }

    // Round to 2 decimal places
    const rounded = Math.round(numAmount * 100) / 100;

    return { valid: true, value: rounded };
}

/**
 * Validate donation message
 * @param {string} message - Donation message
 * @returns {object} { valid: boolean, value: string }
 */
function validateMessage(message) {
    if (!message) {
        return { valid: true, value: '' };
    }

    const sanitized = sanitizeString(message);

    // قائمة الكلمات النابية (Arabic Profanity List)
    const profanityList = [
        'كلب', 'حمار', 'تفه', 'شتم', 'لعن', 'وسخ', 'عاهر', 'منيوك', 'قواد', 'عرص',
        'شرموط', 'لبوة', 'خنيث', 'زبي', 'كس', 'طيز', 'كسمك', 'يا واد', 'يا بنت',
        'نيك', 'تناك', 'مص', 'لحس', 'خرا', 'زق', 'يا حيوان'
    ];

    // Check for spam patterns
    const spamPatterns = [
        /(.)\1{5,}/,              // Repeated characters
        /(https?:\/\/)/i,         // URLs
        /\b(discord|telegram)\b/i // External links
    ];

    // 1. Check for spam
    for (const pattern of spamPatterns) {
        if (pattern.test(sanitized)) {
            return { valid: true, value: '[رسالة محظورة]' };
        }
    }

    // 2. Check for profanity
    const lowerMessage = sanitized.toLowerCase();
    for (const word of profanityList) {
        if (lowerMessage.includes(word)) {
            return { valid: true, value: '[رسالة محظورة]' };
        }
    }

    return { valid: true, value: sanitized.substring(0, 200) };
}

/**
 * Validate complete donation input
 * @param {object} data - { donor_name, amount, message }
 * @returns {object} { valid: boolean, errors?: array, data?: object }
 */
function validateDonation(data) {
    const errors = [];
    const validated = {};

    // Validate donor name
    const nameResult = validateDonorName(data.donor_name);
    if (!nameResult.valid) {
        errors.push(nameResult.error);
    } else {
        validated.donor_name = nameResult.value;
    }

    // Validate amount
    const amountResult = validateAmount(data.amount);
    if (!amountResult.valid) {
        errors.push(amountResult.error);
    } else {
        validated.amount = amountResult.value;
    }

    // Validate message
    const messageResult = validateMessage(data.message);
    validated.message = messageResult.value;

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true, data: validated };
}

module.exports = {
    sanitizeString,
    validateDonorName,
    validateAmount,
    validateMessage,
    validateDonation
};
