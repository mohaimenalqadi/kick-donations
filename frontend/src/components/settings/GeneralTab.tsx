'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, VolumeX } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import type { PublicSettings } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { PageLoader, SectionHeader, Spinner } from '@/components/ui/primitives';

export default function GeneralTab() {
    const qc = useQueryClient();
    const toast = useToast();
    const { data, isLoading } = useQuery({ queryKey: qk.settings, queryFn: () => api.settings().then((r) => r.settings) });
    const [form, setForm] = useState<PublicSettings | null>(null);

    useEffect(() => {
        if (data) setForm(data);
    }, [data]);

    const save = useMutation({
        mutationFn: (f: PublicSettings) =>
            api.updateSettings({ site_title: f.site_title.trim(), currency: f.currency, mute_overlay: !!f.mute_overlay }),
        onSuccess: (r) => {
            qc.setQueryData(qk.settings, r.settings);
            qc.invalidateQueries({ queryKey: qk.branding });
            toast.success('تم حفظ الإعدادات');
        },
        onError: toast.error,
    });

    if (isLoading || !form) return <PageLoader />;
    const dirty = JSON.stringify(form) !== JSON.stringify(data);

    return (
        <form
            className="card p-5 sm:p-7"
            onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
            }}
        >
            <SectionHeader title="الإعدادات العامة" description="هوية المنصة وخيارات العرض الأساسية." />
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="site_title" className="label">اسم المنصة</label>
                    <input
                        id="site_title"
                        className="input"
                        value={form.site_title}
                        maxLength={40}
                        required
                        dir="ltr"
                        onChange={(e) => setForm({ ...form, site_title: e.target.value })}
                    />
                    <p className="hint">يظهر في الشريط الجانبي وصفحة الدخول. الحرف الكبير الأخير يبدأ الجزء الملوّن (KickPay).</p>
                </div>
                <div>
                    <label htmlFor="currency" className="label">العملة</label>
                    <select id="currency" className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                        <option value="LYD">دينار ليبي (د.ل)</option>
                        <option value="USD">دولار أمريكي ($)</option>
                        <option value="EUR">يورو (€)</option>
                    </select>
                </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-surface-sunken p-4">
                <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-ink-muted"><VolumeX size={18} /></span>
                    <span>
                        <span className="block text-sm font-bold">كتم صوت صفحة العرض</span>
                        <span className="block text-xs text-ink-faint">يُطبَّق فوراً على OBS دون إعادة تحميل.</span>
                    </span>
                </span>
                <input
                    type="checkbox"
                    role="switch"
                    className="h-5 w-5 accent-[#03e115]"
                    checked={!!form.mute_overlay}
                    onChange={(e) => setForm({ ...form, mute_overlay: e.target.checked })}
                />
            </label>

            <div className="mt-6 flex justify-end">
                <button type="submit" className="btn-primary" disabled={!dirty || save.isPending}>
                    {save.isPending ? <Spinner size={16} className="text-brand-ink" /> : <Save size={16} />} حفظ التغييرات
                </button>
            </div>
        </form>
    );
}
