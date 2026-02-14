
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
}

/**
 * DIAMOND TIER (40-49 LYD) - THE ULTIMATE ELITE ALERT
 * Stunning diamond-themed visuals with pulsing glow and cinematic entrance.
 */
export default function DiamondTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: DiamondTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showGlow, setShowGlow] = useState(false);

    const count = useSpring(0, { stiffness: 12, damping: 28 });
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

        // Phase 1: Diamond Glow Buildup (10s)
        const glowTimer = setTimeout(() => setShowGlow(true), 8000);
        const nameTimer = setTimeout(() => setShowName(true), 10000);

        // Phase 2: Amount reveal
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
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center overflow-hidden"
        >
            {/* --- 🌌 HYBRID BACKGROUND (VIDEO/IMAGE) --- */}
            <TierBackground
                url={backgroundUrl}
                fallbackUrl={BACKGROUND_ASSETS.LEGENDARY}
                opacity={0.85}
                volume={volume}
            />

            {/* Diamond gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-purple-900/20 to-black/70" />

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
                <div className="flex flex-col items-center gap-[4vh] w-full text-center">
                    <div className="flex flex-col items-center gap-[2vh] relative">
                        {/* Diamond badge */}
                        <AnimatePresence>
                            {showName && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                    className="mb-4"
                                >
                                    <div className="w-24 h-24 flex items-center justify-center">
                                        <span className="text-7xl drop-shadow-[0_0_30px_rgba(232,121,249,0.8)]">💎</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0, scale: 0.8, filter: 'blur(25px)' }}
                                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-4 relative z-10"
                                >
                                    <h1 className="text-[clamp(3.5rem,10vw,10rem)] font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-white to-fuchsia-300 tracking-tighter uppercase leading-[1.1] drop-shadow-[0_2px_40px_rgba(232,121,249,0.5)] break-words max-w-[90vw]"
                                        style={{ WebkitTextStroke: '1px rgba(232,121,249,0.3)' }}
                                    >
                                        {donorName}
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, filter: 'blur(30px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 80, damping: 18 }}
                                    className="flex flex-col items-center relative z-10"
                                >
                                    <motion.span className="text-[clamp(8rem,22vw,22rem)] font-black text-fuchsia-300 leading-none drop-shadow-[0_0_80px_rgba(232,121,249,0.7)]">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(2.5rem,6vw,6rem)] text-fuchsia-300/90 font-black ml-10 drop-shadow-[0_0_60px_rgba(232,121,249,0.5)]">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && message.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="max-w-7xl"
                            >
                                <p className="text-[clamp(2.5rem,5vw,6rem)] text-white font-black drop-shadow-[0_5px_80px_rgba(232,121,249,0.8)] leading-tight break-words max-w-[85vw]">
                                    {message}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
