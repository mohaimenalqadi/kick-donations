/**
 * Tier calculation utility
 * Determines donation tier based on amount (Libyan Dinar)
 * 6 Tiers: tier1 (1-4), tier2 (5-9), tier3 (10-19), tier4 (20-29), tier5 (30-39), tier6 (40-49)
 */

const TIERS = {
    tier1: {
        min: 1,
        max: 4,
        duration: 10000,      // 10 seconds
        label: 'بسيط',
        color: '#10b981'
    },
    tier2: {
        min: 5,
        max: 9,
        duration: 15000,      // 15 seconds
        label: 'فضي',
        color: '#3b82f6'
    },
    tier3: {
        min: 10,
        max: 19,
        duration: 30000,      // 30 seconds
        label: 'ذهبي',
        color: '#f59e0b'
    },
    tier4: {
        min: 20,
        max: 29,
        duration: 45000,      // 45 seconds
        label: 'بلاتيني',
        color: '#8b5cf6'
    },
    tier5: {
        min: 30,
        max: 39,
        duration: 60000,      // 60 seconds
        label: 'ملكي',
        color: '#ef4444'
    },
    tier6: {
        min: 40,
        max: 49,
        duration: 90000,      // 90 seconds
        label: 'أسطوري',
        color: '#e879f9'
    },
    tier_50: {
        min: 50,
        max: 50,
        duration: 120000,     // 120 seconds
        label: 'الخمسين الخارقة',
        color: '#ff007f'
    }
};

/**
 * Calculate tier based on donation amount
 * @param {number} amount - Donation amount in LYD
 * @returns {object} Tier information
 */
function calculateTier(amount) {
    const numAmount = parseFloat(amount);

    if (numAmount === 50) {
        return { name: 'tier_50', ...TIERS.tier_50 };
    }
    if (numAmount >= TIERS.tier6.min) {
        return { name: 'tier6', ...TIERS.tier6 };
    }
    if (numAmount >= TIERS.tier5.min) {
        return { name: 'tier5', ...TIERS.tier5 };
    }
    if (numAmount >= TIERS.tier4.min) {
        return { name: 'tier4', ...TIERS.tier4 };
    }
    if (numAmount >= TIERS.tier3.min) {
        return { name: 'tier3', ...TIERS.tier3 };
    }
    if (numAmount >= TIERS.tier2.min) {
        return { name: 'tier2', ...TIERS.tier2 };
    }
    return { name: 'tier1', ...TIERS.tier1 };
}

/**
 * Get display duration based on tier
 * @param {string} tierName - Tier name
 * @returns {number} Duration in milliseconds
 */
function getTierDuration(tierName) {
    return TIERS[tierName]?.duration || TIERS.tier1.duration;
}

module.exports = {
    TIERS,
    calculateTier,
    getTierDuration
};
