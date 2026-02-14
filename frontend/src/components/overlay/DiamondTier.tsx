
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface DiamondTierProps {
    donorName: string;
    amount: number;
    message?: string;
    duration: number;
    onComplete: () => void;
    soundUrl?: string;
    backgroundUrl?: string;
    volume?: number;
    color?: string;
}

/**
 * DIAMOND TIER (40-49 LYD) - THE ULTIMATE ELITE ALERT
 * Standardized typography and layout to match the unified premium theme.
 */
export default function DiamondTier({
    donorName,
    amount,
    message,
    duration,
    onComplete,
    soundUrl,
    backgroundUrl,
    volume = 80,
    color = '#ff007f'
}: DiamondTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showGlow, setShowGlow] = useState(false);

    const count = useSpring(0, { stiffness: 120, damping: 22 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.LEGENDARY;
        audioManager.preload('diamond_alert', alertSound);
        audioManager.play('diamond_alert', { volume: (volume / 100) });

        // Phase 1: Diamond Glow Buildup (8s)
        const glowTimer = setTimeout(() => setShowGlow(true), 8000);

        // Phase 2: Name reveal (10s)
        const nameTimer = setTimeout(() => setShowName(true), 10000);

        // Phase 3: Amount reveal (12s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 12000);

        return () => {
            audioManager.stop('diamond_alert');
            clearTimeout(glowTimer);
            clearTimeout(nameTimer);
            clearTimeout(amountTimer);
        };
    }, [amount, count, soundUrl, volume]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center overflow-hidden z-[9999]"
        >
            {/* --- 🌌 BACKGROUND --- */}
            <TierBackground
                url={backgroundUrl}
                fallbackUrl={BACKGROUND_ASSETS.LEGENDARY}
                opacity={0.85}
                volume={volume}
            />

            {/* Diamond gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-purple-900/20 to-black/70 z-[5]" />

            {/* Pulsing diamond glow effect */}
            <AnimatePresence>
                {showGlow && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 z-10 flex items-center justify-center"
                    >
                        <div className="w-[60vw] h-[60vw] rounded-full bg-gradient-radial from-fuchsia-500/30 via-purple-500/10 to-transparent blur-3xl" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4">
                <div className="flex flex-col items-center gap-[6vh] w-full text-center">
                    <div className="flex flex-col items-center gap-[3vh] relative">

                        {/* Donor Name */}
                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ scale: 0.3, y: 50, opacity: 0, filter: 'blur(25px)' }}
                                    animate={{ scale: [0.3, 1.25, 1], y: 0, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="relative z-10"
                                >
                                    <h2 className="text-[clamp(3.5rem,8.5vw,8.5rem)] font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] uppercase break-words max-w-[95vw]">
                                        {donorName}
                                    </h2>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Amount Reveal */}
                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.2, opacity: 0, filter: 'blur(25px)' }}
                                    animate={{ scale: [0.2, 1.4, 1], opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 160, damping: 15 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-[clamp(7rem,15vw,15rem)] font-black leading-none"
                                        style={{
                                            color: color,
                                            textShadow: `0 0 50px ${color}80, 0 12px 0 #4d0026`
                                        }}
                                    >
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(2rem,4.5vw,5.5rem)] opacity-90 ml-6 font-black">د.ل</span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Message */}
                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.4, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.4 }}
                                className="max-w-6xl"
                            >
                                <p className="text-[clamp(2.2rem,4.5vw,5rem)] font-bold text-white/95 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] break-words max-w-[90vw]">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Glow */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[40vh] opacity-30 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
            />
        </motion.div>
    );
}
