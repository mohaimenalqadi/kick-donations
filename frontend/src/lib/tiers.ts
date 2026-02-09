export const TIERS = {
    basic: {
        duration: 10000,
        label: 'بسيط',
        color: '#10b981'
    },
    medium: {
        duration: 30000,
        label: 'متوسط',
        color: '#3b82f6'
    },
    professional: {
        duration: 60000,
        label: 'احترافي',
        color: '#8b5cf6'
    },
    cinematic: {
        duration: 180000,
        label: 'سينمائي',
        color: '#f59e0b'
    },
    legendary: {
        duration: 300000,
        label: 'خارق',
        color: '#ef4444'
    }
} as const;

export type TierName = keyof typeof TIERS;

export function calculateTier(amount: number): { name: TierName; duration: number; color: string; label: string } {
    const numAmount = Number(amount);

    if (numAmount >= 500) return { name: 'legendary', ...TIERS.legendary };
    if (numAmount >= 100) return { name: 'cinematic', ...TIERS.cinematic };
    if (numAmount >= 50) return { name: 'professional', ...TIERS.professional };
    if (numAmount >= 10) return { name: 'medium', ...TIERS.medium };
    return { name: 'basic', ...TIERS.basic };
}
