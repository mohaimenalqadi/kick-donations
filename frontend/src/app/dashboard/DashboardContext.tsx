'use client';

import { createContext, useContext } from 'react';
import type { Presence, User } from '@/lib/types';

interface DashboardCtx {
    user: User;
    isAdmin: boolean;
    socketConnected: boolean;
    presence: Presence;
}

export const DashboardContext = createContext<DashboardCtx | null>(null);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used inside the dashboard layout');
    return ctx;
}
