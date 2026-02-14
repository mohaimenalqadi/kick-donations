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
    const count = useSpring(0, { stiffness: 60, damping: 20 });
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

        // Phase 1: Name reveal (2s - Fast)
        const overlayTimer = setTimeout(() => setShowOverlay(true), 1500);
        const nameTimer = setTimeout(() => setShowName(true), 2000);

        // Phase 2: Amount reveal (2.5s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 2500);

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
                {/* --- DATA CONTAINER (Standardized Spec) --- */}
                <div className="flex flex-col items-center gap-[6vh] text-center w-full px-4">

                    <div className="flex flex-col items-center gap-[2vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ scale: 0.3, y: 100, opacity: 0, filter: 'blur(30px)' }}
                                    animate={{ scale: [0.3, 1.2, 1], y: 0, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="text-[clamp(3rem,8vw,8rem)] font-black text-white tracking-[0.05em] leading-tight drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] uppercase break-words max-w-[90vw]"
                                >
                                    {donorName}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.2, opacity: 0, filter: 'blur(20px)' }}
                                    animate={{ scale: [0.2, 1.35, 1], opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                                    className="flex items-center justify-center"
                                >
                                    <span className="text-[clamp(5rem,13vw,13rem)] font-black leading-none"
                                        style={{
                                            color: '#ff007f',
                                            textShadow: '0 0 50px rgba(255,0,127,0.7), 0 12px 0 #4d0026'
                                        }}
                                    >
                                        <motion.span>{rounded}</motion.span>
                                    </span>
                                    <span className="text-[clamp(2.5rem,6vw,6rem)] font-black ml-4 align-middle"
                                        style={{
                                            color: '#ff007f', // Unified Label Color
                                            textShadow: '0 0 50px rgba(255,0,127,0.7), 0 12px 0 #4d0026'
                                        }}
                                    >
                                        د.ل
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.3, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.5 }}
                                className="max-w-[90vw]"
                            >
                                <p className="text-[clamp(1.8rem,4.5vw,5rem)] font-bold text-white/95 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] break-words">
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
