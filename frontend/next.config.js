/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable static export for Netlify
    output: 'standalone',

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    },

    // Optimize for streaming overlays
    images: {
        unoptimized: true,
    },

    // Headers for CORS and security
    async headers() {
        return [
            {
                source: '/overlay',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
