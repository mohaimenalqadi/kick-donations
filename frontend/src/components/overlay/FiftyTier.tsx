
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
    return (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <TierBackground
                    url={backgroundUrl}
                    fallbackUrl={BACKGROUND_ASSETS.CINEMATIC}
                />
            </div>

            {/* Content Area */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="z-10 flex flex-col items-center text-center max-w-5xl px-10 pointer-events-none"
            >
                {/* Donor Name */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[clamp(3rem,8vw,8rem)] font-black text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] break-words max-w-[90vw] leading-tight uppercase"
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
                        damping: 15,
                        delay: 0.4
                    }}
                    className="text-[clamp(6rem,14vw,14rem)] font-black leading-none mb-6 p-4"
                    style={{
                        color: '#ff007f',
                        textShadow: '0 0 40px rgba(255,0,127,0.6), 0 10px 0 #4d0026'
                    }}
                >
                    {amount} <span className="text-[clamp(2rem,4vw,5rem)] align-middle ml-4">د.ل</span>
                </motion.div>

                {/* Message */}
                {message && message.trim() && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-[clamp(2rem,4vw,4.5rem)] font-bold text-white/90 leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] break-words max-w-[85vw]"
                    >
                        "{message}"
                    </motion.div>
                )}
            </motion.div>

            {/* Bottom Glow */}
            <div
                className="absolute bottom-0 left-0 right-0 h-96 opacity-40 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
            />
        </div>
    );
}
