'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

export default function TitleManager() {
    useEffect(() => {
        const updateTitle = async () => {
            try {
                const res = await api.getSettings();
                if (res.settings?.site_title) {
                    document.title = `${res.settings.site_title} - منصة تبرعات البث المباشر`;
                }
            } catch (err) {
                console.error('Failed to update title:', err);
            }
        };

        updateTitle();

        // Listen for custom event if settings update in-app
        const handleSettingsUpdate = (e: any) => {
            if (e.detail?.site_title) {
                document.title = `${e.detail.site_title} - منصة تبرعات البث المباشر`;
            }
        };

        window.addEventListener('settingsUpdated', handleSettingsUpdate);
        return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    }, []);

    return null;
}
