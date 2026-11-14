'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, Play } from 'lucide-react';
import { audioManager } from '@/lib/audio';
import { currencyLabel } from '@/lib/format';
import type { OverlayDonation } from '@/lib/types';
import { useOverlayController } from '@/hooks/useOverlayController';
import StandardTier, { type StandardPreset } from '@/components/overlay/StandardTier';
import CinematicTier from '@/components/overlay/CinematicTier';
import GoldTier from '@/components/overlay/GoldTier';
import DiamondTier from '@/components/overlay/DiamondTier';
import FiftyTier from '@/components/overlay/FiftyTier';
import Leaderboard from '@/components/overlay/Leaderboard';
import StandbyScreen from '@/components/overlay/StandbyScreen';

const STANDARD: Record<string, StandardPreset> = { tier1: 'basic', tier2: 'medium', tier3: 'professional' };

function renderAlert(d: OverlayDonation, onComplete: () => void, currency: string) {
    const props = {
        donorName: d.donor_name,
        amount: d.amount,
        message: d.message,
        duration: d.duration,
        soundUrl: d.sound_url || undefined,
        backgroundUrl: d.background_url || undefined,
        volume: d.volume ?? 80,
        onComplete,
    };
    const key = `alert-${d.id}`;
    if (STANDARD[d.tier]) return <StandardTier key={key} preset={STANDARD[d.tier]} currency={currency} {...props} />;
    switch (d.tier) {
        case 'tier4': return <CinematicTier key={key} {...props} />;
        case 'tier5': return <GoldTier key={key} {...props} />;
        case 'tier6': return <DiamondTier key={key} {...props} />;
        case 'tier_50':
            return (
                <FiftyTier
                    key={key}
                    donor={d.donor_name}
                    amount={d.amount}
                    message={d.message}
                    color={d.color}
                    backgroundUrl={props.backgroundUrl}
                    soundUrl={props.soundUrl}
                    volume={props.volume}
                    duration={d.duration}
                    onComplete={onComplete}
                />
            );
        // Custom tiers added in the DB fall back to the standard design.
        default: return <StandardTier key={key} preset="basic" currency={currency} {...props} />;
    }
}

function OverlayInner() {
    const params = useSearchParams();
    const key = params.get('key');
    // OBS browser sources allow autoplay, so `?autostart=1` skips the click gate.
    const [unlocked, setUnlocked] = useState(params.get('autostart') === '1');
    const { status, settings, current, top, complete } = useOverlayController(key, unlocked);

    useEffect(() => {
        document.body.classList.add('overlay-mode');
        return () => document.body.classList.remove('overlay-mode');
    }, []);

    if (!key || status === 'unauthorized') {
        return (
            <main className="flex min-h-screen items-center justify-center bg-canvas p-6 text-center">
                <div className="max-w-md">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger"><KeyRound size={26} /></div>
                    <h1 className="text-xl font-black">{key ? 'مفتاح صفحة العرض غير صالح' : 'رابط صفحة العرض غير مكتمل'}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        انسخ رابط OBS الكامل من لوحة التحكم: الإعدادات ← صفحة العرض. إذا تم تجديد المفتاح، حدّث الرابط في مصدر المتصفح.
                    </p>
                </div>
            </main>
        );
    }

    const currency = currencyLabel(settings?.currency);

    return (
        <main className="relative h-screen w-full overflow-hidden bg-transparent font-black">
            {/* Chroma-key base layer, always present behind alerts. */}
            <StandbyScreen />

            <div className="pointer-events-none fixed left-10 right-10 top-10 z-[60] flex items-start justify-between">
                <div>{current && <Leaderboard topDonor={top} />}</div>
            </div>

            <AnimatePresence>
                {!unlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas/95 backdrop-blur-md"
                    >
                        <div className="space-y-8 text-center">
                            <h1 className="text-4xl font-black italic tracking-tight text-white" dir="ltr">
                                {settings?.site_title || 'KickPay'} <span className="text-brand">OVERLAY</span>
                            </h1>
                            <p className="font-bold text-ink-muted">انقر لبدء تشغيل التنبيهات والصوت</p>
                            <button
                                onClick={async () => {
                                    await audioManager.unlock();
                                    setUnlocked(true);
                                }}
                                className="btn-primary px-12 py-5 text-xl"
                            >
                                بدء التشغيل <Play size={22} fill="currentColor" />
                            </button>
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink-faint">
                                <span className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-brand' : 'bg-danger'} animate-pulse`} />
                                {status === 'online' ? 'متصل بالخادم' : status === 'connecting' ? 'جاري الاتصال...' : 'غير متصل، جاري إعادة المحاولة...'}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tiny connection indicator; turns red if the link drops. */}
            {unlocked && (
                <div className={`pointer-events-none fixed bottom-6 right-6 z-50 h-3 w-3 rounded-full ${status === 'online' ? 'bg-brand opacity-20' : 'animate-pulse bg-danger opacity-80'}`} />
            )}

            <div className="flex min-h-screen items-center justify-center">
                <AnimatePresence mode="popLayout">{current && unlocked && renderAlert(current, complete, currency)}</AnimatePresence>
            </div>
        </main>
    );
}

export default function OverlayPage() {
    return (
        <Suspense fallback={null}>
            <OverlayInner />
        </Suspense>
    );
}
