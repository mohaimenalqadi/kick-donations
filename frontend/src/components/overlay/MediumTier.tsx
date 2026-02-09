
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
        }, duration || 30000);

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
            {/* --- 🖼️ TIER BORDER --- */}
            <AnimatePresence>
                {showBorder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="tier-border border-medium"
                    />
                )}
            </AnimatePresence>

            {/* --- 🌌 HYBRID BACKGROUND (VIDEO/IMAGE) --- */}
            <TierBackground
                url={backgroundUrl}
                fallbackUrl={BACKGROUND_ASSETS.MEDIUM}
                opacity={0.6}
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-black opacity-60" />
            <div className="grain-overlay" />

            {/* --- ☄️ MEDIUM ENTRY (TRANSFERRED FROM CINEMATIC) --- */}
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="nebula-effect scale-110 opacity-40" />
                <div className="ignition-effect scale-75" />
                <div className="shockwave scale-75" />
            </div>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[4vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[1.5vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 30, opacity: 0, scale: 0.95 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <h2 className="text-[clamp(2.5rem,6vw,6rem)] font-black text-white tracking-tighter leading-none text-sovereign-shadow uppercase">
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
                                    <span className="text-[clamp(4rem,10vw,10rem)] font-black text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] text-sovereign-shadow leading-none">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.2rem,3vw,3.5rem)] text-blue-300 opacity-80 font-black ml-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="unified-message-card card-accent-medium"
                            >
                                <p className="text-[clamp(1.1rem,2.2vw,2.5rem)] text-slate-200 font-medium italic text-sovereign-shadow">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Cyan Accent Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-white to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-[60]" />
        </motion.div>
    );
}
