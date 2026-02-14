'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
    topDonor: {
        donor_name: string;
        amount: number;
    } | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ topDonor }) => {
    return (
        <AnimatePresence>
            {topDonor && (
                <motion.div
                    initial={{ opacity: 0, x: -50, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.8 }}
                    transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 100
                    }}
                    className="relative group"
                >
                    {/* High-end Solid Glass Card */}
                    <div className="bg-[#0f0f12]/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-2 pr-8 flex items-center gap-5 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative min-w-[320px]">

                        {/* Animated Glow Border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fbbf24]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        {/* Icon Container */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#fbbf24]/20 shrink-0">
                            <Trophy size={26} className="text-black" />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1.5">
                                أفضل دعم
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-white whitespace-nowrap">
                                    {topDonor.donor_name}
                                </span>
                                <div className="h-5 w-[1.5px] bg-white/10 shrink-0" />
                                <span className="text-xl font-black text-[#fbbf24] shrink-0">
                                    {topDonor.amount} <small className="text-[11px] opacity-70">د.ل</small>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Outer Ring Effect */}
                    <div className="absolute -inset-[2px] rounded-[30px] border border-[#fbbf24]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Leaderboard;
