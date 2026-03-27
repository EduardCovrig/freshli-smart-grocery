import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, AlertTriangle, Check, X, XCircle, Clock, ShoppingCart, LayoutDashboard, Edit2, Trash2, Plus, Tag, ChevronUp, ChevronDown, Loader2, CheckCircle2, PackageOpen} from "lucide-react";
import { Product } from "@/types";

interface AdminNotificationsProps {
    allOrders: any[];
    adminLogs: any[];
    setAdminLogs: (logs: any[]) => void;
    dismissedAlerts: string[];
    setDismissedAlerts: (alerts: string[]) => void;
    formatDate: (date: string) => string;
}

export default function AdminNotifications({ allOrders, adminLogs, setAdminLogs, dismissedAlerts, setDismissedAlerts, formatDate }: AdminNotificationsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [showPastNotifs, setShowPastNotifs] = useState(false);
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);

    useEffect(() => {
        const fetchProductsList = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const res = await axios.get(`${apiUrl}/products`);
                setProducts(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProductsList();
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredAlerts = products
        .filter(p => p.expirationDate && new Date(p.expirationDate) < today)
        .map(p => ({
            id: `exp-dead-${p.id}-${p.expirationDate}`, type: 'expired_complete', date: new Date(p.expirationDate!), item: p as any
        }));

    const clearanceAlerts = products
        .filter(p => (p.nearExpiryQuantity || 0) > 0 && p.expirationDate && new Date(p.expirationDate) >= today)
        .map(p => ({
            id: `clearance-${p.id}-${p.expirationDate}`, type: 'clearance_entered', date: new Date(), item: p as any
        }));

    const newOrderAlerts = allOrders
        .filter(o => o.status === 'CONFIRMED')
        .map(o => ({
            id: `ord-${o.id}`, type: 'order', date: new Date(o.createdAt), item: o as any
        }));

    const allSystemAlerts = [...expiredAlerts, ...clearanceAlerts, ...newOrderAlerts].sort((a, b) => b.date.getTime() - a.date.getTime());
    const newNotifs = allSystemAlerts.filter(a => !dismissedAlerts.includes(a.id));
    const pastNotifs = allSystemAlerts.filter(a => dismissedAlerts.includes(a.id));

    const handleDismissAlert = (alertId: string) => {
        const updated = [...dismissedAlerts, alertId];
        setDismissedAlerts(updated);
        localStorage.setItem("dismissedSystemAlerts", JSON.stringify(updated));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3 tracking-tight">
                        <Bell size={32} className="text-[#134c9c]" /> Activity Hub
                    </h1>
                    <p className="text-gray-500 text-base">Monitor system alerts, product expirations, and your admin action history.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* COLOANA 1: SYSTEM ALERTS */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <AlertTriangle size={24} className="text-orange-500" /> System Alerts
                        </h2>
                        {pastNotifs.length > 0 && (
                            <button onClick={() => setShowPastNotifs(!showPastNotifs)} className="text-sm font-bold text-[#134c9c] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-[#134c9c] hover:text-white transition-colors">
                                {showPastNotifs ? "Hide Read Alerts" : `View Read (${pastNotifs.length})`}
                            </button>
                        )}
                    </div>

                    {isLoadingProducts ? (
                        <div className="flex justify-center p-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm"><Loader2 className="animate-spin text-[#134c9c]" size={40} /></div>
                    ) : (
                        <div className="space-y-4">
                            {newNotifs.length === 0 && !showPastNotifs && (
                                <Card className="border border-gray-100 shadow-sm text-center p-12 bg-white rounded-[2.5rem]">
                                    <CardContent className="flex flex-col items-center justify-center m-0 p-0">
                                        <div className="bg-green-50 p-5 rounded-full mb-4"><Check size={40} className="text-green-500" strokeWidth={3} /></div>
                                        <p className="text-gray-900 font-black text-2xl tracking-tight">All Clear!</p>
                                        <p className="text-gray-500 text-base mt-2">No unread system alerts.</p>
                                    </CardContent>
                                </Card>
                            )}

                            {newNotifs.map(alert => (
                                <Card key={alert.id} className={`relative border-none shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-r ${alert.type === 'expiration' ? 'from-orange-50' : 'from-blue-50'} to-white rounded-[2rem] overflow-hidden group`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${alert.type === 'expiration' ? 'bg-orange-500' : 'bg-[#134c9c]'}`}></div>
                                    <button onClick={() => handleDismissAlert(alert.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100" title="Mark as read"><X size={16} strokeWidth={3} /></button>
                                    <CardContent className="p-6 sm:p-8 flex items-start gap-5 pl-8">
                                        {alert.type === 'expired_complete' && <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 shrink-0"><XCircle size={28} strokeWidth={2.5} /></div>}
                                        {alert.type === 'clearance_entered' && <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 shrink-0"><Clock size={28} strokeWidth={2.5} /></div>}
                                        {alert.type === 'order' && <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#134c9c] to-blue-400 text-white shadow-lg shadow-blue-500/30 shrink-0"><ShoppingCart size={28} strokeWidth={2.5} /></div>}
                                        <div className="pr-8 flex-1">
                                            {alert.type === 'expired_complete' && (
                                                <><h3 className="font-black text-gray-900 text-lg mb-2">Product Expired</h3><p className="text-gray-600 text-sm leading-relaxed"><strong className="text-gray-900 text-base">{alert.item.name}</strong> ({alert.item.brandName}) has passed its expiration date (<span className="text-red-600 font-bold">{alert.item.expirationDate}</span>). It will be automatically removed from stock.</p></>
                                            )}
                                            {alert.type === 'clearance_entered' && (
                                                <><h3 className="font-black text-gray-900 text-lg mb-2">Clearance Alert</h3><p className="text-gray-600 text-sm leading-relaxed"><strong className="text-gray-900 text-base">{alert.item.name}</strong> ({alert.item.brandName}) has <strong className="text-orange-600 bg-orange-100 px-1 rounded">{alert.item.nearExpiryQuantity} units</strong> expiring on <span className="text-orange-600 font-bold">{alert.item.expirationDate}</span>. They are now marked as Clearance.</p></>
                                            )}
                                            {alert.type === 'order' && (
                                                <><h3 className="font-black text-gray-900 text-lg mb-2">New Order Received</h3><p className="text-gray-600 text-sm leading-relaxed">Order <strong className="text-[#134c9c] text-base bg-blue-50 px-2 rounded py-0.5">#{alert.item.id}</strong> was placed for <strong className="text-[#134c9c] font-black">{alert.item.totalPrice.toFixed(2)} LEI</strong>. Please review and process it.</p></>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {showPastNotifs && pastNotifs.length > 0 && (
                                <div className="pt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    {pastNotifs.map(alert => (
                                        <Card key={`past-${alert.id}`} className="border border-gray-200 bg-gray-50/50 shadow-none opacity-80 rounded-[2rem] overflow-hidden relative">
                                            <CardContent className="p-6 flex items-start gap-5">
                                                <div className="bg-gray-200 p-3 rounded-xl text-gray-500 shrink-0"><CheckCircle2 size={24} /></div>
                                                <div>
                                                    <h3 className="font-bold text-gray-700 text-base mb-1">Alert Acknowledged</h3>
                                                    <p className="text-gray-500 text-sm leading-relaxed">
                                                        {alert.type === 'expired_complete' && <><strong className="text-gray-700">{alert.item.name}</strong> (Exp: {alert.item.expirationDate}) expiration was acknowledged.</>}
                                                        {alert.type === 'clearance_entered' && <><strong className="text-gray-700">{alert.item.name}</strong> clearance alert (Exp: {alert.item.expirationDate}) was acknowledged.</>}
                                                        {alert.type === 'order' && <>New order <strong className="text-gray-700">#{alert.item.id}</strong> has been acknowledged.</>}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* COLOANA 2: ADMIN ACTION LOGS */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2 border-b border-gray-200 pb-4">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <LayoutDashboard size={24} className="text-[#134c9c]" /> Action Logs
                        </h2>
                        {adminLogs.length > 0 && (
                            <button onClick={() => { setAdminLogs([]); localStorage.removeItem("adminActionLogs"); }} className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors">
                                <Trash2 size={16} /> Clear Logs
                            </button>
                        )}
                    </div>

                    {adminLogs.length === 0 ? (
                        <Card className="border border-gray-100 shadow-sm text-center p-12 bg-white rounded-[2.5rem]">
                            <CardContent className="flex flex-col items-center justify-center m-0 p-0">
                                <div className="bg-gray-50 p-5 rounded-full mb-4"><LayoutDashboard size={40} className="text-gray-300" /></div>
                                <p className="text-gray-900 font-black text-xl tracking-tight">No actions recorded.</p>
                                <p className="text-gray-500 text-base mt-2">Changes made to products or orders will appear here.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {adminLogs.slice(0, isLogsExpanded ? adminLogs.length : 6).map(log => (
                                <Card key={log.id} className="border border-gray-100 shadow-sm bg-white rounded-[2rem] overflow-hidden relative hover:shadow-md transition-shadow">
                                    <div className="w-2 h-full bg-[#134c9c] absolute left-0 top-0"></div>
                                    <CardContent className="p-5 sm:p-6 flex items-start gap-5 pl-6">
                                        <div className="bg-blue-50 p-3 rounded-xl text-[#134c9c] shrink-0">
                                            {log.type === 'status' && <PackageOpen size={20} />}
                                            {log.type === 'price' && <Edit2 size={20} />}
                                            {log.type === 'delete' && <Trash2 size={20} />}
                                            {log.type === 'clearance' && <Clock size={20} />}
                                            {log.type === 'add' && <Plus size={20} />}
                                            {log.type === 'promo' && <Tag size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="font-black text-gray-900 text-base mb-1">
                                                {log.type === 'status' && "Order Updated"}
                                                {log.type === 'price' && "Pricing Changed"}
                                                {log.type === 'delete' && "Product Deleted"}
                                                {log.type === 'clearance' && "Clearance Dropped"}
                                                {log.type === 'add' && "Inventory Update"}
                                                {log.type === 'promo' && "Promo Code Sent"}
                                            </h3>
                                            <p className="text-gray-600 text-sm leading-relaxed pr-2">{log.message}</p>
                                            <span className="text-xs font-bold text-gray-400 mt-3 flex items-center gap-1.5 uppercase tracking-widest"><Clock size={12} /> {formatDate(log.date)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {adminLogs.length > 6 && (
                                <div className="pt-4 flex justify-center">
                                    <button onClick={() => setIsLogsExpanded(!isLogsExpanded)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-8 py-3 rounded-full shadow-sm font-black text-sm hover:bg-blue-50 hover:text-[#134c9c] hover:border-blue-200 transition-all hover:-translate-y-0.5">
                                        {isLogsExpanded ? <>Show Less <ChevronUp size={16} /></> : <>Show {adminLogs.length - 6} More <ChevronDown size={16} /></>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}