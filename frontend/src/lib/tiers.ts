import type { Tier } from './types';

/**
 * Display-only helpers. The server decides a donation's tier; these mirror
 * its rule so the dashboard can preview the tier while the amount is typed.
 */
export function resolveTier(amount: number, tiers: Tier[]): Tier | null {
    if (!Number.isFinite(amount) || amount <= 0 || !tiers.length) return null;
    const sorted = [...tiers].sort((a, b) => Number(b.min_amount) - Number(a.min_amount));
    return (
        sorted.find(
            (t) => amount >= Number(t.min_amount) && (t.max_amount === null || t.max_amount === undefined || amount <= Number(t.max_amount))
        ) || null
    );
}

export function tierByKey(tiers: Tier[] | undefined, key: string) {
    return tiers?.find((t) => t.tier_key === key);
}

export function rangeLabel(tier: Tier, tiers: Tier[]) {
    if (tier.max_amount !== null && tier.max_amount !== undefined && Number(tier.max_amount) === Number(tier.min_amount)) {
        return `${tier.min_amount} بالضبط`;
    }
    const next = [...tiers]
        .filter((t) => Number(t.min_amount) > Number(tier.min_amount) && (t.max_amount === null || Number(t.max_amount) !== Number(t.min_amount)))
        .sort((a, b) => Number(a.min_amount) - Number(b.min_amount))[0];
    return next ? `${tier.min_amount} – ${Number(next.min_amount) - 0.01}` : `${tier.min_amount}+`;
}
