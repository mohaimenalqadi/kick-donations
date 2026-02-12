
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface BasicTierProps {
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
 * BASIC TIER (1 - 9 LYD)
 * Simple, efficient, and clear.
 */
export default function BasicTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: BasicTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showBorder, setShowBorder] = useState(false);

    const count = useSpring(0, { stiffness: 30, damping: 25 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.BASIC;
        audioManager.preload('basic_alert', alertSound);
        audioManager.play('basic_alert', { volume: (volume / 100) });

        // Phase 1: Entry Buildup (3s for Basic)
        const nameTimer = setTimeout(() => {
            setShowName(true);
            setShowBorder(true);
        }, 3000);

        // Phase 2: Amount reveal
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 4500);

        return () => {
            audioManager.stop('basic_alert');
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
                fallbackUrl={BACKGROUND_ASSETS.BASIC}
                opacity={0.8}
                volume={volume}
            />

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[6vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[3vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.6 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-black text-white tracking-tight leading-none drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] uppercase">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 150, damping: 20 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-[clamp(4rem,9vw,9rem)] font-black text-[#ff007f] drop-shadow-[0_0_30px_rgba(255,0,127,0.4)] leading-none">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.2rem,3vw,3rem)] text-[#ff007f]/80 font-black ml-4">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="max-w-4xl"
                            >
                                <p className="text-[clamp(1.5rem,3vw,3.5rem)] text-white font-black drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] leading-relaxed">
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
