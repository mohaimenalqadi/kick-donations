
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BACKGROUND_ASSETS } from '@/lib/audio';
import TierBackground from './TierBackground';

interface FiftyTierProps {
    donor: string;
    amount: number;
    message: string;
    color?: string;
    backgroundUrl?: string;
    duration?: number;
}

export default function FiftyTier({ donor, amount, message, color = '#ff007f', backgroundUrl, duration = 120000 }: FiftyTierProps) {
    const [phase, setPhase] = useState<'suspense' | 'reveal'>('suspense');

    useEffect(() => {
        // Suspense phase for 4 seconds before reveal
        const timer = setTimeout(() => {
            setPhase('reveal');
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Background Video (Only visible in reveal phase or muted/subtle in suspense) */}
            <AnimatePresence>
                {phase === 'reveal' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0"
                    >
                        <TierBackground
                            url={backgroundUrl}
                            fallbackUrl={BACKGROUND_ASSETS.CINEMATIC}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SUSPENSE PHASE: The Bomb / Warning */}
            <AnimatePresence>
                {phase === 'suspense' && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: 1,
                            rotate: [0, -5, 5, -5, 5, 0]
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                        exit={{ scale: 5, opacity: 0, filter: 'blur(20px)' }}
                        className="z-50 flex flex-col items-center"
                    >
                        <div className="relative">
                            {/* Bomb Icon Symbol */}
                            <div className="text-9xl filter drop-shadow-[0_0_20px_#ff007f]">💣</div>
                            <motion.div
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.2, repeat: Infinity }}
                                className="absolute -top-4 -right-4 text-6xl"
                            >
                                ⚡
                            </motion.div>
                        </div>
                        <h2 className="mt-8 text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_30px_#ff007f]">
                            Mega Support Incoming...
                        </h2>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* REVEAL PHASE: The Data */}
            <AnimatePresence>
                {phase === 'reveal' && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="z-10 flex flex-col items-center text-center max-w-5xl px-10"
                    >
                        {/* Donor Name */}
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl font-black text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                        >
                            {donor}
                        </motion.div>

                        {/* Amount - MEGA Styled */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 10,
                                delay: 0.4
                            }}
                            className="text-[12rem] font-black leading-none mb-6 p-4 rounded-3xl"
                            style={{
                                color: '#ff007f',
                                textShadow: '0 0 40px rgba(255,0,127,0.6), 0 10px 0 #4d0026'
                            }}
                        >
                            {amount} <span className="text-6xl align-middle">د.ل</span>
                        </motion.div>

                        {/* Message */}
                        {message && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-4xl font-bold text-white/90 leading-relaxed italic drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                            >
                                "{message}"
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Glow */}
            <div
                className="absolute bottom-0 left-0 right-0 h-96 opacity-30 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
            />
        </div>
    );
}
