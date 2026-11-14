/** Shared API types. Keep in sync with backend/src/routes/*.js response shapes. */

export type Role = 'admin' | 'moderator';
export type DonationStatus = 'pending' | 'live' | 'done';

export interface User {
    id: string;
    username: string;
    role: Role;
    created_at?: string;
}

export interface Donation {
    id: string;
    donor_name: string;
    amount: number;
    message: string;
    tier: string;
    status: DonationStatus;
    flagged: boolean;
    created_at: string;
    displayed_at: string | null;
    created_by: string | null;
}

export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export interface Tier {
    id: string;
    tier_key: string;
    label: string;
    min_amount: number;
    max_amount: number | null;
    color: string;
    duration: number;
    volume: number;
    background_url: string | null;
    sound_url: string | null;
}

/** A donation as delivered to the overlay: tier presentation already resolved by the server. */
export interface OverlayDonation {
    id: string;
    donor_name: string;
    amount: number;
    message: string;
    tier: string;
    label: string;
    color: string;
    duration: number;
    volume: number;
    background_url: string | null;
    sound_url: string | null;
    created_at?: string;
    emittedAt?: string;
    test?: boolean;
}

export interface PublicSettings {
    site_title: string;
    currency: string;
    tts_enabled?: boolean;
    tts_voice?: string | null;
    mute_overlay?: boolean;
}

export interface Stats {
    all_time_total: number;
    all_time_count: number;
    today_total: number;
    today_count: number;
    daily_average: number;
}

export interface Presence {
    adminCount: number;
    overlayCount: number;
    nowPlaying: { donationId: string; startedAt: string } | null;
}

export interface Analytics {
    dailyTrend: { date: string; total: number; count: number }[];
    distribution: { tier: string; count: number; total: number }[];
}

export interface ActivityEntry {
    id: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
    username: string | null;
}
