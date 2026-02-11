
/**
 * AudioSystem for handling alert sounds and music for the overlay.
 * Supports preloading and synchronized playback.
 */

class AudioManager {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;

    constructor() {
        // In SSR, window is not defined
        if (typeof window !== 'undefined') {
            this.isMuted = localStorage.getItem('overlay_muted') === 'true';
        }
    }

    /**
     * Preload a sound asset
     */
    preload(name: string, url: string) {
        if (typeof window === 'undefined' || this.sounds.has(name)) return;

        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';

        // Listen for errors on the element itself
        audio.addEventListener('error', (e) => {
            console.warn(`🔊 Audio preload error for "${name}":`, e);
            // Don't delete from map, so play() can still try to handle it or show warn
        });

        this.sounds.set(name, audio);
    }

    /**
     * Play a sound by name
     */
    async play(name: string, { volume = 1, loop = false } = {}) {
        if (typeof window === 'undefined' || this.isMuted) return;

        const audio = this.sounds.get(name);
        if (!audio) {
            console.warn(`🔊 Audio asset "${name}" not found. Trying to load on the fly...`);
            return;
        }

        try {
            audio.currentTime = 0;
            audio.volume = volume;
            audio.loop = loop;

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                await playPromise.catch((err: any) => {
                    if (err.name === 'AbortError') return;
                    throw err;
                });
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.warn(`🔊 Error playing audio "${name}":`, err);
        }
    }

    /**
     * Stop a specific sound
     */
    stop(name: string) {
        const audio = this.sounds.get(name);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        this.sounds.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    /**
     * Unlock audio context (Call this on user interaction)
     */
    async unlock() {
        if (typeof window === 'undefined') return;

        // Use a short, valid MP3 from Mixkit (pre-verified source) to warm up context
        const silentAudio = new Audio();
        silentAudio.src = 'https://assets.mixkit.co/active_storage/sfx/2861/2861-preview.mp3';
        silentAudio.volume = 0;

        try {
            const playPromise = silentAudio.play();
            if (playPromise !== undefined) {
                await playPromise.catch(() => { }); // Ignore interruptions on warmup
            }
            console.log('🔊 Audio Context Unlocked');
        } catch (err) {
            console.warn('🔊 Audio Context Unlock failed:', err);
        }
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
        if (typeof window !== 'undefined') {
            localStorage.setItem('overlay_muted', String(muted));
        }
    }
}

export const audioManager = new AudioManager();

// Pre-configured assets (Royalty free URLs)
export const ALERT_ASSETS = {
    BASIC: '/videos/alex_kizenkov-dark-engine-logo-141942.mp3',
    MEDIUM: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    PROFESSIONAL: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3',
    CINEMATIC: 'https://assets.mixkit.co/active_storage/sfx/1653/1653-preview.mp3', // Epic boom
    LEGENDARY: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3', // Super epic transformation/win
    DIAMOND: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3', // Diamond tier uses same epic sound
    CINEMATIC_MUSIC: 'https://assets.mixkit.co/music/preview/mixkit-celebration-606.mp3'
};

// High-quality background video loops (Royalty free from Pixabay/Pexels verified direct links)
export const BACKGROUND_ASSETS = {
    BASIC: 'https://cdn.pixabay.com/video/2021/04/12/70860-536962295_tiny.mp4',       // Abstract green flow
    MEDIUM: 'https://cdn.pixabay.com/video/2023/10/20/185792-876387995_tiny.mp4',     // Cyber blue digital
    PROFESSIONAL: 'https://cdn.pixabay.com/video/2021/09/01/87243-597551522_tiny.mp4', // Deep purple ethereal
    CINEMATIC: 'https://cdn.pixabay.com/video/2022/11/04/137651-766795861_tiny.mp4',    // Orange/Fire abstract
    LEGENDARY: 'https://cdn.pixabay.com/video/2023/10/16/185208-875150826_tiny.mp4',     // Dark intense crimson
    DIAMOND: 'https://cdn.pixabay.com/video/2023/10/16/185208-875150826_tiny.mp4'         // Diamond tier - intense
};
