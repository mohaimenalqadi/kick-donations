const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiError {
    error: string;
    details?: string[];
}

interface LoginResponse {
    success: boolean;
    user: {
        id: string;
        username: string;
        role: string;
    };
    token: string;
}

interface Donation {
    id: string;
    donor_name: string;
    amount: number;
    message: string;
    tier: 'basic' | 'medium' | 'professional' | 'cinematic' | 'legendary';
    status: 'pending' | 'live' | 'done';
    created_at: string;
    displayed_at?: string;
}

interface DonationsResponse {
    donations: Donation[];
    count: number;
    connections: {
        adminCount: number;
        overlayCount: number;
        total: number;
    };
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor() {
        this.baseUrl = API_URL;
        // Load token from localStorage if available
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`[ApiClient] Request: ${options.method || 'GET'} ${url}`);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const isBodyMethod = ['POST', 'PATCH', 'PUT'].includes(options.method || '');
        const body = options.body || (isBodyMethod ? JSON.stringify({}) : undefined);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                body,
                credentials: 'include',
            });

            console.log(`[ApiClient] Status: ${response.status} ${response.statusText}`);

            const responseText = await response.text();
            console.log(`[ApiClient] Raw Response:`, responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error(`[ApiClient] JSON Parse Error:`, e);
                throw new Error('فشل تحليل استجابة الخادم (Format Error)');
            }

            if (!response.ok) {
                throw new Error((data as ApiError).error || 'حدث خطأ غير متوقع');
            }

            return data as T;
        } catch (error: any) {
            console.error(`[ApiClient] Fetch Error:`, error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username: string, password: string): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async logout(): Promise<void> {
        await this.request('/api/auth/logout', { method: 'POST' });
        this.clearToken();
    }

    async getCurrentUser() {
        return this.request<{ user: LoginResponse['user'] }>('/api/auth/me');
    }

    async updateProfile(data: { username?: string; password?: string }): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/api/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async setup(username: string, password: string) {
        return this.request('/api/auth/setup', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    // User management endpoints
    async getUsers(): Promise<{ users: any[] }> {
        return this.request('/api/users');
    }

    async createUser(data: { username: string; password: string; role: string }): Promise<{ success: boolean; user: any }> {
        return this.request('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateUser(id: string, data: { password?: string; role?: string }): Promise<{ success: boolean; user: any }> {
        return this.request(`/api/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteUser(id: string): Promise<{ success: boolean }> {
        return this.request(`/api/users/${id}`, {
            method: 'DELETE',
        });
    }

    // Donation endpoints
    async getDonations(status?: string): Promise<DonationsResponse> {
        const query = status ? `?status=${status}` : '';
        return this.request<DonationsResponse>(`/api/donations${query}`);
    }

    async getQueue(): Promise<{ queue: Donation[] }> {
        return this.request<{ queue: Donation[] }>('/api/donations/queue');
    }

    async getLatest(): Promise<{ latest: Donation | null }> {
        return this.request<{ latest: Donation | null }>('/api/donations/latest');
    }

    async createDonation(data: {
        donor_name: string;
        amount: number;
        message?: string;
    }): Promise<{ success: boolean; donation: Donation }> {
        return this.request('/api/donations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendToStream(donationId: string): Promise<{ success: boolean; donation: Donation }> {
        return this.request(`/api/donations/${donationId}/send`, {
            method: 'POST',
        });
    }

    async updateStatus(donationId: string, status: string): Promise<{ success: boolean }> {
        return this.request(`/api/donations/${donationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async deleteDonation(donationId: string): Promise<{ success: boolean }> {
        return this.request(`/api/donations/${donationId}`, {
            method: 'DELETE',
        });
    }

    async bulkDeleteDonations(period: 'today' | 'all'): Promise<{ success: boolean; message: string }> {
        return this.request(`/api/donations/bulk?period=${period}`, {
            method: 'DELETE',
        });
    }

    async getTopDonor(): Promise<{ top: { donor_name: string; amount: number } | null }> {
        return this.request('/api/donations/top');
    }

    async getAnalytics(start?: string, end?: string): Promise<{
        dailyTrend: { date: string; total: number }[];
        distribution: { tier: string; count: number }[];
    }> {
        const query = (start && end) ? `?start=${start}&end=${end}` : '';
        return this.request(`/api/donations/analytics${query}`);
    }

    async getStats(): Promise<{
        today: { total: number; count: number; average: number };
        connections: { adminCount: number; overlayCount: number };
    }> {
        return this.request('/api/donations/stats');
    }

    // Settings endpoints
    async getSettings(): Promise<{
        settings: {
            site_title: string;
            currency: string;
            tts_enabled: boolean;
            tts_voice: string;
            mute_overlay: boolean;
        }
    }> {
        return this.request('/api/settings');
    }

    async updateSettings(data: {
        site_title?: string;
        currency?: string;
        tts_enabled?: boolean;
        tts_voice?: string;
        mute_overlay?: boolean;
    }): Promise<{ success: boolean; settings: any }> {
        return this.request('/api/settings', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Tier Settings
    async getTierSettings(): Promise<{
        tiers: {
            id: string;
            tier_key: string;
            label: string;
            min_amount: number;
            sound_url: string;
            background_url: string;
            duration: number;
            color: string;
        }[]
    }> {
        return this.request('/api/tier-settings');
    }

    async updateTierSetting(id: string, data: {
        label?: string;
        min_amount?: number;
        sound_url?: string;
        background_url?: string;
        duration?: number;
        color?: string;
    }): Promise<{ success: boolean; tier: any }> {
        return this.request(`/api/tier-settings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
}

export const api = new ApiClient();
export type { Donation, DonationsResponse, LoginResponse };
