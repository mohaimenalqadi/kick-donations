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
    volume?: number;
}

/**
 * CINEMATIC TIER (100 - 499 LYD)
 * High-impact, wide-screen aesthetic. Now with Munancho GIF.
 */
export default function CinematicTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: CinematicTierProps) {
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
        audioManager.play('cinematic_alert', { volume: (volume / 100) });

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
    }, [amount, count, soundUrl, volume]);

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
                opacity={0.8}
                volume={volume}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60" />

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
                                    <h2 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-white tracking-tighter leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] uppercase">
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
                                    <motion.span className="text-[clamp(6rem,16vw,16rem)] font-black text-[#fbbf24] drop-shadow-[0_0_50px_rgba(251,191,36,0.7)] leading-none flex items-center gap-8">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.5rem,4vw,4rem)] text-[#fbbf24]/80 font-black italic drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.p
                                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 0.6 }}
                                className="text-[clamp(1.2rem,2.5vw,3rem)] text-white font-bold italic max-w-[65vw] mt-8 bg-black/50 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)]"
                            >
                                "{message}"
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
