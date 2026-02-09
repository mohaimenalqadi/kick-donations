'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    User,
    Settings,
    HelpCircle,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ username: string; role: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [siteTitle, setSiteTitle] = useState('KickPay');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.getCurrentUser();
                setUser(response.user);
                // Fetch site settings for dynamic title
                const settingsRes = await api.getSettings();
                if (settingsRes.settings?.site_title) {
                    setSiteTitle(settingsRes.settings.site_title);
                }
            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const navItems = [
        { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
        { name: 'الملف الشخصي', href: '/dashboard/profile', icon: User },
        { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
        { name: 'مركز المساعدة', href: '/dashboard/help', icon: HelpCircle },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#03e115] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400 font-medium">جاري التحقق...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-[#0f0f12] border-r border-white/5 fixed inset-y-0 right-0 z-50">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#03e115] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(3,225,21,0.3)]">
                            <LayoutDashboard className="text-[#0a0a0a]" size={24} />
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter">{siteTitle.split(/(?=[A-Z])/).map((part, i) => i === siteTitle.split(/(?=[A-Z])/).length - 1 ? <span key={i} className="text-[#03e115]">{part}</span> : part)}</h1>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-[#03e115]/10 text-[#03e115]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-[#03e115]' : 'group-hover:scale-110 transition-transform'} />
                                    <span className="font-bold">{item.name}</span>
                                    {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[#03e115] shadow-[0_0_10px_#03e115]" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/5">
                    <button
                        onClick={async () => {
                            await api.logout();
                            router.push('/login');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold"
                    >
                        <LogOut size={20} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 w-full bg-[#0f0f12]/80 backdrop-blur-xl border-b border-white/5 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-black italic">{siteTitle.split(/(?=[A-Z])/).map((part, i) => i === siteTitle.split(/(?=[A-Z])/).length - 1 ? <span key={i} className="text-[#03e115]">{part}</span> : part)}</h1>
                <div className="w-10 h-10 bg-white/5 rounded-full" />
            </header>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                    <motion.aside
                        initial={{ x: 280 }}
                        animate={{ x: 0 }}
                        className="absolute right-0 top-0 bottom-0 w-72 bg-[#0f0f12] p-6 shadow-2xl"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-xl font-black italic">{siteTitle.split(/(?=[A-Z])/).map((part, i) => i === siteTitle.split(/(?=[A-Z])/).length - 1 ? <span key={i} className="text-[#03e115]">{part}</span> : part)}</h1>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-[#03e115]/10 text-[#03e115]'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-bold">{item.name}</span>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={async () => {
                                    await api.logout();
                                    router.push('/login');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold"
                            >
                                <LogOut size={20} />
                                <span>تسجيل الخروج</span>
                            </button>
                        </nav>
                    </motion.aside>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 lg:pr-64 pt-20 lg:pt-0">
                <header className="hidden lg:flex items-center justify-between p-8">
                    <div>
                        <h2 className="text-3xl font-black text-white capitalize">
                            {navItems.find(i => i.href === pathname)?.name || 'لوحة التحكم'}
                        </h2>
                        <p className="text-gray-500 font-medium">أهلاً بك مجدداً، {user.username}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-[#03e115] transition-all relative">
                            <Bell size={20} />
                            <div className="absolute top-3 right-3 w-2 h-2 bg-[#03e115] rounded-full shadow-[0_0_5px_#03e115]" />
                        </button>
                        <div className="flex items-center gap-3 px-4 py-2 bg-[#0f0f12] border border-white/5 rounded-2xl shadow-xl">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center font-bold text-[#03e115]">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold leading-tight">{user.username}</p>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    {user.role === 'admin' ? 'MEMBER' : 'STAFF'}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-4 lg:px-8 pb-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
