'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { audioManager } from '@/lib/audio';
import { createOverlaySocket } from '@/lib/socket';
import type { OverlayDonation, PublicSettings, Tier } from '@/lib/types';
import type { Socket } from 'socket.io-client';

const GAP_BETWEEN_ALERTS_MS = 1500;
const DONE_MEMORY = 200;

export type OverlayStatus = 'connecting' | 'online' | 'offline' | 'unauthorized';

/**
 * Overlay state machine.
 *
 * - The server resolves every donation's tier/presentation; the overlay just plays them.
 * - Queue is de-duplicated by id: reconnects and multiple deliveries never
 *   show the same alert twice (the old overlay re-queued the alert on screen
 *   after every reconnect).
 * - `donation:started` / `donation:displayed` acks tell the server what is on
 *   screen, which powers the dashboard's "now playing" and skip controls.
 */
export function useOverlayController(key: string | null, enabled: boolean) {
    const [status, setStatus] = useState<OverlayStatus>('connecting');
    const [settings, setSettings] = useState<PublicSettings | null>(null);
    const [current, setCurrent] = useState<OverlayDonation | null>(null);
    const [queueLength, setQueueLength] = useState(0);
    const [top, setTop] = useState<{ donor_name: string; amount: number } | null>(null);

    const queueRef = useRef<OverlayDonation[]>([]);
    const currentRef = useRef<OverlayDonation | null>(null);
    const doneRef = useRef<string[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const tiersRef = useRef<Tier[]>([]);
    const gapTimer = useRef<ReturnType<typeof setTimeout>>();
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;

    const isKnown = (id: string) =>
        currentRef.current?.id === id || queueRef.current.some((d) => d.id === id) || doneRef.current.includes(id);

    /** Re-applies the latest tier config (e.g. admin changed a sound) to queued items. */
    const applyTier = useCallback((d: OverlayDonation): OverlayDonation => {
        const t = tiersRef.current.find((x) => x.tier_key === d.tier);
        if (!t) return d;
        return {
            ...d,
            label: t.label,
            color: t.color,
            duration: t.duration,
            volume: t.volume,
            background_url: t.background_url,
            sound_url: t.sound_url,
        };
    }, []);

    const playNext = useCallback(() => {
        if (!enabledRef.current || currentRef.current || gapTimer.current) return;
        const next = queueRef.current.shift();
        setQueueLength(queueRef.current.length);
        if (!next) return;
        const ready = applyTier(next);
        currentRef.current = ready;
        setCurrent(ready);
        if (!ready.test) socketRef.current?.emit('donation:started', { donationId: ready.id });
        // Warm the cache for whatever comes after.
        const after = queueRef.current[0];
        if (after) audioManager.preload(applyTier(after).sound_url);
    }, [applyTier]);

    const enqueue = useCallback(
        (items: OverlayDonation[]) => {
            let added = false;
            for (const d of items) {
                if (!d?.id || isKnown(d.id)) continue;
                queueRef.current.push(d);
                added = true;
            }
            if (added) {
                setQueueLength(queueRef.current.length);
                playNext();
            }
        },
        [playNext]
    );

    const refreshTop = useCallback(async () => {
        if (!key) return;
        try {
            setTop((await api.overlayTop(key)).top);
        } catch {
            /* non-critical */
        }
    }, [key]);

    /** Called by the tier component when its timer ends, or on skip. */
    const complete = useCallback(() => {
        const done = currentRef.current;
        if (!done) return;
        audioManager.stopAll();
        if (!done.test) {
            socketRef.current?.emit('donation:displayed', { donationId: done.id });
            doneRef.current = [...doneRef.current.slice(-DONE_MEMORY + 1), done.id];
            refreshTop();
        }
        currentRef.current = null;
        setCurrent(null);
        gapTimer.current = setTimeout(() => {
            gapTimer.current = undefined;
            playNext();
        }, GAP_BETWEEN_ALERTS_MS);
    }, [playNext, refreshTop]);

    const bootstrap = useCallback(async () => {
        if (!key) return;
        try {
            const data = await api.overlayBootstrap(key);
            tiersRef.current = data.tiers;
            setSettings(data.settings);
            setTop(data.top);
            audioManager.setMuted(!!data.settings.mute_overlay);
            enqueue(data.queue);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) setStatus('unauthorized');
        }
    }, [key, enqueue]);

    // Socket lifecycle
    useEffect(() => {
        if (!key) return;
        const socket = createOverlaySocket(key);
        socketRef.current = socket;

        socket.on('connect', () => {
            setStatus('online');
            bootstrap(); // also recovers anything missed while offline (deduped)
        });
        socket.on('disconnect', () => setStatus('offline'));
        socket.on('connect_error', (err) => setStatus(err.message === 'unauthorized' ? 'unauthorized' : 'offline'));

        socket.on('donation:new', (d: OverlayDonation) => enqueue([d]));
        socket.on('overlay:skip', () => complete());
        socket.on('overlay:clear', () => {
            queueRef.current = [];
            setQueueLength(0);
        });
        socket.on('tiers:updated', (tiers: Tier[]) => {
            tiersRef.current = tiers;
        });
        socket.on('settings:updated', (s: PublicSettings) => {
            setSettings(s);
            audioManager.setMuted(!!s.mute_overlay);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            audioManager.stopAll();
            if (gapTimer.current) clearTimeout(gapTimer.current);
        };
    }, [key, bootstrap, enqueue, complete]);

    // Start playing once the user has unlocked audio.
    useEffect(() => {
        if (enabled) playNext();
    }, [enabled, playNext]);

    return { status, settings, current, queueLength, top, complete };
}
