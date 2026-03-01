'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { HelpCircle, LayoutDashboard, LogOut, Menu, MonitorPlay, Settings, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useBranding, useMe } from '@/hooks/queries';
import { useAdminSocket } from '@/hooks/useAdminSocket';
import { BrandTitle, PageLoader, StatusDot } from '@/components/ui/primitives';
import { DashboardContext } from './DashboardContext';

const NAV = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { name: 'الملف الشخصي', href: '/dashboard/profile', icon: UserIcon },
    { name: 'المسؤولون', href: '/dashboard/responsibilities', icon: ShieldCheck, adminOnly: true },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings, adminOnly: true },
    { name: 'مركز المساعدة', href: '/dashboard/help', icon: HelpCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const qc = useQueryClient();
    const [mobileOpen, setMobileOpen] = useState(false);
    const me = useMe();
    const { data: branding } = useBranding();
    const user = me.data;
    const { connected, presence } = useAdminSocket(!!user);

    useEffect(() => {
        if (me.error instanceof ApiError && me.error.status === 401) router.replace('/login');
    }, [me.error, router]);

    useEffect(() => setMobileOpen(false), [pathname]);

    if (me.isLoading) return <PageLoader label="جاري التحقق من الجلسة..." />;
    if (!user) {
        if (me.error && !(me.error instanceof ApiError && me.error.status === 401)) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
                    <p className="font-bold">{me.error.message}</p>
                    <button className="btn-secondary" onClick={() => me.refetch()}>إعادة المحاولة</button>
                </div>
            );
        }
        return <PageLoader />;
    }

    const isAdmin = user.role === 'admin';
    const items = NAV.filter((i) => !i.adminOnly || isAdmin);
    const current = items.find((i) => i.href === pathname) || items[0];
    const overlayOnline = presence.overlayCount > 0;

    async function logout() {
        try {
            await api.logout();
        } finally {
            qc.clear();
            router.replace('/login');
        }
    }

    const nav = (
        <nav className="space-y-1" aria-label="التنقل الرئيسي">
            {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                            active ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-white/[0.04] hover:text-ink'
                        }`}
                    >
                        <Icon size={19} />
                        <span>{item.name}</span>
                        {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-brand shadow-glow" />}
                    </Link>
                );
            })}
        </nav>
    );

    const sidebarFooter = (
        <div className="space-y-3 border-t border-line p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised font-black text-brand">
                    {user.username[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold" dir="ltr">{user.username}</p>
                    <p className="text-[11px] font-bold text-ink-faint">{isAdmin ? 'مشرف' : 'مشرف مساعد'}</p>
                </div>
            </div>
            <button onClick={logout} className="btn-ghost w-full justify-start text-danger hover:bg-danger-soft hover:text-danger">
                <LogOut size={18} />
                تسجيل الخروج
            </button>
        </div>
    );

    return (
        <DashboardContext.Provider value={{ user, isAdmin, socketConnected: connected, presence }}>
            <div className="min-h-screen lg:flex">
                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink">
                    تخطي إلى المحتوى
                </a>

                {/* Desktop sidebar */}
                <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-line bg-surface lg:flex">
                    <div className="flex items-center gap-3 px-6 pb-6 pt-7">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-ink shadow-glow">
                            <MonitorPlay size={20} />
                        </div>
                        <BrandTitle title={branding?.site_title || 'KickPay'} className="text-xl" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-3">{nav}</div>
                    {sidebarFooter}
                </aside>

                {/* Mobile header */}
                <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:hidden">
                    <button onClick={() => setMobileOpen(true)} className="btn-ghost btn-sm p-2" aria-label="فتح القائمة">
                        <Menu size={22} />
                    </button>
                    <BrandTitle title={branding?.site_title || 'KickPay'} className="text-lg" />
                    <StatusDot online={overlayOnline} />
                </header>

                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                        >
                            <motion.aside
                                initial={{ x: 300 }}
                                animate={{ x: 0 }}
                                exit={{ x: 300 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                className="absolute inset-y-0 right-0 flex w-72 flex-col bg-surface"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-5">
                                    <BrandTitle title={branding?.site_title || 'KickPay'} className="text-xl" />
                                    <button onClick={() => setMobileOpen(false)} className="btn-ghost btn-sm p-2" aria-label="إغلاق القائمة">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto px-3">{nav}</div>
                                {sidebarFooter}
                            </motion.aside>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="min-w-0 flex-1 lg:pr-64">
                    <header className="hidden items-center justify-between gap-4 px-8 pb-2 pt-8 lg:flex">
                        <div>
                            <h1 className="text-2xl font-black">{current.name}</h1>
                            <p className="mt-0.5 text-sm text-ink-muted">
                                أهلاً بك، <span dir="ltr">{user.username}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5" title={connected ? 'متصل بالخادم' : 'غير متصل بالخادم'}>
                            <StatusDot online={overlayOnline} label={overlayOnline ? `صفحة العرض متصلة (${presence.overlayCount})` : 'صفحة العرض غير متصلة'} />
                            {!connected && <span className="badge bg-warning-soft text-warning">إعادة الاتصال...</span>}
                        </div>
                    </header>
                    <main id="main" className="px-4 pb-16 pt-5 sm:px-6 lg:px-8">
                        {children}
                    </main>
                </div>
            </div>
        </DashboardContext.Provider>
    );
}
