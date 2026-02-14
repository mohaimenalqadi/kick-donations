
'use client';

import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
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
    const count = useSpring(0, { stiffness: 90, damping: 20 });
    const rounded = useTransform(count, latest => Math.round(latest));

    const [showName, setShowName] = useState(false);
    const [showAmount, setShowAmount] = useState(false);

    useEffect(() => {
        // Phase 1: Name reveal (5.5s)
        const nameTimer = setTimeout(() => setShowName(true), 5500);

        // Phase 2: Amount reveal (8.5s)
        const amountTimer = setTimeout(() => {
            setShowAmount(true);
            count.set(amount);
        }, 8500);

        return () => {
            clearTimeout(nameTimer);
            clearTimeout(amountTimer);
        };
    }, [amount, count]);

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
            <div className="z-10 flex flex-col items-center gap-[6vh] w-full text-center px-4 pointer-events-none">
                <div className="flex flex-col items-center gap-[4vh]">
                    {/* Donor Name */}
                    <AnimatePresence mode="wait">
                        {showName && (
                            <motion.div
                                initial={{ scale: 0.5, y: -50, opacity: 0 }}
                                animate={{ scale: [0.5, 1.1, 1], y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-[clamp(3rem,8vw,8rem)] font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] break-words max-w-[90vw] leading-tight uppercase"
                            >
                                {donor}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Amount - MEGA Styled */}
                    <AnimatePresence mode="wait">
                        {showAmount && (
                            <motion.div
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={{ scale: [0.3, 1.3, 1], opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 150,
                                    damping: 15,
                                    delay: 0
                                }}
                                className="text-[clamp(6rem,14vw,14rem)] font-black leading-none p-4"
                                style={{
                                    color: '#ff007f',
                                    textShadow: '0 0 40px rgba(255,0,127,0.6), 0 10px 0 #4d0026'
                                }}
                            >
                                <motion.span>{rounded}</motion.span> <span className="text-[clamp(2rem,4vw,5rem)] align-middle ml-4">د.ل</span>
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
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                            className="text-[clamp(1.5rem,4vw,4.5rem)] font-bold text-white/90 leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] break-words max-w-[95vw]"
                        >
                            "{message}"
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Glow */}
            <div
                className="absolute bottom-0 left-0 right-0 h-96 opacity-40 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
            />
        </div>
    );
}
