'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSetup, setIsSetup] = useState(false);
    const [siteTitle, setSiteTitle] = useState('KickPay');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.getSettings();
                if (res.settings?.site_title) {
                    setSiteTitle(res.settings.site_title);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSetup) {
                // Initial setup
                await api.setup(username, password);
                setIsSetup(false);
                setError('');
                // Now login
            }

            const response = await api.login(username, password);

            if (response.success) {
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';

            // Check if this is first setup
            if (errorMessage.includes('FIRST_RUN') || errorMessage.includes('الإعداد الأولي')) {
                setIsSetup(true);
                setError('هذا هو الإعداد الأولي للنظام. أدخل بيانات حساب المشرف الجديد الذي ترغب في إنشائه.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-app-dark">
            {/* Background Effect */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative"
            >
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500/20 border border-primary-500/30 mb-4"
                    >
                        <Zap className="w-10 h-10 text-primary-500" />
                    </motion.div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">
                        {siteTitle.split(/(?=[A-Z])/).map((part, i) => i === siteTitle.split(/(?=[A-Z])/).length - 1 ? <span key={i} className="text-[#03e115]">{part}</span> : part)}
                    </h1>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">منصة تبرعات البث المباشر</p>
                </div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                >
                    <h2 className="text-xl font-bold mb-6 text-center">
                        {isSetup ? 'إنشاء حساب المشرف' : 'تسجيل الدخول'}
                    </h2>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">
                                اسم المستخدم
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                placeholder="admin"
                                required
                                minLength={3}
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    autoComplete={isSetup ? 'new-password' : 'current-password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-dark-400 border-t-transparent rounded-full animate-spin" />
                                    <span>جاري التحميل...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    <span>{isSetup ? 'إنشاء الحساب' : 'دخول'}</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Overlay Link */}
                    <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                        <p className="text-gray-500 text-sm mb-2">للستريمر:</p>
                        <a
                            href="/overlay"
                            target="_blank"
                            className="text-primary-500 hover:text-primary-400 text-sm"
                        >
                            فتح صفحة العرض (Overlay)
                        </a>
                    </div>
                </motion.div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    Kick Donations © 2024
                </p>
            </motion.div>
        </div>
    );
}
