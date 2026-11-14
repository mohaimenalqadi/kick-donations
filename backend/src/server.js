'use strict';

const { loadConfig } = require('./config/env');
const { buildApp } = require('./app');

async function start() {
    let config;
    try {
        config = loadConfig();
    } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
    }

    const app = await buildApp(config);

    const problems = await app.checkSchema().catch((err) => [`schema check failed: ${err.message}`]);
    if (problems.length) {
        app.log.error(
            { problems },
            'DATABASE MIGRATION REQUIRED — run backend/migrations/*.sql in the Supabase SQL editor. /health reports 503 until fixed.'
        );
    }

    await app.listen({ port: config.port, host: config.host });

    // Graceful shutdown: stop accepting connections, finish in-flight requests.
    let closing = false;
    const shutdown = async (signal) => {
        if (closing) return;
        closing = true;
        app.log.info({ signal }, 'shutting down');
        const timer = setTimeout(() => process.exit(1), 10_000);
        timer.unref();
        try {
            await app.close();
            process.exit(0);
        } catch (err) {
            app.log.error({ err }, 'error during shutdown');
            process.exit(1);
        }
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (err) => app.log.error({ err }, 'unhandled rejection'));
}

start().catch((err) => {
    console.error('❌ Startup error:', err);
    process.exit(1);
});
