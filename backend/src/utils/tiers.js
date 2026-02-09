/**
 * Tier calculation utility
 * Determines donation tier based on amount (Libyan Dinar)
 */

const TIERS = {
    basic: {
        min: 1,
        max: 9,
        duration: 10000,      // 10 seconds
        label: 'بسيط',
        color: '#10b981'
    },
    medium: {
        min: 10,
        max: 49,
        duration: 30000,      // 30 seconds
        label: 'متوسط',
        color: '#3b82f6'
    },
    professional: {
        min: 50,
        max: 99,
        duration: 60000,      // 1 minute
        label: 'احترافي',
        color: '#8b5cf6'
    },
    cinematic: {
        min: 100,
        max: 499,
        duration: 180000,     // 3 minutes
        label: 'سينمائي',
        color: '#f59e0b'
    },
    legendary: {
        min: 500,
        max: Infinity,
        duration: 300000,     // 5 minutes
        label: 'خارق',
        color: '#ef4444'
    }
};

/**
 * Calculate tier based on donation amount
 * @param {number} amount - Donation amount in LYD
 * @returns {object} Tier information
 */
function calculateTier(amount) {
    const numAmount = parseFloat(amount);

    if (numAmount >= TIERS.legendary.min) {
        return { name: 'legendary', ...TIERS.legendary };
    }
    if (numAmount >= TIERS.cinematic.min) {
        return { name: 'cinematic', ...TIERS.cinematic };
    }
    if (numAmount >= TIERS.professional.min) {
        return { name: 'professional', ...TIERS.professional };
    }
    if (numAmount >= TIERS.medium.min) {
        return { name: 'medium', ...TIERS.medium };
    }
    return { name: 'basic', ...TIERS.basic };
}

/**
 * Get display duration based on tier
 * @param {string} tierName - Tier name
 * @returns {number} Duration in milliseconds
 */
function getTierDuration(tierName) {
    return TIERS[tierName]?.duration || TIERS.basic.duration;
}

module.exports = {
    TIERS,
    calculateTier,
    getTierDuration
};
