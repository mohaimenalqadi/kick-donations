'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

interface ToastApi {
    success: (message: string) => void;
    error: (message: string | unknown) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = {
    success: 'border-brand/30 text-brand',
    error: 'border-danger/30 text-danger',
    info: 'border-info/30 text-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

    const push = useCallback(
        (kind: ToastKind, message: string) => {
            const id = nextId.current++;
            setItems((list) => [...list.slice(-3), { id, kind, message }]);
            window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
        },
        [dismiss]
    );

    const api = useMemo<ToastApi>(
        () => ({
            success: (m) => push('success', m),
            info: (m) => push('info', m),
            error: (m) => push('error', m instanceof Error ? m.message : typeof m === 'string' ? m : 'حدث خطأ غير متوقع'),
        }),
        [push]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-6 sm:right-auto sm:items-start"
            >
                <AnimatePresence initial={false}>
                    {items.map((t) => {
                        const Icon = ICONS[t.kind];
                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                role={t.kind === 'error' ? 'alert' : 'status'}
                                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-surface-raised/95 p-4 shadow-2xl backdrop-blur ${TONES[t.kind]}`}
                            >
                                <Icon size={18} className="mt-0.5 shrink-0" />
                                <p className="flex-1 text-sm font-semibold leading-relaxed text-ink">{t.message}</p>
                                <button onClick={() => dismiss(t.id)} className="text-ink-faint hover:text-ink" aria-label="إغلاق">
                                    <X size={16} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
