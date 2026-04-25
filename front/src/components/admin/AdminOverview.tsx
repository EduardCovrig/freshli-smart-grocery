import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, PackageOpen, AlertTriangle, Activity, CalendarDays, Users, ArrowRight, Zap, ShoppingBag } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminOverviewProps {
    user: any;
    stats: { totalOrders: number; totalRevenue: number; expiringProducts: number };
    timeRange: 'week' | 'month' | 'year';
    setTimeRange: (range: 'week' | 'month' | 'year') => void;
    chartData: any[];
    chartTitle: string;
    setActiveTab: (tab: any) => void;
}

export default function AdminOverview({ user, stats, timeRange, setTimeRange, chartData, chartTitle, setActiveTab }: AdminOverviewProps) {
    
    // Calculam Average Order Value (AOV)
    const aov = stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : "0.00";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full w-full max-w-7xl mx-auto space-y-6 pb-10">
            
            {/* HERO WELCOME BANNER */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0a2747] via-[#0f3d7d] to-[#134c9c] rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10 border border-blue-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-cyan-400/20 rounded-full blur-[50px] pointer-events-none"></div>
                <div className="absolute bottom-[-50%] left-[-10%] w-[200px] h-[200px] bg-blue-400/30 rounded-full blur-[40px] pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
                        Welcome back, <span className="text-cyan-300">{user?.firstName}</span>! 👋
                    </h1>
                    <p className="text-blue-100/90 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                        Here is your Freshli command center. Monitor sales, track customer retention, and manage expiring inventory all in one place.
                    </p>
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-inner flex shrink-0">
                    {['week', 'month', 'year'].map((range) => (
                        <button 
                            key={range}
                            onClick={() => setTimeRange(range as any)} 
                            className={`px-5 py-2 text-xs font-black rounded-full transition-all duration-300 uppercase tracking-widest ${timeRange === range ? 'bg-white text-[#134c9c] shadow-sm' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}
                        >
                            {range === 'week' ? '7 Days' : range === 'month' ? '4 Weeks' : '1 Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* BENTO GRID: 4 KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Revenue */}
                <Card onClick={() => setActiveTab('revenue')} className="border border-gray-100 shadow-sm rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group bg-white">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Gross Revenue</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter truncate group-hover:text-green-600 transition-colors">
                                {stats.totalRevenue.toFixed(2)} <span className="text-sm text-gray-400 uppercase">Lei</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Orders */}
                <Card onClick={() => setActiveTab('ordersList')} className="border border-gray-100 shadow-sm rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group bg-white">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#134c9c] flex items-center justify-center group-hover:bg-[#134c9c] group-hover:text-white transition-colors">
                                <PackageOpen size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Orders</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter truncate group-hover:text-[#134c9c] transition-colors">
                                {stats.totalOrders} <span className="text-sm text-gray-400 uppercase tracking-widest">Carts</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. AOV (Nou adaugat pt context de business) */}
                <Card className="border border-gray-100 shadow-sm rounded-3xl bg-white relative overflow-hidden">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <ShoppingBag size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Avg. Order Value</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter truncate">
                                {aov} <span className="text-sm text-gray-400 uppercase">Lei</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Clearance Alert */}
                <Card onClick={() => setActiveTab('expiring')} className="border border-orange-100 shadow-sm rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group bg-gradient-to-br from-orange-50 to-rose-50 relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[100px] h-[100px] bg-orange-400/20 rounded-full blur-[20px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                    <CardContent className="p-6 flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                                <AlertTriangle size={24} strokeWidth={2.5} />
                                {stats.expiringProducts > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-orange-800/70 uppercase tracking-widest mb-1">Needs Clearance</p>
                            <h3 className="text-3xl font-black text-orange-600 tracking-tighter truncate group-hover:text-orange-700 transition-colors">
                                {stats.expiringProducts} <span className="text-sm text-orange-600/60 uppercase">Items</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* LOWER GRID: Chart (2/3) + Quick Actions (1/3) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* CHART AREA */}
                <Card className="xl:col-span-2 border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <Activity size={24} className="text-[#134c9c]" /> {chartTitle}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium flex items-center gap-1.5">
                                    <CalendarDays size={14}/> Visualizing successful transactions over time.
                                </p>
                            </div>
                            <div className="bg-blue-50 px-4 py-2 rounded-xl text-[#134c9c] text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm inline-flex w-max">
                                Live Analytics
                            </div>
                        </div>
                        
                        <div style={{ width: '100%', height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#134c9c" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#134c9c" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} dy={15} />
                                    <YAxis stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-10} />
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                    <Tooltip 
                                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{ borderRadius: '1.25rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '12px 16px' }} 
                                        itemStyle={{ color: '#134c9c', fontSize: '16px', fontWeight: '900' }}
                                        labelStyle={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#134c9c" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 8, strokeWidth: 4, fill: '#fff', stroke: '#134c9c' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* QUICK ACTIONS / AI INSIGHTS */}
                <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                    <div className="p-6 sm:p-8 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <Zap size={24} className="text-amber-500" />
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Quick Actions</h3>
                    </div>
                    
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
                        <button onClick={() => setActiveTab('churn')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={16} className="text-indigo-600" />
                                    <span className="font-bold text-gray-900">Run AI Churn Analysis</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">Predict which users might leave the platform.</p>
                            </div>
                            <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button onClick={() => setActiveTab('expiring')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all group text-left">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle size={16} className="text-orange-500" />
                                    <span className="font-bold text-gray-900">Manage Clearance</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">{stats.expiringProducts > 0 ? `You have ${stats.expiringProducts} items needing action.` : "All stock is fresh."}</p>
                            </div>
                            <ArrowRight size={18} className="text-gray-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button onClick={() => setActiveTab('ordersList')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group text-left">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <PackageOpen size={16} className="text-[#134c9c]" />
                                    <span className="font-bold text-gray-900">Process Orders</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">Update shipping statuses for recent sales.</p>
                            </div>
                            <ArrowRight size={18} className="text-gray-300 group-hover:text-[#134c9c] group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </Card>

            </div>
        </div>
    );
}