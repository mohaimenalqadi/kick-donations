
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface MediumTierProps {
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
 * MEDIUM TIER (10 - 49 LYD)
 * Modern, clean, and interactive.
 */
export default function MediumTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: MediumTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showBorder, setShowBorder] = useState(false);

    const count = useSpring(0, { stiffness: 25, damping: 25 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.MEDIUM;
        audioManager.preload('medium_alert', alertSound);
        audioManager.play('medium_alert', { volume: (volume / 100) });

        // Phase 1: Entry Buildup (5s for Medium)
        const nameTimer = setTimeout(() => {
            setShowName(true);
            setShowBorder(true);
        }, 5000);

        // Phase 2: Amount reveal
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 6500);

        return () => {
            audioManager.stop('medium_alert');
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
                fallbackUrl={BACKGROUND_ASSETS.MEDIUM}
                opacity={0.8}
                volume={volume}
            />

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[8vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[2.5vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 30, opacity: 0, scale: 0.95 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <h2 className="text-[clamp(3rem,7vw,7rem)] font-black text-white tracking-tighter leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] uppercase">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.7, opacity: 0, filter: 'blur(15px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-[clamp(5rem,12vw,12rem)] font-black text-[#ff007f] drop-shadow-[0_0_40px_rgba(255,0,127,0.5)] leading-none">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.5rem,3.5vw,4rem)] text-[#ff007f]/80 font-black ml-4">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="max-w-4xl"
                            >
                                <p className="text-[clamp(1.8rem,3.5vw,4rem)] text-white font-black drop-shadow-[0_4px_30px_rgba(0,0,0,1)] leading-relaxed">
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
