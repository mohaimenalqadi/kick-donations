
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    connectSocket,
    onNewDonation,
    emitDonationDisplayed,
    emitOverlayReady,
    disconnectSocket,
    type DonationEvent
} from '@/lib/socket';
import { audioManager, ALERT_ASSETS } from '@/lib/audio';
import { Play } from 'lucide-react';
import BasicTier from '@/components/overlay/BasicTier';
import MediumTier from '@/components/overlay/MediumTier';
import ProfessionalTier from '@/components/overlay/ProfessionalTier';
import CinematicTier from '@/components/overlay/CinematicTier';
import GoldTier from '@/components/overlay/GoldTier';
import Leaderboard from '@/components/overlay/Leaderboard';
import StandbyScreen from '@/components/overlay/StandbyScreen';
import { api, type Donation } from '@/lib/api';
import { calculateTier } from '@/lib/tiers';

interface QueuedDonation extends DonationEvent {
    queuedAt: number;
}

export default function OverlayPage() {
    const [queue, setQueue] = useState<DonationEvent[]>([]);
    const [currentDonation, setCurrentDonation] = useState<DonationEvent | null>(null);
    const [latestCompleted, setLatestCompleted] = useState<DonationEvent | null>(null);
    const [topDonor, setTopDonor] = useState<{ donor_name: string; amount: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [tierSettings, setTierSettings] = useState<any[]>([]);
    const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Toggle overlay-mode class for transparency
    useEffect(() => {
        document.body.classList.add('overlay-mode');
        return () => document.body.classList.remove('overlay-mode');
    }, []);

    // Initial state fetch
    const fetchInitialState = useCallback(async () => {
        try {
            console.log('🔄 Fetching initial overlay state...');

            // 1. Fetch Platform Settings & Tier Settings
            const [{ settings: platformSettings }, { tiers: dbTiers }] = await Promise.all([
                api.getSettings(),
                api.getTierSettings()
            ]);

            setSettings(platformSettings);
            setTierSettings(dbTiers);

            // 2. Fetch Queue
            const { queue: dbQueue } = await api.getQueue();

            // Map DB donations using dynamic tier settings
            const mappedQueue: DonationEvent[] = dbQueue.map(d => {
                const amount = Number(d.amount);

                // Defensive tier matching
                let tier = null;
                if (dbTiers && dbTiers.length > 0) {
                    tier = [...dbTiers]
                        .sort((a, b) => Number(b.min_amount) - Number(a.min_amount))
                        .find(t => amount >= Number(t.min_amount));
                }

                // Fallback to static calculation if DB tier not found
                if (!tier) {
                    const fallback = calculateTier(amount);
                    return {
                        id: d.id,
                        donor_name: d.donor_name,
                        amount,
                        message: d.message,
                        tier: fallback.name,
                        duration: fallback.duration,
                        color: fallback.color,
                        label: fallback.label,
                        background_url: undefined,
                        sound_url: undefined,
                        emittedAt: d.created_at,
                    };
                }

                return {
                    id: d.id,
                    donor_name: d.donor_name,
                    amount,
                    message: d.message,
                    tier: tier.tier_key,
                    duration: tier.duration,
                    color: tier.color,
                    label: tier.label,
                    background_url: tier.background_url,
                    sound_url: tier.sound_url,
                    emittedAt: d.created_at,
                };
            });

            if (mappedQueue.length > 0) {
                setQueue(mappedQueue);
            }

            // 2. Fetch latest completed for sticky display
            const { latest } = await api.getLatest();
            if (latest) {
                setLatestCompleted({
                    ...latest,
                    emittedAt: new Date().toISOString()
                } as any);
            }

            // 3. Fetch top donor
            const { top } = await api.getTopDonor();
            setTopDonor(top);
        } catch (err) {
            console.error('Failed to sync overlay state:', err);
        }
    }, []);

    // Preload all audio on mount
    useEffect(() => {
        Object.entries(ALERT_ASSETS).forEach(([name, url]) => {
            audioManager.preload(name.toLowerCase(), url);
        });
    }, []);

    // Initial fetch when unlocked
    useEffect(() => {
        if (isUnlocked) {
            fetchInitialState();
        }
    }, [isUnlocked, fetchInitialState]);

    // Process queue
    const processQueue = useCallback(() => {
        if (!isUnlocked || isProcessing || queue.length === 0) return;

        const nextDonation = queue[0];
        setCurrentDonation(nextDonation);
        setIsProcessing(true);

        // Remove from queue
        setQueue(prev => prev.slice(1));
    }, [isProcessing, queue, isUnlocked]);

    // Handle donation complete
    const handleDonationComplete = useCallback(async () => {
        if (currentDonation) {
            emitDonationDisplayed(currentDonation.id);
            setLatestCompleted(currentDonation);
            // Refresh top donor after each alert
            try {
                const { top } = await api.getTopDonor();
                setTopDonor(top);
            } catch (err) {
                console.error('Failed to refresh top donor:', err);
            }
        }
        setCurrentDonation(null);
        setIsProcessing(false);
    }, [currentDonation]);

    // Process queue when available
    useEffect(() => {
        if (isUnlocked && !isProcessing && queue.length > 0) {
            processTimeoutRef.current = setTimeout(processQueue, 1500);
        }

        return () => {
            if (processTimeoutRef.current) {
                clearTimeout(processTimeoutRef.current);
            }
        };
    }, [isProcessing, queue.length, processQueue, isUnlocked]);

    // Initialize WebSocket connection
    useEffect(() => {
        const socket = connectSocket('overlay');

        socket.on('connect', () => {
            console.log('✅ Overlay connected to socket');
            setIsSocketConnected(true);
            emitOverlayReady();
            // Sync queue on reconnect/initial connect
            if (isUnlocked) fetchInitialState();
        });

        socket.on('disconnect', () => {
            console.log('❌ Overlay disconnected');
            setIsSocketConnected(false);
        });

        // Listen for new donations
        const unsubscribe = onNewDonation((donation) => {
            console.log('📥 New donation received:', donation);

            const amount = Number(donation.amount);

            // Calculate tier info with defensive checks
            let tier = null;
            if (tierSettings && tierSettings.length > 0) {
                tier = [...tierSettings]
                    .sort((a, b) => Number(b.min_amount) - Number(a.min_amount))
                    .find(t => amount >= Number(t.min_amount));
            }

            // Fallback strategy: Use calculateTier utility if DB settings are empty or no match
            if (!tier) {
                console.warn('⚠️ No matching tier found in DB settings, using fallback utility');
                const fallback = calculateTier(amount);
                setQueue(prev => [...prev, {
                    ...donation,
                    tier: fallback.name,
                    duration: fallback.duration,
                    color: fallback.color,
                    label: fallback.label,
                    background_url: undefined,
                    sound_url: undefined,
                    emittedAt: donation.emittedAt || new Date().toISOString()
                }]);
                return;
            }

            setQueue(prev => [...prev, {
                ...donation,
                tier: tier.tier_key,
                duration: tier.duration,
                color: tier.color,
                label: tier.label,
                background_url: tier.background_url,
                sound_url: tier.sound_url,
                emittedAt: donation.emittedAt || new Date().toISOString()
            }]);
        });

        // Listen for settings updates
        socket.on('settingsUpdate', (newSettings) => {
            console.log('⚙️ Settings updated via socket:', newSettings);
            setSettings(newSettings);
        });

        socket.on('tierSettingsUpdate', (updatedTier) => {
            console.log('💎 Tier settings updated via socket:', updatedTier);
            setTierSettings(prev => prev.map(t => t.tier_key === updatedTier.tier_key ? updatedTier : t));
        });

        return () => {
            unsubscribe();
            socket.off('settingsUpdate');
            socket.off('tierSettingsUpdate');
            disconnectSocket();
            audioManager.stopAll();
        };
    }, [isUnlocked, fetchInitialState]);

    // Sync global mute setting
    useEffect(() => {
        if (settings) {
            console.log('🔇 Syncing global mute:', settings.mute_overlay);
            audioManager.setMuted(!!settings.mute_overlay);
        }
    }, [settings?.mute_overlay]);

    const handleStartOverlay = async () => {
        await audioManager.unlock();
        setIsUnlocked(true);
    };

    // Render tier component based on donation tier
    const renderDonation = () => {
        if (!isUnlocked || !isProcessing) return null;

        const donationToDisplay = currentDonation;

        if (!donationToDisplay) return null;

        // Match settings by tier key
        const currentTierSettings = tierSettings.find(t => t.tier_key === donationToDisplay.tier);

        console.log('[Overlay] Rendering donation:', {
            donor: donationToDisplay.donor_name,
            tierKey: donationToDisplay.tier,
            foundSettings: !!currentTierSettings,
            bgInSettings: currentTierSettings?.background_url,
            volume: currentTierSettings?.volume || 80
        });

        const props = {
            donorName: donationToDisplay.donor_name,
            amount: donationToDisplay.amount,
            message: donationToDisplay.message,
            duration: donationToDisplay.duration,
            soundUrl: currentTierSettings?.sound_url || donationToDisplay.sound_url,
            backgroundUrl: currentTierSettings?.background_url || donationToDisplay.background_url,
            volume: currentTierSettings?.volume || 80,
            onComplete: handleDonationComplete,
        };

        console.log('[Overlay] Final Props for Tier:', {
            tier: currentTierSettings?.tier_key,
            backgroundUrl: props.backgroundUrl
        });

        const uniqueKey = `donation-${donationToDisplay.id || Date.now()}`;

        switch (donationToDisplay.tier) {
            case 'basic':
                return <BasicTier key={uniqueKey} {...props} />;
            case 'medium':
                return <MediumTier key={uniqueKey} {...props} />;
            case 'professional':
                return <ProfessionalTier key={uniqueKey} {...props} />;
            case 'cinematic':
                return <CinematicTier key={uniqueKey} {...props} />;
            case 'legendary':
                return <GoldTier key={uniqueKey} {...props} />;
            default:
                return <BasicTier key={uniqueKey} {...props} />;
        }
    };

    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] font-black rtl">
            {/* Top HUD Header (Symmetric Layout) */}
            <div className="fixed top-10 left-10 right-10 flex justify-between items-start pointer-events-none z-[60]">
                {/* Left Side: Leaderboard (Only show during active support alerts) */}
                <div className="flex flex-col items-start gap-4">
                    {isProcessing && <Leaderboard topDonor={topDonor} />}
                </div>

                {/* Right Side: Reserved for future elements */}
                <div className="flex flex-col items-end gap-4 pointer-events-none">
                </div>
            </div>

            {/* Interaction Gate Overlay */}
            <AnimatePresence>
                {!isUnlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center space-y-8"
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-[#03e115]/10 rounded-3xl flex items-center justify-center mb-6 border border-[#03e115]/20">
                                    <div className="w-12 h-12 bg-[#03e115] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(3,225,21,0.5)]">
                                        <Play className="text-[#0a0a0a] ml-1" size={32} />
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                                    {settings?.site_title?.split(/(?=[A-Z])/).map((part: string, i: number) => i === settings.site_title.split(/(?=[A-Z])/).length - 1 ? <span key={i} className="text-[#03e115]">{part}</span> : part)} OVERLAY
                                </h2>
                                <p className="text-gray-400 font-bold mt-2">انقر لبدء تشغيل التنبيهات والصوت</p>
                            </div>

                            <button
                                onClick={handleStartOverlay}
                                className="group relative px-12 py-5 bg-[#03e115] text-[#0a0a0a] font-black text-xl rounded-[24px] hover:scale-105 transition-all shadow-[0_0_50px_rgba(3,225,21,0.3)]"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    بدء التشغيل
                                    <Play size={24} fill="currentColor" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <div className="flex items-center justify-center gap-6 pt-8">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mb-1 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">SOCKET</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full mb-1 bg-blue-500" />
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">BROWSER OK</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Standby Layer (Kick Green) - Base layer to prevent white flash */}
            {isUnlocked && (
                <div className="fixed inset-0 z-0 bg-[#03e115]" />
            )}

            {/* Status indicators (Relocated to bottom-right for clean HUD) */}
            <div className={`fixed bottom-6 right-6 z-50 pointer-events-none transition-opacity duration-1000 ${isUnlocked ? 'opacity-20' : 'opacity-0'}`}>
                <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-[#03e115]' : 'bg-red-500'} animate-pulse`} />
            </div>


            {/* Main Donation Stage */}
            <div className="flex items-center justify-center min-h-screen">
                <AnimatePresence mode="wait">
                    {renderDonation()}
                </AnimatePresence>
            </div>
        </main>
    );
}
