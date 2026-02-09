
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
}

/**
 * PROFESSIONAL TIER (50 - 99 LYD)
 * Sleek, professional aesthetic with glassmorphism. Now with Munancho GIF.
 */
export default function ProfessionalTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl }: ProfessionalTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showBorder, setShowBorder] = useState(false);

    const count = useSpring(0, { stiffness: 20, damping: 25 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration || 60000);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.PROFESSIONAL;
        audioManager.preload('prof_alert', alertSound);
        audioManager.play('prof_alert', { volume: 0.6 });

        // Phase 1: Mystery Entry Buildup (7s)
        const nameTimer = setTimeout(() => {
            setShowName(true);
            setShowBorder(true);
        }, 7000);

        // Phase 2: Amount reveal
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 8500);

        return () => {
            audioManager.stop('prof_alert');
            clearTimeout(nameTimer);
            clearTimeout(amountTimer);
        };
    }, [amount, count, soundUrl]);

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
                        className="tier-border border-prof"
                    />
                )}
            </AnimatePresence>

            {/* --- 🌌 HYBRID BACKGROUND (VIDEO/IMAGE) --- */}
            <TierBackground
                url={backgroundUrl}
                fallbackUrl={BACKGROUND_ASSETS.PROFESSIONAL}
                opacity={0.6}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70" />

            {/* --- ✨ SUBTLE AMBIENT LOOP --- */}
            <AnimatePresence>
                {showBorder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="prism-drift-loop opacity-30"
                    />
                )}
            </AnimatePresence>

            <div className="grain-overlay" />

            {/* --- ⚛️ QUANTUM SINGULARITY ENTRY (7s - PROFESSIONAL EXCLUSIVE) --- */}
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="quantum-singularity-effect" />
                <div className="crystal-geometry" />
            </div>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[4vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[2vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 40, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <h2 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-white tracking-tighter leading-none text-sovereign-shadow uppercase text-shimmer">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, filter: 'blur(20px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    className="flex flex-col items-center relative"
                                >
                                    {/* --- ✨ VIBRANT BACKLIGHT --- */}
                                    <div className="absolute inset-[-100px] professional-backlight opacity-60 z-0 animate-pulse" />

                                    <motion.span className="text-[clamp(4.5rem,12vw,12rem)] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-indigo-200 text-professional-glow text-sovereign-shadow leading-none relative z-10">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.5rem,4vw,4rem)] text-purple-200 font-black ml-4 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] text-shimmer">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 0.5 }}
                                className="unified-message-card card-accent-prof"
                            >
                                <p className="text-[clamp(1.2rem,2.5vw,3rem)] text-slate-200 font-semibold italic text-sovereign-shadow">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Prismatic Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-white to-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.6)] z-[60]" />
        </motion.div>
    );
}
