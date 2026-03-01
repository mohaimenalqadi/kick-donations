'use strict';

const { loadConfig } = require('../src/config/env');
const { buildApp } = require('../src/app');

/**
 * Minimal stand-in for the Supabase client: every query-builder call chains,
 * and awaiting the builder resolves with whatever `respond(table, calls)`
 * returns. Lets route tests run without a database or network.
 */
function fakeDb(respond = () => ({ data: [], error: null, count: 0 })) {
    function builder(table) {
        const calls = [];
        const proxy = new Proxy({}, {
            get(_t, prop) {
                if (prop === 'then') {
                    return (resolve, reject) => Promise.resolve(respond(table, calls)).then(resolve, reject);
                }
                return (...args) => {
                    calls.push([prop, ...args]);
                    return proxy;
                };
            },
        });
        return proxy;
    }
    return {
        from: (table) => builder(table),
        rpc: (fn, args) => Promise.resolve(respond(`rpc:${fn}`, [['rpc', args]])),
        storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://x/y' } }) }) },
    };
}

function testConfig(overrides = {}) {
    return loadConfig({
        NODE_ENV: 'test',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_KEY: 'service-key',
        JWT_SECRET: 'x'.repeat(48),
        FRONTEND_URL: 'https://app.example.com',
        SMS_AUTOMATION_KEY: 'k'.repeat(32),
        ...overrides,
    });
}

async function makeApp({ respond, config } = {}) {
    const app = await buildApp(config || testConfig(), { db: fakeDb(respond), withRealtime: false, logger: false });
    await app.ready();
    return app;
}

module.exports = { fakeDb, testConfig, makeApp };
