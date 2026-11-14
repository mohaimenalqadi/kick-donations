'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Table2 } from 'lucide-react';
import { api } from '@/lib/api';
import { qk, useTiers } from '@/hooks/queries';
import { tierByKey } from '@/lib/tiers';
import { formatAmount } from '@/lib/format';
import { EmptyState, SectionHeader } from '@/components/ui/primitives';

const RANGES = [
    { days: 7, label: '7 أيام' },
    { days: 30, label: '30 يوماً' },
    { days: 90, label: '90 يوماً' },
];

// Single-series charts: one brand hue, recessive grid/axes, text in ink tokens.
const SERIES = '#03e115';
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = '#71717a';

const dayFmt = new Intl.DateTimeFormat('ar-LY', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function ChartTooltip({ active, payload, label, currency, kind }: {
    active?: boolean;
    payload?: { value: number; payload: Record<string, number | string> }[];
    label?: string;
    currency?: string;
    kind: 'trend' | 'tier';
}) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="rounded-xl border border-line-strong bg-surface-raised px-3 py-2 text-xs shadow-xl">
            <p className="mb-1 font-bold text-ink">{kind === 'trend' ? dayFmt.format(new Date(String(label))) : String(p.name)}</p>
            <p className="text-ink-muted">
                المبلغ: <b className="text-ink" dir="ltr">{formatAmount(Number(p.total), currency)}</b>
            </p>
            <p className="text-ink-muted">العمليات: <b className="text-ink">{p.count}</b></p>
        </div>
    );
}

export default function AnalyticsSection({ currency }: { currency?: string }) {
    const [days, setDays] = useState(30);
    const [asTable, setAsTable] = useState(false);
    const { data: tiers } = useTiers();

    // Stable range per selection (rounded to the hour) so the query key doesn't churn.
    const { start, end } = useMemo(() => {
        const e = new Date();
        e.setMinutes(59, 59, 999);
        const s = new Date(e.getTime() - days * 86400_000);
        return { start: s.toISOString(), end: e.toISOString() };
    }, [days]);

    const { data, isLoading } = useQuery({
        queryKey: qk.analytics(start, end),
        queryFn: () => api.analytics(start, end),
    });

    const trend = data?.dailyTrend ?? [];
    const dist = (data?.distribution ?? [])
        .map((d) => ({ ...d, name: tierByKey(tiers, d.tier)?.label || d.tier, min: tierByKey(tiers, d.tier)?.min_amount ?? 0 }))
        .sort((a, b) => Number(a.min) - Number(b.min));
    const periodTotal = trend.reduce((s, d) => s + d.total, 0);
    const periodCount = trend.reduce((s, d) => s + d.count, 0);

    return (
        <section aria-labelledby="analytics-title" className="card p-4 sm:p-6">
            <SectionHeader
                title="التحليلات"
                description={data ? `${formatAmount(periodTotal, currency)} من ${periodCount} عملية خلال الفترة` : undefined}
                action={
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-xl border border-line bg-surface-sunken p-1" role="group" aria-label="الفترة الزمنية">
                            {RANGES.map((r) => (
                                <button
                                    key={r.days}
                                    onClick={() => setDays(r.days)}
                                    aria-pressed={days === r.days}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${days === r.days ? 'bg-brand text-brand-ink' : 'text-ink-muted hover:text-ink'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button className="btn-ghost btn-sm p-2" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} title={asTable ? 'عرض كرسوم' : 'عرض كجدول'}>
                            {asTable ? <BarChart3 size={16} /> : <Table2 size={16} />}
                        </button>
                    </div>
                }
            />

            {isLoading ? (
                <div className="grid gap-4 lg:grid-cols-5">
                    <div className="skeleton h-64 lg:col-span-3" />
                    <div className="skeleton h-64 lg:col-span-2" />
                </div>
            ) : trend.length === 0 ? (
                <EmptyState icon={BarChart3} title="لا توجد بيانات في هذه الفترة" />
            ) : asTable ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    <DataTable title="حسب اليوم" rows={trend.map((d) => ({ k: dayFmt.format(new Date(d.date)), total: d.total, count: d.count }))} currency={currency} />
                    <DataTable title="حسب الفئة" rows={dist.map((d) => ({ k: d.name, total: d.total, count: d.count }))} currency={currency} />
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-5">
                    <figure className="lg:col-span-3">
                        <figcaption className="mb-3 text-sm font-bold text-ink-muted">إجمالي الدعم اليومي</figcaption>
                        <div className="h-64" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={SERIES} stopOpacity={0.28} />
                                            <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke={GRID} vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => dayFmt.format(new Date(v))} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
                                    <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                                    <Tooltip content={<ChartTooltip currency={currency} kind="trend" />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="total" stroke={SERIES} strokeWidth={2} fill="url(#trendFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#111114' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </figure>
                    <figure className="lg:col-span-2">
                        <figcaption className="mb-3 text-sm font-bold text-ink-muted">عدد العمليات حسب الفئة</figcaption>
                        <div className="h-64" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dist} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }} barCategoryGap={6}>
                                    <CartesianGrid stroke={GRID} horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" orientation="right" width={92} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip currency={currency} kind="tier" />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                    <Bar dataKey="count" fill={SERIES} radius={[4, 4, 4, 4]} maxBarSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </figure>
                </div>
            )}
        </section>
    );
}

function DataTable({ title, rows, currency }: { title: string; rows: { k: string; total: number; count: number }[]; currency?: string }) {
    return (
        <div>
            <h3 className="mb-2 text-sm font-bold text-ink-muted">{title}</h3>
            <div className="max-h-72 overflow-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface-raised text-xs text-ink-faint">
                        <tr>
                            <th className="p-3 text-right font-bold">البند</th>
                            <th className="p-3 text-right font-bold">المبلغ</th>
                            <th className="p-3 text-right font-bold">العمليات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rows.map((r) => (
                            <tr key={r.k}>
                                <td className="p-3 font-semibold">{r.k}</td>
                                <td className="p-3 tabular-nums" dir="ltr" style={{ textAlign: 'right' }}>{formatAmount(r.total, currency)}</td>
                                <td className="p-3 tabular-nums">{r.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
