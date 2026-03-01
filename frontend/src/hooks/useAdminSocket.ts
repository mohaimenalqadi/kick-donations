'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createAdminSocket } from '@/lib/socket';
import type { Donation, Presence } from '@/lib/types';
import { qk } from './queries';

/**
 * Dashboard real-time link: keeps donation lists and overlay presence fresh
 * without polling. One connection per dashboard session.
 */
export function useAdminSocket(enabled: boolean) {
    const qc = useQueryClient();
    const [connected, setConnected] = useState(false);
    const [presence, setPresence] = useState<Presence>({ adminCount: 0, overlayCount: 0, nowPlaying: null });

    useEffect(() => {
        if (!enabled) return;
        const socket = createAdminSocket(() => api.socketTicket().then((r) => r.ticket));

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('connect_error', () => setConnected(false));

        socket.on('overlay:presence', (p: Presence) => setPresence(p));

        socket.on('donation:status_updated', (u: { donationId: string; status: Donation['status'] | 'deleted'; displayedAt?: string }) => {
            // Patch cached pages in place for instant feedback, then refetch in the background.
            qc.setQueriesData<{ items: Donation[] }>({ queryKey: qk.donationsAll }, (old) => {
                if (!old?.items || u.status === 'deleted') return old;
                return {
                    ...old,
                    items: old.items.map((d) =>
                        d.id === u.donationId ? { ...d, status: u.status as Donation['status'], displayed_at: u.displayedAt ?? d.displayed_at } : d
                    ),
                };
            });
            qc.invalidateQueries({ queryKey: qk.donationsAll });
            qc.invalidateQueries({ queryKey: qk.stats });
        });

        socket.on('donations:reset', () => {
            qc.invalidateQueries({ queryKey: qk.donationsAll });
            qc.invalidateQueries({ queryKey: qk.stats });
        });

        socket.on('settings:updated', () => {
            qc.invalidateQueries({ queryKey: qk.settings });
            qc.invalidateQueries({ queryKey: qk.branding });
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [enabled, qc]);

    return { connected, presence };
}
