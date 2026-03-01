'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AtSign, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import { useDashboard } from '../DashboardContext';
import { useToast } from '@/components/ui/Toast';
import { SectionHeader, Spinner } from '@/components/ui/primitives';
import { ChangePasswordForm } from '@/components/settings/SecurityTab';

export default function ProfilePage() {
    const { user, isAdmin } = useDashboard();
    const qc = useQueryClient();
    const toast = useToast();
    const [username, setUsername] = useState(user.username);
    const [current, setCurrent] = useState('');

    const save = useMutation({
        mutationFn: () => api.updateProfile({ current_password: current, username: username.trim() }),
        onSuccess: (r) => {
            qc.setQueryData(qk.me, r.user);
            setCurrent('');
            toast.success('تم تحديث اسم المستخدم');
        },
        onError: toast.error,
    });

    const changed = username.trim().toLowerCase() !== user.username;
    const validName = /^[A-Za-z0-9_.-]{3,30}$/.test(username.trim());

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="card relative overflow-hidden p-6 sm:p-8">
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
                <div className="relative flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-line bg-surface-raised text-3xl font-black text-brand">
                        {user.username[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black" dir="ltr" style={{ textAlign: 'right' }}>{user.username}</h2>
                        <span className={`badge mt-2 ${isAdmin ? 'bg-brand-soft text-brand' : 'bg-info-soft text-info'}`}>
                            {isAdmin ? 'مشرف' : 'مشرف مساعد'}
                        </span>
                    </div>
                </div>
            </section>

            <form
                className="card p-5 sm:p-7"
                onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate();
                }}
            >
                <SectionHeader title="اسم المستخدم" description="يُستخدم لتسجيل الدخول. أحرف إنجليزية وأرقام و . _ - فقط." />
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="uname" className="label">اسم المستخدم الجديد</label>
                        <div className="relative">
                            <AtSign size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                            <input id="uname" className="input pl-10" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} aria-invalid={!validName} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="cur-pw" className="label">كلمة المرور الحالية (للتأكيد)</label>
                        <input id="cur-pw" type="password" className="input" dir="ltr" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                    </div>
                </div>
                <div className="mt-6">
                    <button className="btn-primary" disabled={!changed || !validName || !current || save.isPending}>
                        {save.isPending ? <Spinner size={16} className="text-brand-ink" /> : <Save size={16} />} حفظ
                    </button>
                </div>
            </form>

            <ChangePasswordForm />
        </div>
    );
}
