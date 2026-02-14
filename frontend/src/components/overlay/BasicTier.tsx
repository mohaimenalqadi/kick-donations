
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

    const count = useSpring(0, { stiffness: 160, damping: 20 });
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

        // Phase 1: Entry Buildup (0.8s for Basic)
        const nameTimer = setTimeout(() => {
            setShowName(true);
            setShowBorder(true);
        }, 800);

        // Phase 2: Amount reveal (1.5s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 1500);

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
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center z-50 px-4"
        >
            {/* --- MEDIA CONTAINER (Top) --- */}
            <div className="relative w-[30vw] max-w-[500px] aspect-video rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 border-white/10 mb-8 bg-black/50">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.BASIC}
                    opacity={1}
                    volume={volume}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* --- DATA CONTAINER (Bottom) --- */}
            <div className="flex flex-col items-center gap-[4vh] text-center w-full relative z-10">

                {/* Donor Name */}
                <AnimatePresence mode="wait">
                    {showName && (
                        <motion.div
                            initial={{ scale: 0.2, y: 50, opacity: 0 }}
                            animate={{ scale: [0.2, 1.1, 1], y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h2 className="text-[clamp(3.5rem,7vw,7rem)] font-black text-white tracking-tighter leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                                style={{ WebkitTextStroke: '2px black' }}>
                                {donorName}
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Amount */}
                <AnimatePresence mode="wait">
                    {showAmount && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                            transition={{ type: "spring", stiffness: 160, damping: 20 }}
                        >
                            <span className="text-[clamp(4rem,9vw,9rem)] font-black text-[#34d399] leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                                style={{ WebkitTextStroke: '2px black' }}>
                                <motion.span>{rounded}</motion.span>
                                <span className="text-[0.6em] ml-2 text-white">د.ل</span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Message */}
                <AnimatePresence>
                    {showAmount && message && message.trim() && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="max-w-4xl"
                        >
                            <p className="text-[clamp(1.5rem,3vw,3rem)] font-bold text-white/90 leading-tight drop-shadow-md break-words max-w-[85vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
