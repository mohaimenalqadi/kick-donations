require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const rateLimit = require('@fastify/rate-limit');
const cookie = require('@fastify/cookie');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const settingsRoutes = require('./routes/settings');
const tierSettingsRoutes = require('./routes/tier-settings');

// Import services
const { initializeSocket } = require('./services/websocket');

async function buildServer() {
    const fastify = Fastify({
        logger: true
    });

    // Register Plugins
    await fastify.register(cors, {
        origin: [
            'http://localhost:3000',
            'https://kick-donations.vercel.app',
            process.env.CORS_ORIGIN
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
    });

    await fastify.register(cookie, {
        secret: process.env.JWT_SECRET,
        parseOptions: {}
    });

    await fastify.register(jwt, {
        secret: process.env.JWT_SECRET,
        cookie: {
            cookieName: 'token',
            signed: false
        }
    });

    await fastify.register(rateLimit, {
        max: 500,
        timeWindow: '1 minute'
    });

    // Decorate fastify with auth
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            const token = request.cookies.token || request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return reply.code(401).send({ error: 'غير مصرح - يجب تسجيل الدخول' });
            }
            const decoded = fastify.jwt.verify(token);
            request.user = decoded;
        } catch (err) {
            return reply.code(401).send({ error: 'جلسة منتهية - يرجى إعادة تسجيل الدخول' });
        }
    });

    // Register Routes
    fastify.register(authRoutes, { prefix: '/api/auth' });
    fastify.register(settingsRoutes, { prefix: '/api/settings' });
    fastify.register(tierSettingsRoutes, { prefix: '/api/tier-settings' });
    fastify.register(donationRoutes, { prefix: '/api/donations' });

    // Root route
    fastify.get('/', async () => {
        return {
            message: 'Kick Donation API is running!',
            version: '1.0.0',
            status: 'healthy'
        };
    });

    // Health check
    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    return fastify;
}

async function start() {
    try {
        const server = await buildServer();

        // Start Fastify
        await server.listen({
            port: process.env.PORT || 3001,
            host: '0.0.0.0'
        });

        // Initialize Socket.io
        io = new Server(server.server, {
            cors: {
                origin: true,
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // Setup WebSocket handlers
        initializeSocket(io);

        // Make io accessible globally
        global.io = io;

        console.log(`🚀 Server running on port ${process.env.PORT || 3001}`);
        console.log(`📡 WebSocket server ready`);

    } catch (err) {
        console.error('❌ Startup Error:', err);
        process.exit(1);
    }
}

start();

module.exports = { buildServer };
