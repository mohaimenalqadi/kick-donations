'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface TierBackgroundProps {
    url?: string;
    fallbackUrl: string;
    opacity?: number;
    volume?: number;
    className?: string;
    style?: React.CSSProperties;
}

const VIDEO_RE = /\.(mp4|webm|ogv|mov)(\?|#|$)|pixabay\.com\/video|\/video\//i;
const IMAGE_HINT_RE = /\.(gif|png|jpe?g|webp|avif)(\?|#|$)|giphy\.com|tenor\.com/i;

/**
 * Renders a tier background (video or image). If the custom URL fails to
 * load, it falls back to the built-in asset instead of showing nothing.
 */
export default function TierBackground({
    url,
    fallbackUrl,
    opacity = 1,
    volume = 100,
    className = 'absolute inset-0 z-0 overflow-hidden',
    style,
}: TierBackgroundProps) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [url]);

    const src = !url || failed ? fallbackUrl : url;
    const isVideo = useMemo(() => VIDEO_RE.test(src) && !IMAGE_HINT_RE.test(src), [src]);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) videoRef.current.volume = Math.min(1, Math.max(0, volume / 100));
    }, [volume, src]);

    const onError = () => {
        if (src !== fallbackUrl) setFailed(true);
    };

    return (
        <div className={className} style={style}>
            {isVideo ? (
                <video
                    ref={videoRef}
                    key={src}
                    src={src}
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover"
                    style={{ opacity }}
                    onLoadedData={() => videoRef.current?.play().catch(() => undefined)}
                    onError={onError}
                />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote media, sized by container
                <img key={src} src={src} alt="" className="h-full w-full object-cover" style={{ opacity }} onError={onError} />
            )}
        </div>
    );
}
