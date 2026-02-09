'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * StandbyScreen - Chroma Key Edition
 * A solid Kick Green screen with no overlays, optimized for OBS Chroma Key filters.
 */
export default function StandbyScreen() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden bg-[#03e115]"
        >
            {/* Pure solid Kick green background for OBS Chroma Keying */}
        </motion.div>
    );
}
