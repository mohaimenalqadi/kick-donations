
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
            {/* --- MEDIA CONTAINER (Frameless) --- */}
            <div className="relative w-[30vw] max-w-[500px] aspect-video mb-4">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.BASIC}
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
                                animate={{ scale: [0.5, 1.1, 1], y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-[clamp(3.5rem,7vw,7rem)] font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] break-words max-w-[90vw] leading-tight uppercase"
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
                                className="text-[clamp(4.5rem,10vw,10rem)] font-black leading-none p-4"
                                style={{
                                    color: '#ff007f', // Unified Color (Pink/Magenta)
                                    textShadow: '0 0 40px rgba(255,0,127,0.6), 0 10px 0 #4d0026'
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
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                            className="max-w-4xl"
                        >
                            <p className="text-[clamp(1.5rem,4vw,4.5rem)] font-bold text-white/90 leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] break-words max-w-[95vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
