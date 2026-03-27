import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, PackageOpen, AlertTriangle } from "lucide-react";
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
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full w-full max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1 tracking-tight">Overview</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Welcome back, <strong className="text-[#134c9c]">{user?.firstName}</strong>. Here's a summary of your business.</p>
                </div>
                
                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm shrink-0 overflow-x-auto w-full lg:w-auto">
                    <button onClick={() => setTimeRange('week')} className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${timeRange === 'week' ? 'bg-[#134c9c] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>7 Days</button>
                    <button onClick={() => setTimeRange('month')} className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${timeRange === 'month' ? 'bg-[#134c9c] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>4 Weeks</button>
                    <button onClick={() => setTimeRange('year')} className={`flex-1 lg:flex-none px-4 sm:px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${timeRange === 'year' ? 'bg-[#134c9c] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>1 Year</button>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2rem] flex flex-col w-full bg-white overflow-hidden flex-1 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 divide-y sm:divide-y-0 xl:divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/30">
                    <div onClick={() => setActiveTab('revenue')} className="p-5 sm:p-6 lg:p-8 cursor-pointer hover:bg-blue-50/50 transition-colors group border-r border-gray-100 xl:border-r-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gross Revenue</p>
                        </div>
                        <div className="flex items-baseline gap-1 overflow-hidden mt-4">
                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter group-hover:text-[#134c9c] transition-colors truncate">{stats.totalRevenue.toFixed(2)}</h3>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest shrink-0 ml-1">Lei</span>
                        </div>
                    </div>

                    <div onClick={() => setActiveTab('ordersList')} className="p-5 sm:p-6 lg:p-8 cursor-pointer hover:bg-blue-50/50 transition-colors group sm:border-r xl:border-r-0 border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-blue-100 text-[#134c9c] rounded-full flex items-center justify-center shrink-0">
                                <PackageOpen size={24} strokeWidth={2.5} />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">Total Orders</p>
                        </div>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter group-hover:text-[#134c9c] transition-colors truncate mt-4">{stats.totalOrders}</h3>
                    </div>

                    <div onClick={() => setActiveTab('expiring')} className="p-5 sm:p-6 lg:p-8 cursor-pointer hover:bg-orange-50/50 transition-colors group relative sm:col-span-2 xl:col-span-1 border-t sm:border-t-0 xl:border-t-0 border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                                <AlertTriangle size={24} strokeWidth={2.5} />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">Needs Action</p>
                            {stats.expiringProducts > 0 && (
                                <span className="absolute top-6 lg:top-8 right-6 lg:right-8 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-sm">Clearance</span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2 overflow-hidden mt-4">
                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-600 tracking-tighter group-hover:text-orange-700 transition-colors truncate">{stats.expiringProducts}</h3>
                            <span className="text-sm font-bold text-gray-400 shrink-0 ml-1">items</span>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4 sm:p-6 lg:p-8 pt-8 flex-1">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{chartTitle}</h3>
                            <p className="text-sm text-gray-500 mt-1">Visualizing successful transactions.</p>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#134c9c" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#134c9c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-5} />
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                                    itemStyle={{ color: '#134c9c' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#134c9c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: '#134c9c' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}