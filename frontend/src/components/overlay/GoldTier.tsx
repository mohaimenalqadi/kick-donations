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
        }, duration);

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

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[15vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[4vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0, filter: 'blur(30px)' }}
                                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <h2 className="text-[clamp(3rem,9.5vw,9.5rem)] font-black text-white tracking-[0.1em] leading-[1.1] drop-shadow-[0_5px_50px_rgba(0,0,0,0.9)] uppercase break-words max-w-[90vw]">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.2, opacity: 0, filter: 'blur(50px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-[clamp(8rem,20vw,20rem)] font-black text-[#ff007f] drop-shadow-[0_0_80px_rgba(255,0,127,0.8)] leading-none text-sovereign-shadow">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(2.5rem,6vw,6rem)] text-[#ff007f]/90 font-black ml-10">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 1, duration: 1 }}
                                className="max-w-7xl"
                            >
                                <p className="text-[clamp(2.5rem,5vw,6rem)] text-white font-black drop-shadow-[0_5px_60px_rgba(0,0,0,1)] leading-tight break-words max-w-[85vw]">
                                    {message}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
