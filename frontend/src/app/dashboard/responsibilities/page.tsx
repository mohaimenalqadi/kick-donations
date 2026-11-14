'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, LogOut, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/hooks/queries';
import { formatDateTime } from '@/lib/format';
import type { Role, User } from '@/lib/types';
import { useDashboard } from '../DashboardContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { EmptyState, SectionHeader, Spinner } from '@/components/ui/primitives';

const ROLE_LABEL: Record<Role, string> = { admin: 'مشرف', moderator: 'مشرف مساعد' };

export default function ResponsibilitiesPage() {
    const { user: me, isAdmin } = useDashboard();
    const router = useRouter();
    const qc = useQueryClient();
    const toast = useToast();
    const confirm = useConfirm();
    const [resetFor, setResetFor] = useState<User | null>(null);

    useEffect(() => {
        if (!isAdmin) router.replace('/dashboard');
    }, [isAdmin, router]);

    const users = useQuery({ queryKey: qk.users, queryFn: () => api.users().then((r) => r.users), enabled: isAdmin });
    const refresh = () => qc.invalidateQueries({ queryKey: qk.users });

    const updateRole = useMutation({
        mutationFn: ({ id, role }: { id: string; role: Role }) => api.updateUser(id, { role }),
        onSuccess: () => { toast.success('تم تحديث الصلاحية'); refresh(); },
        onError: toast.error,
    });

    async function remove(u: User) {
        if (!(await confirm({ title: `حذف "${u.username}"`, description: 'سيفقد هذا المستخدم الوصول إلى لوحة التحكم فوراً.', confirmLabel: 'حذف المستخدم' }))) return;
        try {
            await api.deleteUser(u.id);
            toast.success('تم حذف المستخدم');
            refresh();
        } catch (err) {
            toast.error(err);
        }
    }

    async function revoke(u: User) {
        if (!(await confirm({ title: 'إنهاء الجلسات', description: `سيتم تسجيل خروج "${u.username}" من كل الأجهزة.`, confirmLabel: 'إنهاء الجلسات', tone: 'default' }))) return;
        try {
            await api.revokeUserSessions(u.id);
            toast.success('تم إنهاء جلسات المستخدم');
        } catch (err) {
            toast.error(err);
        }
    }

    if (!isAdmin) return null;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
                <CreateUserForm onCreated={refresh} />
            </div>

            <section className="card p-4 sm:p-6 lg:col-span-8" aria-labelledby="team-title">
                <SectionHeader title="فريق الإدارة" description={users.data ? `${users.data.length} مستخدم` : undefined} />
                <div className="mb-4 grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
                    <p className="rounded-xl bg-white/[0.03] p-3"><b className="text-ink">مشرف:</b> صلاحيات كاملة، الإعدادات، المستخدمون، الحذف.</p>
                    <p className="rounded-xl bg-white/[0.03] p-3"><b className="text-ink">مشرف مساعد:</b> إضافة التبرعات وإرسالها للبث فقط.</p>
                </div>
                {users.isLoading ? (
                    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
                ) : !users.data?.length ? (
                    <EmptyState icon={Users} title="لا يوجد مستخدمون" />
                ) : (
                    <ul className="divide-y divide-line">
                        {users.data.map((u) => {
                            const self = u.id === me.id;
                            return (
                                <li key={u.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${u.role === 'admin' ? 'bg-brand-soft text-brand' : 'bg-info-soft text-info'}`}>
                                            {u.username[0]?.toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                                                {u.username} {self && <span className="text-xs font-semibold text-ink-faint">(أنت)</span>}
                                            </p>
                                            <p className="text-[11px] text-ink-faint">أُنشئ {formatDateTime(u.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                        <select
                                            className="input w-auto py-2 text-xs"
                                            value={u.role}
                                            disabled={self || updateRole.isPending}
                                            onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as Role })}
                                            aria-label={`صلاحية ${u.username}`}
                                        >
                                            <option value="admin">{ROLE_LABEL.admin}</option>
                                            <option value="moderator">{ROLE_LABEL.moderator}</option>
                                        </select>
                                        <button className="btn-ghost btn-sm p-2" onClick={() => setResetFor(u)} title="تعيين كلمة مرور جديدة" aria-label={`تعيين كلمة مرور ${u.username}`}>
                                            <KeyRound size={15} />
                                        </button>
                                        {!self && (
                                            <>
                                                <button className="btn-ghost btn-sm p-2" onClick={() => revoke(u)} title="إنهاء الجلسات" aria-label={`إنهاء جلسات ${u.username}`}>
                                                    <LogOut size={15} />
                                                </button>
                                                <button className="btn-ghost btn-sm p-2 hover:bg-danger-soft hover:text-danger" onClick={() => remove(u)} aria-label={`حذف ${u.username}`}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} />
        </div>
    );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
    const toast = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('moderator');
    const validName = /^[A-Za-z0-9_.-]{3,30}$/.test(username.trim());

    const create = useMutation({
        mutationFn: () => api.createUser({ username: username.trim(), password, role }),
        onSuccess: () => {
            toast.success('تم إنشاء المستخدم');
            setUsername('');
            setPassword('');
            setRole('moderator');
            onCreated();
        },
        onError: toast.error,
    });

    return (
        <form
            className="card p-5 sm:p-6 lg:sticky lg:top-6"
            onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
            }}
        >
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-black">إضافة مسؤول</h2>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand"><UserPlus size={18} /></span>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="new-username" className="label">اسم المستخدم</label>
                    <input id="new-username" className="input" dir="ltr" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} required />
                    <p className="hint">3–30 حرفاً: إنجليزية وأرقام و . _ -</p>
                </div>
                <div>
                    <label htmlFor="new-password" className="label">كلمة المرور</label>
                    <input id="new-password" type="password" className="input" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                    <p className="hint">8 أحرف على الأقل</p>
                </div>
                <div>
                    <span className="label">الصلاحية</span>
                    <div className="grid grid-cols-2 gap-2" role="radiogroup">
                        {(['moderator', 'admin'] as Role[]).map((r) => (
                            <button
                                type="button"
                                key={r}
                                role="radio"
                                aria-checked={role === r}
                                onClick={() => setRole(r)}
                                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-bold transition-colors ${role === r ? 'border-brand/40 bg-brand-soft text-brand' : 'border-line text-ink-muted hover:text-ink'}`}
                            >
                                <ShieldCheck size={15} /> {ROLE_LABEL[r]}
                            </button>
                        ))}
                    </div>
                </div>
                <button className="btn-primary w-full" disabled={!validName || password.length < 8 || create.isPending}>
                    {create.isPending ? <Spinner size={16} className="text-brand-ink" /> : <UserPlus size={16} />} إنشاء الحساب
                </button>
            </div>
        </form>
    );
}

function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
    const toast = useToast();
    const [pw, setPw] = useState('');
    const save = useMutation({
        mutationFn: () => api.updateUser(user!.id, { password: pw }),
        onSuccess: () => {
            toast.success('تم تعيين كلمة المرور وإنهاء جلسات المستخدم');
            setPw('');
            onClose();
        },
        onError: toast.error,
    });

    return (
        <Modal
            open={!!user}
            onClose={() => { setPw(''); onClose(); }}
            title={`كلمة مرور جديدة لـ ${user?.username ?? ''}`}
            description="سيتم تسجيل خروج المستخدم من كل الأجهزة."
            footer={
                <>
                    <button className="btn-primary" disabled={pw.length < 8 || save.isPending} onClick={() => save.mutate()}>
                        {save.isPending && <Spinner size={16} className="text-brand-ink" />} حفظ
                    </button>
                    <button className="btn-secondary" onClick={onClose}>إلغاء</button>
                </>
            }
        >
            <label htmlFor="reset-pw" className="label">كلمة المرور الجديدة</label>
            <input id="reset-pw" type="password" className="input" dir="ltr" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} data-autofocus />
        </Modal>
    );
}
