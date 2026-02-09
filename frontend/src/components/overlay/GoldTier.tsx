'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { audioManager, ALERT_ASSETS, BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface GoldTierProps {
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
 * GOLD TIER (500+ LYD) - THE ULTIMATE ALERT
 * Premium, suspenseful, and absolutely extraordinary.
 */
export default function GoldTier({ donorName, amount, message, duration, onComplete, soundUrl, backgroundUrl, volume = 80 }: GoldTierProps) {
    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    // Retuning for "faster" but still professional count
    const count = useSpring(0, { stiffness: 15, damping: 30 });
    const rounded = useTransform(count, latest => Math.round(latest));

    // Master Duration Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration || 300000);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    useEffect(() => {
        const alertSound = soundUrl || ALERT_ASSETS.LEGENDARY;
        audioManager.preload('gold_alert', alertSound);
        audioManager.play('gold_alert', { volume: (volume / 100) });

        // Phase 1: Ultimate Suspense (12s)
        const overlayTimer = setTimeout(() => setShowOverlay(true), 12000);
        const nameTimer = setTimeout(() => setShowName(true), 14000);

        // Phase 2: Amount reveal
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 16000);

        return () => {
            audioManager.stop('gold_alert');
            clearTimeout(overlayTimer);
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
                {showOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="tier-border border-gold"
                    />
                )}
            </AnimatePresence>

            {/* --- 🌌 HYBRID BACKGROUND (VIDEO/IMAGE) --- */}
            <TierBackground
                url={backgroundUrl}
                fallbackUrl={BACKGROUND_ASSETS.LEGENDARY}
                opacity={0.8}
                volume={volume}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90" />
            <div className="grain-overlay" />

            {/* --- 🪐 AMBIENT GLOW --- */}
            <AnimatePresence>
                {showOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 4 }}
                        className="gold-ambient-glow"
                    />
                )}
            </AnimatePresence>

            {/* --- 💥 HYPER-SOVEREIGN IGNITION (10s ENTRY) --- */}
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="nebula-effect scale-150 opacity-40" />
                <div className="sovereign-ignition-effect" />
                {/* Custom Gold Shockwave */}
                <div className="shockwave border-amber-500/50" />
            </div>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-[6vh] w-full text-center px-8">
                    <div className="flex flex-col items-center gap-[2vh] relative">
                        {/* Sovereign Aura Glow */}
                        <div className="absolute inset-0 z-0 sovereign-aura blur-[100px]" />

                        <AnimatePresence mode="wait">
                            {showName && (
                                <motion.div
                                    initial={{ y: 60, opacity: 0, scale: 0.8, filter: 'blur(30px)' }}
                                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-4 relative z-10"
                                >
                                    <h1 className="text-[clamp(4.5rem,11vw,12rem)] font-black text-white tracking-tighter uppercase leading-none text-sovereign-shadow text-shimmer">
                                        {donorName}
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {showAmount && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, filter: 'blur(40px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    className="flex flex-col items-center relative z-10"
                                >
                                    <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-black text-amber-400 tracking-[0.2em] uppercase mb-4 text-glow-subtle opacity-80">
                                        Grand Sovereign Gift
                                    </h2>
                                    <motion.span className="text-[clamp(7rem,20vw,22rem)] font-black text-white leading-none text-sovereign-shadow text-shimmer">
                                        <motion.span>{rounded}</motion.span>
                                        <span className="text-[clamp(2rem,5vw,5rem)] text-amber-500 font-black ml-8 drop-shadow-[0_0_50px_rgba(245,158,11,0.8)]">د.ل</span>
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {showAmount && message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ delay: 0.8, duration: 1 }}
                                className="unified-message-card card-accent-gold"
                            >
                                <p className="text-[clamp(1.5rem,3vw,4rem)] text-slate-200 font-bold italic text-sovereign-shadow leading-relaxed">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Sovereign Light Pillar */}
            <div className="fixed left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_60px_rgba(245,158,11,0.8)] top-0 z-[60]" />
            <div className="fixed left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_60px_rgba(245,158,11,0.8)] bottom-0 z-[60]" />
        </motion.div>
    );
}
