
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Bell,
    Shield,
    Globe,
    Database,
    Volume2,
    Monitor,
    Lock,
    Eye,
    ChevronLeft,
    CreditCard,
    Smartphone,
    Save,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);

    const [settings, setSettings] = useState({
        site_title: 'KickPay',
        currency: 'LYD'
    });

    // Platform Settings Local State
    const [localSettings, setLocalSettings] = useState({
        site_title: 'KickPay',
        currency: 'LYD'
    });

    const [tiers, setTiers] = useState<any[]>([]);
    const [localTiers, setLocalTiers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            console.log('🔄 Fetching settings data...');
            try {
                console.log('📡 Requesting Settings...');
                const settingsRes = await api.getSettings();
                console.log('✅ Fetched Settings:', settingsRes);

                if (settingsRes.settings) {
                    setSettings(settingsRes.settings);
                    setLocalSettings(settingsRes.settings);
                }

                console.log('📡 Requesting Tiers...');
                const tiersRes = await api.getTierSettings();
                console.log('✅ Fetched Tiers:', tiersRes);

                if (tiersRes.tiers) {
                    const sorted = tiersRes.tiers.sort((a: any, b: any) => {
                        const order = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6', 'tier_50'];
                        return order.indexOf(a.tier_key) - order.indexOf(b.tier_key);
                    });
                    setTiers(sorted);
                    setLocalTiers(JSON.parse(JSON.stringify(sorted)));
                    console.log('📊 Tiers state updated:', sorted.length, 'items');
                }
            } catch (error: any) {
                console.error('❌ Failed to fetch settings:', error);
                console.error('Error Details:', {
                    message: error.message,
                    stack: error.stack
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const response = await api.updateSettings(localSettings);
            if (response.success) {
                setSettings(localSettings);
                setShowSavedMsg(true);
                setTimeout(() => setShowSavedMsg(false), 3000);
                // Trigger title update
                window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: localSettings }));
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            alert('حدث خطأ أثناء حفظ الإعدادات - قد تكون تجاوزت حدود الطلبات المسموحة');
        } finally {
            setSaving(false);
        }
    };

    const handleTierUpdate = async (id: string) => {
        setSaving(true);
        const tierToUpdate = localTiers.find(t => t.id === id);
        if (!tierToUpdate) return;

        try {
            const response = await api.updateTierSetting(id, tierToUpdate);
            if (response.success) {
                setTiers(prev => prev.map(t => t.id === id ? { ...t, ...tierToUpdate } : t));
                setShowSavedMsg(true);
                setTimeout(() => setShowSavedMsg(false), 3000);
            }
        } catch (error) {
            console.error('Failed to update tier:', error);
            alert('حدث خطأ أثناء حفظ الفئة - قد تكون تجاوزت حدود الطلبات المسموحة');
        } finally {
            setSaving(false);
        }
    };

    const menuItems = [
        { id: 'general', label: 'عام', icon: Globe },
        { id: 'overlay', label: 'صفحة العرض', icon: Monitor },
        { id: 'tiers', label: 'تخصيص الفئات', icon: CreditCard },
        { id: 'security', label: 'الأمان', icon: Shield },
    ];

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#03e115] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 text-right" dir="rtl">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Side Navigation */}
                <div className="w-full lg:w-72 space-y-2">
                    <h1 className="text-2xl font-black text-white mb-8 pr-4">الإعدادات</h1>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold ${isActive
                                    ? 'bg-[#03e115]/10 text-[#03e115] shadow-xl'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                                {isActive && <ChevronLeft className="mr-auto rotate-180" size={18} />}
                            </button>
                        );
                    })}
                </div>

                {/* Main Settings Content */}
                <div className="flex-1 space-y-8">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white">إعدادات الحساب</h3>
                                        <p className="text-gray-500 font-bold text-sm">إدارة المعلومات الأساسية لحسابك على المنصة.</p>
                                    </div>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        className="px-6 py-3 bg-[#03e115] text-[#0a0a0a] rounded-2xl font-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ التغييرات'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">اسم المنصة</label>
                                        <input
                                            type="text"
                                            value={localSettings.site_title}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, site_title: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">العملة الافتراضية</label>
                                        <select
                                            value={localSettings.currency}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, currency: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 appearance-none"
                                        >
                                            <option value="LYD">دينار ليبي (LYD)</option>
                                            <option value="USD">دولار أمريكي (USD)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Overlay Settings */}
                    {activeTab === 'overlay' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 text-right">
                            <div className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white">رابط صفحة العرض (Overlay URL)</h3>
                                        <p className="text-gray-500 font-bold text-sm">قم بنسخ هذا الرابط وإضافته كمصدر متصفح في OBS.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-[#03e115]/10 border border-[#03e115]/20 rounded-full">
                                        <span className="text-[10px] font-black text-[#03e115] uppercase tracking-widest">PRIVATE SOURCE</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 bg-black/50 border border-white/5 rounded-2xl p-4 font-mono text-sm text-[#03e115] overflow-hidden whitespace-nowrap opacity-60">
                                        {typeof window !== 'undefined' ? `${window.location.origin}/overlay` : 'https://kickpay.co/overlay'}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = typeof window !== 'undefined' ? `${window.location.origin}/overlay` : '';
                                            navigator.clipboard.writeText(url);
                                        }}
                                        className="px-6 py-4 bg-[#03e115] text-[#0a0a0a] rounded-2xl font-black hover:scale-105 transition-transform"
                                    >
                                        نسخ الرابط
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/10 rounded-[40px] p-10 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                                        <Eye size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">معاينة مباشرة</h3>
                                        <p className="text-gray-500 font-bold text-sm">اختبر عرض الفئات المختلفة وقم بموازنة الأصوات والتنسيقات.</p>
                                    </div>
                                </div>
                                <a
                                    href="/overlay"
                                    target="_blank"
                                    className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-black hover:scale-105 transition-transform shadow-xl shadow-blue-500/20"
                                >
                                    فتح المعاينة
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Tier Customization */}
                    {activeTab === 'tiers' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 text-right">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white">تخصيص الفئات</h2>
                                    <p className="text-gray-500 font-bold text-sm">تحكم في مظهر وصوت وتوقيت كل فئة تبرع.</p>
                                </div>
                                {tiers.length === 0 && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-2 bg-[#03e115]/10 text-[#03e115] border border-[#03e115]/20 rounded-xl font-black hover:bg-[#03e115]/20 transition-all text-xs"
                                    >
                                        تحديث البيانات
                                    </button>
                                )}
                            </div>

                            {tiers.length === 0 ? (
                                <div className="bg-[#0f0f12] border border-white/5 border-dashed rounded-[40px] p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-3xl mx-auto flex items-center justify-center text-gray-600">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-500">جاري تحميل إعدادات الفئات...</h3>
                                    <p className="text-gray-700 font-bold max-w-xs mx-auto text-xs uppercase tracking-[0.2em]">
                                        إذا استغرق الأمر طويلاً، تأكد من اتصال الخادم.
                                    </p>
                                </div>
                            ) : (
                                localTiers.map((tier, idx) => {
                                    const originalTier = tiers.find(t => t.id === tier.id);
                                    const hasChanges = JSON.stringify(tier) !== JSON.stringify(originalTier);

                                    return (
                                        <div key={tier.id} className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-8 space-y-6 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-4 h-12 rounded-full"
                                                        style={{ backgroundColor: tier.color }}
                                                    />
                                                    <div>
                                                        <h3 className="text-xl font-black text-white">{tier.label}</h3>
                                                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{tier.tier_key} Tier</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 font-mono text-xs text-white/50">
                                                        <span>يبدأ من:</span>
                                                        <span className="text-[#03e115] font-black">{tier.min_amount} {settings.currency}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTierUpdate(tier.id)}
                                                        disabled={saving}
                                                        className="px-6 py-2 bg-[#03e115] text-[#0a0a0a] rounded-xl font-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 text-sm"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-center" /> : 'حفظ'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">اسم العرض</label>
                                                    <input
                                                        type="text"
                                                        value={tier.label}
                                                        onChange={(e) => {
                                                            const newTiers = [...localTiers];
                                                            newTiers[idx].label = e.target.value;
                                                            setLocalTiers(newTiers);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all text-right"
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">الحد الأدنى (دينار)</label>
                                                    <input
                                                        type="number"
                                                        value={tier.min_amount}
                                                        onChange={(e) => {
                                                            const newTiers = [...localTiers];
                                                            newTiers[idx].min_amount = Number(e.target.value);
                                                            setLocalTiers(newTiers);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[#03e115] font-black focus:outline-none focus:border-[#03e115]/30 transition-all text-right"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">اللون الأساسي (HEX)</label>
                                                    <div className="flex gap-4">
                                                        <input
                                                            type="text"
                                                            value={tier.color}
                                                            onChange={(e) => {
                                                                const newTiers = [...localTiers];
                                                                newTiers[idx].color = e.target.value;
                                                                setLocalTiers(newTiers);
                                                            }}
                                                            className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-[#03e115]/30 transition-all"
                                                        />
                                                        <input
                                                            type="color"
                                                            value={tier.color}
                                                            onChange={(e) => {
                                                                const newTiers = [...localTiers];
                                                                newTiers[idx].color = e.target.value;
                                                                setLocalTiers(newTiers);
                                                            }}
                                                            className="w-14 h-14 bg-transparent border-none p-0 rounded-2xl cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">مدة العرض (ثواني)</label>
                                                    <div className="flex items-center gap-6">
                                                        <input
                                                            type="range"
                                                            min="5"
                                                            max="600"
                                                            value={tier.duration / 1000}
                                                            onChange={(e) => {
                                                                const newTiers = [...localTiers];
                                                                newTiers[idx].duration = Number(e.target.value) * 1000;
                                                                setLocalTiers(newTiers);
                                                            }}
                                                            className="flex-1 accent-[#03e115] cursor-pointer"
                                                        />
                                                        <span className="w-20 text-center bg-black/40 border border-white/5 rounded-xl py-2 font-black text-[#03e115]">
                                                            {tier.duration / 1000}ث
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">رابط الوسائط (Video/GIF)</label>
                                                    <input
                                                        type="text"
                                                        value={tier.background_url || ''}
                                                        placeholder="https://example.com/background.mp4"
                                                        onChange={(e) => {
                                                            const newTiers = [...localTiers];
                                                            newTiers[idx].background_url = e.target.value;
                                                            setLocalTiers(newTiers);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-mono text-xs focus:outline-none focus:border-[#03e115]/30 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}



                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 text-right">
                            <div className="bg-[#0f0f12] border border-white/5 rounded-[40px] p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white">تغيير كلمة المرور</h3>
                                        <p className="text-gray-500 font-bold text-sm">قم بتحديث كلمة المرور الخاصة بك لتأمين حسابك.</p>
                                    </div>
                                    <Shield className="text-[#03e115]" size={32} />
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">كلمة المرور الحالية</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            placeholder="أدخل كلمة المرور الحالية"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all text-right"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">كلمة المرور الجديدة</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            placeholder="أدخل كلمة المرور الجديدة"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all text-right"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">تأكيد كلمة المرور الجديدة</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            placeholder="أعد إدخال كلمة المرور الجديدة"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#03e115]/30 transition-all text-right"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value;
                                        const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
                                        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;

                                        if (!currentPassword || !newPassword || !confirmPassword) {
                                            alert('يرجى ملء جميع الحقول.');
                                            return;
                                        }
                                        if (newPassword !== confirmPassword) {
                                            alert('كلمة المرور الجديدة غير متطابقة.');
                                            return;
                                        }
                                        if (newPassword.length < 6) {
                                            alert('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
                                            return;
                                        }

                                        setSaving(true);
                                        try {
                                            await api.updateProfile({ password: newPassword });
                                            setShowSavedMsg(true);
                                            setTimeout(() => setShowSavedMsg(false), 3000);
                                            (document.getElementById('currentPassword') as HTMLInputElement).value = '';
                                            (document.getElementById('newPassword') as HTMLInputElement).value = '';
                                            (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
                                        } catch (error) {
                                            console.error('Failed to update password:', error);
                                            alert('فشل تغيير كلمة المرور. تأكد من كلمة المرور الحالية.');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                    className="w-full px-6 py-4 bg-[#03e115] text-[#0a0a0a] rounded-2xl font-black hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'تحديث كلمة المرور'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Status (Floating) */}
            {(saving || showSavedMsg) && (
                <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 ${showSavedMsg ? 'bg-[#03e115]' : 'bg-white/10 backdrop-blur-xl border border-white/10'} text-[#0a0a0a] flex items-center gap-4 rounded-3xl font-black shadow-2xl z-50 animate-in slide-in-from-bottom-10`}>
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                            <span className="text-white">جاري الحفظ...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5 text-[#0a0a0a]" />
                            <span>تم حفظ التغييرات بنجاح</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
