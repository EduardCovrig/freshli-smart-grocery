import { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Search, SearchX, Loader2, Save } from "lucide-react";

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
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
    const ITEMS_PER_PAGE = 10;

    const filteredOrders = allOrders.filter(o => o.id.toString().includes(orderSearchTerm.trim()));
    const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;

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
                        <ShoppingCart size={32} className="text-[#134c9c]" /> Store Orders
                    </h1>
                    <p className="text-gray-500 text-base">View and update the status of all customer orders.</p>
                </div>
                <div className="relative w-full md:w-80 shrink-0">
                    <Input type="text" placeholder="Search by Order ID..." value={orderSearchTerm} onChange={(e) => { setOrderSearchTerm(e.target.value); setOrdersPage(1); }} className="pl-10 h-12 bg-white rounded-xl border-gray-200 shadow-sm" />
                    <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-bold pl-6">Order ID</th>
                                    <th className="p-5 font-bold">Date Placed</th>
                                    <th className="p-5 font-bold">Items</th>
                                    <th className="p-5 font-bold">Total</th>
                                    <th className="p-5 font-bold">Current Status</th>
                                    <th className="p-5 font-bold text-center pr-6">Update Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedOrders.map((order) => {
                                    const draftStatus = statusDrafts[order.id] || order.status;
                                    const hasChanged = draftStatus !== order.status;

                                    return (
                                        <tr key={order.id} onClick={() => setSelectedOrderDetails(order)} className="group hover:bg-blue-50/40 transition-colors cursor-pointer border-b border-gray-50">
                                            <td className="p-5 pl-6 font-black text-gray-900 text-lg">#{order.id}</td>
                                            <td className="p-5 text-sm text-gray-600 font-medium">{formatDate(order.createdAt)}</td>
                                            <td className="p-5 text-sm text-gray-600">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-lg text-xs">{order.items.length} items</div>
                                                    <span className="text-[10px] text-[#134c9c] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View details &rarr;</span>
                                                </div>
                                            </td>
                                            <td className="p-5 font-black text-[#134c9c] text-lg">{order.totalPrice.toFixed(2)} Lei</td>
                                            <td className="p-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)}`}>{order.status}</span></td>
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
                        {filteredOrders.length === 0 && (
                            <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                                <SearchX size={48} className="text-gray-300 mb-4" />
                                <p className="font-bold text-lg text-gray-900 mb-1">No orders found</p>
                            </div>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-[2rem]">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                                Showing {(ordersPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(ordersPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
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