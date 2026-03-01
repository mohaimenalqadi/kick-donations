'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Central query keys so invalidation is consistent across the app. */
export const qk = {
    me: ['me'] as const,
    branding: ['branding'] as const,
    settings: ['settings'] as const,
    tiers: ['tiers'] as const,
    stats: ['stats'] as const,
    presence: ['presence'] as const,
    donations: (filters: object) => ['donations', filters] as const,
    donationsAll: ['donations'] as const,
    analytics: (start?: string, end?: string) => ['analytics', start, end] as const,
    users: ['users'] as const,
    overlayKey: ['overlay-key'] as const,
    activity: (page: number, action?: string) => ['activity', page, action] as const,
};

export function useMe() {
    return useQuery({ queryKey: qk.me, queryFn: () => api.me().then((r) => r.user), staleTime: 60_000 });
}

export function useBranding() {
    return useQuery({ queryKey: qk.branding, queryFn: api.branding, staleTime: 5 * 60_000 });
}

export function useTiers(enabled = true) {
    return useQuery({ queryKey: qk.tiers, queryFn: () => api.tiers().then((r) => r.tiers), staleTime: 60_000, enabled });
}
