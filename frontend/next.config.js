/** @type {import('next').NextConfig} */

// Backend origin. BACKEND_URL (server-only) wins; NEXT_PUBLIC_API_URL is the
// legacy variable already configured on Netlify.
const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || BACKEND_URL).replace(/\/+$/, '');
const wsOrigin = WS_URL.replace(/^http/, 'ws');
const isDev = process.env.NODE_ENV !== 'production';

// Next.js App Router needs inline scripts for hydration; framer-motion needs inline styles.
const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Tier media can be hosted anywhere over https (Supabase Storage, Pixabay, Giphy...).
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: blob:",
    `connect-src 'self' ${BACKEND_URL} ${WS_URL} ${wsOrigin}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
].join('; ');

const securityHeaders = [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    output: 'standalone',
    images: { unoptimized: true },

    // Same-origin API: the browser talks to /api on this domain, so the session
    // cookie is first-party (works with Safari/Chrome third-party cookie blocking).
    async rewrites() {
        return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
    },

    async headers() {
        return [
            { source: '/:path*', headers: securityHeaders },
            // Never cache authenticated pages or the overlay (it holds a secret key in its URL).
            { source: '/(dashboard|overlay)(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
        ];
    },
};

module.exports = nextConfig;
