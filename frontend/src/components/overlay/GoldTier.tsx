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
                                    <h2 className="text-[clamp(3.5rem,9.5vw,9.5rem)] font-black text-white tracking-[0.05em] leading-[1.1] drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] uppercase break-words max-w-[95vw]">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, filter: 'blur(20px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-[clamp(6rem,14vw,14rem)] font-black leading-none"
                                        style={{
                                            color: '#ff007f',
                                            textShadow: '0 0 50px rgba(255,0,127,0.7), 0 12px 0 #4d0026'
                                        }}
                                    >
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.8rem,4vw,4.5rem)] opacity-90 font-black ml-6">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 1, duration: 1 }}
                                className="max-w-7xl"
                            >
                                <p className="text-[clamp(2.5rem,5vw,6rem)] font-bold text-white/95 leading-tight italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] break-words max-w-[90vw]">
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
