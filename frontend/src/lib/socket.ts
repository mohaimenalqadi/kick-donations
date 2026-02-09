'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export interface DonationEvent {
    id: string;
    donor_name: string;
    amount: number;
    message: string;
    tier: string;
    duration: number;
    color: string;
    label: string;
    background_url?: string;
    sound_url?: string;
    emittedAt: string;
}

export interface StatusUpdateEvent {
    donationId: string;
    status: string;
    updatedAt: string;
}

export function getSocket(): Socket {
    if (!socket) {
        socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket(clientType: 'admin' | 'overlay'): Socket {
    const s = getSocket();

    if (!s.connected) {
        s.connect();

        s.on('connect', () => {
            console.log('🔌 WebSocket connected');
            s.emit('register', clientType);
        });

        s.on('connected', (data) => {
            console.log('✅ Registered as:', data.type);
        });

        s.on('disconnect', () => {
            console.log('📴 WebSocket disconnected');
        });

        s.on('error', (error) => {
            console.warn('❌ WebSocket Error Object:', error);
            // Don't use console.error for generic event objects to avoid overlay spam
            const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
            console.warn('❌ WebSocket connection issue:', errorMsg);
        });
    }

    return s;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// Event listeners
export function onNewDonation(callback: (donation: DonationEvent) => void): () => void {
    const s = getSocket();
    s.on('donation:new', callback);
    return () => s.off('donation:new', callback);
}

export function onStatusUpdate(callback: (update: StatusUpdateEvent) => void): () => void {
    const s = getSocket();
    s.on('donation:status_updated', callback);
    return () => s.off('donation:status_updated', callback);
}

export function emitDonationDisplayed(donationId: string): void {
    const s = getSocket();
    s.emit('donation:displayed', { donationId });
}

export function emitOverlayReady(): void {
    const s = getSocket();
    s.emit('overlay:ready');
}
