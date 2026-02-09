
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Send,
    Trash2,
    RefreshCw,
    Clock,
    Play,
    CheckCircle,
    Users,
    TrendingUp,
    DollarSign,
    Zap,
    MessageSquare,
    ChevronLeft,
    AlertCircle
} from 'lucide-react';
import { api, type Donation } from '@/lib/api';
import { connectSocket, onStatusUpdate, disconnectSocket } from '@/lib/socket';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';

const TIER_COLORS = {
    basic: '#10b981',
    medium: '#3b82f6',
    professional: '#8b5cf6',
    cinematic: '#f59e0b',
    legendary: '#ef4444',
};

const TIER_LABELS = {
    basic: 'بسيط',
    medium: 'متوسط',
    professional: 'احترافي',
    cinematic: 'سينمائي',
    legendary: 'خارق',
};

const STATUS_ICONS = {
    pending: Clock,
    live: Play,
    done: CheckCircle,
};

export default function DashboardPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [stats, setStats] = useState({ total: 0, count: 0, average: 0 });
    const [connections, setConnections] = useState({ adminCount: 0, overlayCount: 0 });
    const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

    // Form state
    const [donorName, setDonorName] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    // Analytics state
    const [view, setView] = useState<'operations' | 'analytics'>('operations');
    const [analyticsData, setAnalyticsData] = useState<{
        dailyTrend: { date: string; total: number }[];
        distribution: { tier: string; count: number }[];
    }>({ dailyTrend: [], distribution: [] });
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const getTierPreview = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 1) return null;
        if (num >= 500) return 'legendary';
        if (num >= 100) return 'cinematic';
        if (num >= 50) return 'professional';
        if (num >= 10) return 'medium';
        return 'basic';
    };

    const tierPreview = getTierPreview(amount);

    const fetchDonations = useCallback(async () => {
        try {
            const response = await api.getDonations();
            setDonations(response.donations);
            setConnections(response.connections);
        } catch (err) {
            console.error('Error:', err);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.getStats();
            setStats(response.today);
        } catch (err) {
            console.error('Error:', err);
        }
    }, []);

    const fetchAnalytics = useCallback(async (start?: string, end?: string) => {
        setAnalyticsLoading(true);
        try {
            const data = await api.getAnalytics(start, end);
            setAnalyticsData(data);
        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchDonations(), fetchStats(), fetchAnalytics()]);
            setLoading(false);
        };
        init();

        connectSocket('admin');
        const unsubscribe = onStatusUpdate((update) => {
            setDonations(prev =>
                prev.map(d => d.id === update.donationId ? { ...d, status: update.status as any } : d)
            );
        });

        return () => {
            unsubscribe();
            disconnectSocket();
        };
    }, [fetchDonations, fetchStats]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const response = await api.createDonation({
                donor_name: donorName,
                amount: parseFloat(amount),
                message: message || undefined,
            });

            if (response.success) {
                setSuccess('تم إضافة التبرع بنجاح');
                setDonorName('');
                setAmount('');
                setMessage('');
                fetchDonations();
                fetchStats();
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendToStream = async (donationId: string) => {
        setSendingIds(prev => new Set(prev).add(donationId));
        try {
            await api.sendToStream(donationId);
            setSuccess('تم إرسال التبرع للبث');
            fetchDonations();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSendingIds(prev => {
                const next = new Set(prev);
                next.delete(donationId);
                return next;
            });
        }
    };

    const handleDelete = async (donationId: string) => {
        if (!confirm('هل أنت متأكد؟')) return;
        try {
            await api.deleteDonation(donationId);
            setSuccess('تم الحذف');
            fetchDonations();
            fetchStats();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleBulkDelete = async (period: 'today' | 'all') => {
        const message = period === 'today'
            ? 'هل أنت متأكد من حذف جميع عمليات اليوم؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'هل أنت متأكد من حذف كافة العمليات في جميع الأيام؟ سيتم مسح كل شيء تماماً!';

        if (!confirm(message)) return;

        setSubmitting(true);
        try {
            const response = await api.bulkDeleteDonations(period);
            setSuccess(response.message);
            // Re-fetch everything immediately
            await Promise.all([
                fetchDonations(),
                fetchStats(),
                fetchAnalytics()
            ]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Stats Summary */}
                {stats && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0f0f12] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#03e115]/5 blur-3xl rounded-full -mr-12 -mt-12" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-[#03e115]/10 rounded-2xl">
                                    <DollarSign className="w-6 h-6 text-[#03e115]" />
                                </div>
                                <span className="text-white/50 font-bold">إجمالي التبرعات</span>
                            </div>
                            <div className="text-3xl font-black text-white">{stats.total} د.ل</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#0f0f12] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <TrendingUp className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="text-white/50 font-bold">عمليات اليوم</span>
                            </div>
                            <div className="text-3xl font-black text-white">{stats.count}</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#0f0f12] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-2xl">
                                    <Zap className="w-6 h-6 text-purple-500" />
                                </div>
                                <span className="text-white/50 font-bold">المتوسط اليومي</span>
                            </div>
                            <div className="text-3xl font-black text-white">{stats.average} د.ل</div>
                        </motion.div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-8 lg:p-10 sticky top-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white">تبرع جديد</h2>
                            <div className="w-10 h-10 bg-[#03e115]/10 rounded-full flex items-center justify-center text-[#03e115]">
                                <Plus size={20} />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">اسم المتبرع</label>
                                <input
                                    type="text"
                                    value={donorName}
                                    onChange={(e) => setDonorName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all"
                                    placeholder="مثال: عبدالرزاق البكوش"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">المبلغ (د.ل)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all"
                                        placeholder="0.00"
                                        required
                                        min="1"
                                    />
                                    {tierPreview && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                            <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: TIER_COLORS[tierPreview] }}>
                                                {TIER_LABELS[tierPreview]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mr-2">الرسالة (اختياري)</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all min-h-[120px] resize-none"
                                    placeholder="اكتب رسالة المتبرع..."
                                />
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
                                        <Send size={20} />
                                        <span>إرسال التبرع</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List & Analytics Section */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-6">
                            <div className="flex bg-[#0f0f12] p-1 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => setView('operations')}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'operations' ? 'bg-[#03e115] text-[#0a0a0a]' : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    آخر العمليات
                                </button>
                                <button
                                    onClick={() => setView('analytics')}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'analytics' ? 'bg-[#03e115] text-[#0a0a0a]' : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    التحليلات
                                </button>
                            </div>
                            <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-black text-gray-500 border border-white/5">
                                {donations.length} عملية
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulkDelete('today')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 size={14} />
                                <span>حذف اليوم</span>
                            </button>
                            <button
                                onClick={() => handleBulkDelete('all')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <AlertCircle size={14} />
                                <span>حذف الكل</span>
                            </button>
                            <div className="w-px h-8 bg-white/5 mx-2" />
                            <button
                                onClick={fetchDonations}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all underline-none"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {view === 'analytics' ? (
                            <AnalyticsSection
                                data={analyticsData}
                                isLoading={analyticsLoading}
                                onDateChange={(start, end) => fetchAnalytics(start, end)}
                            />
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {donations.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center bg-[#0f0f12] border border-white/5 border-dashed rounded-[40px] text-gray-600">
                                        <AlertCircle size={48} className="mb-4 opacity-20" />
                                        <p className="font-bold">لا توجد عمليات مسجلة حالياً</p>
                                    </div>
                                ) : (
                                    donations.map((donation, i) => {
                                        const StatusIcon = STATUS_ICONS[donation.status];
                                        const color = TIER_COLORS[donation.tier];

                                        return (
                                            <motion.div
                                                key={donation.id}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="bg-[#0f0f12] border border-white/5 rounded-[32px] p-6 flex flex-col sm:flex-row items-center gap-6 group hover:border-white/10 transition-all"
                                            >
                                                <div className="w-20 h-20 rounded-[24px] bg-black/40 border border-white/5 flex flex-col items-center justify-center shrink-0" style={{ boxShadow: `inset 0 0 20px ${color}15` }}>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase">LYD</p>
                                                    <p className="text-xl font-black" style={{ color }}>{donation.amount}</p>
                                                </div>

                                                <div className="flex-1 text-center sm:text-right space-y-1">
                                                    <div className="flex items-center justify-center sm:justify-start gap-3">
                                                        <h3 className="text-lg font-black text-white">{donation.donor_name}</h3>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                            {TIER_LABELS[donation.tier]}
                                                        </span>
                                                    </div>
                                                    {donation.message ? (
                                                        <p className="text-gray-400 font-bold leading-relaxed">{donation.message}</p>
                                                    ) : (
                                                        <p className="text-gray-600 italic text-sm">بدون رسالة...</p>
                                                    )}
                                                    <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 uppercase">
                                                            <Clock size={12} />
                                                            {new Date(donation.created_at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${donation.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            donation.status === 'live' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                                                'bg-[#03e115]/10 text-[#03e115]'
                                                            }`}>
                                                            <StatusIcon size={10} />
                                                            {donation.status === 'pending' ? 'PENDING' : donation.status === 'live' ? 'ON STREAM' : 'COMPLETED'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {donation.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleSendToStream(donation.id)}
                                                            className="w-12 h-12 bg-[#03e115]/10 hover:bg-[#03e115] text-[#03e115] hover:text-[#0a0a0a] border border-[#03e115]/20 rounded-2xl transition-all flex items-center justify-center group/btn"
                                                        >
                                                            {sendingIds.has(donation.id) ? (
                                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Send size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(donation.id)}
                                                        className="w-12 h-12 bg-red-400/5 hover:bg-red-400 text-red-400 hover:text-white border border-red-400/10 rounded-2xl transition-all flex items-center justify-center group/btn"
                                                    >
                                                        <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Toast (Simplified) */}
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
