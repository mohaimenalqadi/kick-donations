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
                    {/* High-end Glassmorphism Card */}
                    <div className="bg-[#0f0f12]/60 backdrop-blur-xl border border-white/10 rounded-[28px] p-1 pr-6 flex items-center gap-4 overflow-hidden shadow-2xl shadow-black/50">

                        {/* Animated Glow Border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#03e115]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        {/* Icon Container */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#03e115] to-[#029d0e] flex items-center justify-center shadow-lg shadow-[#03e115]/20 shrink-0">
                            <Trophy size={22} className="text-black" />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">
                                أفضل متبرع
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-white truncate max-w-[120px]">
                                    {topDonor.donor_name}
                                </span>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <span className="text-lg font-black text-[#03e115]">
                                    {topDonor.amount} <small className="text-[10px] opacity-70">د.ل</small>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Outer Ring Effect */}
                    <div className="absolute -inset-[2px] rounded-[30px] border border-[#03e115]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Leaderboard;
