'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 15_000,
                        refetchOnWindowFocus: true,
                        // Don't hammer the API on auth/permission errors.
                        retry: (count, err) => !(err instanceof ApiError && [401, 403, 404].includes(err.status)) && count < 2,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={client}>
            <ToastProvider>
                <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
        </QueryClientProvider>
    );
}
