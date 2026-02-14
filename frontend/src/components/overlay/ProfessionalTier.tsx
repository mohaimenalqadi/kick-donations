
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface ProfessionalTierProps {
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
 * PROFESSIONAL TIER (50 - 99 LYD)
 * Sleek, professional aesthetic with glassmorphism. Now with Munancho GIF.
 */
export default function ProfessionalTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: ProfessionalTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showBorder, setShowBorder] = useState(false);

    const count = useSpring(0, { stiffness: 130, damping: 18 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.PROFESSIONAL;
        audioManager.preload('prof_alert', alertSound);
        audioManager.play('prof_alert', { volume: (volume / 100) });

        // Phase 1: Mystery Entry Buildup (2s)
        const nameTimer = setTimeout(() => {
            setShowName(true);
            setShowBorder(true);
        }, 2000);

        // Phase 2: Amount reveal (3.2s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 3200);

        return () => {
            audioManager.stop('prof_alert');
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
            <div className="relative w-[40vw] max-w-[700px] aspect-video rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.3)] border-4 border-purple-500/30 mb-8 bg-black/50">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.PROFESSIONAL}
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
                            animate={{ scale: [0.2, 1.2, 1], y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h2 className="text-[clamp(4.5rem,8vw,8.5rem)] font-black text-white tracking-tighter leading-none drop-shadow-[0_6px_8px_rgba(0,0,0,0.9)]"
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
                            animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
                            transition={{ type: "spring", stiffness: 130, damping: 18 }}
                        >
                            <span className="text-[clamp(6rem,12vw,12rem)] font-black text-purple-400 leading-none drop-shadow-[0_6px_8px_rgba(0,0,0,0.9)]"
                                style={{ WebkitTextStroke: '2px black' }}>
                                <motion.span>{rounded}</motion.span>
                                <span className="text-[0.6em] ml-4 text-white">د.ل</span>
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
                            className="max-w-6xl"
                        >
                            <p className="text-[clamp(2rem,3.5vw,4rem)] font-bold text-purple-50/95 leading-tight drop-shadow-lg break-words max-w-[90vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
