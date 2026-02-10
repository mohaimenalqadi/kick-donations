'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface GoldTierProps {
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
 * GOLD TIER (500+ LYD) - THE ULTIMATE ALERT
 * Premium, suspenseful, and absolutely extraordinary.
 */
export default function GoldTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: GoldTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    // Retuning for "faster" but still professional count
    const count = useSpring(0, { stiffness: 15, damping: 30 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration || 300000);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.LEGENDARY;
        audioManager.preload('gold_alert', alertSound);
        audioManager.play('gold_alert', { volume: (volume / 100) });

        // Phase 1: Ultimate Suspense (12s)
        const overlayTimer = setTimeout(() => setShowOverlay(true), 12000);
        const nameTimer = setTimeout(() => setShowName(true), 14000);

        // Phase 2: Amount reveal
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 16000);

        return () => {
            audioManager.stop('gold_alert');
            clearTimeout(overlayTimer);
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
                fallbackUrl={BACKGROUND_ASSETS.LEGENDARY}
                opacity={0.9}
                volume={volume}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[6vh] w-full text-center px-8">
                    <div className="flex flex-col items-center gap-[2vh] relative">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 60, opacity: 0, scale: 0.8, filter: 'blur(30px)' }}
                                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-4 relative z-10"
                                >
                                    <h1 className="text-[clamp(4.5rem,11vw,12rem)] font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_2px_30px_rgba(0,0,0,1)]">
                                        {donorName}
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, filter: 'blur(40px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    className="flex flex-col items-center relative z-10"
                                >
                                    <motion.span className="text-[clamp(7rem,20vw,22rem)] font-black text-[#fbbf24] leading-none drop-shadow-[0_0_60px_rgba(251,191,36,0.8)]">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(2rem,5vw,5rem)] text-[#fbbf24]/90 font-black ml-8 drop-shadow-[0_0_50px_rgba(251,191,36,0.6)]">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ delay: 0.8, duration: 1 }}
                                className="max-w-6xl px-16 py-8 bg-black/60 backdrop-blur-3xl rounded-[48px] border border-white/20 shadow-2xl"
                            >
                                <p className="text-[clamp(1.5rem,3vw,4rem)] text-white font-bold italic drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] leading-relaxed">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
