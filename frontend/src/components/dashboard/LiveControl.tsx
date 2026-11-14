'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ExternalLink, MonitorOff, MonitorPlay, Radio, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { formatAmount } from '@/lib/format';

/** "On air" panel: overlay connectivity, what's showing, what's queued, skip. */
export default function LiveControl({ currency }: { currency?: string }) {
    const { presence, isAdmin } = useDashboard();
    const toast = useToast();
    const online = presence.overlayCount > 0;

    const live = useQuery({
        queryKey: qk.donations({ status: 'live', limit: 5 }),
        queryFn: () => api.donations({ status: 'live', limit: 5 }),
        refetchInterval: 30_000,
    });
    const nowId = presence.nowPlaying?.donationId;
    const now = live.data?.items?.find((d) => d.id === nowId);
    const waiting = Math.max(0, (live.data?.total ?? 0) - (now ? 1 : 0));

    const skip = useMutation({
        mutationFn: api.overlaySkip,
        onSuccess: () => toast.info('تم تخطي التنبيه الحالي'),
        onError: toast.error,
    });

    return (
        <section aria-label="حالة البث" className="card relative overflow-hidden p-5">
            {online && <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />}
            <div className="relative flex flex-wrap items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${online ? 'bg-brand text-brand-ink shadow-glow' : 'bg-danger-soft text-danger'}`}>
                    {online ? <MonitorPlay size={22} /> : <MonitorOff size={22} />}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-black">{online ? 'صفحة العرض متصلة' : 'صفحة العرض غير متصلة'}</p>
                    <p className="text-sm text-ink-muted">
                        {online
                            ? now
                                ? <>يُعرض الآن: <b className="text-ink">{now.donor_name}</b> · <span dir="ltr">{formatAmount(now.amount, currency)}</span></>
                                : 'في وضع الانتظار'
                            : 'التبرعات المرسلة ستُعرض عند فتح صفحة العرض في OBS'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="badge bg-white/5 text-ink-muted">
                        <Radio size={12} /> في الطابور: {waiting}
                    </span>
                    <button
                        className="btn-secondary btn-sm"
                        disabled={!online || !nowId || skip.isPending}
                        onClick={() => skip.mutate()}
                        title="إنهاء التنبيه المعروض حالياً والانتقال للتالي"
                    >
                        <SkipForward size={14} /> تخطي
                    </button>
                    {isAdmin && (
                        <Link href="/dashboard/settings?tab=overlay" className="btn-ghost btn-sm">
                            <ExternalLink size={14} /> رابط OBS
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
