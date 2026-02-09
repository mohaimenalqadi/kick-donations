
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle,
    Search,
    ChevronDown,
    Plus,
    MessageCircle,
    Mail,
    ExternalLink,
    Zap,
    Shield,
    DollarSign,
    Monitor
} from 'lucide-react';

const faqs = [
    {
        id: 1,
        question: "كيف أقوم بربط منصة التبرعات ببرنامج OBS؟",
        answer: "يمكنك ربط المنصة عن طريق إضافة (Browser Source) جديد في OBS، ثم لصق رابط الـ Overlay الخاص بك المتواجد في صفحة الإعدادات. تأكد من ضبط العرض على 1920 والارتفاع على 1080.",
        category: "technical"
    },
    {
        id: 2,
        question: "ما هي العملات المدعومة في المنصة؟",
        answer: "حالياً ندعم الدينار الليبي (LYD) بشكل أساسي، مع خطط مستقبلية لدعم العملات الدولية والعملات الرقمية.",
        category: "payments"
    },
    {
        id: 3,
        question: "هل يمكنني تغيير الأصوات والصور في التنبيهات؟",
        answer: "نعم، يمكنك تخصيص كل فئة تبرع بصوت وصورة أو GIF أو فيديو MP4 مختلف عن طريق صفحة 'تخصيص الفئات' في الإعدادات. ما عليك سوى لصق رابط الوسائط وضغط حفظ.",
        category: "customization"
    },
    {
        id: 4,
        question: "ما هو الوقت المستغرق لوصول التنبيه؟",
        answer: "التنبيهات تصل بشكل لحظي (أقل من ثانية) بفضل تقنية WebSocket التي نستخدمها لضمان عدم ضياع أي تبرع.",
        category: "technical"
    },
    {
        id: 5,
        question: "كيف يمكنني تغيير كلمة المرور الخاصة بي؟",
        answer: "انتقل إلى الإعدادات > الأمان، ثم أدخل كلمة المرور الحالية وكلمة المرور الجديدة مرتين، ثم اضغط على 'تحديث كلمة المرور'.",
        category: "security"
    },
    {
        id: 6,
        question: "كيف أقوم بكتم صوت التنبيهات؟",
        answer: "انتقل إلى الإعدادات > الصوتيات، ثم قم بتفعيل خيار 'كتم جميع الأصوات'. يمكنك أيضاً التحكم في مستوى صوت كل فئة على حدة.",
        category: "audio"
    },
    {
        id: 7,
        question: "ما هي فئات التبرعات المتاحة؟",
        answer: "لدينا 5 فئات: الأساسي (1-9 دينار)، المتوسط (10-49 دينار)، الاحترافي (50-99 دينار)، السينمائي (100-499 دينار)، والأسطوري (500+ دينار). كل فئة لها تصميم وصوت مختلف.",
        category: "general"
    },
    {
        id: 8,
        question: "كيف أختبر التنبيهات قبل البث المباشر؟",
        answer: "يمكنك الذهاب إلى الإعدادات > صفحة العرض والضغط على 'فتح المعاينة'. ثم من لوحة التحكم الرئيسية، أضف تبرعاً تجريبياً وأرسله للبث.",
        category: "technical"
    },
    {
        id: 9,
        question: "هل يمكنني تعديل مدة ظهور التنبيه؟",
        answer: "نعم، في صفحة 'تخصيص الفئات' يمكنك تعديل مدة العرض (بالثواني) لكل فئة تبرع باستخدام شريط التمرير.",
        category: "customization"
    },
    {
        id: 10,
        question: "لماذا لا يظهر الفيديو الخلفي في التنبيه؟",
        answer: "تأكد من أن الرابط يشير إلى ملف فيديو بصيغة MP4 أو WebM. بعض الروابط المحمية أو التي تتطلب تسجيل دخول لن تعمل. استخدم روابط مباشرة فقط.",
        category: "troubleshooting"
    }
];


