'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { qk, useTiers } from '@/hooks/queries';
import { resolveTier } from '@/lib/tiers';
import { currencyLabel } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/primitives';

const MAX_NAME = 50;
const MAX_MESSAGE = 200;

export default function DonationForm({ currency }: { currency?: string }) {
    const qc = useQueryClient();
    const toast = useToast();
    const { data: tiers = [] } = useTiers();
    const nameRef = useRef<HTMLInputElement>(null);

    const [donorName, setDonorName] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    // Remembered per browser; defaults to the previous behaviour (add, then send manually).
    const [sendNow, setSendNowState] = useState(false);
    useEffect(() => {
        try {
            setSendNowState(localStorage.getItem('donation_send_now') === '1');
        } catch {
            /* storage unavailable */
        }
    }, []);
    function setSendNow(v: boolean) {
        setSendNowState(v);
        try {
            localStorage.setItem('donation_send_now', v ? '1' : '0');
        } catch {
            /* storage unavailable */
        }
    }

    const tier = useMemo(() => resolveTier(Number.parseFloat(amount), tiers), [amount, tiers]);

    const create = useMutation({
        mutationFn: async () => {
            const { donation } = await api.createDonation({
                donor_name: donorName.trim(),
                amount: Number.parseFloat(amount),
                message: message.trim() || undefined,
            });
            if (sendNow) await api.sendDonation(donation.id);
            return donation;
        },
        onSuccess: (donation) => {
            toast.success(
                donation.flagged
                    ? 'تمت الإضافة، لكن الرسالة حُجبت تلقائياً. يمكن للمشرف مراجعتها.'
                    : sendNow ? 'تمت إضافة التبرع وإرساله للبث' : 'تمت إضافة التبرع إلى القائمة'
            );
            setDonorName('');
            setAmount('');
            setMessage('');
            nameRef.current?.focus();
            qc.invalidateQueries({ queryKey: qk.donationsAll });
            qc.invalidateQueries({ queryKey: qk.stats });
        },
        onError: toast.error,
    });

    const valid = donorName.trim().length >= 2 && Number.parseFloat(amount) >= 1;

    function submit(e?: React.FormEvent) {
        e?.preventDefault();
        if (valid && !create.isPending) create.mutate();
    }

    return (
        <section aria-labelledby="new-donation" className="card p-5 sm:p-6 lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between">
                <h2 id="new-donation" className="text-lg font-black">دعم جديد</h2>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Plus size={18} />
                </span>
            </div>

            <form
                onSubmit={submit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
                }}
                className="space-y-4"
            >
                <div>
                    <label htmlFor="donor" className="label">اسم الداعم</label>
                    <input
                        ref={nameRef}
                        id="donor"
                        className="input"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="مثال: محمد"
                        maxLength={MAX_NAME}
                        required
                        autoComplete="off"
                    />
                </div>

                <div>
                    <label htmlFor="amount" className="label">المبلغ ({currencyLabel(currency)})</label>
                    <input
                        id="amount"
                        type="number"
                        inputMode="decimal"
                        className="input text-lg tabular-nums"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        min={1}
                        max={10000}
                        step="0.01"
                        required
                        dir="ltr"
                    />
                    <div className="mt-2 min-h-[28px]" aria-live="polite">
                        {tier && (
                            <span
                                className="badge border"
                                style={{ color: tier.color, borderColor: `${tier.color}55`, backgroundColor: `${tier.color}14` }}
                            >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tier.color }} />
                                فئة {tier.label} · {Math.round(tier.duration / 1000)} ثانية
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="message" className="label">الرسالة (اختياري)</label>
                        <span className={`text-[11px] font-bold tabular-nums ${message.length > MAX_MESSAGE - 20 ? 'text-warning' : 'text-ink-faint'}`}>
                            {message.length}/{MAX_MESSAGE}
                        </span>
                    </div>
                    <textarea
                        id="message"
                        className="input min-h-[96px] resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={MAX_MESSAGE}
                        placeholder="رسالة الداعم..."
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface-sunken p-3">
                    <input
                        type="checkbox"
                        checked={sendNow}
                        onChange={(e) => setSendNow(e.target.checked)}
                        className="h-4 w-4 accent-[#03e115]"
                    />
                    <span className="text-sm font-semibold">إرسال للبث مباشرة</span>
                </label>

                <button type="submit" className="btn-primary w-full py-3.5" disabled={!valid || create.isPending}>
                    {create.isPending ? <Spinner size={18} className="text-brand-ink" /> : sendNow ? <Send size={18} /> : <Plus size={18} />}
                    {sendNow ? 'إضافة وإرسال' : 'إضافة'}
                    <kbd className="mr-auto hidden rounded-md bg-black/15 px-1.5 py-0.5 text-[10px] font-bold sm:inline" dir="ltr">Ctrl ↵</kbd>
                </button>
            </form>
        </section>
    );
}
