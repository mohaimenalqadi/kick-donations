'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Music, PlayCircle, RotateCcw, Save, Upload, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { qk, useTiers } from '@/hooks/queries';
import { rangeLabel } from '@/lib/tiers';
import type { Tier } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { PageLoader, SectionHeader, Spinner } from '@/components/ui/primitives';
import { useDashboard } from '@/app/dashboard/DashboardContext';

const EDITABLE: (keyof Tier)[] = ['label', 'min_amount', 'max_amount', 'color', 'duration', 'volume', 'background_url', 'sound_url'];
const URL_RE = /^(|https:\/\/\S+|\/\S*)$/;

function diff(a: Tier, b: Tier) {
    const out: Partial<Tier> = {};
    for (const k of EDITABLE) if (a[k] !== b[k]) (out as Record<string, unknown>)[k] = a[k];
    return out;
}

export default function TiersTab() {
    const { data: tiers, isLoading } = useTiers();
    if (isLoading || !tiers) return <PageLoader />;
    return (
        <div className="space-y-4">
            <div className="card p-5 sm:p-7">
                <SectionHeader
                    title="تخصيص الفئات"
                    description="الخادم يحدد فئة كل تبرع من هذه الإعدادات، وتُطبَّق التغييرات على صفحة العرض فوراً."
                />
            </div>
            {tiers.map((t) => <TierCard key={t.id || t.tier_key} tier={t} all={tiers} />)}
        </div>
    );
}

