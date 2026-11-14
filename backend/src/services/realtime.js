'use strict';

const { Server } = require('socket.io');
const { safeEqual } = require('../lib/crypto');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Real-time channel.
 *
 * Every socket must authenticate during the handshake:
 *   - dashboard: `{ type: 'admin', token }` where token is a short-lived
 *     socket ticket from GET /api/auth/socket-ticket
 *   - overlay:   `{ type: 'overlay', key }` where key is the overlay key
 *
 * Sockets are placed in the `admin` or `overlay` room and events are only
 * sent to the room that needs them — anonymous clients receive nothing and
 * cannot change donation state.
 */
function createRealtime({ httpServer, config, log, verifyTicket, getOverlayKey }) {
    const io = httpServer
        ? new Server(httpServer, {
            cors: { origin: config.allowedOrigins, credentials: true },
            maxHttpBufferSize: 16 * 1024,
            pingInterval: 20_000,
            pingTimeout: 20_000,
        })
        : null;

    /** Last donation the overlay reported as on screen. */
    let nowPlaying = null;
    /** @type {(id: string) => Promise<boolean>} set by app once services exist */
    let onDisplayed = async () => false;

    const roomSize = (room) => (io ? io.sockets.adapter.rooms.get(room)?.size || 0 : 0);

    function presence() {
        return { adminCount: roomSize('admin'), overlayCount: roomSize('overlay'), nowPlaying };
    }

    function broadcastPresence() {
        io?.to('admin').emit('overlay:presence', presence());
    }

    if (io) {
        io.use(async (socket, next) => {
            try {
                const auth = socket.handshake.auth || {};
                if (auth.type === 'admin' && typeof auth.token === 'string') {
                    const user = await verifyTicket(auth.token);
                    if (!user) return next(new Error('unauthorized'));
                    socket.data.role = 'admin';
                    socket.data.user = user;
                    return next();
                }
                if (auth.type === 'overlay' && typeof auth.key === 'string') {
                    const expected = await getOverlayKey();
                    if (!expected || !safeEqual(auth.key, expected)) return next(new Error('unauthorized'));
                    socket.data.role = 'overlay';
                    return next();
                }
                return next(new Error('unauthorized'));
            } catch (err) {
                log.error({ err }, 'socket auth failed');
                return next(new Error('unauthorized'));
            }
        });

        io.on('connection', (socket) => {
            const role = socket.data.role;
            socket.join(role);
            socket.emit('connected', { id: socket.id, type: role });
            broadcastPresence();

            if (role === 'overlay') {
                socket.on('donation:started', (data) => {
                    if (!data || !UUID_RE.test(String(data.donationId))) return;
                    nowPlaying = { donationId: data.donationId, startedAt: new Date().toISOString() };
                    broadcastPresence();
                });

                socket.on('donation:displayed', async (data) => {
                    const id = data && String(data.donationId);
                    if (!UUID_RE.test(id || '')) return;
                    try {
                        await onDisplayed(id);
                    } catch (err) {
                        log.error({ err, donationId: id }, 'failed to mark donation displayed');
                    }
                    if (nowPlaying?.donationId === id) nowPlaying = null;
                    broadcastPresence();
                });
            }

            socket.on('disconnect', () => {
                if (role === 'overlay' && roomSize('overlay') === 0) nowPlaying = null;
                broadcastPresence();
            });
        });
    }

    return {
        io,
        presence,
        setDisplayedHandler(fn) {
            onDisplayed = fn;
        },
        /** Queue a donation on every overlay. */
        showDonation(enriched) {
            io?.to('overlay').emit('donation:new', { ...enriched, emittedAt: new Date().toISOString() });
        },
        /** Play a preview alert that is not stored anywhere. */
        showTest(enriched) {
            io?.to('overlay').emit('donation:new', { ...enriched, test: true, emittedAt: new Date().toISOString() });
        },
        skipCurrent() {
            io?.to('overlay').emit('overlay:skip');
        },
        clearOverlayQueue() {
            io?.to('overlay').emit('overlay:clear');
        },
        donationChanged(donationId, status, displayedAt) {
            io?.to('admin').emit('donation:status_updated', { donationId, status, displayedAt });
        },
        donationsReset() {
            io?.to('admin').emit('donations:reset');
            io?.to('overlay').emit('overlay:clear');
        },
        settingsChanged(publicSettings) {
            io?.emit('settings:updated', publicSettings);
        },
        tiersChanged(tiers) {
            io?.to('overlay').emit('tiers:updated', tiers);
        },
        /** Kick every overlay (e.g. after rotating the overlay key). */
        async disconnectOverlays() {
            if (!io) return;
            const sockets = await io.in('overlay').fetchSockets();
            sockets.forEach((s) => s.disconnect(true));
        },
        close() {
            return new Promise((resolve) => (io ? io.close(() => resolve()) : resolve()));
        },
    };
}

module.exports = { createRealtime, UUID_RE };
