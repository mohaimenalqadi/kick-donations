'use client';

import React, { useMemo, useEffect } from 'react';

interface TierBackgroundProps {
    url?: string;
    fallbackUrl: string;
    opacity?: number;
    volume?: number;
}

/**
 * Hybrid Media Renderer
 * Handles both video (MP4/WebM) and image (GIF/PNG/JPG) backgrounds.
 * Prioritizes the provided 'url' (from settings) and falls back to 'fallbackUrl'.
 */
export default function TierBackground({ url, fallbackUrl, opacity = 1, volume = 0 }: TierBackgroundProps) {
    const finalUrl = url || fallbackUrl;
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Sync volume with video ref
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = (volume || 80) / 100;
        }
    }, [volume]);

    // Diagnostic logging
    useEffect(() => {
        console.log('[TierBackground] Component Mount/Update:', {
            providedUrl: url,
            fallbackUrl,
            resolvedUrl: finalUrl,
            timestamp: new Date().toISOString()
        });
    }, [url, fallbackUrl, finalUrl]);

    // Media type detection logic
    const isVideo = useMemo(() => {
        if (!finalUrl) return false;
        const lowerUrl = finalUrl.toLowerCase();

        // Comprehensive video detection
        const detected =
            lowerUrl.endsWith('.mp4') ||
            lowerUrl.endsWith('.webm') ||
            lowerUrl.endsWith('.ogg') ||
            lowerUrl.includes('pixabay.com/video') ||
            lowerUrl.includes('vimeo.com') ||
            lowerUrl.includes('youtube.com/embed');

        console.log('[TierBackground] isVideo detection:', { detected, url: finalUrl });
        return detected;
    }, [finalUrl]);

    // Force image if specifically requested or if it's a known GIF source
    const isKnownGif = useMemo(() => {
        if (!finalUrl) return false;
        const lowerUrl = finalUrl.toLowerCase();
        return lowerUrl.includes('giphy.com') ||
            lowerUrl.includes('tenor.com') ||
            lowerUrl.includes('.gif');
        lowerUrl.endsWith('.gif');
    }, [finalUrl]);

    if (isVideo && !isKnownGif) {
        return (
            <div className="absolute inset-0 z-0 bg-black overflow-hidden">
                <video
                    ref={videoRef}
                    key={finalUrl}
                    src={finalUrl}
                    autoPlay
                    loop
                    muted={!(volume && volume > 0)}
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ opacity }}
                    onLoadedData={() => console.log('[TierBackground] ✅ Video loaded:', finalUrl)}
                    onError={() => console.error('[TierBackground] ❌ Video failed:', finalUrl)}
                />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
            <img
                key={finalUrl}
                src={finalUrl}
                alt=""
                className="w-full h-full object-cover"
                style={{ opacity }}
                onLoad={() => console.log('[TierBackground] ✅ Image loaded:', finalUrl)}
                onError={(e) => {
                    console.error('[TierBackground] ❌ Image failed:', finalUrl);
                    // If image fails, try to show the fallback if we aren't already
                    if (url && fallbackUrl && finalUrl === url) {
                        console.log('[TierBackground] Attempting fallback to:', fallbackUrl);
                    }
                }}
            />
        </div>
    );
};

