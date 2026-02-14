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

    const count = useSpring(0, { stiffness: 80, damping: 20 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.CINEMATIC;
        audioManager.preload('cinematic_alert', alertSound);
        audioManager.play('cinematic_alert', { volume: (volume / 100) });

        // Phase 1: High-Duration Buildup (8s)
        const nameTimer = setTimeout(() => setShowName(true), 8000);

        // Phase 2: Amount reveal (12s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 12000);

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
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center z-50 px-4"
        >
            {/* --- MEDIA CONTAINER (Frameless) --- */}
            <div className="relative w-[45vw] max-w-[800px] aspect-video mb-6">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.CINEMATIC}
                    opacity={1}
                    volume={volume}
                    className="w-full h-full object-contain"
                />
            </div>

            {/* --- DATA CONTAINER (FiftyTier Style) --- */}
            <div className="flex flex-col items-center gap-[6vh] text-center w-full relative z-10">

                <div className="flex flex-col items-center gap-[4vh]">
                    {/* Donor Name */}
                    <AnimatePresence mode="wait">
                        {showName && (
                            <motion.div
                                initial={{ scale: 0.5, y: -50, opacity: 0 }}
                                animate={{ scale: [0.5, 1.25, 1], y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-[clamp(5rem,9vw,9.5rem)] font-black text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.95)] break-words max-w-[90vw] leading-tight uppercase"
                            >
                                {donorName}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Amount */}
                    <AnimatePresence mode="wait">
                        {showAmount && (
                            <motion.div
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={{ scale: [0.3, 1.4, 1], opacity: 1 }}
                                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                                className="text-[clamp(7rem,14vw,14rem)] font-black leading-none p-4"
                                style={{
                                    color: '#ff007f', // Unified Color (Pink/Magenta)
                                    textShadow: '0 0 55px rgba(255,0,127,0.6), 0 12px 0 #be185d'
                                }}
                            >
                                <motion.span>{rounded}</motion.span>
                                <span className="text-[clamp(2.5rem,5vw,6rem)] align-middle ml-4 text-white">د.ل</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Message */}
                <AnimatePresence mode="wait">
                    {showAmount && message && message.trim() && (
                        <motion.div
                            initial={{ scale: 0.5, y: 30, opacity: 0 }}
                            animate={{ scale: [0.5, 1.1, 1], y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
                            className="max-w-7xl"
                        >
                            <p className="text-[clamp(1.5rem,4.5vw,5.5rem)] font-bold text-white/95 leading-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)] break-words max-w-[95vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
