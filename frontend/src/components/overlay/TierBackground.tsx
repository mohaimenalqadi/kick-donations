'use client';

import React, { useMemo } from 'react';

interface TierBackgroundProps {
    url?: string;
    fallbackUrl: string;
    opacity?: number;
}

/**
 * Hybrid Media Renderer
 * Handles both video (MP4/WebM) and image (GIF/PNG/JPG) backgrounds.
 * Prioritizes the provided 'url' (from settings) and falls back to 'fallbackUrl'.
 */
const TierBackground: React.FC<TierBackgroundProps> = ({ url, fallbackUrl, opacity = 0.6 }) => {
    const finalUrl = url || fallbackUrl;

    // Media type detection logic
    const isVideo = useMemo(() => {
        const lowerUrl = finalUrl.toLowerCase();
        return lowerUrl.endsWith('.mp4') ||
            lowerUrl.endsWith('.webm') ||
            lowerUrl.endsWith('.ogg') ||
            lowerUrl.includes('pixabay.com/video') ||
            lowerUrl.includes('vimeo.com') ||
            lowerUrl.includes('youtube.com/embed');
    }, [finalUrl]);

    const isImage = useMemo(() => {
        const lowerUrl = finalUrl.toLowerCase();
        return lowerUrl.endsWith('.gif') ||
            lowerUrl.endsWith('.png') ||
            lowerUrl.endsWith('.jpg') ||
            lowerUrl.endsWith('.jpeg') ||
            lowerUrl.endsWith('.webp') ||
            lowerUrl.includes('giphy.com/media') ||
            lowerUrl.includes('tenor.com/view');
    }, [finalUrl]);

    if (isVideo) {
        return (
            <div className="absolute inset-0 z-0 bg-black overflow-hidden">
                <video
                    key={finalUrl} // Force reload video when URL changes
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ opacity }}
                >
                    <source src={finalUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 z-0 bg-black"
            style={{
                backgroundImage: `url("${finalUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity
            }}
        />
    );
};

export default TierBackground;
