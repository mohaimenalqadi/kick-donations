
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

    const count = useSpring(0, { stiffness: 140, damping: 20 });
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

        // Phase 1: Entry Buildup (1.5s for Medium)
        const nameTimer = setTimeout(() => {
            setShowName(true);
            setShowBorder(true);
        }, 1500);

        // Phase 2: Amount reveal (2.5s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 2500);

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
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center z-50 px-4"
        >
            {/* --- MEDIA CONTAINER (Top) --- */}
            <div className="relative w-[35vw] max-w-[600px] aspect-video rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.2)] border-4 border-yellow-400/20 mb-8 bg-black/50">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.MEDIUM}
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
                            animate={{ scale: [0.2, 1.15, 1], y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h2 className="text-[clamp(4rem,7.5vw,7.5rem)] font-black text-white tracking-tighter leading-none drop-shadow-[0_5px_8px_rgba(0,0,0,0.9)]"
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
                            transition={{ type: "spring", stiffness: 140, damping: 20 }}
                        >
                            <span className="text-[clamp(5rem,10vw,10rem)] font-black text-yellow-400 leading-none drop-shadow-[0_5px_8px_rgba(0,0,0,0.9)]"
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
                            className="max-w-5xl"
                        >
                            <p className="text-[clamp(1.8rem,3.2vw,3.5rem)] font-bold text-yellow-50/95 leading-tight drop-shadow-md break-words max-w-[90vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
