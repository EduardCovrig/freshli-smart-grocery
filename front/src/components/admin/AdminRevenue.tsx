import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CalendarDays, ArrowDownLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRevenueProps {
    allOrders: any[];
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
}

export default function AdminRevenue({ allOrders, formatDate, getStatusColor }: AdminRevenueProps) {
    const [revenueFilter, setRevenueFilter] = useState<'today' | 'month' | 'year' | 'all'>('all');
    const [revenuePage, setRevenuePage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredRevenueOrders = allOrders.filter(o => {
        if (o.status === "CANCELLED") return false;
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        if (revenueFilter === 'today') return orderDate.toDateString() === now.toDateString();
        if (revenueFilter === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        if (revenueFilter === 'year') return orderDate.getFullYear() === now.getFullYear();
        return true;
    });

    const calculatedRevenue = filteredRevenueOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const paginatedRevenueOrders = filteredRevenueOrders.slice((revenuePage - 1) * ITEMS_PER_PAGE, revenuePage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredRevenueOrders.length / ITEMS_PER_PAGE) || 1;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3 tracking-tight">
                    <Wallet size={32} className="text-[#134c9c]" /> Revenue Analytics
                </h1>
                <p className="text-gray-500 text-base sm:text-lg">Calculate and track your real earnings based on actual orders.</p>
            </div>

            <div className="space-y-8">
                <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 via-[#134c9c] to-blue-900 text-white rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
                    
                    <CardContent className="p-8 sm:p-12 relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                        <div className="text-center lg:text-left">
                            <p className="text-blue-200 font-bold uppercase tracking-widest text-sm mb-3 flex items-center justify-center lg:justify-start gap-2">
                                <Wallet size={18} /> Total Net Earnings
                            </p>
                            <div className="text-5xl sm:text-6xl font-black tracking-tighter mb-3 drop-shadow-md">
                                {calculatedRevenue.toFixed(2)} <span className="text-2xl text-blue-200 uppercase tracking-widest ml-1 font-bold">Lei</span>
                            </div>
                            <p className="text-blue-100/80 text-sm font-medium">Generated from <strong className="text-white">{filteredRevenueOrders.length}</strong> successful transactions.</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-inner gap-1">
                            {['today', 'month', 'year', 'all'].map((filter) => (
                                <button key={filter} onClick={() => { setRevenueFilter(filter as any); setRevenuePage(1); }} className={`px-4 sm:px-6 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${revenueFilter === filter ? 'bg-white text-[#134c9c] shadow-md' : 'text-blue-100 hover:bg-white/10'}`}>
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-6 sm:px-8 border-b border-gray-50">
                        <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3">
                            <CalendarDays size={22} className="text-[#134c9c]" />
                            Transactions Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="p-5 font-bold pl-8">Transaction</th>
                                        <th className="p-5 font-bold">Date & Time</th>
                                        <th className="p-5 font-bold">Status</th>
                                        <th className="p-5 font-bold text-right pr-8">Net Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedRevenueOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="p-5 pl-8 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                    <ArrowDownLeft size={18} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900">Order #{order.id}</p>
                                                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm text-gray-600 font-medium">{formatDate(order.createdAt)}</td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-5 font-black text-green-600 text-right pr-8 text-lg">
                                                +{order.totalPrice.toFixed(2)} <span className="text-xs">LEI</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredRevenueOrders.length === 0 && (
                                <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                    <SearchX size={48} className="text-gray-300 mb-4" />
                                    <p className="font-bold text-lg text-gray-900 mb-1">No transactions found</p>
                                    <p className="text-sm">There are no successful orders for the selected period.</p>
                                </div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                                    Showing {(revenuePage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(revenuePage * ITEMS_PER_PAGE, filteredRevenueOrders.length)} of {filteredRevenueOrders.length}
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={revenuePage === 1} onClick={() => setRevenuePage(p => p - 1)} className="h-9 rounded-xl font-bold border-gray-200">Previous</Button>
                                    <Button variant="outline" size="sm" disabled={revenuePage === totalPages} onClick={() => setRevenuePage(p => p + 1)} className="h-9 rounded-xl font-bold border-gray-200">Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}