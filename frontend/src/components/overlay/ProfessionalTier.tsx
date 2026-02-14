
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
            {/* --- MEDIA CONTAINER (Frameless) --- */}
            <div className="relative w-[40vw] max-w-[700px] aspect-video mb-4">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.PROFESSIONAL}
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
                                animate={{ scale: [0.5, 1.2, 1], y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-[clamp(4.5rem,8vw,8.5rem)] font-black text-white drop-shadow-[0_6px_15px_rgba(0,0,0,0.9)] break-words max-w-[90vw] leading-tight uppercase"
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
                                className="text-[clamp(6rem,12vw,12rem)] font-black leading-none p-4"
                                style={{
                                    color: '#c084fc', // Tier Color (Purple)
                                    textShadow: '0 0 50px rgba(192,132,252,0.6), 0 10px 0 #581c87' // Deep shadow matching FiftyTier
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
                            className="max-w-6xl"
                        >
                            <p className="text-[clamp(2.5rem,4vw,5rem)] font-bold text-white/95 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] break-words max-w-[90vw]">
                                "{message}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
