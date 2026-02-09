'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface CinematicTierProps {
    donorName: string;
    amount: number;
    message?: string;
    duration: number;
    onComplete: () => void;
    soundUrl?: string;
    backgroundUrl?: string;
}

/**
 * CINEMATIC TIER (100 - 499 LYD)
 * High-impact, wide-screen aesthetic. Now with Munancho GIF.
 */
export default function CinematicTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl }: CinematicTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);

    const count = useSpring(0, { stiffness: 25, damping: 25 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration || 180000);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.CINEMATIC;
        audioManager.preload('cinematic_alert', alertSound);
        audioManager.play('cinematic_alert', { volume: 0.7 });

        // Phase 1: High-Duration Buildup (10s)
        const nameTimer = setTimeout(() => setShowName(true), 10000);

        // Phase 2: Amount reveal
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 11500);

        return () => {
            audioManager.stop('cinematic_alert');
            clearTimeout(nameTimer);
            clearTimeout(amountTimer);
        };
    }, [amount, count, soundUrl]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center overflow-hidden"
        >
            {/* --- 🌌 HYBRID BACKGROUND (VIDEO/IMAGE) --- */}
            <TierBackground
                url={backgroundUrl}
                fallbackUrl={BACKGROUND_ASSETS.CINEMATIC}
                opacity={0.6}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
            <div className="grain-overlay" />

            {/* --- 🪐 CINEMATIC ENTRY (TRANSFERRED FROM PROFESSIONAL) --- */}
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="mystery-fusion-effect scale-125" />
            </div>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[4vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[2vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <h2 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-white tracking-tighter leading-none text-sovereign-shadow uppercase">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, filter: 'blur(30px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                    className="flex flex-col items-center"
                                >
                                    <motion.span className="text-[clamp(6rem,16vw,16rem)] font-black text-white leading-none text-sovereign-shadow flex items-center gap-8">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.5rem,4vw,4rem)] text-red-500 font-black italic drop-shadow-[0_0_25px_rgba(239,68,68,0.7)] uppercase">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && (
                            <motion.p
                                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 0.6 }}
                                className="text-[clamp(1.2rem,2.5vw,3rem)] text-slate-200 font-bold italic max-w-[65vw] mt-8 bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 text-sovereign-shadow"
                            >
                                "{message}"
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Accent Bar */}
            <div className="fixed bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-white to-red-600 shadow-[0_0_30px_rgba(239,68,68,0.8)] z-50" />
        </motion.div>
    );
}
