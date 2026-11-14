'use strict';

/**
 * Centralised, validated environment configuration.
 * The process refuses to start with an insecure or incomplete configuration
 * instead of failing later at runtime.
 */
require('dotenv').config();

function list(value) {
    return String(value || '')
        .split(',')
        .map((v) => v.trim().replace(/\/+$/, ''))
        .filter(Boolean);
}

function bool(value, fallback) {
    if (value === undefined || value === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}

function loadConfig(env = process.env) {
    const nodeEnv = env.NODE_ENV || 'development';
    const isProd = nodeEnv === 'production';
    const isTest = nodeEnv === 'test';

    const config = {
        nodeEnv,
        isProd,
        isTest,
        port: int(env.PORT, 3001),
        host: env.HOST || '0.0.0.0',

        supabaseUrl: env.SUPABASE_URL,
        supabaseServiceKey: env.SUPABASE_SERVICE_KEY,
        storageBucket: env.SUPABASE_STORAGE_BUCKET || 'overlay-media',

        jwtSecret: env.JWT_SECRET,
        sessionTtlHours: int(env.SESSION_TTL_HOURS, 12),

        allowedOrigins: list(env.FRONTEND_URL || 'http://localhost:3000'),
        cookieSecure: bool(env.COOKIE_SECURE, isProd),
        cookieSameSite: (env.COOKIE_SAMESITE || 'lax').toLowerCase(),

        trustProxyHops: int(env.TRUST_PROXY_HOPS, 2),
        timezone: env.TIMEZONE || 'Africa/Tripoli',

        smsAutomationKey: env.SMS_AUTOMATION_KEY || '',
        uploadMaxMb: int(env.UPLOAD_MAX_MB, 30),
    };

    const errors = [];
    if (!config.supabaseUrl) errors.push('SUPABASE_URL is required');
    if (!config.supabaseServiceKey) errors.push('SUPABASE_SERVICE_KEY is required');
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
        errors.push('JWT_SECRET is required and must be at least 32 characters');
    }
    if (!['lax', 'strict', 'none'].includes(config.cookieSameSite)) {
        errors.push('COOKIE_SAMESITE must be one of lax|strict|none');
    }
    if (config.cookieSameSite === 'none' && !config.cookieSecure) {
        errors.push('COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
    }
    if (config.smsAutomationKey && config.smsAutomationKey.length < 24) {
        errors.push('SMS_AUTOMATION_KEY must be at least 24 characters when set');
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: config.timezone });
    } catch {
        errors.push(`TIMEZONE "${config.timezone}" is not a valid IANA zone`);
    }

    if (errors.length) {
        const err = new Error(`Invalid configuration:\n - ${errors.join('\n - ')}`);
        err.code = 'INVALID_CONFIG';
        throw err;
    }

    return Object.freeze(config);
}

module.exports = { loadConfig };
