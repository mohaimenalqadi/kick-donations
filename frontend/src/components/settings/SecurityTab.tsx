'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { SectionHeader, Spinner } from '@/components/ui/primitives';

export function passwordStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(4, score);
}
const STRENGTH = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];
const STRENGTH_CLS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-brand'];

export function ChangePasswordForm() {
    const toast = useToast();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const strength = passwordStrength(next);
    const mismatch = confirmPw.length > 0 && next !== confirmPw;

    const save = useMutation({
        mutationFn: () => api.updateProfile({ current_password: current, password: next }),
        onSuccess: () => {
            toast.success('تم تغيير كلمة المرور. تم تسجيل الخروج من الأجهزة الأخرى.');
            setCurrent('');
            setNext('');
            setConfirmPw('');
        },
        onError: toast.error,
    });

    return (
        <form
            className="card p-5 sm:p-7"
            onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
            }}
        >
            <SectionHeader title="تغيير كلمة المرور" description="تغيير كلمة المرور يُنهي جلساتك على كل الأجهزة الأخرى." />
            <div className="grid gap-4 sm:max-w-md">
                <div>
                    <label htmlFor="cur" className="label">كلمة المرور الحالية</label>
                    <input id="cur" type="password" className="input" dir="ltr" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="new" className="label">كلمة المرور الجديدة</label>
                    <input id="new" type="password" className="input" dir="ltr" autoComplete="new-password" minLength={8} maxLength={128} value={next} onChange={(e) => setNext(e.target.value)} required />
                    {next && (
                        <div className="mt-2">
                            <div className="flex gap-1" aria-hidden>
                                {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < strength ? STRENGTH_CLS[strength] : 'bg-white/10'}`} />)}
                            </div>
                            <p className="hint">القوة: {STRENGTH[strength]}{next.length < 8 && ' · 8 أحرف على الأقل'}</p>
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="confirm" className="label">تأكيد كلمة المرور الجديدة</label>
                    <input id="confirm" type="password" className="input" dir="ltr" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} aria-invalid={mismatch} required />
                    {mismatch && <p className="mt-1.5 text-xs font-semibold text-danger">كلمتا المرور غير متطابقتين</p>}
                </div>
            </div>
            <div className="mt-6">
                <button className="btn-primary" disabled={!current || next.length < 8 || next !== confirmPw || save.isPending}>
                    {save.isPending ? <Spinner size={16} className="text-brand-ink" /> : <KeyRound size={16} />} تحديث كلمة المرور
                </button>
            </div>
        </form>
    );
}

export default function SecurityTab() {
    const router = useRouter();
    const qc = useQueryClient();
    const toast = useToast();
    const confirm = useConfirm();

    const logoutAll = useMutation({
        mutationFn: api.logoutAll,
        onSuccess: () => {
            qc.clear();
            router.replace('/login');
        },
        onError: toast.error,
    });

    return (
        <div className="space-y-6">
            <ChangePasswordForm />
            <section className="card p-5 sm:p-7">
                <SectionHeader title="الجلسات" description="إذا فقدت جهازاً أو تشك في دخول غير مصرح به، أنهِ جميع الجلسات." />
                <button
                    className="btn-danger"
                    disabled={logoutAll.isPending}
                    onClick={async () => {
                        if (await confirm({ title: 'تسجيل الخروج من كل الأجهزة', description: 'ستحتاج لتسجيل الدخول مجدداً على كل الأجهزة بما فيها هذا الجهاز.', confirmLabel: 'تسجيل الخروج من الكل' })) {
                            logoutAll.mutate();
                        }
                    }}
                >
                    <LogOut size={16} /> تسجيل الخروج من جميع الأجهزة
                </button>
            </section>
        </div>
    );
}
