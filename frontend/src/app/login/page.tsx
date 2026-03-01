'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, LogIn, ShieldPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useBranding, qk } from '@/hooks/queries';
import { BrandTitle, Spinner } from '@/components/ui/primitives';

export default function LoginPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const { data: branding } = useBranding();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSetup, setIsSetup] = useState(false);

    // Already signed in? Go straight to the dashboard.
    useEffect(() => {
        api.me().then(() => router.replace('/dashboard')).catch(() => undefined);
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSetup) await api.setup(username, password);
            const res = await api.login(username, password);
            qc.setQueryData(qk.me, res.user);
            router.replace('/dashboard');
        } catch (err) {
            if (err instanceof ApiError && err.code === 'FIRST_RUN') {
                setIsSetup(true);
                setError('');
            } else {
                setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 right-1/2 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
                <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-md"
            >
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-glow">
                        <LogIn size={28} />
                    </div>
                    <h1 className="text-3xl">
                        <BrandTitle title={branding?.site_title || 'KickPay'} />
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-ink-muted">لوحة إدارة تبرعات البث المباشر</p>
                </div>

                <div className="card p-6 sm:p-8">
                    <h2 className="mb-1 text-xl font-black">{isSetup ? 'الإعداد الأولي' : 'تسجيل الدخول'}</h2>
                    <p className="mb-6 text-sm text-ink-muted">
                        {isSetup
                            ? 'لا يوجد أي حساب بعد. أنشئ حساب المشرف الرئيسي للنظام.'
                            : 'أدخل بيانات حسابك للمتابعة.'}
                    </p>

                    {error && (
                        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-sm font-semibold text-danger">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
                        <div>
                            <label htmlFor="username" className="label">اسم المستخدم</label>
                            <input
                                id="username"
                                className="input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength={3}
                                maxLength={30}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                                dir="ltr"
                                autoFocus
                            />
                            {isSetup && <p className="hint">أحرف إنجليزية وأرقام و . _ - فقط</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">كلمة المرور</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pl-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={isSetup ? 8 : 1}
                                    autoComplete={isSetup ? 'new-password' : 'current-password'}
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-faint hover:text-ink"
                                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {isSetup && <p className="hint">8 أحرف على الأقل</p>}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                            {loading ? <Spinner size={18} className="text-brand-ink" /> : isSetup ? <ShieldPlus size={18} /> : <LogIn size={18} />}
                            {isSetup ? 'إنشاء حساب المشرف' : 'دخول'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-ink-faint">© {new Date().getFullYear()} Kick Donations</p>
            </motion.div>
        </main>
    );
}
