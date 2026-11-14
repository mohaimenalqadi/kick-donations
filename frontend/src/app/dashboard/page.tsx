'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import { useDashboard } from './DashboardContext';
import StatsCards from '@/components/dashboard/StatsCards';
import LiveControl from '@/components/dashboard/LiveControl';
import DonationForm from '@/components/dashboard/DonationForm';
import DonationsTable from '@/components/dashboard/DonationsTable';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';

export default function DashboardPage() {
    const { isAdmin } = useDashboard();
    const { data: settings } = useQuery({ queryKey: qk.settings, queryFn: () => api.settings().then((r) => r.settings) });
    const currency = settings?.currency;

    return (
        <div className="space-y-6">
            <StatsCards currency={currency} />
            <LiveControl currency={currency} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4">
                    <DonationForm currency={currency} />
                </div>
                <div className="min-w-0 lg:col-span-8">
                    <DonationsTable isAdmin={isAdmin} currency={currency} />
                </div>
            </div>
            {isAdmin && <AnalyticsSection currency={currency} />}
        </div>
    );
}
