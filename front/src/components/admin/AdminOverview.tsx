import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, PackageOpen, AlertTriangle, Activity, Users, ArrowRight, Zap, ShoppingBag, Box, Tag, TrendingDown, Bell, ExternalLink } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminOverviewProps {
    user: any;
    stats: { totalOrders: number; totalRevenue: number; expiringProducts: number; aovTrend?: number };
    timeRange: 'week' | 'month' | 'year';
    setTimeRange: (range: 'week' | 'month' | 'year') => void;
    chartData: any[];
    chartTitle: string;
    setActiveTab: (tab: any) => void;
}

export default function AdminOverview({ user, stats, timeRange, setTimeRange, chartData, chartTitle, setActiveTab }: AdminOverviewProps) {
    
    const aov = stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : "0.00";
    const isAovPositive = (stats.aovTrend || 0) >= 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full w-full max-w-7xl mx-auto space-y-6 pb-10">
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0a2747] via-[#0f3d7d] to-[#134c9c] rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10 border border-blue-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
     
                <div className="absolute top-[-30%] right-[-5%] w-[250px] h-[250px] bg-cyan-400/20 rounded-full blur-[40px] pointer-events-none animate-blob z-0"></div>
                <div className="absolute bottom-[-30%] left-[10%] w-[200px] h-[200px] bg-blue-400/30 rounded-full blur-[40px] pointer-events-none animate-blob z-0" style={{ animationDelay: "2s" }}></div>
                <div className="absolute top-[10%] left-[40%] w-[180px] h-[180px] bg-emerald-400/15 rounded-full blur-[30px] pointer-events-none animate-blob z-0" style={{ animationDelay: "4s" }}></div>
                
                <div className="relative z-10 flex flex-col items-start">
                    <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
                        Welcome back, <span className="text-cyan-300">{user?.firstName}</span>! 👋
                    </h1>
                    <p className="text-blue-100/90 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                        Here is your Freshli command center. Monitor sales, track customer retention, and manage expiring inventory all in one place.
                    </p>
                    
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className="mt-6 inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 hover:pr-4 group/btn shadow-sm"
                    >
                        <Bell size={16} className="text-cyan-300 group-hover/btn:animate-pulse" />
                        <span>See what's new in Activity Hub</span>
                        <ArrowRight size={16} className="opacity-0 -ml-5 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300 text-cyan-300" />
                    </button>
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-inner flex shrink-0 self-start md:self-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Net Revenue */}
                <Card className="border border-gray-100 shadow-sm rounded-[2rem] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-100 group">
                    <CardContent className="p-6 sm:p-8 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100/50 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-green-600 transition-colors">Net Revenue</p>
                            <h3 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter truncate group-hover:text-gray-800 transition-colors">
                                {stats.totalRevenue.toFixed(2)} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Lei</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="border border-gray-100 shadow-sm rounded-[2rem] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-100 group">
                    <CardContent className="p-6 sm:p-8 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#134c9c] flex items-center justify-center border border-blue-100/50 group-hover:bg-[#134c9c] group-hover:text-white transition-colors duration-300">
                                <PackageOpen size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#134c9c] transition-colors">Total Orders</p>
                            <h3 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter truncate group-hover:text-gray-800 transition-colors">
                                {stats.totalOrders} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Carts</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Order Value */}
                <Card className="border border-gray-100 shadow-sm rounded-[2rem] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-100 group">
                    <CardContent className="p-6 sm:p-8 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                <ShoppingBag size={24} strokeWidth={2.5} />
                            </div>
                            {stats.aovTrend !== undefined && (
                                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black shadow-sm border ${isAovPositive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {isAovPositive ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
                                    {Math.abs(stats.aovTrend)}%
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Avg. Order Value</p>
                            <h3 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter truncate group-hover:text-gray-800 transition-colors">
                                {aov} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Lei</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                
                {/* CHART AREA (2/3) */}
                <Card className="xl:col-span-2 border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full">
                    <div className="p-6 sm:p-8 sm:pb-6 flex-1 flex flex-col">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-50 pb-6">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <Activity size={24} className="text-[#134c9c]" /> {chartTitle}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Sales velocity and revenue growth over time.</p>
                            </div>
                            
                            <button 
                                onClick={() => setActiveTab('ordersList')}
                                className="flex items-center gap-2 bg-gray-50 hover:bg-[#134c9c] hover:text-white text-gray-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm border border-gray-200 hover:border-[#134c9c] group"
                            >
                                View Full Report <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-200 transition-colors"/>
                            </button>
                        </div>
                        
                        {/* GRAFICUL */}
                        <div style={{ width: '100%', height: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#134c9c" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#134c9c" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94a3b8" 
                                        fontSize={12} 
                                        fontWeight={600} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        dy={10} 
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        fontSize={12} 
                                        fontWeight={600} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `${value}`} 
                                        dx={-10} 
                                    />
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip 
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{ borderRadius: '1.25rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '12px 16px' }} 
                                        itemStyle={{ color: '#134c9c', fontSize: '16px', fontWeight: '900' }}
                                        labelStyle={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                                    />
                                    {/* type="monotone" in loc de "natural" previne curbele care pica sub Y=0 in chart-urile Recharts */}
                                    <Area type="monotone" dataKey="sales" stroke="#134c9c" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 3, fill: '#fff', stroke: '#134c9c' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* COLANA DREAPTA (1/3): ACTIONS & ALERTS */}
                <div className="xl:col-span-1 flex flex-col gap-6 h-full">

                    {/* WIDGET ALERT: CLEARANCE */}
                    {stats.expiringProducts > 0 && (
                        <div 
                            onClick={() => setActiveTab('expiring')}
                            className="bg-gradient-to-br from-orange-50 to-rose-50 p-6 sm:p-8 rounded-[2rem] border border-orange-100/60 shadow-sm flex items-center justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden"
                        >
                            <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] bg-orange-500/10 rounded-full blur-[20px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100/50 shrink-0">
                                    <AlertTriangle size={24} strokeWidth={2.5} />
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm"></span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-orange-800/70 uppercase tracking-widest mb-0.5">Inventory Alert</p>
                                    <h4 className="text-2xl font-black text-orange-600 tracking-tight group-hover:text-orange-700 transition-colors">
                                        {stats.expiringProducts} <span className="text-[10px] text-orange-600/60 uppercase font-bold tracking-widest">batches expiring soon...</span>
                                    </h4>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white text-orange-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0 shadow-sm relative z-10 shrink-0">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    )}

                    {/* WIDGET: QUICK ACTIONS */}
                    <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden flex flex-col flex-1">
                        <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                            <Zap size={22} className="text-amber-500" />
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Quick Actions</h3>
                        </div>
                        
                        <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-center">
                            
                            {/* Actiunea 1 */}
                            <button onClick={() => setActiveTab('churn')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left shadow-sm hover:shadow-md">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <Users size={18} className="text-indigo-600" />
                                        <span className="font-bold text-gray-900 text-sm">Run AI Churn Analysis</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Predict which users might leave the platform.</p>
                                </div>
                                <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Actiunea 2 */}
                            <button onClick={() => setActiveTab('products')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group text-left shadow-sm hover:shadow-md">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <Box size={18} className="text-[#134c9c]" />
                                        <span className="font-bold text-gray-900 text-sm">Manage Products</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Add new items or update batches.</p>
                                </div>
                                <ArrowRight size={18} className="text-gray-300 group-hover:text-[#134c9c] group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Actiunea 3 */}
                            <button onClick={() => setActiveTab('discounts')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all group text-left shadow-sm hover:shadow-md">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <Tag size={18} className="text-amber-600" />
                                        <span className="font-bold text-gray-900 text-sm">Add Discount</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Create promotions for any products.</p>
                                </div>
                                <ArrowRight size={18} className="text-gray-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                            </button>
                            
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}