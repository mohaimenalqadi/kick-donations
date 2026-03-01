'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Coins, Gauge, Hash } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import { formatAmount } from '@/lib/format';

export default function StatsCards({ currency }: { currency?: string }) {
    const { data, isLoading } = useQuery({ queryKey: qk.stats, queryFn: () => api.stats().then((r) => r.stats), refetchInterval: 60_000 });

    const cards = [
        { label: 'إجمالي الدعم', value: data && formatAmount(data.all_time_total, currency), sub: data && `${data.all_time_count} عملية`, icon: Coins, tone: 'text-brand bg-brand-soft' },
        { label: 'دعم اليوم', value: data && formatAmount(data.today_total, currency), sub: 'حسب توقيت ليبيا', icon: CalendarDays, tone: 'text-info bg-info-soft' },
        { label: 'عمليات اليوم', value: data && String(data.today_count), sub: 'تبرع', icon: Hash, tone: 'text-warning bg-warning-soft' },
        { label: 'المتوسط اليومي', value: data && formatAmount(data.daily_average, currency), sub: 'لأيام النشاط', icon: Gauge, tone: 'text-purple-300 bg-purple-400/10' },
    ];

    return (
        <section aria-label="الإحصائيات" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {cards.map((c, i) => (
                <div key={c.label} className="card animate-fade-up p-4 sm:p-5" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="mb-3 flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tone}`}>
                            <c.icon size={18} />
                        </span>
                        <span className="text-xs font-bold text-ink-muted sm:text-sm">{c.label}</span>
                    </div>
                    {isLoading ? (
                        <div className="skeleton h-8 w-3/4" />
                    ) : (
                        <p className="truncate text-xl font-black tabular-nums sm:text-2xl" dir="ltr" style={{ textAlign: 'right' }}>
                            {c.value ?? '—'}
                        </p>
                    )}
                    <p className="mt-1 text-[11px] font-semibold text-ink-faint">{c.sub}</p>
                </div>
            ))}
        </section>
    );
}
