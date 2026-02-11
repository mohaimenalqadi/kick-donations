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
 * Advanced Profanity Filter with Normalization and Libyan Dialect support
 * @param {string} message - Donation message
 * @returns {object} { valid: boolean, value: string }
 */
function validateMessage(message) {
    if (!message) {
        return { valid: true, value: '' };
    }

    const sanitized = sanitizeString(message);

    // 1. القائمة الشاملة للشتائم (العامة، الليبية، وبمختلف الصيغ)
    const profanityList = [
        // عامة (Common Arabic)
        'كلب', 'حمار', 'تفه', 'شتم', 'لعن', 'وسخ', 'عاهر', 'منيوك', 'قواد', 'عرص',
        'شرموط', 'لبوة', 'خنيث', 'زبي', 'كس', 'طيز', 'كسمك', 'نيك', 'تناك', 'مص', 'لحس',
        'خرا', 'زق', 'يا حيوان', 'سكس', 'اباحي',

        // ليبية (Libyan Dialect)
        'فرخ', 'تيس', 'صايع', 'مفرخ', 'فرخة', 'طير', 'شلاكة',
        'منيك', 'نيكة', 'عطيب', 'حي عليك', 'يا خامر', 'خامر', 'يا فاشل',
        'تافه', 'مسخ', 'موسخ', 'يا صايع', 'يا بو ', 'يا ام ', 'يا عيل', 'عيل', 'سربوت', 'صرمك', 'زكمك', 'زكمتك', 'قحبة', 'قحبتك', 'زبر', 'زبري', 'ميبون', 'ميبونه', 'زامل', 'ولد قحبة', 'طيز', 'طيزك', 'اكلة', 'عاضة'
    ];

    // 2. فحص الأنماط المتكررة والروابط (Spam Patterns)
    const spamPatterns = [
        /(.)\1{7,}/,              // تكرار حرف أكثر من 7 مرات
        /(https?:\/\/)/i,         // روابط
        /\b(discord|telegram|kick|twitch)\b/i // روابط خارجية
    ];

    for (const pattern of spamPatterns) {
        if (pattern.test(sanitized)) {
            return { valid: true, value: '[رسالة محظورة]' };
        }
    }

    // 3. خوارزمية كشف الخداع (Text Normalization)
    // أ) تنظيف النص من (المسافات، النقاط، الزخارف، الحركات) لتوقع الخداع
    const normalizedText = sanitized
        .replace(/[\s\.\-\_\,\;\:\!\?\*\/\\\#\$\%\^\&\(\)\[\]\{\}\+\=]/g, '') // إزالة كل الرموز والمسافات
        .replace(/[ًٌٍَُِّْٰ]/g, '') // إزالة التشكيل
        .replace(/(.)\1+/g, '$1'); // دمج الحروف المكررة (ككككلب -> كلب)

    const lowerOriginal = sanitized.toLowerCase();
    const lowerNormalized = normalizedText.toLowerCase();

    // 4. الفحص المزدوج (Original & Normalized)
    for (const word of profanityList) {
        // فحص في النص الأصلي
        if (lowerOriginal.includes(word)) {
            return { valid: true, value: '[رسالة محظورة]' };
        }
        // فحص في النص "المطهر" (لكشف الخداع بالمسافات والتكرار)
        if (lowerNormalized.includes(word)) {
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
