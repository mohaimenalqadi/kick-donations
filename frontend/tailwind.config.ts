import type { Config } from 'tailwindcss';

/**
 * Design tokens. Colours are defined once here and used through utility
 * classes (bg-surface, text-brand, ...) instead of hard-coded hex values.
 */
const config: Config = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#03e115', // Kick green — also the OBS chroma-key colour
                    soft: 'rgb(3 225 21 / 0.12)',
                    ring: 'rgb(3 225 21 / 0.35)',
                    ink: '#04130a',      // text on brand-coloured surfaces
                },
                canvas: '#0a0a0b',
                surface: {
                    DEFAULT: '#111114',
                    raised: '#17171b',
                    sunken: '#0c0c0e',
                },
                line: {
                    DEFAULT: 'rgb(255 255 255 / 0.07)',
                    strong: 'rgb(255 255 255 / 0.14)',
                },
                ink: {
                    DEFAULT: '#f4f4f5',
                    muted: '#a1a1aa',
                    faint: '#71717a',
                },
                danger: { DEFAULT: '#f87171', soft: 'rgb(248 113 113 / 0.12)' },
                warning: { DEFAULT: '#fbbf24', soft: 'rgb(251 191 36 / 0.12)' },
                info: { DEFAULT: '#60a5fa', soft: 'rgb(96 165 250 / 0.12)' },
            },
            fontFamily: {
                sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1.25rem',
                '3xl': '1.75rem',
            },
            boxShadow: {
                glow: '0 0 0 1px rgb(3 225 21 / 0.25), 0 8px 30px -8px rgb(3 225 21 / 0.35)',
                card: '0 1px 0 0 rgb(255 255 255 / 0.03) inset, 0 20px 40px -24px rgb(0 0 0 / 0.8)',
            },
            keyframes: {
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(-100%)' },
                },
            },
            animation: {
                'fade-up': 'fade-up 0.35s ease-out both',
                shimmer: 'shimmer 1.4s infinite',
            },
        },
    },
    plugins: [],
};

export default config;
