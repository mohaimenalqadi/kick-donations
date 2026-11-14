'use client';

import { io, type Socket } from 'socket.io-client';
import { WS_URL } from './config';

/**
 * Socket factory. Every connection authenticates in the handshake:
 * - dashboard: a fresh short-lived ticket is fetched on every (re)connect
 * - overlay:   the overlay key from the page URL
 * Reconnection uses exponential backoff with jitter (socket.io defaults, tuned).
 */
export function createAdminSocket(getTicket: () => Promise<string>): Socket {
    return io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 15000,
        randomizationFactor: 0.5,
        auth: (cb) => {
            getTicket()
                .then((token) => cb({ type: 'admin', token }))
                .catch(() => cb({ type: 'admin', token: '' }));
        },
    });
}

export function createOverlaySocket(key: string): Socket {
    return io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        auth: { type: 'overlay', key },
    });
}
