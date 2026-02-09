import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Kick-inspired color palette
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#53fc18', // Kick green
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                dark: {
                    100: '#1e1e2e',
                    200: '#181825',
                    300: '#11111b',
                    400: '#0a0a0f',
                },
                // Donation tiers
                tier: {
                    basic: '#4CAF50',
                    medium: '#2196F3',
                    professional: '#9C27B0',
                    cinematic: '#FF9800',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                arabic: ['Cairo', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'scale-in': 'scaleIn 0.5s ease-out',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'shake': 'shake 0.5s ease-in-out',
                'cinematic-enter': 'cinematicEnter 1s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.8)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(83, 252, 24, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(83, 252, 24, 0.6)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                cinematicEnter: {
                    '0%': { opacity: '0', transform: 'scale(1.5)' },
                    '50%': { opacity: '1', transform: 'scale(1.1)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            boxShadow: {
                'neon': '0 0 10px rgba(83, 252, 24, 0.5), 0 0 20px rgba(83, 252, 24, 0.3)',
                'neon-strong': '0 0 20px rgba(83, 252, 24, 0.7), 0 0 40px rgba(83, 252, 24, 0.5)',
            },
        },
    },
    plugins: [],
};

export default config;
