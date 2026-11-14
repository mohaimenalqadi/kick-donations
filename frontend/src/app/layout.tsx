import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import TitleManager from '@/components/TitleManager';

const cairo = Cairo({
    subsets: ['arabic', 'latin'],
    weight: ['400', '600', '700', '800', '900'],
    variable: '--font-cairo',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'KickPay - منصة تبرعات البث المباشر',
    description: 'منصة تبرعات احترافية للستريمرز في ليبيا',
    robots: { index: false, follow: false },
};

export const viewport: Viewport = {
    themeColor: '#0a0a0b',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ar" dir="rtl" className={cairo.variable}>
            <body className="min-h-screen">
                <Providers>
                    <TitleManager />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
