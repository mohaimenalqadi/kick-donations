import type { Metadata } from 'next';
import './globals.css';
import TitleManager from '@/components/TitleManager';

export const metadata: Metadata = {
    title: 'Kick Donations - منصة تبرعات البث المباشر',
    description: 'منصة تبرعات احترافية للستريمرز في ليبيا',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body className="min-h-screen">
                <TitleManager />
                {children}
            </body>
        </html>
    );
}
