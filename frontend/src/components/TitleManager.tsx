'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useBranding } from '@/hooks/queries';

/** Keeps the browser tab title in sync with the configured site title. */
export default function TitleManager() {
    const pathname = usePathname();
    const isOverlay = pathname?.startsWith('/overlay');
    const { data } = useBranding();

    useEffect(() => {
        if (isOverlay || !data?.site_title) return;
        document.title = `${data.site_title} - منصة تبرعات البث المباشر`;
    }, [data?.site_title, isOverlay]);

    return null;
}
