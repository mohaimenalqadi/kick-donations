'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function StandbyScreen() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Kick Green Layer - Very subtle transparency */}
            <div className="absolute inset-0 bg-[#03e115]/5" />

            {/* Diagonal Scanlines Effect */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(45deg, #03e115 25%, transparent 25%, transparent 50%, #03e115 50%, #03e115 75%, transparent 75%, transparent 100%)',
                    backgroundSize: '4px 4px'
                }}
            />

            {/* Pulsing Ethereal Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    rotate: [0, 90, 180, 270, 360]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute w-[800px] h-[800px] bg-gradient-to-r from-[#03e115]/10 via-transparent to-[#03e115]/10 rounded-full blur-[120px]"
            />

            {/* Center Branding (Subtle) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.1, scale: 1 }}
                className="relative z-10 flex flex-col items-center gap-4"
            >
                <div className="w-24 h-24 border-4 border-[#03e115] rounded-3xl rotate-45 flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#03e115] rounded-lg -rotate-45 shadow-[0_0_50px_#03e115]" />
                </div>
                <h2 className="text-4xl font-black text-[#03e115] italic tracking-widest uppercase">
                    Standby
                </h2>
            </motion.div>

            {/* Decorative Corner Accents */}
            <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-[#03e115]/20 rounded-tl-3xl" />
            <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-[#03e115]/20 rounded-tr-3xl" />
            <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-[#03e115]/20 rounded-bl-3xl" />
            <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-[#03e115]/20 rounded-br-3xl" />
        </motion.div>
    );
}
