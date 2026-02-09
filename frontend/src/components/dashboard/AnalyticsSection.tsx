'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Filter, Calendar } from 'lucide-react';

interface AnalyticsData {
    dailyTrend: { date: string; total: number }[];
    distribution: { tier: string; count: number }[];
}

interface AnalyticsSectionProps {
    data: AnalyticsData;
    isLoading: boolean;
    onDateChange: (start: string, end: string) => void;
}

interface ChartPoint {
    x: number;
    y: number;
    value: number;
}

const TIER_COLORS: Record<string, string> = {
    basic: '#10b981',
    medium: '#3b82f6',
    professional: '#8b5cf6',
    cinematic: '#f59e0b',
    legendary: '#ef4444',
};

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ data, isLoading, onDateChange }) => {
    const [trendType, setTrendType] = React.useState<'area' | 'bar'>('area');
    const [distType, setDistType] = React.useState<'bars' | 'pie'>('bars');

    // 1. Calculate Trend Chart Data (SVG Path / Bars)
    const trendConfig = useMemo(() => {
        if (!data.dailyTrend || data.dailyTrend.length === 0) return null;
        const width = 800;
        const height = 200;
        const padding = 20;

        const maxVal = Math.max(...data.dailyTrend.map(d => Number(d.total) || 0), 1);

        const points: ChartPoint[] = data.dailyTrend.length === 1
            ? [
                {
                    x: padding,
                    y: height - ((Number(data.dailyTrend[0].total) / maxVal) * (height - padding * 2) + padding),
                    value: Number(data.dailyTrend[0].total)
                },
                {
                    x: width - padding,
                    y: height - ((Number(data.dailyTrend[0].total) / maxVal) * (height - padding * 2) + padding),
                    value: Number(data.dailyTrend[0].total)
                }
            ]
            : data.dailyTrend.map((d, i) => ({
                x: (i / (data.dailyTrend.length - 1)) * (width - padding * 2) + padding,
                y: height - ((Number(d.total) / maxVal) * (height - padding * 2) + padding),
                value: Number(d.total)
            }));

        const pathData = points.reduce((acc, p, i) =>
            acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");

        const areaData = pathData + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

        return { points, pathData, areaData, width, height, maxVal, padding };
    }, [data.dailyTrend]);

    // 2. Calculate Pie Chart Data
    const pieData = useMemo(() => {
        const total = data.distribution.reduce((acc, d) => acc + d.count, 0);
        if (total === 0) return [];

        let currentAngle = -Math.PI / 2;
        return ['basic', 'medium', 'professional', 'cinematic', 'legendary'].map(tier => {
            const item = data.distribution.find(d => d.tier === tier);
            const count = item?.count || 0;
            const percentage = count / total;
            const angle = percentage * Math.PI * 2;

            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            return { tier, count, percentage, startAngle, endAngle };
        });
    }, [data.distribution]);

    return (
        <div className={`space-y-8 animate-in fade-in duration-700 relative ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#03e115] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Header / Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#03e115]/10 flex items-center justify-center text-[#03e115]">
                        <BarChart3 size={20} />
                    </div>
                    <h2 className="text-2xl font-black text-white">التحليلات المتقدمة</h2>
                </div>

                <div className="flex items-center gap-2 bg-[#0f0f12] p-1.5 rounded-2xl border border-white/5">
                    {[
                        { label: 'آخر 7 أيام', days: 7 },
                        { label: 'آخر 30 يوم', days: 30 },
                    ].map((period) => (
                        <button
                            key={period.days}
                            onClick={() => {
                                const end = new Date();
                                const start = new Date(Date.now() - period.days * 24 * 60 * 60 * 1000);
                                onDateChange(start.toISOString(), end.toISOString());
                            }}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {period.label}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-white/10 mx-2" />
                    <input
                        type="date"
                        onChange={(e) => {
                            if (e.target.value) {
                                const start = new Date(e.target.value);
                                const end = new Date(start);
                                end.setHours(23, 59, 59);
                                onDateChange(start.toISOString(), end.toISOString());
                            }
                        }}
                        className="bg-transparent text-[10px] font-black text-gray-400 focus:outline-none cursor-pointer uppercase"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Trend Chart Card */}
                <div className="lg:col-span-8 bg-[#0f0f12] border border-white/5 rounded-[40px] p-8 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">إجمالي التبرعات</p>
                            <h3 className="text-xl font-black text-white">التوجه الزمني</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setTrendType('area')}
                                className={`p-2 rounded-lg transition-all ${trendType === 'area' ? 'bg-[#03e115] text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <TrendingUp size={16} />
                            </button>
                            <button
                                onClick={() => setTrendType('bar')}
                                className={`p-2 rounded-lg transition-all ${trendType === 'bar' ? 'bg-[#03e115] text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <BarChart3 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="h-[220px] w-full mt-4 flex items-end">
                        {trendConfig ? (
                            <svg viewBox={`0 0 ${trendConfig.width} ${trendConfig.height}`} className="w-full h-full">
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#03e115" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#03e115" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {trendType === 'area' ? (
                                    <>
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                            d={trendConfig.pathData}
                                            fill="none"
                                            stroke="#03e115"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <motion.path
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            d={trendConfig.areaData}
                                            fill="url(#areaGradient)"
                                        />
                                        {/* Numerical Labels for Area Chart */}
                                        <g>
                                            {trendConfig.points.map((p, i) => (
                                                <motion.text
                                                    key={`label-area-${i}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1 + i * 0.05 }}
                                                    x={p.x}
                                                    y={p.y - 10}
                                                    textAnchor="middle"
                                                    fill="#03e115"
                                                    className="text-[10px] font-black font-mono"
                                                >
                                                    {p.value?.toLocaleString()}
                                                </motion.text>
                                            ))}
                                        </g>
                                    </>
                                ) : (
                                    <g>
                                        {trendConfig.points.map((p, i) => {
                                            const barWidth = 20;
                                            const barHeight = trendConfig.height - p.y - trendConfig.padding;
                                            return (
                                                <React.Fragment key={`bar-group-${i}`}>
                                                    <motion.rect
                                                        initial={{ height: 0, y: trendConfig.height }}
                                                        animate={{ height: barHeight, y: p.y }}
                                                        transition={{ delay: i * 0.05, duration: 0.5 }}
                                                        x={p.x - barWidth / 2}
                                                        width={barWidth}
                                                        rx="4"
                                                        fill="#03e115"
                                                        fillOpacity={0.4 + (i / trendConfig.points.length) * 0.6}
                                                    />
                                                    <motion.text
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.5 + i * 0.05 }}
                                                        x={p.x}
                                                        y={p.y - 8}
                                                        textAnchor="middle"
                                                        fill="#03e115"
                                                        className="text-[9px] font-black font-mono"
                                                    >
                                                        {p.value?.toLocaleString()}
                                                    </motion.text>
                                                </React.Fragment>
                                            );
                                        })}
                                    </g>
                                )}
                            </svg>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                لا توجد بيانات كافية للرسم البياني
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Tier Distribution Component */}
                <div className="lg:col-span-4 bg-[#0f0f12] border border-white/5 rounded-[40px] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">توزيع الفئات</p>
                            <h3 className="text-xl font-black text-white">عدد العمليات</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setDistType('bars')}
                                className={`p-2 rounded-lg transition-all ${distType === 'bars' ? 'bg-[#03e115] text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <BarChart3 size={16} />
                            </button>
                            <button
                                onClick={() => setDistType('pie')}
                                className={`p-2 rounded-lg transition-all ${distType === 'pie' ? 'bg-[#03e115] text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="relative min-h-[220px] flex items-center justify-center">
                        {distType === 'bars' ? (
                            <div className="space-y-6 w-full">
                                {['basic', 'medium', 'professional', 'cinematic', 'legendary'].map((tier) => {
                                    const item = data.distribution.find(d => d.tier === tier);
                                    const count = item?.count || 0;
                                    const maxCount = Math.max(...data.distribution.map(d => d.count), 1);
                                    const percentage = (count / maxCount) * 100;

                                    return (
                                        <div key={tier} className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-black">
                                                <span className="text-gray-400 capitalize">{tier}</span>
                                                <span className="text-white">{count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: TIER_COLORS[tier] }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="relative w-48 h-48">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(3,225,21,0.1)]">
                                    <defs>
                                        {['basic', 'medium', 'professional', 'cinematic', 'legendary'].map(tier => (
                                            <radialGradient key={`grad-${tier}`} id={`grad-${tier}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                <stop offset="0%" stopColor={TIER_COLORS[tier]} stopOpacity="0.8" />
                                                <stop offset="100%" stopColor={TIER_COLORS[tier]} stopOpacity="1" />
                                            </radialGradient>
                                        ))}
                                    </defs>
                                    {pieData.filter(s => s.percentage > 0).map((slice, i) => {
                                        const x1 = 50 + 40 * Math.cos(slice.startAngle);
                                        const y1 = 50 + 40 * Math.sin(slice.startAngle);
                                        const x2 = 50 + 40 * Math.cos(slice.endAngle);
                                        const y2 = 50 + 40 * Math.sin(slice.endAngle);

                                        const largeArc = slice.percentage > 0.5 ? 1 : 0;
                                        const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                                        // Label position (mid-angle)
                                        const midAngle = (slice.startAngle + slice.endAngle) / 2;
                                        const lx = 50 + 30 * Math.cos(midAngle);
                                        const ly = 50 + 30 * Math.sin(midAngle);

                                        return (
                                            <g key={slice.tier}>
                                                <motion.path
                                                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 100,
                                                        damping: 10,
                                                        delay: i * 0.1
                                                    }}
                                                    d={d}
                                                    fill={`url(#grad-${slice.tier})`}
                                                    className="hover:brightness-110 transition-all cursor-pointer"
                                                    stroke="#0f0f12"
                                                    strokeWidth="1.5"
                                                />
                                                {slice.percentage > 0.05 && (
                                                    <motion.text
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.5 + i * 0.1 }}
                                                        x={lx}
                                                        y={ly}
                                                        textAnchor="middle"
                                                        fill="white"
                                                        className="text-[5px] font-black pointer-events-none drop-shadow-md rotate-90"
                                                    >
                                                        {slice.count}
                                                    </motion.text>
                                                )}
                                            </g>
                                        );
                                    })}
                                    <circle cx="50" cy="50" r="22" fill="#0f0f12" className="shadow-inner" />
                                    <circle cx="50" cy="50" r="20" fill="#0a0a0a" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-gray-500 uppercase">الإجمالي</span>
                                    <span className="text-xl font-black text-white">
                                        {data.distribution.reduce((acc, d) => acc + d.count, 0)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSection;
