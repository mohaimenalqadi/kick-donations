'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, EyeOff, ExternalLink, KeyRound, PlayCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { qk, useTiers } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { SectionHeader, Spinner, StatusDot } from '@/components/ui/primitives';
import { useDashboard } from '@/app/dashboard/DashboardContext';

export default function OverlayTab() {
    const qc = useQueryClient();
    const toast = useToast();
    const confirm = useConfirm();
    const { presence } = useDashboard();
    const { data: tiers = [] } = useTiers();
    const [reveal, setReveal] = useState(false);

    const keyQuery = useQuery({ queryKey: qk.overlayKey, queryFn: () => api.overlayKey().then((r) => r.key) });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = keyQuery.data ? `${origin}/overlay?key=${keyQuery.data}` : '';
    const masked = keyQuery.data ? `${origin}/overlay?key=${'•'.repeat(16)}` : '';

    const rotate = useMutation({
        mutationFn: api.rotateOverlayKey,
        onSuccess: (r) => {
            qc.setQueryData(qk.overlayKey, r.key);
            toast.success('تم إنشاء مفتاح جديد. حدّث الرابط في OBS.');
        },
        onError: toast.error,
    });

    const test = useMutation({
        mutationFn: api.overlayTest,
        onSuccess: () => toast.info('تم إرسال تنبيه تجريبي لصفحة العرض'),
        onError: toast.error,
    });

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('تم نسخ الرابط');
        } catch {
            toast.error('تعذر النسخ، انسخ الرابط يدوياً');
        }
    }

    async function handleRotate() {
        const yes = await confirm({
            title: 'إنشاء مفتاح جديد',
            description: 'سيتوقف الرابط الحالي عن العمل فوراً وستنفصل صفحات العرض المفتوحة. استخدمه إذا شاركت الرابط بالخطأ.',
            confirmLabel: 'إنشاء مفتاح جديد',
        });
        if (yes) rotate.mutate();
    }

    return (
        <div className="space-y-6">
            <section className="card p-5 sm:p-7">
                <SectionHeader
                    title="رابط صفحة العرض (OBS)"
                    description="الرابط خاص ويحتوي على مفتاح سري. لا تشاركه علناً ولا تُظهره على البث."
                    action={<StatusDot online={presence.overlayCount > 0} label={presence.overlayCount > 0 ? `متصلة (${presence.overlayCount})` : 'غير متصلة'} />}
                />

                {keyQuery.isLoading ? (
                    <div className="skeleton h-14" />
                ) : !keyQuery.data ? (
                    <p className="rounded-2xl bg-warning-soft p-4 text-sm font-semibold text-warning">
                        لا يوجد مفتاح بعد. شغّل ملف الترحيل في قاعدة البيانات أو أنشئ مفتاحاً جديداً.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-2xl border border-line bg-surface-sunken p-4 font-mono text-xs text-brand" dir="ltr">
                            {reveal ? url : masked}
                        </code>
                        <div className="flex gap-2">
                            <button className="btn-secondary" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'إخفاء' : 'إظهار'}>
                                {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button className="btn-primary flex-1" onClick={copy}><Copy size={16} /> نسخ</button>
                            <a className="btn-secondary" href={url} target="_blank" rel="noopener noreferrer" aria-label="فتح المعاينة">
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex justify-end">
                    <button className="btn-ghost btn-sm" onClick={handleRotate} disabled={rotate.isPending}>
                        {rotate.isPending ? <Spinner size={14} /> : <RefreshCw size={14} />} إنشاء مفتاح جديد
                    </button>
                </div>
            </section>

            <section className="card p-5 sm:p-7">
                <SectionHeader title="طريقة الإعداد في OBS" />
                <ol className="space-y-3 text-sm leading-relaxed text-ink-muted">
                    {[
                        'في OBS أضف مصدراً جديداً من نوع Browser Source.',
                        'الصق الرابط أعلاه، واضبط العرض 1920 والارتفاع 1080.',
                        'فعّل "Control audio via OBS" إذا أردت التحكم بصوت التنبيهات من OBS.',
                        'أضف فلتر Chroma Key باللون الأخضر (#03E115) لإزالة خلفية الانتظار.',
                        'انقر بزر الفأرة الأيمن على المصدر ← Interact، ثم اضغط "بدء التشغيل" مرة واحدة لتفعيل الصوت.',
                    ].map((s, i) => (
                        <li key={i} className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-black text-brand">{i + 1}</span>
                            <span>{s}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="card p-5 sm:p-7">
                <SectionHeader
                    title="اختبار التنبيهات"
                    description="يُرسل تنبيهاً تجريبياً إلى صفحة العرض المتصلة دون تسجيل أي تبرع."
                    action={<KeyRound size={18} className="text-ink-faint" />}
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {tiers.map((t) => (
                        <button
                            key={t.tier_key}
                            className="btn-secondary justify-start"
                            disabled={test.isPending || presence.overlayCount === 0}
                            onClick={() => test.mutate(t.tier_key)}
                            title={presence.overlayCount === 0 ? 'افتح صفحة العرض أولاً' : undefined}
                        >
                            <PlayCircle size={16} style={{ color: t.color }} />
                            <span className="truncate">{t.label}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
