const { supabase } = require('../config/database');

/**
 * WebSocket service for real-time donation updates
 */

let connectedClients = {
    admin: new Set(),
    overlay: new Set()
};

/**
 * Initialize Socket.io handlers
 * @param {Server} io - Socket.io server instance
 */
function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log(`📱 New connection: ${socket.id}`);

        // Handle client type registration
        socket.on('register', (clientType) => {
            if (clientType === 'admin') {
                connectedClients.admin.add(socket.id);
                console.log(`👤 Admin connected: ${socket.id}`);
            } else if (clientType === 'overlay') {
                connectedClients.overlay.add(socket.id);
                console.log(`🎬 Overlay connected: ${socket.id}`);
            }

            socket.clientType = clientType;

            // Send connection confirmation
            socket.emit('connected', {
                id: socket.id,
                type: clientType,
                timestamp: new Date().toISOString()
            });
        });

        // Handle donation status updates from overlay
        socket.on('donation:displayed', async (data) => {
            console.log(`✅ Donation displayed: ${data.donationId}`);

            try {
                // Update database to done
                await supabase
                    .from('donations')
                    .update({
                        status: 'done',
                        displayed_at: new Date().toISOString()
                    })
                    .eq('id', data.donationId);

                // Notify admin clients of status change
                io.emit('donation:status_updated', {
                    donationId: data.donationId,
                    status: 'done',
                    displayedAt: new Date().toISOString()
                });
            } catch (err) {
                console.error('❌ Error updating donation status in socket:', err);
            }
        });

        // Handle overlay ready signal
        socket.on('overlay:ready', () => {
            console.log(`🎬 Overlay ready: ${socket.id}`);
            socket.emit('overlay:acknowledged');
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`📴 Disconnected: ${socket.id}`);
            connectedClients.admin.delete(socket.id);
            connectedClients.overlay.delete(socket.id);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`❌ Socket error: ${error.message}`);
        });
    });

    console.log('🔌 WebSocket handlers initialized');
}

/**
 * Emit new donation to all overlay clients
 * @param {object} donation - Donation data
 */
function emitNewDonation(donation) {
    if (global.io) {
        global.io.emit('donation:new', {
            ...donation,
            emittedAt: new Date().toISOString()
        });
        console.log(`📤 Donation emitted: ${donation.id}`);
    }
}

/**
 * Emit donation status update
 * @param {string} donationId - Donation ID
 * @param {string} status - New status
 */
function emitStatusUpdate(donationId, status) {
    if (global.io) {
        global.io.emit('donation:status_updated', {
            donationId,
            status,
            updatedAt: new Date().toISOString()
        });
    }
}

/**
 * Get connection stats
 * @returns {object} Connection statistics
 */
function getConnectionStats() {
    return {
        adminCount: connectedClients.admin.size,
        overlayCount: connectedClients.overlay.size,
        total: connectedClients.admin.size + connectedClients.overlay.size
    };
}

module.exports = {
    initializeSocket,
    emitNewDonation,
    emitStatusUpdate,
    getConnectionStats
};
