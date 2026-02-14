
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
            {/* --- MEDIA CONTAINER (Frameless) --- */}
            <div className="relative w-[35vw] max-w-[600px] aspect-video mb-4">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.MEDIUM}
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
                                animate={{ scale: [0.5, 1.15, 1], y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-[clamp(4rem,7.5vw,7.5rem)] font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] break-words max-w-[90vw] leading-tight uppercase"
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
                                animate={{ scale: [0.3, 1.3, 1], opacity: 1 }}
                                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                                className="text-[clamp(5rem,11vw,11rem)] font-black leading-none p-4"
                                style={{
                                    color: '#facc15', // Tier Color (Yellow)
                                    textShadow: '0 0 45px rgba(250,204,21,0.6), 0 10px 0 #713f12' // Deep shadow matching FiftyTier
                                }}
                            >
                                <motion.span>{rounded}</motion.span>
                                <span className="text-[clamp(2rem,4vw,5rem)] align-middle ml-4 text-white">د.ل</span>
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
                            className="max-w-5xl"
                        >
                            <p className="text-[clamp(2.2rem,4.5vw,5rem)] font-bold text-white/95 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] break-words max-w-[90vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
