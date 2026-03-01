'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, Eye, Inbox, Play, RotateCcw, Search, Send, ShieldAlert, Trash2,
} from 'lucide-react';
import { api, type DonationFilters } from '@/lib/api';
import { qk, useTiers } from '@/hooks/queries';
import { tierByKey } from '@/lib/tiers';
import { formatAmount, formatDateTime, formatRelative } from '@/lib/format';
import type { Donation, DonationStatus } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState, SectionHeader, Spinner } from '@/components/ui/primitives';
import Modal from '@/components/ui/Modal';

const PAGE_SIZE = 20;

const STATUS: Record<DonationStatus, { label: string; icon: typeof Clock; cls: string }> = {
    pending: { label: 'بالانتظار', icon: Clock, cls: 'bg-warning-soft text-warning' },
    live: { label: 'على البث', icon: Play, cls: 'bg-brand-soft text-brand' },
    done: { label: 'تم العرض', icon: CheckCircle2, cls: 'bg-white/5 text-ink-muted' },
};

function useDebounced<T>(value: T, ms = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

function toCsv(rows: Donation[], tierLabel: (k: string) => string) {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['التاريخ', 'الاسم', 'المبلغ', 'الفئة', 'الحالة', 'الرسالة'];
    const lines = rows.map((d) =>
        [formatDateTime(d.created_at), d.donor_name, d.amount, tierLabel(d.tier), STATUS[d.status]?.label, d.message].map(esc).join(',')
    );
    // BOM so Excel opens Arabic text correctly.
    return '﻿' + [header.map(esc).join(','), ...lines].join('\r\n');
}

export default function DonationsTable({ isAdmin, currency }: { isAdmin: boolean; currency?: string }) {
    const qc = useQueryClient();
    const toast = useToast();
    const confirm = useConfirm();
    const { data: tiers } = useTiers();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<DonationStatus | ''>('');
    const [tier, setTier] = useState('');
    const [flaggedOnly, setFlaggedOnly] = useState(false);
    const [review, setReview] = useState<Donation | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const debouncedSearch = useDebounced(search.trim());

    const filters: DonationFilters = useMemo(
        () => ({
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
            status: status || undefined,
            tier: tier || undefined,
            flagged: flaggedOnly || undefined,
        }),
        [page, debouncedSearch, status, tier, flaggedOnly]
    );

    useEffect(() => setPage(1), [debouncedSearch, status, tier, flaggedOnly]);

    const { data, isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: qk.donations(filters),
        queryFn: () => api.donations(filters),
        placeholderData: keepPreviousData,
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const tierLabel = (k: string) => tierByKey(tiers, k)?.label || k;

    const refresh = () => {
        qc.invalidateQueries({ queryKey: qk.donationsAll });
        qc.invalidateQueries({ queryKey: qk.stats });
    };

    async function run(id: string, fn: () => Promise<unknown>, ok: string) {
        setBusyId(id);
        try {
            await fn();
            toast.success(ok);
            refresh();
        } catch (err) {
            toast.error(err);
        } finally {
            setBusyId(null);
        }
    }

    async function handleDelete(d: Donation) {
        const yes = await confirm({ title: 'حذف التبرع', description: `سيتم حذف تبرع "${d.donor_name}" بقيمة ${formatAmount(d.amount, currency)}.`, confirmLabel: 'حذف' });
        if (yes) run(d.id, () => api.deleteDonation(d.id), 'تم حذف التبرع');
    }

    const bulk = useMutation({
        mutationFn: api.bulkDelete,
        onSuccess: (r) => {
            toast.success(r.message);
            refresh();
            qc.invalidateQueries({ queryKey: ['analytics'] });
        },
        onError: toast.error,
    });

    async function handleBulk(period: 'today' | 'all') {
        const yes = await confirm(
            period === 'today'
                ? { title: 'حذف عمليات اليوم', description: 'سيتم حذف جميع تبرعات اليوم (حسب توقيت ليبيا).', confirmLabel: 'حذف عمليات اليوم', requireText: 'حذف' }
                : { title: 'حذف كل العمليات', description: 'سيتم مسح جميع التبرعات في كل الأيام نهائياً، بما فيها الإحصائيات.', confirmLabel: 'حذف الكل', requireText: 'حذف الكل' }
        );
        if (yes) bulk.mutate(period);
    }

    async function exportCsv() {
        setExporting(true);
        try {
            const all: Donation[] = [];
            for (let p = 1; p <= 50; p++) {
                const r = await api.donations({ ...filters, page: p, limit: 100 });
                all.push(...r.items);
                if (all.length >= r.total || r.items.length === 0) break;
            }
            const blob = new Blob([toCsv(all, tierLabel)], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success(`تم تصدير ${all.length} عملية`);
        } catch (err) {
            toast.error(err);
        } finally {
            setExporting(false);
        }
    }

    return (
        <section aria-labelledby="donations-title" className="card p-4 sm:p-6">
            <SectionHeader
                title="سجل العمليات"
                description={`${total} عملية${isFetching && !isLoading ? ' · جاري التحديث...' : ''}`}
                action={
                    <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary btn-sm" onClick={exportCsv} disabled={exporting || total === 0}>
                            {exporting ? <Spinner size={14} /> : <Download size={14} />} تصدير CSV
                        </button>
                        {isAdmin && (
                            <>
                                <button className="btn-danger btn-sm" onClick={() => handleBulk('today')} disabled={bulk.isPending}>
                                    <Trash2 size={14} /> حذف اليوم
                                </button>
                                <button className="btn-danger btn-sm" onClick={() => handleBulk('all')} disabled={bulk.isPending}>
                                    <Trash2 size={14} /> حذف الكل
                                </button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
                <div className="relative">
                    <Search size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                    <input
                        className="input pr-11"
                        placeholder="بحث باسم الداعم..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="بحث باسم الداعم"
                    />
                </div>
                <select className="input lg:w-40" value={status} onChange={(e) => setStatus(e.target.value as DonationStatus | '')} aria-label="الحالة">
                    <option value="">كل الحالات</option>
                    <option value="pending">بالانتظار</option>
                    <option value="live">على البث</option>
                    <option value="done">تم العرض</option>
                </select>
                <select className="input lg:w-40" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="الفئة">
                    <option value="">كل الفئات</option>
                    {tiers?.map((t) => <option key={t.tier_key} value={t.tier_key}>{t.label}</option>)}
                </select>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-line bg-surface-sunken px-4 py-3 text-sm font-semibold">
                    <input type="checkbox" className="accent-[#03e115]" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
                    المحجوبة فقط
                </label>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
                </div>
            ) : isError ? (
                <EmptyState icon={Inbox} title="تعذر تحميل العمليات" action={<button className="btn-secondary btn-sm" onClick={() => refetch()}>إعادة المحاولة</button>} />
            ) : items.length === 0 ? (
                <EmptyState icon={Inbox} title="لا توجد عمليات" description={search || status || tier || flaggedOnly ? 'جرّب تغيير عوامل التصفية.' : 'ستظهر التبرعات هنا فور إضافتها.'} />
            ) : (
                <ul className="divide-y divide-line">
                    {items.map((d) => {
                        const st = STATUS[d.status];
                        const t = tierByKey(tiers, d.tier);
                        const busy = busyId === d.id;
                        return (
                            <li key={d.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t?.color || '#71717a' }} aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="truncate font-bold">{d.donor_name}</span>
                                            <span className="font-black tabular-nums text-brand" dir="ltr">{formatAmount(d.amount, currency)}</span>
                                            <span className={`badge ${st.cls}`}><st.icon size={11} />{st.label}</span>
                                            {t && <span className="badge bg-white/5 text-ink-muted">{t.label}</span>}
                                            {d.flagged && <span className="badge bg-danger-soft text-danger"><ShieldAlert size={11} />محجوبة</span>}
                                        </div>
                                        {d.message && <p className="mt-1 line-clamp-2 break-words text-sm text-ink-muted">{d.message}</p>}
                                        <p className="mt-1 text-[11px] font-semibold text-ink-faint" title={formatDateTime(d.created_at)}>{formatRelative(d.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                                    {isAdmin && d.flagged && (
                                        <button className="btn-ghost btn-sm" onClick={() => setReview(d)} aria-label="مراجعة الرسالة">
                                            <Eye size={14} /> مراجعة
                                        </button>
                                    )}
                                    {d.status === 'pending' && (
                                        <button className="btn-primary btn-sm" disabled={busy} onClick={() => run(d.id, () => api.sendDonation(d.id), 'تم الإرسال للبث')}>
                                            {busy ? <Spinner size={14} className="text-brand-ink" /> : <Send size={14} />} إرسال
                                        </button>
                                    )}
                                    {d.status === 'done' && (
                                        <button className="btn-secondary btn-sm" disabled={busy} onClick={() => run(d.id, () => api.sendDonation(d.id), 'تمت إعادة العرض')} title="إعادة عرض التنبيه">
                                            {busy ? <Spinner size={14} /> : <RotateCcw size={14} />} إعادة
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button className="btn-ghost btn-sm p-2 hover:bg-danger-soft hover:text-danger" disabled={busy} onClick={() => handleDelete(d)} aria-label={`حذف تبرع ${d.donor_name}`}>
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {pages > 1 && (
                <nav className="mt-4 flex items-center justify-between border-t border-line pt-4" aria-label="الصفحات">
                    <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronRight size={14} /> السابق
                    </button>
                    <span className="text-xs font-bold tabular-nums text-ink-muted">صفحة {page} من {pages}</span>
                    <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                        التالي <ChevronLeft size={14} />
                    </button>
                </nav>
            )}

            <ReviewModal donation={review} onClose={() => setReview(null)} onApproved={refresh} />
        </section>
    );
}

function ReviewModal({ donation, onClose, onApproved }: { donation: Donation | null; onClose: () => void; onApproved: () => void }) {
    const toast = useToast();
    const original = useQuery({
        queryKey: ['original', donation?.id],
        queryFn: () => api.originalMessage(donation!.id).then((r) => r.original),
        enabled: !!donation,
    });
    const approve = useMutation({
        mutationFn: () => api.approveDonation(donation!.id),
        onSuccess: () => {
            toast.success('تمت الموافقة على الرسالة واستعادة النص الأصلي');
            onApproved();
            onClose();
        },
        onError: toast.error,
    });

    return (
        <Modal
            open={!!donation}
            onClose={onClose}
            title="مراجعة رسالة محجوبة"
            description="حجب الفلتر هذه الرسالة تلقائياً. إذا كانت سليمة يمكنك استعادتها قبل إرسالها للبث."
            footer={
                <>
                    <button className="btn-primary" onClick={() => approve.mutate()} disabled={approve.isPending || original.isLoading}>
                        {approve.isPending && <Spinner size={16} className="text-brand-ink" />} الموافقة واستعادة النص
                    </button>
                    <button className="btn-secondary" onClick={onClose}>إبقاء الحجب</button>
                </>
            }
        >
            {original.isLoading ? (
                <div className="skeleton h-20" />
            ) : (
                <div className="space-y-3 rounded-2xl border border-line bg-surface-sunken p-4 text-sm">
                    <p><span className="text-ink-faint">الاسم الأصلي: </span><b>{original.data?.donor_name || donation?.donor_name}</b></p>
                    <p className="break-words"><span className="text-ink-faint">الرسالة الأصلية: </span>{original.data?.message || '—'}</p>
                </div>
            )}
        </Modal>
    );
}
