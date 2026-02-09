
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Edit2,
    Save,
    Camera
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editLoading, setEditLoading] = useState(false);

    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, statsRes] = await Promise.all([
                    api.getCurrentUser(),
                    api.getStats()
                ]);
                if (userRes?.user) {
                    setUser(userRes.user);
                    setUsername(userRes.user.username);
                }
                setStats(statsRes.today);
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdateProfile = async () => {
        if (!username.trim() || username.length < 3) {
            setMessage({ type: 'error', text: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' });
            return;
        }

        if (password && password.length < 6) {
            setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
            return;
        }

        setEditLoading(true);
        setMessage(null);

        try {
            const res = await api.updateProfile({
                username: username !== user.username ? username : undefined,
                password: password || undefined
            });

            setUser(res.user);
            setIsEditing(false);
            setPassword('');
            setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'خطأ في تحديث البيانات' });
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-[#03e115] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Cover Section */}
            <div className="relative group">
                <div className="h-48 rounded-[32px] bg-gradient-to-r from-[#03e115]/20 via-[#03e115]/5 to-transparent border border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                </div>

                <div className="absolute -bottom-12 right-12 flex items-end gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-[#0f0f12] p-1 border-4 border-[#0a0a0a] shadow-2xl shadow-[#03e115]/20">
                            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
                                <span className="text-4xl font-black text-[#03e115]">
                                    {user.username[0].toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pb-4">
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            {user.username}
                            <div className="px-3 py-1 bg-[#03e115]/10 border border-[#03e115]/20 rounded-full">
                                <span className="text-xs font-black text-[#03e115] uppercase tracking-wider font-mono">OFFICIAL</span>
                            </div>
                        </h1>
                        <p className="text-gray-400 font-bold font-mono">@{user.username.toLowerCase()}</p>
                    </div>
                </div>
            </div>

            {/* Profile Content Card */}
            <div className="pt-16 max-w-2xl mx-auto">
                <div className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#03e115]/50 to-transparent" />

                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-40 h-40 rounded-[48px] bg-[#0f0f12] p-1.5 border-4 border-[#0a0a0a] shadow-2xl shadow-[#03e115]/10 relative z-10">
                                <div className="w-full h-full rounded-[38px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/5">
                                    <span className="text-6xl font-black text-[#03e115] drop-shadow-[0_0_15px_rgba(3,225,21,0.3)]">
                                        {user.username[0].toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute -inset-4 bg-[#03e115]/5 blur-3xl rounded-full" />
                        </div>

                        <div className="space-y-4 w-full max-w-sm relative z-10">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-1 text-right">
                                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-2 font-mono">اسم المستخدم</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#03e115] transition-all"
                                            placeholder="اسم المستخدم الجديد"
                                        />
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-2 font-mono">كلمة المرور الجديدة (اختياري)</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#03e115] transition-all"
                                            placeholder="اتركها فارغة للإبقاء على الحالية"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3">
                                        {user.username}
                                        <div className="px-3 py-1 bg-[#03e115]/10 border border-[#03e115]/20 rounded-full">
                                            <span className="text-[10px] font-black text-[#03e115] uppercase tracking-[0.2em] font-mono">OFFICIAL</span>
                                        </div>
                                    </h1>
                                    <p className="text-gray-500 font-bold text-lg font-mono">@{user.username.toLowerCase()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-2xl text-xs font-black ${message.type === 'success'
                                    ? 'bg-[#03e115]/10 text-[#03e115] border border-[#03e115]/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}
                        >
                            {message.text}
                        </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5 relative z-10">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-1">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">إجمالي الدعم</p>
                            <p className="text-2xl font-black text-[#03e115]">{Number(stats?.total || 0).toLocaleString()} د.ل</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-1">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">عدد التبرعات</p>
                            <p className="text-2xl font-black text-white">{stats?.count || 0}</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-center gap-4 relative z-10">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={editLoading}
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-[#03e115] text-[#0a0a0a] rounded-[24px] font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#03e115]/20 disabled:opacity-50"
                                >
                                    {editLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
                                    <span>حفظ البيانات</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setUsername(user.username);
                                        setPassword('');
                                        setMessage(null);
                                    }}
                                    className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-[24px] font-black transition-all hover:bg-white/10"
                                >
                                    إلغاء
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-3 px-8 py-4 bg-[#03e115] text-[#0a0a0a] rounded-[24px] font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#03e115]/20"
                            >
                                <Edit2 size={20} />
                                <span>تعديل الحساب</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