function TierCard({ tier, all }: { tier: Tier; all: Tier[] }) {
    const qc = useQueryClient();
    const toast = useToast();
    const { presence } = useDashboard();
    const [form, setForm] = useState<Tier>(tier);
    useEffect(() => setForm(tier), [tier]);

    const changes = diff(form, tier);
    const dirty = Object.keys(changes).length > 0;
    const errors = {
        label: !form.label.trim() ? 'مطلوب' : '',
        min_amount: !(Number(form.min_amount) > 0) ? 'أدخل مبلغاً صحيحاً' : '',
        max_amount: form.max_amount !== null && Number(form.max_amount) < Number(form.min_amount) ? 'يجب أن يكون أكبر من الحد الأدنى' : '',
        background_url: !URL_RE.test(form.background_url || '') ? 'يجب أن يبدأ بـ https://' : '',
        sound_url: !URL_RE.test(form.sound_url || '') ? 'يجب أن يبدأ بـ https://' : '',
    };
    const invalid = Object.values(errors).some(Boolean);

    const save = useMutation({
        mutationFn: () =>
            api.updateTier(tier.id, {
                ...changes,
                ...(changes.background_url !== undefined && { background_url: form.background_url || '' }),
                ...(changes.sound_url !== undefined && { sound_url: form.sound_url || '' }),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk.tiers });
            toast.success(`تم حفظ فئة "${form.label}"`);
        },
        onError: toast.error,
    });

    const test = useMutation({
        mutationFn: () => api.overlayTest(tier.tier_key),
        onSuccess: () => toast.info('تم إرسال تنبيه تجريبي'),
        onError: toast.error,
    });

    const set = <K extends keyof Tier>(k: K, v: Tier[K]) => setForm((f) => ({ ...f, [k]: v }));
    const id = (k: string) => `${tier.tier_key}-${k}`;

    return (
        <section className="card overflow-hidden" aria-labelledby={id('title')}>
            <div className="h-1" style={{ backgroundColor: form.color }} />
            <div className="p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black" style={{ backgroundColor: `${form.color}22`, color: form.color }}>
                            {form.label.slice(0, 1)}
                        </span>
                        <div>
                            <h3 id={id('title')} className="font-black">{form.label}</h3>
                            <p className="text-xs font-semibold text-ink-faint" dir="ltr" style={{ textAlign: 'right' }}>
                                {tier.tier_key} · {rangeLabel(tier, all)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn-ghost btn-sm" onClick={() => test.mutate()} disabled={test.isPending || presence.overlayCount === 0} title={presence.overlayCount === 0 ? 'افتح صفحة العرض أولاً' : 'معاينة على صفحة العرض'}>
                            <PlayCircle size={14} /> اختبار
                        </button>
                        {dirty && (
                            <button className="btn-ghost btn-sm" onClick={() => setForm(tier)}>
                                <RotateCcw size={14} /> تراجع
                            </button>
                        )}
                        <button className="btn-primary btn-sm" onClick={() => save.mutate()} disabled={!dirty || invalid || save.isPending}>
                            {save.isPending ? <Spinner size={14} className="text-brand-ink" /> : <Save size={14} />} حفظ
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field id={id('label')} label="اسم العرض" error={errors.label}>
                        <input id={id('label')} className="input" maxLength={50} value={form.label} onChange={(e) => set('label', e.target.value)} aria-invalid={!!errors.label} />
                    </Field>
                    <Field id={id('min')} label="الحد الأدنى" error={errors.min_amount}>
                        <input id={id('min')} type="number" step="0.01" min={0.01} className="input tabular-nums" dir="ltr" value={form.min_amount} onChange={(e) => set('min_amount', Number(e.target.value))} aria-invalid={!!errors.min_amount} />
                    </Field>
                    <Field id={id('max')} label="الحد الأعلى (اختياري)" error={errors.max_amount} hint="فارغ = بلا حد">
                        <input
                            id={id('max')}
                            type="number"
                            step="0.01"
                            className="input tabular-nums"
                            dir="ltr"
                            value={form.max_amount ?? ''}
                            onChange={(e) => set('max_amount', e.target.value === '' ? null : Number(e.target.value))}
                            aria-invalid={!!errors.max_amount}
                        />
                    </Field>
                    <Field id={id('color')} label="اللون">
                        <div className="flex gap-2">
                            <input type="color" aria-label="اختيار اللون" className="h-[46px] w-12 shrink-0 cursor-pointer rounded-xl border border-line bg-transparent p-1" value={form.color} onChange={(e) => set('color', e.target.value)} />
                            <input id={id('color')} className="input font-mono uppercase" dir="ltr" maxLength={7} value={form.color} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set('color', e.target.value)} />
                        </div>
                    </Field>
                    <Field id={id('duration')} label={`مدة العرض: ${Math.round(form.duration / 1000)} ث`}>
                        <input id={id('duration')} type="range" min={3} max={300} step={1} className="w-full accent-[#03e115]" value={Math.round(form.duration / 1000)} onChange={(e) => set('duration', Number(e.target.value) * 1000)} />
                    </Field>
                    <Field id={id('volume')} label={`مستوى الصوت: ${form.volume}%`}>
                        <input id={id('volume')} type="range" min={0} max={100} step={5} className="w-full accent-[#03e115]" value={form.volume} onChange={(e) => set('volume', Number(e.target.value))} />
                    </Field>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MediaField id={id('bg')} label="الخلفية (فيديو / GIF / صورة)" icon={Video} accept="video/mp4,video/webm,image/gif,image/png,image/jpeg,image/webp" value={form.background_url || ''} error={errors.background_url} onChange={(v) => set('background_url', v)} />
                    <MediaField id={id('sound')} label="صوت التنبيه" icon={Music} accept="audio/mpeg,audio/wav,audio/ogg,audio/webm" value={form.sound_url || ''} error={errors.sound_url} onChange={(v) => set('sound_url', v)} audio />
                </div>
            </div>
        </section>
    );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="label">{label}</label>
            {children}
            {error ? <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
        </div>
    );
}

function MediaField({ id, label, icon: Icon, accept, value, error, onChange, audio }: {
    id: string;
    label: string;
    icon: typeof Video;
    accept: string;
    value: string;
    error?: string;
    onChange: (v: string) => void;
    audio?: boolean;
}) {
    const toast = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(file?: File | null) {
        if (!file) return;
        if (file.size > 30 * 1024 * 1024) return toast.error('الحد الأقصى لحجم الملف 30 ميغابايت');
        setUploading(true);
        try {
            const r = await api.upload(file);
            onChange(r.url);
            toast.success('تم رفع الملف. اضغط "حفظ" لتطبيقه.');
        } catch (err) {
            toast.error(err);
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    return (
        <div>
            <label htmlFor={id} className="label flex items-center gap-1.5"><Icon size={13} /> {label}</label>
            <div className="flex gap-2">
                <input id={id} className="input font-mono text-xs" dir="ltr" placeholder="https://... (فارغ = الافتراضي)" value={value} onChange={(e) => onChange(e.target.value.trim())} aria-invalid={!!error} />
                <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                <button type="button" className="btn-secondary shrink-0" onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="رفع ملف">
                    {uploading ? <Spinner size={16} /> : <Upload size={16} />}
                </button>
            </div>
            {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
            {audio && value && !error && <audio className="mt-2 h-9 w-full" controls preload="none" src={value} />}
        </div>
    );
}
