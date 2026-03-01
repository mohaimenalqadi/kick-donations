/**
 * Audio playback for the overlay.
 *
 * Sounds are cached by URL (previously by tier name, which meant a sound
 * changed in settings was ignored until the page was reloaded).
 */
class AudioManager {
    private sounds = new Map<string, HTMLAudioElement>();
    private muted = false;

    private get(url: string) {
        let audio = this.sounds.get(url);
        if (!audio) {
            audio = new Audio(url);
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous';
            this.sounds.set(url, audio);
            // Keep the cache bounded.
            if (this.sounds.size > 24) {
                const oldest = this.sounds.keys().next().value as string;
                this.sounds.get(oldest)?.pause();
                this.sounds.delete(oldest);
            }
        }
        return audio;
    }

    preload(url?: string | null) {
        if (typeof window === 'undefined' || !url) return;
        this.get(url);
    }

    async play(url: string | null | undefined, { volume = 1, loop = false } = {}) {
        if (typeof window === 'undefined' || this.muted || !url) return;
        const audio = this.get(url);
        try {
            audio.currentTime = 0;
            audio.volume = Math.min(1, Math.max(0, volume));
            audio.loop = loop;
            await audio.play();
        } catch (err) {
            if ((err as Error).name !== 'AbortError') console.warn('[audio] playback failed', url);
        }
    }

    stop(url: string | null | undefined) {
        if (!url) return;
        const audio = this.sounds.get(url);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    stopAll() {
        this.sounds.forEach((a) => {
            a.pause();
            a.currentTime = 0;
        });
    }

    /** Must be called from a user gesture so browsers allow sound. */
    async unlock() {
        if (typeof window === 'undefined') return;
        try {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (Ctx) {
                const ctx = new Ctx();
                const buffer = ctx.createBuffer(1, 1, 22050);
                const src = ctx.createBufferSource();
                src.buffer = buffer;
                src.connect(ctx.destination);
                src.start(0);
                await ctx.resume();
            }
        } catch {
            /* ignore — OBS browser sources usually allow autoplay anyway */
        }
    }

    setMuted(muted: boolean) {
        this.muted = muted;
        if (muted) this.stopAll();
    }

    get isMuted() {
        return this.muted;
    }
}

export const audioManager = new AudioManager();

/** Built-in fallback assets, used when a tier has no custom sound/background. */
export const ALERT_ASSETS = {
    BASIC: '/videos/alex_kizenkov-dark-engine-logo-141942.mp3',
    MEDIUM: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    PROFESSIONAL: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3',
    CINEMATIC: 'https://assets.mixkit.co/active_storage/sfx/1653/1653-preview.mp3',
    LEGENDARY: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
    DIAMOND: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
    CINEMATIC_MUSIC: 'https://assets.mixkit.co/music/preview/mixkit-celebration-606.mp3',
} as const;

export const BACKGROUND_ASSETS = {
    BASIC: 'https://cdn.pixabay.com/video/2021/04/12/70860-536962295_tiny.mp4',
    MEDIUM: 'https://cdn.pixabay.com/video/2023/10/20/185792-876387995_tiny.mp4',
    PROFESSIONAL: 'https://cdn.pixabay.com/video/2021/09/01/87243-597551522_tiny.mp4',
    CINEMATIC: 'https://cdn.pixabay.com/video/2022/11/04/137651-766795861_tiny.mp4',
    LEGENDARY: 'https://cdn.pixabay.com/video/2023/10/16/185208-875150826_tiny.mp4',
    DIAMOND: 'https://cdn.pixabay.com/video/2023/10/16/185208-875150826_tiny.mp4',
} as const;
