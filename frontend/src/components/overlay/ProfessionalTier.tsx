
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
        }, duration);

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

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[10vh] w-full text-center px-4">
                    <div className="flex flex-col items-center gap-[3vh]">
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0, scale: 0.8 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ duration: 1 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <h2 className="text-[clamp(3.5rem,8.5vw,9.5rem)] font-black text-white tracking-widest leading-tight drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] uppercase break-words max-w-[95vw]">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-[clamp(6rem,14vw,14rem)] font-black leading-none"
                                        style={{
                                            color: '#ff007f',
                                            textShadow: '0 0 50px rgba(255,0,127,0.7), 0 12px 0 #4d0026'
                                        }}
                                    >
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(1.8rem,4vw,4.5rem)] opacity-90 font-black ml-6">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="max-w-5xl"
                            >
                                <p className="text-[clamp(2.2rem,4.5vw,5rem)] font-bold text-white/95 leading-tight italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] break-words max-w-[90vw]">
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
