'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Accessible dialog: focus moves in, Escape closes, focus returns on close. */
export default function Modal({ open, onClose, title, description, children, footer, size = 'sm' }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        const t = window.setTimeout(() => {
            const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input, button, select, textarea');
            el?.focus();
        }, 30);
        return () => {
            window.clearTimeout(t);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            previous?.focus?.();
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[150] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className={`card w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto p-6 sm:p-7`}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="modal-title" className="text-lg font-black text-ink">{title}</h2>
                                {description && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>}
                            </div>
                            <button onClick={onClose} className="btn-ghost btn-sm -m-1 p-2" aria-label="إغلاق">
                                <X size={18} />
                            </button>
                        </div>
                        {children}
                        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
