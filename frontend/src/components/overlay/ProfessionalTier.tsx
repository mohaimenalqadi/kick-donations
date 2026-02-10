
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
        audioManager.play('prof_alert', { volume: (volume / 100) });

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
                fallbackUrl={BACKGROUND_ASSETS.PROFESSIONAL}
                opacity={0.8}
                volume={volume}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />

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
                                    <h2 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-white tracking-tighter leading-none drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] uppercase">
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
                                    <motion.span className="text-[clamp(4.5rem,12vw,12rem)] font-extrabold text-[#00FF00] drop-shadow-[0_0_40px_rgba(0,255,0,0.6)] leading-none relative z-10">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.5rem,4vw,4rem)] text-[#00FF00]/80 font-black ml-4 drop-shadow-[0_0_20px_rgba(0,255,0,0.5)]">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 0.5 }}
                                className="max-w-4xl px-12 py-6 bg-black/60 backdrop-blur-2xl rounded-[32px] border border-white/10"
                            >
                                <p className="text-[clamp(1.2rem,2.5vw,3rem)] text-white font-semibold italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
