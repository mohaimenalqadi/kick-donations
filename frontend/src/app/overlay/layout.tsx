'use client';

export default function OverlayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen w-full"
            style={{ background: 'transparent' }}
        >
            {children}
        </div>
    );
}
