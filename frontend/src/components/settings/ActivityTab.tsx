'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import { formatDateTime } from '@/lib/format';
import { EmptyState, SectionHeader } from '@/components/ui/primitives';

const PAGE = 30;

const ACTIONS: Record<string, { label: string; tone?: 'danger' | 'warning' }> = {
    login: { label: 'تسجيل دخول' },
    login_failed: { label: 'محاولة دخول فاشلة', tone: 'warning' },
    logout_all: { label: 'خروج من كل الأجهزة' },
    setup_first_admin: { label: 'الإعداد الأولي' },
    update_profile: { label: 'تحديث الملف الشخصي' },
    create_user: { label: 'إنشاء مستخدم' },
    update_user: { label: 'تعديل مستخدم' },
    delete_user: { label: 'حذف مستخدم', tone: 'danger' },
    revoke_sessions: { label: 'إنهاء جلسات مستخدم', tone: 'warning' },
    create_donation: { label: 'إضافة تبرع' },
    send_donation: { label: 'إرسال للبث' },
    delete_donation: { label: 'حذف تبرع', tone: 'danger' },
    bulk_delete_donations: { label: 'حذف جماعي', tone: 'danger' },
    approve_message: { label: 'الموافقة على رسالة' },
    sms_auto_donation: { label: 'تبرع تلقائي (SMS)' },
    update_settings: { label: 'تعديل الإعدادات' },
    update_tier: { label: 'تعديل فئة' },
    rotate_overlay_key: { label: 'تجديد مفتاح العرض', tone: 'warning' },
    overlay_skip: { label: 'تخطي تنبيه' },
    upload_media: { label: 'رفع ملف' },
};

function summarize(details: Record<string, unknown>) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(details || {})) {
        if (v === null || v === undefined || k.endsWith('_id')) continue;
        parts.push(`${k}: ${Array.isArray(v) ? v.join('، ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
    }
    return parts.join(' · ');
}

export default function ActivityTab() {
    const [page, setPage] = useState(1);
    const [action, setAction] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: qk.activity(page, action || undefined),
        queryFn: () => api.activity({ page, limit: PAGE, action: action || undefined }),
        placeholderData: keepPreviousData,
    });
    const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE));

    return (
        <section className="card p-5 sm:p-7">
            <SectionHeader
                title="سجل النشاط"
                description="كل العمليات الحساسة مسجلة مع المستخدم والوقت."
                action={
                    <select className="input w-auto" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="نوع العملية">
                        <option value="">كل العمليات</option>
                        {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                }
            />
            {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
            ) : !data?.items.length ? (
                <EmptyState icon={History} title="لا يوجد نشاط مسجل" />
            ) : (
                <ul className="divide-y divide-line">
                    {data.items.map((e) => {
                        const a = ACTIONS[e.action] || { label: e.action };
                        const tone = a.tone === 'danger' ? 'bg-danger-soft text-danger' : a.tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-white/5 text-ink-muted';
                        return (
                            <li key={e.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                                <span className="w-36 shrink-0 text-xs font-semibold tabular-nums text-ink-faint">{formatDateTime(e.created_at)}</span>
                                <span className={`badge w-fit ${tone}`}>{a.label}</span>
                                <span className="text-sm font-bold" dir="ltr">{e.username || 'النظام'}</span>
                                <span className="min-w-0 flex-1 truncate text-xs text-ink-muted" dir="ltr" style={{ textAlign: 'right' }}>{summarize(e.details)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
            {pages > 1 && (
                <nav className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronRight size={14} /> السابق</button>
                    <span className="text-xs font-bold text-ink-muted">صفحة {page} من {pages}</span>
                    <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>التالي <ChevronLeft size={14} /></button>
                </nav>
            )}
        </section>
    );
}