export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [openId, setOpenId] = useState<number | null>(null);

    const filteredFaqs = faqs.filter(faq =>
        faq.question.includes(searchTerm) || faq.answer.includes(searchTerm)
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#03e115]/10 rounded-2xl flex items-center justify-center text-[#03e115] mx-auto mb-6 shadow-2xl shadow-[#03e115]/20">
                    <HelpCircle size={32} />
                </div>
                <h1 className="text-4xl font-black text-white">مركز المساعدة والدعم</h1>
                <p className="text-gray-400 font-bold max-w-lg mx-auto leading-relaxed">
                    نحن هنا لمساعدتك في ضبط منصتك بأفضل شكل ممكن. ابحث عن إجابات لأسئلتك أو تواصل معنا.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#03e115] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="ابحث عن سؤالك هنا..."
                    className="w-full bg-[#0f0f12] border border-white/5 rounded-3xl py-5 pr-14 pl-6 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-[#03e115]/30 transition-all shadow-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { icon: Monitor, label: "دليل OBS", color: "blue" },
                    { icon: Shield, label: "الأمان", color: "emerald" },
                    { icon: DollarSign, label: "المدفوعات", color: "amber" },
                    { icon: Zap, label: "التنبيهات", color: "purple" }
                ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <button key={idx} className="p-6 bg-[#0f0f12] border border-white/5 rounded-[24px] flex flex-col items-center gap-3 group hover:border-white/20 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                <Icon size={24} />
                            </div>
                            <span className="text-sm font-black text-gray-400 group-hover:text-white">{item.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-4">
                <h3 className="text-xl font-black text-white mb-6 pr-2">الأسئلة الشائعة</h3>
                {filteredFaqs.map((faq) => (
                    <div
                        key={faq.id}
                        className={`bg-[#0f0f12] border border-white/5 rounded-3xl overflow-hidden transition-all ${openId === faq.id ? 'border-[#03e115]/20 shadow-2xl' : ''}`}
                    >
                        <button
                            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                            className="w-full p-6 flex items-center justify-between text-right"
                        >
                            <span className={`text-lg font-bold ${openId === faq.id ? 'text-[#03e115]' : 'text-white'}`}>
                                {faq.question}
                            </span>
                            <ChevronDown
                                size={20}
                                className={`text-gray-500 transition-transform duration-300 ${openId === faq.id ? 'rotate-180 text-[#03e115]' : ''}`}
                            />
                        </button>

                        <AnimatePresence>
                            {openId === faq.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-6 pb-6"
                                >
                                    <div className="pt-2 text-gray-400 font-bold leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-br from-[#03e115]/10 to-transparent border border-[#03e115]/10 rounded-[40px] p-12 text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#03e115]/5 blur-[80px] rounded-full" />

                <div className="relative">
                    <h2 className="text-3xl font-black text-white">هل ما زلت بحاجة للمساعدة؟</h2>
                    <p className="text-gray-400 font-bold mt-2">فريقنا جاهز للرد على استفساراتك 24/7</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
                    <button className="flex items-center gap-3 px-8 py-4 bg-[#03e115] text-[#0a0a0a] rounded-2xl font-black hover:scale-105 transition-transform shadow-xl shadow-[#03e115]/20">
                        <MessageCircle size={20} />
                        <span>تحدث معنا مباشرة</span>
                    </button>
                    <button className="flex items-center gap-3 px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black hover:bg-white/10 transition-all">
                        <Mail size={20} />
                        <span>أرسل بريداً إلكترونياً</span>
                    </button>
                </div>

                <div className="pt-4 flex items-center justify-center gap-8 text-xs font-black text-gray-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#03e115] rounded-full" />
                        AVERAGE RESPONSE: 5 MINS
                    </div>
                    <div className="flex items-center gap-2 text-[#03e115]">
                        <ExternalLink size={14} />
                        DOCS.KICKPAY.CO
                    </div>
                </div>
            </div>
        </div>
    );
}
