'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Globe, History, Monitor, Shield } from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { PageLoader } from '@/components/ui/primitives';
import GeneralTab from '@/components/settings/GeneralTab';
import OverlayTab from '@/components/settings/OverlayTab';
import TiersTab from '@/components/settings/TiersTab';
import SecurityTab from '@/components/settings/SecurityTab';
import ActivityTab from '@/components/settings/ActivityTab';

const TABS = [
    { id: 'general', label: 'عام', icon: Globe, Component: GeneralTab },
    { id: 'overlay', label: 'صفحة العرض', icon: Monitor, Component: OverlayTab },
    { id: 'tiers', label: 'الفئات', icon: CreditCard, Component: TiersTab },
    { id: 'security', label: 'الأمان', icon: Shield, Component: SecurityTab },
    { id: 'activity', label: 'سجل النشاط', icon: History, Component: ActivityTab },
] as const;

function SettingsInner() {
    const { isAdmin } = useDashboard();
    const router = useRouter();
    const params = useSearchParams();
    const active = TABS.find((t) => t.id === params.get('tab')) || TABS[0];

    useEffect(() => {
        if (!isAdmin) router.replace('/dashboard');
    }, [isAdmin, router]);
    if (!isAdmin) return null;

    const Active = active.Component;

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
            <nav aria-label="أقسام الإعدادات" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:px-0">
                {TABS.map((t) => {
                    const on = t.id === active.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => router.replace(`/dashboard/settings?tab=${t.id}`, { scroll: false })}
                            aria-current={on ? 'page' : undefined}
                            className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${on ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-white/[0.04] hover:text-ink'}`}
                        >
                            <t.icon size={18} />
                            {t.label}
                        </button>
                    );
                })}
            </nav>
            <div className="min-w-0 flex-1 animate-fade-up" key={active.id}>
                <Active />
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <SettingsInner />
        </Suspense>
    );
}
