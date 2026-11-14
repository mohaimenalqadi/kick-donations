import { DIRECT_API_URL } from './config';
import type {
    ActivityEntry, Analytics, Donation, DonationStatus, Paginated, Presence, PublicSettings, Role, Stats, Tier, User,
    OverlayDonation,
} from './types';

/** Error carrying the HTTP status and the backend's machine-readable code. */
export class ApiError extends Error {
    constructor(message: string, public status: number, public code?: string) {
        super(message);
        this.name = 'ApiError';
    }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function qs(params?: Query) {
    if (!params) return '';
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
    const str = s.toString();
    return str ? `?${str}` : '';
}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Query;
    headers?: Record<string, string>;
    base?: string;
}

async function request<T>(path: string, { method = 'GET', body, query, headers = {}, base = '' }: RequestOptions = {}): Promise<T> {
    const init: RequestInit = {
        method,
        credentials: base ? 'omit' : 'same-origin',
        headers: {
            Accept: 'application/json',
            // Required by the backend CSRF guard for every non-GET request.
            'X-Requested-With': 'XMLHttpRequest',
            ...headers,
        },
    };
    if (body instanceof FormData) {
        init.body = body;
    } else if (body !== undefined) {
        (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
    }

    let res: Response;
    try {
        res = await fetch(`${base}/api${path}${qs(query)}`, init);
    } catch {
        throw new ApiError('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.', 0, 'NETWORK');
    }

    const text = await res.text();
    let data: unknown = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new ApiError('استجابة غير متوقعة من الخادم', res.status, 'BAD_RESPONSE');
        }
    }

    if (!res.ok) {
        const d = (data || {}) as { error?: string; code?: string };
        throw new ApiError(d.error || 'حدث خطأ غير متوقع', res.status, d.code);
    }
    return data as T;
}

export interface DonationFilters {
    page?: number;
    limit?: number;
    status?: DonationStatus;
    tier?: string;
    search?: string;
    flagged?: boolean;
    from?: string;
    to?: string;
}

export const api = {
    // ---- auth ----
    login: (username: string, password: string) =>
        request<{ success: true; user: User }>('/auth/login', { method: 'POST', body: { username, password } }),
    setup: (username: string, password: string) =>
        request<{ success: true }>('/auth/setup', { method: 'POST', body: { username, password } }),
    logout: () => request<{ success: true }>('/auth/logout', { method: 'POST' }),
    logoutAll: () => request<{ success: true }>('/auth/logout-all', { method: 'POST' }),
    me: () => request<{ user: User }>('/auth/me'),
    socketTicket: () => request<{ ticket: string }>('/auth/socket-ticket'),
    updateProfile: (data: { current_password: string; username?: string; password?: string }) =>
        request<{ success: true; user: User }>('/auth/profile', { method: 'PATCH', body: data }),

    // ---- public ----
    branding: () => request<{ site_title: string; currency: string }>('/public/branding'),

    // ---- users ----
    users: () => request<{ users: User[] }>('/users'),
    createUser: (data: { username: string; password: string; role: Role }) =>
        request<{ success: true; user: User }>('/users', { method: 'POST', body: data }),
    updateUser: (id: string, data: { password?: string; role?: Role }) =>
        request<{ success: true; user: User }>(`/users/${id}`, { method: 'PATCH', body: data }),
    revokeUserSessions: (id: string) => request<{ success: true }>(`/users/${id}/revoke-sessions`, { method: 'POST' }),
    deleteUser: (id: string) => request<{ success: true }>(`/users/${id}`, { method: 'DELETE' }),

    // ---- donations ----
    donations: (filters: DonationFilters = {}) =>
        request<Paginated<Donation> & { connections: Presence }>('/donations', { query: filters as Query }),
    createDonation: (data: { donor_name: string; amount: number; message?: string }) =>
        request<{ success: true; donation: Donation }>('/donations', { method: 'POST', body: data }),
    sendDonation: (id: string) => request<{ success: true; donation: Donation }>(`/donations/${id}/send`, { method: 'POST' }),
    originalMessage: (id: string) =>
        request<{ original: { donor_name?: string; message?: string } | null }>(`/donations/${id}/original`),
    approveDonation: (id: string) => request<{ success: true; donation: Donation }>(`/donations/${id}/approve`, { method: 'POST' }),
    deleteDonation: (id: string) => request<{ success: true }>(`/donations/${id}`, { method: 'DELETE' }),
    bulkDelete: (period: 'today' | 'all') =>
        request<{ success: true; message: string; deleted: number }>('/donations/bulk', { method: 'DELETE', query: { period } }),
    stats: () => request<{ stats: Stats; connections: Presence }>('/donations/stats'),
    analytics: (start?: string, end?: string) => request<Analytics>('/donations/analytics', { query: { start, end } }),

    // ---- settings ----
    settings: () => request<{ settings: PublicSettings }>('/settings'),
    updateSettings: (data: Partial<PublicSettings>) =>
        request<{ success: true; settings: PublicSettings }>('/settings', { method: 'PATCH', body: data }),
    tiers: () => request<{ tiers: Tier[] }>('/tier-settings'),
    updateTier: (id: string, data: Partial<Omit<Tier, 'id' | 'tier_key'>>) =>
        request<{ success: true; tier: Tier }>(`/tier-settings/${id}`, { method: 'PATCH', body: data }),

    // ---- overlay control ----
    overlayKey: () => request<{ key: string | null }>('/overlay/key'),
    rotateOverlayKey: () => request<{ success: true; key: string }>('/overlay/key/rotate', { method: 'POST' }),
    overlayStatus: () => request<Presence>('/overlay/status'),
    overlaySkip: () => request<{ success: true }>('/overlay/skip', { method: 'POST' }),
    overlayTest: (tier_key: string) => request<{ success: true }>('/overlay/test', { method: 'POST', body: { tier_key } }),

    // ---- overlay (OBS page, authenticated by overlay key) ----
    overlayBootstrap: (key: string) =>
        request<{ settings: PublicSettings; tiers: Tier[]; queue: OverlayDonation[]; top: { donor_name: string; amount: number } | null }>(
            '/overlay/bootstrap',
            { headers: { 'X-Overlay-Key': key } }
        ),
    overlayTop: (key: string) =>
        request<{ top: { donor_name: string; amount: number } | null }>('/overlay/top', { headers: { 'X-Overlay-Key': key } }),

    // ---- audit ----
    activity: (params: { page?: number; limit?: number; action?: string } = {}) =>
        request<{ items: ActivityEntry[]; total: number }>('/activity-logs', { query: params }),

    // ---- uploads (direct to API with a short-lived ticket) ----
    async upload(file: File): Promise<{ url: string; type: string }> {
        const { ticket } = await request<{ ticket: string }>('/auth/upload-ticket');
        const form = new FormData();
        form.append('file', file);
        return request('/uploads', {
            method: 'POST',
            body: form,
            base: DIRECT_API_URL,
            headers: { Authorization: `Bearer ${ticket}` },
        });
    },
};
