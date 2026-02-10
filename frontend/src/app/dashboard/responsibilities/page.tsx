'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    UserPlus,
    Trash2,
    Key,
    User,
    AlertCircle,
    CheckCircle,
    UserCircle,
    BadgeCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ResponsibilitiesPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('moderator');

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data.users);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.message || 'خطأ في جلب المستخدمين');
        }
    };

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await api.getCurrentUser();
                if (res.user.role !== 'admin') {
                    router.push('/dashboard');
                    return;
                }
                setUserRole(res.user.role);
                await fetchUsers();
            } catch (err) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [router]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await api.createUser({ username, password, role });
            setSuccess('تم إنشاء المستخدم بنجاح');
            setUsername('');
            setPassword('');
            setRole('moderator');
            await fetchUsers();
        } catch (err: any) {
            setError(err.message || 'خطأ في إنشاء المستخدم');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟`)) return;

        try {
            await api.deleteUser(id);
            setSuccess('تم حذف المستخدم');
            await fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-10">
                {/* Create User Form */}
                <div className="w-full md:w-1/3">
                    <div className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-8 lg:p-10 sticky top-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white">إضافة مسؤول</h2>
                            <div className="w-10 h-10 bg-[#03e115]/10 rounded-full flex items-center justify-center text-[#03e115]">
                                <UserPlus size={20} />
                            </div>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">اسم المستخدم</label>
                                <div className="relative">
                                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all"
                                        placeholder="اسم المستخدم الجديد..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">كلمة المرور</label>
                                <div className="relative">
                                    <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all"
                                        placeholder="كلمة مرور قوية..."
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">الصلاحية</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole('moderator')}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${role === 'moderator'
                                                ? 'bg-[#03e115]/10 border-[#03e115] text-[#03e115]'
                                                : 'bg-white/5 border-white/10 text-gray-500'
                                            }`}
                                    >
                                        مشرف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('admin')}
                                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${role === 'admin'
                                                ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                                : 'bg-white/5 border-white/10 text-gray-500'
                                            }`}
                                    >
                                        مسؤول
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#03e115] text-[#0a0a0a] py-5 rounded-[24px] font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#03e115]/20 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-4 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <BadgeCheck size={20} />
                                        <span>تفعيل العضوية</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-white">فريق العمل</h2>
                            <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-black text-gray-500 border border-white/5">
                                {users.length} مستخدم
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {users.map((u, i) => (
                                <motion.div
                                    key={u.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-[#0f0f12] border border-white/5 rounded-[32px] p-6 flex items-center justify-between group hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl border ${u.role === 'admin'
                                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                : 'bg-[#03e115]/10 border-[#03e115]/20 text-[#03e115]'
                                            }`}>
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-white">{u.username}</h3>
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${u.role === 'admin'
                                                        ? 'bg-blue-500/10 text-blue-500'
                                                        : 'bg-[#03e115]/10 text-[#03e115]'
                                                    }`}>
                                                    <ShieldCheck size={10} />
                                                    {u.role === 'admin' ? 'ADMIN' : 'MODERATOR'}
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500">
                                                تم الإنشاء في {new Date(u.created_at).toLocaleDateString('ar-LY')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                            className="w-12 h-12 bg-red-400/5 hover:bg-red-400 text-red-400 hover:text-white border border-red-400/10 rounded-2xl transition-all flex items-center justify-center group/btn"
                                            disabled={u.role === 'admin' && users.filter(usr => usr.role === 'admin').length === 1}
                                        >
                                            <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-12 left-1/2 z-[100] px-8 py-4 rounded-3xl font-black shadow-2xl flex items-center gap-4 ${error ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#03e115] text-[#0a0a0a] shadow-[#03e115]/20'
                            }`}
                    >
                        {error ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        <span>{error || success}</span>
                        <button onClick={() => { setError(''); setSuccess(''); }} className="mr-4 opacity-50 hover:opacity-100">×</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
