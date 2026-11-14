'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    tone?: 'danger' | 'default';
    /** When set, the user must type this exact text to enable the confirm button. */
    requireText?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Promise-based replacement for window.confirm(). */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [opts, setOpts] = useState<ConfirmOptions | null>(null);
    const [typed, setTyped] = useState('');
    const resolver = useRef<(v: boolean) => void>();

    const confirm = useCallback<ConfirmFn>((o) => {
        setTyped('');
        setOpts(o);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const close = useCallback((value: boolean) => {
        resolver.current?.(value);
        resolver.current = undefined;
        setOpts(null);
    }, []);

    const blocked = !!opts?.requireText && typed.trim() !== opts.requireText;
    const danger = opts?.tone !== 'default';

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                open={!!opts}
                onClose={() => close(false)}
                title={opts?.title || ''}
                description={opts?.description}
                footer={
                    <>
                        <button
                            className={danger ? 'btn bg-danger text-white hover:brightness-110' : 'btn-primary'}
                            disabled={blocked}
                            onClick={() => close(true)}
                            data-autofocus={opts?.requireText ? undefined : true}
                        >
                            {opts?.confirmLabel || 'تأكيد'}
                        </button>
                        <button className="btn-secondary" onClick={() => close(false)}>
                            إلغاء
                        </button>
                    </>
                }
            >
                {danger && (
                    <div className="flex items-center gap-3 rounded-2xl bg-danger-soft p-3 text-sm font-semibold text-danger">
                        <AlertTriangle size={18} className="shrink-0" />
                        لا يمكن التراجع عن هذا الإجراء.
                    </div>
                )}
                {opts?.requireText && (
                    <div className="mt-4">
                        <label className="label" htmlFor="confirm-text">
                            اكتب <span className="font-black text-ink">{opts.requireText}</span> للتأكيد
                        </label>
                        <input
                            id="confirm-text"
                            className="input"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            autoComplete="off"
                            data-autofocus
                        />
                    </div>
                )}
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
    return ctx;
}
