export const TIERS = {
    tier1: {
        duration: 10000,
        label: 'بسيط',
        color: '#10b981'
    },
    tier2: {
        duration: 15000,
        label: 'فضي',
        color: '#3b82f6'
    },
    tier3: {
        duration: 30000,
        label: 'ذهبي',
        color: '#f59e0b'
    },
    tier4: {
        duration: 45000,
        label: 'بلاتيني',
        color: '#8b5cf6'
    },
    tier5: {
        duration: 60000,
        label: 'ملكي',
        color: '#ef4444'
    },
    tier6: {
        duration: 90000,
        label: 'أسطوري',
        color: '#e879f9'
    }
} as const;

export type TierName = keyof typeof TIERS;

export function calculateTier(amount: number): { name: TierName; duration: number; color: string; label: string } {
    const numAmount = Number(amount);

    if (numAmount >= 40) return { name: 'tier6', ...TIERS.tier6 };
    if (numAmount >= 30) return { name: 'tier5', ...TIERS.tier5 };
    if (numAmount >= 20) return { name: 'tier4', ...TIERS.tier4 };
    if (numAmount >= 10) return { name: 'tier3', ...TIERS.tier3 };
    if (numAmount >= 5) return { name: 'tier2', ...TIERS.tier2 };
    return { name: 'tier1', ...TIERS.tier1 };
}
