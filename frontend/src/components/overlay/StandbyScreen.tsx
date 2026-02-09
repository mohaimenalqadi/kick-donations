'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function StandbyScreen() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 flex flex-col items-center justify-center overflow-hidden bg-[#03e115]"
        >
            {/* Subtle Texture/Grain for Depth */}
            <div className="absolute inset-0 opacity-[0.1]"
                style={{
                    backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
                    filter: 'contrast(150%) brightness(100%)'
                }}
            />

            {/* Glowing Ethereal Core behind text */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[800px] h-[800px] bg-white filter blur-[180px] opacity-10 rounded-full"
            />

            {/* Center Branding: Khawlidi */}
            <div className="relative z-10 flex flex-col items-center overflow-visible">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                    className="relative"
                >
                    {/* Ghost Duplicate for Premium Glow Effect */}
                    <h1 className="absolute inset-0 text-[16rem] font-black text-white/10 blur-3xl select-none leading-none tracking-tighter italic">
                        Khawlidi
                    </h1>

                    <h1 className="relative text-[16rem] font-black text-[#0a0a0a] select-none leading-none tracking-tighter italic"
                        style={{
                            textShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                    >
                        Khawlidi
                    </h1>
                </motion.div>

                {/* Subtitle / Decorative Elements */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '110%' }}
                    transition={{ delay: 0.8, duration: 1.2, ease: "circOut" }}
                    className="h-3 bg-[#0a0a0a] mt-[-1.5rem] drop-shadow-2xl"
                />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 1.5 }}
                    className="mt-8 flex items-center gap-6"
                >
                    <div className="h-[1px] w-24 bg-[#0a0a0a]" />
                    <span className="text-3xl font-black text-[#0a0a0a] tracking-[1.5em] uppercase pl-[1.5em]">
                        Sovereign
                    </span>
                    <div className="h-[1px] w-24 bg-[#0a0a0a]" />
                </motion.div>
            </div>

            {/* Dynamic Light Sweep Animation */}
            <motion.div
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[45deg] pointer-events-none"
            />

            {/* Massive Corner Visual Accents */}
            <div className="absolute top-16 left-16 w-48 h-48 border-t-[24px] border-l-[24px] border-[#0a0a0a]" />
            <div className="absolute bottom-16 right-16 w-48 h-48 border-b-[24px] border-r-[24px] border-[#0a0a0a]" />

            {/* HUD Status Text (Bottom Left) */}
            <div className="absolute bottom-16 left-16 flex flex-col items-start opacity-40">
                <span className="text-xs font-black tracking-widest text-[#0a0a0a] uppercase">System State</span>
                <span className="text-sm font-bold text-[#0a0a0a] uppercase tracking-tighter italic">Standby Mode // Awaiting Transmission</span>
            </div>
        </motion.div>
    );
}
