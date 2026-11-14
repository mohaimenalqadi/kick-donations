'use client';

import { Loader2, type LucideIcon } from 'lucide-react';
import { splitBrand } from '@/lib/format';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
    return <Loader2 size={size} className={`animate-spin text-brand ${className}`} aria-hidden />;
}

export function PageLoader({ label = 'جاري التحميل...' }: { label?: string }) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-muted" role="status">
            <Spinner size={28} />
            <span className="text-sm font-semibold">{label}</span>
        </div>
    );
}

export function BrandTitle({ title, className = '' }: { title: string; className?: string }) {
    const [head, tail] = splitBrand(title || 'KickPay');
    return (
        <span className={`font-black italic tracking-tight ${className}`} dir="ltr">
            {head}
            <span className="text-brand">{tail}</span>
        </span>
    );
}

export function EmptyState({ icon: Icon, title, description, action }: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-ink-faint">
                <Icon size={26} />
            </div>
            <p className="font-bold text-ink">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
                <h2 className="text-lg font-black text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export function StatusDot({ online, label }: { online: boolean; label?: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
                {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? 'bg-brand' : 'bg-danger'}`} />
            </span>
            {label && <span className="text-xs font-bold text-ink-muted">{label}</span>}
        </span>
    );
}
