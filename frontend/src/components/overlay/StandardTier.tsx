'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion';
import { ALERT_ASSETS, BACKGROUND_ASSETS, audioManager } from '@/lib/audio';
import TierBackground from './TierBackground';

export interface TierAlertProps {
    donorName: string;
    amount: number;
    message?: string;
    duration: number;
    onComplete: () => void;
    soundUrl?: string;
    backgroundUrl?: string;
    volume?: number;
    currency?: string;
}

/**
 * The three entry tiers used to be three copies of the same component that
 * differed only in timings and a few shadow values. They are presets now.
 */
const PRESETS = {
    basic: {
        sound: ALERT_ASSETS.BASIC, background: BACKGROUND_ASSETS.BASIC,
        nameAt: 800, amountAt: 1500, stiffness: 160, damping: 20,
        nameScale: 1.1, nameShadow: 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]',
        amountShadow: '0 0 40px rgba(255,0,127,0.6), 0 10px 0 #4d0026', messageDelay: 0.2,
    },
    medium: {
        sound: ALERT_ASSETS.MEDIUM, background: BACKGROUND_ASSETS.MEDIUM,
        nameAt: 1500, amountAt: 2500, stiffness: 140, damping: 20,
        nameScale: 1.15, nameShadow: 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]',
        amountShadow: '0 0 45px rgba(255,0,127,0.6), 0 10px 0 #713f12', messageDelay: 0.5,
    },
    professional: {
        sound: ALERT_ASSETS.PROFESSIONAL, background: BACKGROUND_ASSETS.PROFESSIONAL,
        nameAt: 2000, amountAt: 3200, stiffness: 130, damping: 18,
        nameScale: 1.2, nameShadow: 'drop-shadow-[0_6px_15px_rgba(0,0,0,0.9)]',
        amountShadow: '0 0 50px rgba(255,0,127,0.6), 0 10px 0 #581c87', messageDelay: 0.5,
    },
} as const;

export type StandardPreset = keyof typeof PRESETS;

export default function StandardTier({
    preset, donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80, currency = 'د.ل',
}: TierAlertProps & { preset: StandardPreset }) {
    const p = PRESETS[preset];
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const count = useSpring(0, { stiffness: p.stiffness, damping: p.damping });
    const rounded = useTransform(count, (v) => Math.round(v));

    useEffect(() => {
        const t = setTimeout(onComplete, duration);
        return () => clearTimeout(t);
    }, [duration, onComplete]);

    useEffect(() => {
        const sound = soundUrl || p.sound;
        audioManager.play(sound, { volume: volume / 100 });
        const nameTimer = setTimeout(() => setShowName(true), p.nameAt);
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, p.amountAt);
        return () => {
            audioManager.stop(sound);
            clearTimeout(nameTimer);
            clearTimeout(amountTimer);
        };
    }, [amount, count, soundUrl, volume, p]);

    const amountStyle = { color: '#ff007f', textShadow: p.amountShadow };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center px-4"
        >
            <div className="relative mb-4 aspect-video w-[clamp(450px,60vw,900px)]">
                <TierBackground url={backgroundUrl} fallbackUrl={p.background} volume={volume} className="h-full w-full object-contain" />
            </div>

            <div className="relative z-10 flex w-full flex-col items-center gap-[6vh] text-center">
                <div className="flex flex-col items-center gap-[2vh]">
                    <AnimatePresence mode="wait">
                        {showName && (
                            <motion.div
                                initial={{ scale: 0.5, y: -50, opacity: 0 }}
                                animate={{ scale: [0.5, p.nameScale, 1], y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`line-clamp-2 max-w-[90vw] break-words text-[clamp(3rem,8vw,8rem)] font-black uppercase leading-tight text-white ${p.nameShadow}`}
                            >
                                {donorName}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {showAmount && (
                            <motion.div
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={{ scale: [0.3, 1.3, 1], opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                                className="flex items-center justify-center"
                                dir="ltr"
                            >
                                <span className="text-[clamp(5rem,13vw,13rem)] font-black leading-none" style={amountStyle}>
                                    <motion.span>{rounded}</motion.span>
                                </span>
                                <span className="ml-4 align-middle text-[clamp(2.5rem,6vw,6rem)] font-black" style={amountStyle}>
                                    {currency}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                    {showAmount && message?.trim() && (
                        <motion.div
                            initial={{ scale: 0.5, y: 30, opacity: 0 }}
                            animate={{ scale: [0.5, 1.1, 1], y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: p.messageDelay }}
                            className="max-w-[90vw]"
                        >
                            <p className="line-clamp-3 break-words text-[clamp(1.8rem,4.5vw,5rem)] font-bold leading-tight text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                                &ldquo;{message}&rdquo;
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
