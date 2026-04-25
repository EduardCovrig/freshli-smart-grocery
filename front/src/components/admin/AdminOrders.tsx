import { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SearchX, Loader2, Save, ArrowDownLeft, TrendingUp, Wallet } from "lucide-react";

interface AdminOrdersProps {
    allOrders: any[];
    setAllOrders: (orders: any[]) => void;
    token: string | null;
    addAdminLog: (msg: string, type: any) => void;
    setToast: (toast: any) => void;
    setSelectedOrderDetails: (order: any) => void;
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
}

export default function AdminOrders({ allOrders, setAllOrders, token, addAdminLog, setToast, setSelectedOrderDetails, formatDate, getStatusColor }: AdminOrdersProps) {
    const [orderSearchTerm, setOrderSearchTerm] = useState("");
    const [ordersPage, setOrdersPage] = useState(1);
    const [revenueFilter, setRevenueFilter] = useState<'today' | 'month' | 'year' | 'all'>('all');
    
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
    const ITEMS_PER_PAGE = 10;

    // 1. Filtram mai intai dupa TIMP (afecteaza si bannerul si tabelul)
    const timeFilteredOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        if (revenueFilter === 'today') return orderDate.toDateString() === now.toDateString();
        if (revenueFilter === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        if (revenueFilter === 'year') return orderDate.getFullYear() === now.getFullYear();
        return true;
    });

    // 2. Calculam Revenue doar din comenzile neanulate din perioada selectata
    const calculatedRevenue = timeFilteredOrders
        .filter(o => o.status !== "CANCELLED")
        .reduce((sum, order) => sum + order.totalPrice, 0);

    // 3. Filtram in continuare pentru SEARCH BAR in tabel
    const fullyFilteredOrders = timeFilteredOrders.filter(o => 
        o.id.toString().includes(orderSearchTerm.trim())
    );

    const paginatedOrders = fullyFilteredOrders.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(fullyFilteredOrders.length / ITEMS_PER_PAGE) || 1;

    const handleUpdateOrderStatus = async (orderId: number) => {
        const newStatus = statusDrafts[orderId];
        if (!newStatus) return;

        setUpdatingOrderId(orderId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await axios.put(`${apiUrl}/orders/${orderId}/status`, `"${newStatus}"`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            });

            addAdminLog(`Status for Order #${orderId} was updated to ${newStatus}.`, 'status');

            setAllOrders(allOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            const updatedDrafts = { ...statusDrafts };
            delete updatedDrafts[orderId];
            setStatusDrafts(updatedDrafts);
            
            const targetOrder = allOrders.find(o => o.id === orderId);
            const storageKey = targetOrder?.userEmail ? `userNotifs_${targetOrder.userEmail}` : 'userNotifs';

            const newNotif = {
                id: Date.now(), orderId: orderId, message: `Your order #${orderId} status has been updated to: ${newStatus}.`, date: new Date().toISOString(), read: false
            };
            const existingNotifs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([newNotif, ...existingNotifs]));
            window.dispatchEvent(new Event('new_notification'));

            setToast({ show: true, message: `Status for Order #${orderId} updated successfully!`, type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        } catch (err) {
            setToast({ show: true, message: "Failed to update order status.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3 tracking-tight">
                        <TrendingUp size={32} className="text-[#134c9c]" /> Revenue & Orders
                    </h1>
                    <p className="text-gray-500 text-base">Track your earnings and manage customer orders.</p>
                </div>
                <div className="relative w-full md:w-80 shrink-0">
                    <Input type="text" placeholder="Search by Order ID..." value={orderSearchTerm} onChange={(e) => { setOrderSearchTerm(e.target.value); setOrdersPage(1); }} className="pl-10 h-12 bg-white rounded-xl border-gray-200 shadow-sm" />
                    <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
            </div>

            {/* BANNER REVENUE */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 via-[#134c9c] to-blue-900 text-white rounded-[2.5rem] overflow-hidden relative mb-8">
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
                        <p className="text-blue-100/80 text-sm font-medium">Generated from <strong className="text-white">{timeFilteredOrders.filter(o => o.status !== "CANCELLED").length}</strong> successful transactions.</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-inner gap-1">
                        {['today', 'month', 'year', 'all'].map((filter) => (
                            <button key={filter} onClick={() => { setRevenueFilter(filter as any); setOrdersPage(1); }} className={`px-4 sm:px-6 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${revenueFilter === filter ? 'bg-white text-[#134c9c] shadow-md' : 'text-blue-100 hover:bg-white/10'}`}>
                                {filter}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* TABEL COMENZI */}
            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-bold pl-8">Order ID</th>
                                    <th className="p-5 font-bold">Date Placed</th>
                                    <th className="p-5 font-bold text-center">Status</th>
                                    <th className="p-5 font-bold text-right pr-8">Net Amount</th>
                                    <th className="p-5 font-bold text-center pr-6">Update Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedOrders.map((order) => {
                                    const draftStatus = statusDrafts[order.id] || order.status;
                                    const hasChanged = draftStatus !== order.status;

                                    return (
                                        <tr key={order.id} onClick={() => setSelectedOrderDetails(order)} className="group hover:bg-blue-50/40 transition-colors cursor-pointer border-b border-gray-50">
                                            
                                            {/* Order ID cu Iconita Verde (de pe fosta pagina Revenue) */}
                                            <td className="p-5 pl-8 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                    <ArrowDownLeft size={18} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-lg">#{order.id}</p>
                                                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                                                </div>
                                            </td>

                                            <td className="p-5 text-sm text-gray-600 font-medium">{formatDate(order.createdAt)}</td>
                                            
                                            <td className="p-5 text-center"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                            
                                            {/* Pretul cu + Verde (de pe fosta pagina Revenue) */}
                                            <td className="p-5 font-black text-green-600 text-right pr-8 text-xl">
                                                +{order.totalPrice.toFixed(2)} <span className="text-xs">LEI</span>
                                            </td>

                                            <td className="p-5 w-[280px] pr-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-2 justify-end">
                                                    <Select value={draftStatus} onValueChange={(val) => setStatusDrafts({ ...statusDrafts, [order.id]: val })}>
                                                        <SelectTrigger className="w-full bg-white border-gray-200 h-10 text-xs font-bold shadow-sm rounded-xl"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="z-[100] rounded-xl">
                                                            <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                                                            <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                                            <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                                                            <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {hasChanged && (
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-10 shadow-md rounded-xl px-3" onClick={() => handleUpdateOrderStatus(order.id)} disabled={updatingOrderId === order.id}>
                                                            {updatingOrderId === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {fullyFilteredOrders.length === 0 && (
                            <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                <SearchX size={48} className="text-gray-300 mb-4" />
                                <p className="font-bold text-lg text-gray-900 mb-1">No orders found</p>
                                <p className="text-sm">There are no orders matching your criteria.</p>
                            </div>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                                Showing {(ordersPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(ordersPage * ITEMS_PER_PAGE, fullyFilteredOrders.length)} of {fullyFilteredOrders.length}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={ordersPage === 1} onClick={() => setOrdersPage(p => p - 1)} className="h-9 rounded-xl font-bold border-gray-200">Previous</Button>
                                <Button variant="outline" size="sm" disabled={ordersPage === totalPages} onClick={() => setOrdersPage(p => p + 1)} className="h-9 rounded-xl font-bold border-gray-200">Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}